# 11 — Maintenance & Refactoring

## NoteVersion — Version History

### Design Intent
Every `PUT /api/notes/:id` call atomically:
1. Saves a **snapshot** (`NoteVersion`) of the note's state **before** the update
2. Applies the new changes to the `Note`

This gives a full, durable history of every save — stored in PostgreSQL.

### Rules
- `NoteVersion` rows are **append-only** — NEVER delete version rows except via cascade (when the parent `Note` is deleted)
- Do NOT expose `NoteVersion` records to public visitors
- If you add a UI for version history, it must be admin-only

### Schema reminders
```prisma
model NoteVersion {
  id        String     @id @default(cuid())
  noteId    String
  note      Note       @relation(...)
  title     String
  content   String     @db.Text
  status    NoteStatus
  createdAt DateTime   @default(now())  // version timestamp
}
```

---

## Slug Management

### Rules
- Slugs are generated once at creation by `uniqueSlug(title)` — **never** changed after creation
- Slugs are permanent identifiers (used in URLs and export filenames)
- If you refactor `slugify()` in `backend/src/lib/slug.ts`, verify no existing slugs break

### Slug uniqueness algorithm
```typescript
async function uniqueSlug(title: string) {
  const base = slugify(title);   // e.g., "my-note"
  let slug = base;
  let sequence = 2;
  while (await prisma.note.findUnique({ where: { slug } })) {
    slug = `${base}-${sequence++}`;   // "my-note-2", "my-note-3", ...
  }
  return slug;
}
```

This is in `backend/src/routes/notes.ts`. If you extract it to `lib/`, update the import.

---

## Tag Management

### `connectOrCreate` pattern
Tags are created lazily — they don't need to exist before attaching to a note:
```typescript
const tagWrites = (tags: string[]) => ({
  create: tags.map(name => ({
    tag: { connectOrCreate: { where: { name }, create: { name } } }
  }))
});
```

### Tag cleanup
Orphaned tags (tags with no notes) are NOT automatically cleaned up.
This is intentional — tags can be pre-created for future use. If cleanup is needed, add a maintenance endpoint or script.

---

## Code Organization Principles

### Backend
- Route handlers should be **thin** — validate input, call a service/lib function, return a response
- Business logic that is reusable should be extracted to `backend/src/lib/`
- Do NOT put Express-specific code (req, res) inside lib functions
- Keep route files readable — avoid deeply nested async callbacks

### Frontend
- Components should be **focused** — one clear responsibility per component
- Props interfaces should be explicit TypeScript types (not `any`)
- Event handlers should be extracted to named functions, not inline arrow functions in JSX
- Avoid prop drilling more than 2 levels — consider lifting state or co-locating

---

## Known Technical Debt

| Item | Location | Priority | Notes |
|---|---|---|---|
| Route handlers are dense single-liners | `backend/src/routes/notes.ts` | Medium | Readable but hard to debug deep in a stack trace |
| No frontend tests | `frontend/` | High | Add React Testing Library when time allows |
| No CI workflow | `.github/workflows/` | High | See `08_build_ci.md` for recommended config |
| PDF export strips all HTML | `notes.ts` export endpoint | Low | Basic plain-text only; no formatting in PDFs |
| No pagination on note list | `GET /api/notes` | Medium | Will be needed as note count grows |
| Service worker caching strategy undocumented | `frontend/public/sw.js` | Low | Review and document cache versioning |

---

## Dependency Updates

### Check for outdated packages
```powershell
npm outdated                                  # root
npm outdated --workspace=backend              # backend
npm outdated --workspace=frontend             # frontend
```

### Updating Prisma
Prisma must be updated as a pair — both `prisma` (dev) and `@prisma/client` (runtime):
```powershell
npm install prisma@latest @prisma/client@latest --workspace=backend
npm.cmd run prisma:generate --workspace=backend
npm.cmd run test  # verify nothing broke
```

### Updating Next.js
```powershell
npm install next@latest react@latest react-dom@latest --workspace=frontend
npm.cmd run build --workspace=frontend  # verify build passes
```

---

## Performance Considerations

### Database indexes
The `Note` model has `@@index([status, updatedAt])` for efficient public note list queries.
If you add new filter/sort options, add corresponding indexes to avoid full table scans.

### Next.js `force-dynamic`
Pages with `export const dynamic = "force-dynamic"` opt out of static generation and always fetch fresh data.
This is correct for the note list (content changes frequently) but should NOT be applied to static pages like `/about`.

### Cloudinary CDN
Images served from Cloudinary are automatically CDN-cached — do not serve them through the Express backend.

### API response size
The `include` object in `notes.ts` fetches tags, attachments, resources, and author for every note.
For list endpoints returning many notes, consider a lighter projection (omit `content` in list queries).

---

## Refactoring Checklist

Before refactoring any shared code:
- [ ] Run `npm run lint` to establish a baseline
- [ ] Run `npm run test` to establish a baseline
- [ ] Make the refactor
- [ ] Run `npm run lint` again — must be clean
- [ ] Run `npm run test` again — all tests must pass
- [ ] If you moved a file, search for all imports of the old path and update them
- [ ] If you renamed an export, search the codebase for the old name

---

## Git Workflow Recommendations

```powershell
# Before starting work
git pull origin main
git checkout -b feature/my-feature

# During work
git add -p           # stage changes selectively
git commit -m "feat: add tag filtering to admin dashboard"

# Before pushing
npm.cmd run lint      # type check
npm.cmd run test      # run tests
git push origin feature/my-feature
```

### Commit message format
```
<type>: <short description>

Types: feat | fix | refactor | test | docs | chore | style | perf
```

Examples:
- `feat: add note version history UI in admin dashboard`
- `fix: sanitize HTML in NoteView to prevent XSS`
- `refactor: extract uniqueSlug to lib/slug.ts`
- `test: add PUT /api/notes/:id integration test`
- `chore: update Prisma to 5.21`
