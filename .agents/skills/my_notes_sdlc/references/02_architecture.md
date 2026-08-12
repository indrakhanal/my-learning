# 02 — Architecture & Design

## System Overview

```
Admin browser  ──┐
                 ├──> Next.js frontend (port 3000)  ──> Express API (port 4000)  ──> PostgreSQL (port 5432)
Public visitor ──┘                                                              ──> Cloudinary CDN (uploads)
                                                                                ──> backend/uploads/ (local dev)
```

### Key Architectural Decisions

| Decision | Rationale |
|---|---|
| Monorepo with npm workspaces | Shared tooling, single `npm run dev` command |
| Next.js App Router (server components) | SSR for public pages; no client-side fetching for initial render |
| Express REST API | Simple, well-understood; no GraphQL complexity needed |
| Prisma ORM | Type-safe queries, migration management, relation safety |
| JWT (stateless) auth | No session store needed; single admin user |
| Cloudinary for media | Free CDN, avoids serving binary files from Node.js in production |
| Local PostgreSQL | No Docker, no paid DB service for development |

---

## Module Boundaries

### Backend (`backend/src/`)

```
src/
  server.ts          # HTTP server — creates app, binds port
  app.ts             # Express app — CORS, JSON, routes, global error handler
  routes/
    auth.ts          # POST /api/auth/login
    notes.ts         # GET|POST /api/notes, GET|PUT|DELETE /api/notes/:id, export, import
    tags.ts          # GET|POST /api/tags
    uploads.ts       # POST /api/uploads/:noteId
  middleware/
    auth.ts          # requireAdmin, optionalAdmin
  lib/
    prisma.ts        # PrismaClient singleton
    slug.ts          # slugify() helper
```

**Rules:**
- Each route file exports a single `Router` instance.
- `app.ts` mounts all routers — never mount routes inside `server.ts`.
- `lib/` contains pure utilities with no Express dependencies.
- The global error handler in `app.ts` handles `ZodError` (400) and Prisma `P2002` (409).

### Frontend (`frontend/`)

```
app/
  layout.tsx         # Root layout: <html>, fonts, header, bottom nav, ServiceWorker
  page.tsx           # / — server component, fetches published notes
  styles.css         # All global styles and design tokens
  about/
    page.tsx         # /about — static about page
  admin/
    page.tsx         # /admin — admin login + dashboard
  notes/
    [id]/
      page.tsx       # /notes/:id — public note view
components/
  AdminDashboard.tsx # Admin login form + authenticated dashboard shell
  AdminNoteList.tsx  # Note list/search for admin
  NoteEditor.tsx     # Create/edit form with RichTextEditor
  NoteList.tsx       # Public note card grid
  NoteView.tsx       # Full note reading view with sanitized HTML
  RichTextEditor.tsx # Tiptap editor (Bold, Italic, Strike, H2, H3, lists, link, image)
  ServiceWorkerRegistration.tsx  # Client-side SW registration
```

**Rules:**
- Pages under `app/` are Server Components by default — do NOT add `"use client"` unless the page needs browser APIs.
- All components that use `useState`, `useEffect`, `useRef`, or event handlers MUST have `"use client"` at the top.
- Never fetch from the API in a client component for initial render — fetch in the Server Component parent and pass as props.
- Styling lives entirely in `styles.css` — components use CSS class names, not Tailwind or CSS modules.

---

## Data Flow

### Public note list request
```
Browser -> GET / -> Next.js Server Component
  -> fetch(`${NEXT_PUBLIC_API_URL}/notes`) [server-side]
    -> Express GET /api/notes (optionalAdmin: no JWT -> returns PUBLISHED only)
      -> Prisma: Note.findMany({ where: { status: PUBLISHED } })
        -> PostgreSQL
  -> HTML rendered server-side -> sent to browser
```

### Admin note creation
```
Admin browser -> NoteEditor form submit
  -> fetch(`${NEXT_PUBLIC_API_URL}/notes`, { method: 'POST', headers: { Authorization: 'Bearer <jwt>' } })
    -> Express POST /api/notes (requireAdmin)
      -> Zod validation
      -> uniqueSlug() for collision-free slug
      -> Prisma: Note.create({ ... tags: connectOrCreate ... })
        -> PostgreSQL
  -> 201 { note } -> UI update
```

### Image upload flow
```
Admin -> RichTextEditor "Upload" button -> file input
  -> NoteEditor.handleImageUpload(file)
    -> fetch(`${NEXT_PUBLIC_API_URL}/uploads/${noteId}`, { method: 'POST', body: FormData })
      -> Express POST /api/uploads/:noteId (requireAdmin)
        -> Multer: MIME check, 10 MB limit, temp store
        -> Cloudinary.upload(tempFile)
        -> Prisma: Attachment.create({ url: cloudinaryUrl, ... })
          -> PostgreSQL
    -> returns { url } -> editor inserts <img src="url">
```

---

## Prisma Relation Map

```
User (1) ──< Note (many)
Note (1) ──< NoteTag (many) >── Tag (1)
Note (1) ──< Attachment (many)
Note (1) ──< Resource (many)
Note (1) ──< NoteVersion (many)  [append-only history]
```

All child relations use `onDelete: Cascade` — deleting a Note removes all its tags, attachments, resources, and versions.

---

## Design Tokens (styles.css)

The CSS design system is in `frontend/app/styles.css`. Key custom properties:

| Token | Usage |
|---|---|
| `--bg` | Page background |
| `--surface` | Card / panel background |
| `--border` | Default border color |
| `--text` | Primary text |
| `--text-muted` | Secondary/placeholder text |
| `--accent` | Brand accent color |
| `--radius` | Default border radius |

Always use these tokens in new styles — never hardcode color hex values.
