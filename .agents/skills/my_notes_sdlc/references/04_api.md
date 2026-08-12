# 04 — API Development

## Base URL
- **Local**: `http://localhost:4000/api`
- **Production**: set via `NEXT_PUBLIC_API_URL` (frontend) and `APP_URL` (backend)

## Health Check
```
GET /health  ->  200 { status: "ok" }
```

---

## Authentication

### Login
```
POST /api/auth/login
Body: { email: string, password: string }
Response 200: { token: string }
Response 401: { error: "Invalid credentials" }
```

### Using the Token
All protected endpoints require:
```
Authorization: Bearer <token>
```

### Middleware Reference
| Middleware | When to use |
|---|---|
| `requireAdmin` | Route must reject unauthenticated requests with 401 |
| `optionalAdmin` | Route is public but enhanced for admins (e.g., shows DRAFT notes) |

Import from `../middleware/auth.js`:
```typescript
import { requireAdmin, optionalAdmin, type AuthRequest } from "../middleware/auth.js";
```

Access the authenticated user as `(req as AuthRequest).user` — shape: `{ id: string; role: "ADMIN" }`.

---

## Notes API

### List notes
```
GET /api/notes
  ?tag=<name>        filter by tag name (optional)
Authorization: optional

Unauthenticated: returns PUBLISHED notes only
Admin: returns ALL notes (DRAFT + PUBLISHED)

Response 200: Note[]
```

### Get note by ID
```
GET /api/notes/:id
Authorization: optional

Unauthenticated: returns 404 if DRAFT
Admin: returns any note

Response 200: Note
Response 404: { error: "Note not found" }
```

### Create note
```
POST /api/notes
Authorization: required (Admin)
Body: {
  title: string (1-180 chars),
  content: string (max 200 000 chars),
  status: "DRAFT" | "PUBLISHED" (default: "DRAFT"),
  tags: string[] (each 1-50 chars, default: []),
  resources: Array<{ label: string (1-100), url: string (valid URL, max 2000) }> (default: [])
}

Response 201: Note
Response 400: { error: "Validation failed", details: ZodIssue[] }
Response 401: { error: "Authentication required" }
```

### Update note
```
PUT /api/notes/:id
Authorization: required (Admin)
Body: same as POST

Saves a NoteVersion snapshot before applying the update (atomic transaction).

Response 200: Note
Response 400: validation error
Response 404: { error: "Note not found" }
```

### Delete note
```
DELETE /api/notes/:id
Authorization: required (Admin)
Cascades: NoteTag, Attachment, Resource, NoteVersion all deleted.

Response 204: (no body)
Response 404: { error: "Note not found" }
```

### Import from Markdown
```
POST /api/notes/import
Authorization: required (Admin)
Body: {
  markdown: string (1-200 000 chars),
  status: "DRAFT" | "PUBLISHED" (default: "DRAFT"),
  tags: string[] (default: [])
}

The first line `# Title` becomes the note title.
Remaining lines become the content.

Response 201: Note
```

### Export as Markdown
```
GET /api/notes/:id/export/markdown
Authorization: required (Admin)

Response: text/markdown attachment (filename: <slug>.md)
Format:
  # <title>
  <content>
  - [label](url)  (for each resource)
```

### Export as PDF
```
GET /api/notes/:id/export/pdf
Authorization: required (Admin)

Response: application/pdf attachment (filename: <slug>.pdf)
Note: HTML tags are stripped from content in the PDF.
```

---

## Tags API

```
GET /api/tags   ->  200: Tag[]
POST /api/tags  ->  201: Tag  (body: { name: string })
Authorization: not required for GET; required for POST
```

---

## Uploads API

```
POST /api/uploads/:noteId
Authorization: required (Admin)
Content-Type: multipart/form-data
Field: file (the attachment)

Accepted MIME types: image/png, image/jpeg, image/webp, image/gif, application/pdf
Max size: 10 MB

Flow:
  1. Multer validates MIME + size, stores temp file
  2. Cloudinary upload -> returns HTTPS URL
  3. Prisma: Attachment.create({ noteId, url, key, filename, mimeType, size, kind })

Response 201: { url: string, id: string, ... }
Response 400: invalid file type or size
Response 404: note not found
```

---

## Zod Validation Patterns

### Note input schema
```typescript
const resourceInput = z.object({
  label: z.string().trim().min(1).max(100),
  url: z.string().url().max(2000),
});
const input = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().max(200000),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  tags: z.array(z.string().trim().min(1).max(50)).default([]),
  resources: z.array(resourceInput).default([]),
});
```

### Tag includes pattern (Prisma)
```typescript
const include = {
  tags: { include: { tag: true } },
  attachments: true,
  resources: true,
  author: { select: { name: true, email: true } }
} as const;
```

---

## HTTP Status Code Guide

| Code | When |
|---|---|
| 200 | Successful GET or PUT |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no body) |
| 400 | Validation error (ZodError) |
| 401 | Missing or invalid JWT |
| 404 | Resource not found |
| 409 | Unique constraint violation (Prisma P2002) |
| 500 | Unhandled server error |

---

## Global Error Handler (app.ts)

The handler in `backend/src/app.ts` automatically maps:
- `error.name === "ZodError"` -> 400 with `{ error: "Validation failed", details: error.issues }`
- `error.code === "P2002"` -> 409 with `{ error: "A record with that value already exists" }`
- All others -> 500 with `{ error: "Internal server error" }`

Route handlers MUST call `next(error)` instead of sending error responses directly:
```typescript
} catch (error) { next(error); }
```

---

## Adding a New Route

1. Create `backend/src/routes/<feature>.ts`
2. Export a `Router` instance: `export const featureRouter = Router();`
3. Mount it in `backend/src/app.ts`: `app.use("/api/<feature>", featureRouter);`
4. Add a test in `backend/tests/<feature>.test.ts`
