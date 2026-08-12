# 01 — Requirements & Planning

## Purpose
This document defines what the Personal Learning Notes application does, its constraints,
and what is explicitly out of scope. Before implementing any feature, validate it against this document.

---

## Functional Requirements

### Public Visitor (unauthenticated)
- [ ] Browse all **PUBLISHED** notes on the homepage (paginated, sorted by `updatedAt` DESC)
- [ ] View a single note by its unique slug
- [ ] Filter notes by tag (via `?tag=<name>` query param)
- [ ] Read the "About" page
- [ ] Install the app as a PWA (on HTTPS deployments)

### Admin (JWT-authenticated)
- [ ] Sign in via `POST /api/auth/login` with email + password; receive a JWT
- [ ] Create a new note (title, HTML content, status, tags, resource links)
- [ ] Edit an existing note (saves a `NoteVersion` snapshot before every update)
- [ ] Delete a note (cascades to tags, attachments, resources, versions)
- [ ] Change note status (DRAFT / PUBLISHED)
- [ ] Import a note from Markdown (`POST /api/notes/import`)
- [ ] Export a note as Markdown or PDF
- [ ] Upload image/PDF attachments (stored on Cloudinary; URL persisted in PostgreSQL)
- [ ] Manage resource links attached to a note (label + URL pairs)
- [ ] List/search notes in the admin dashboard
- [ ] Use the Tiptap rich-text editor with Bold, Italic, Strikethrough, H2, H3, Bullet list, Ordered list, Blockquote, Link, Image (URL or upload), and Clear formatting

---

## Non-Functional Requirements

### Performance
- Homepage must load published notes server-side (Next.js Server Component with `force-dynamic`)
- API responses for note lists should complete in < 200 ms on local hardware
- Images served from Cloudinary CDN — no local image serving in production

### Accessibility
- All interactive elements must have accessible labels (`aria-label`, `aria-pressed`, etc.)
- Heading hierarchy must be correct (single `<h1>` per page)
- Rich-text editor toolbar must have `role="toolbar"` and labelled buttons
- Color contrast must meet WCAG AA

### Security
- All admin API routes protected by JWT middleware (`requireAdmin`)
- All request bodies validated with Zod before database access
- HTML content sanitized with `sanitize-html` before rendering
- Upload MIME allowlist enforced server-side
- No secrets in frontend environment variables

### PWA / Mobile
- Web app manifest and service worker for offline caching
- Responsive layout (mobile-first, bottom navigation on small screens)
- LAN-accessible dev server (`-H 0.0.0.0`) for mobile testing

---

## Out of Scope (Do Not Implement)
The following are intentionally excluded. Do not add them without explicit user approval:

- AWS services (S3, Lambda, RDS, etc.)
- Docker / Docker Compose
- Terraform or any IaC tooling
- Semantic search / RAG / vector embeddings
- Multi-user or multi-role system (only ADMIN role exists)
- Comments, likes, or social features
- OAuth / SSO (email+password JWT only)
- Real-time collaboration or WebSockets
- Paid hosting dependencies beyond Cloudinary (free tier)
- GraphQL or tRPC (REST only)
- Internationalization (i18n)
- Analytics / tracking scripts

---

## Change Process
1. Verify the feature is not in the Out of Scope list.
2. Update this document if the feature expands the functional requirements.
3. Follow the Architecture phase (02) before writing any code.
