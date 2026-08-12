# 06 — Security

## Security Model

This application uses a simple, single-admin security model:
- **One admin user** — created via seed script
- **JWT-based authentication** — stateless, no sessions
- **Public read access** — PUBLISHED notes only for unauthenticated users

---

## Authentication & Authorization

### JWT Configuration
- **Secret**: `JWT_SECRET` env var — must be >= 32 random characters in production
- **Algorithm**: HS256 (default for `jsonwebtoken`)
- **Token lifetime**: Set an expiry when issuing tokens (e.g., `expiresIn: "7d"`)
- **Storage**: `localStorage` in the browser — acceptable for single-user admin apps

### Middleware Rules
```typescript
// PROTECTED: returns 401 if no valid JWT
app.use("/api/admin-endpoint", requireAdmin, handler);

// PUBLIC WITH OPTIONAL ENHANCEMENT: no 401, but req.user is set if JWT is valid
app.use("/api/notes", optionalAdmin, handler);
```

**Never expose admin-only data on routes using `optionalAdmin` without checking `req.user`.**

### JWT Verification
```typescript
// middleware/auth.ts — current implementation
req.user = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest["user"];
```

If `JWT_SECRET` is undefined, `jwt.verify` throws — the server will return 401. This is safe behavior.

---

## Input Validation

### Rule: Zod validates ALL write endpoints
```typescript
const input = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().max(200000),
  // ...
});
const data = input.parse(req.body); // throws ZodError -> caught by global error handler -> 400
```

Never trust `req.body` directly. Always parse through a Zod schema before accessing fields.

### Common validation patterns
```typescript
z.string().trim().min(1)          // non-empty string
z.string().url().max(2000)        // valid URL
z.enum(["DRAFT", "PUBLISHED"])    // restricted enum
z.array(z.string().max(50))       // bounded array items
```

---

## Database Security

### Prisma prevents SQL injection
Prisma uses parameterized queries internally. Never:
```typescript
// NEVER DO THIS:
prisma.$queryRawUnsafe(`SELECT * FROM notes WHERE title = '${req.body.title}'`);

// DO THIS:
prisma.$queryRaw`SELECT * FROM notes WHERE title = ${req.body.title}`;
// Or simply use the typed Prisma API:
prisma.note.findMany({ where: { title: req.body.title } });
```

### Cascade deletes
All child models cascade on parent delete (defined in schema). This is intentional —
no orphaned records in the database. Be careful when deleting Users or Notes.

---

## File Upload Security

### MIME type allowlist (uploads route)
```
image/png, image/jpeg, image/webp, image/gif, application/pdf
```

Validation is MIME-type based (read from the file buffer), NOT file extension based.
A file named `malware.exe` renamed to `photo.png` will be rejected if its MIME type is not in the allowlist.

### File size limit
- Maximum: **10 MB** per upload
- Enforced by Multer configuration in `uploads.ts`

### Generated filenames
Never use the original filename as the storage key. Always generate a unique key:
```typescript
// Cloudinary generates its own public_id
// Local: use crypto.randomUUID() or similar
```

### Storage location
- **Production**: Cloudinary (HTTPS CDN, public read)
- **Local dev**: `backend/uploads/` directory

---

## HTML Content Security

### Tiptap output
The rich-text editor produces HTML. This HTML is stored in PostgreSQL and rendered in the browser.

### Sanitization rule
ALWAYS sanitize before `dangerouslySetInnerHTML`:
```typescript
import sanitizeHtml from "sanitize-html";
const clean = sanitizeHtml(note.content, { /* allowedTags, allowedAttributes */ });
```

This prevents stored XSS attacks where malicious HTML is injected into note content.

---

## CORS Security

### Configuration (backend/src/app.ts)
```typescript
const allowedOrigins = new Set(process.env.WEB_ORIGIN.split(",").map(normalize));
// Also allows *.vercel.app previews
```

### Rules
- `WEB_ORIGIN` must be set to the exact frontend URL(s) in production
- In production, do NOT set `WEB_ORIGIN=*`
- Multiple origins are comma-separated: `https://my-notes.vercel.app,https://my-notes.com`

---

## Environment Variable Security

| Variable | Location | Exposure |
|---|---|---|
| `DATABASE_URL` | `backend/.env` | Backend only — never expose |
| `JWT_SECRET` | `backend/.env` | Backend only — never expose |
| `ADMIN_EMAIL` | `backend/.env` | Backend only |
| `ADMIN_PASSWORD` | `backend/.env` | Backend only — stored as bcrypt hash |
| `CLOUDINARY_URL` | `backend/.env` | Backend only — never add to Vercel |
| `WEB_ORIGIN` | `backend/.env` | Backend only |
| `API_PORT` | `backend/.env` | Backend only |
| `NEXT_PUBLIC_API_URL` | `frontend/.env.local` | **Client-visible** — only safe public URLs |

### Critical rules
1. **Never commit `.env` files** — `.gitignore` must include `*.env`, `.env`, `backend/.env`, `frontend/.env.local`
2. **`NEXT_PUBLIC_` prefix** means the variable is bundled into the client JavaScript — treat as public
3. **Rotate `JWT_SECRET`** if it is ever exposed — all existing tokens become invalid (effectively logs out all admins)

---

## Security Checklist for New Features

Before merging any new feature:
- [ ] Write endpoints validated with Zod
- [ ] Admin-only endpoints use `requireAdmin`
- [ ] No secrets in frontend code or `NEXT_PUBLIC_` variables
- [ ] No raw SQL with user input
- [ ] File uploads: MIME check + size limit + generated key
- [ ] HTML content sanitized before render
- [ ] CORS not relaxed (no `origin: "*"`)
- [ ] No `console.log` of sensitive data (tokens, passwords, DB URLs)

---

## Password Hashing

```typescript
import bcrypt from "bcryptjs";

// Hash (during seeding / user creation)
const hash = await bcrypt.hash(plainPassword, 12);  // 12 rounds minimum

// Verify (during login)
const valid = await bcrypt.compare(plainPassword, storedHash);
```

Never store passwords in plaintext. The `passwordHash` field name is intentional — never rename it to `password`.
