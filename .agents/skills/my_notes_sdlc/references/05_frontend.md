# 05 — Frontend Development

## Stack
- **Framework**: Next.js 14 (App Router)
- **UI library**: React 18
- **Rich text editor**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`)
- **HTML sanitization**: `sanitize-html`
- **Styling**: Vanilla CSS — single global file at `frontend/app/styles.css`
- **Fonts**: Inter (UI) + Lora (reading) — loaded from Google Fonts in `layout.tsx`
- **TypeScript**: strict mode

---

## Server vs. Client Components

| Pattern | When |
|---|---|
| Default (no directive) = Server Component | Data-fetching pages, layout |
| `"use client"` at top of file | useState, useEffect, useRef, event handlers, browser APIs |

**Rule**: Fetch data in Server Components, pass as props to Client Components.

### Server Component pattern (data fetching)
```tsx
// frontend/app/page.tsx
export const dynamic = "force-dynamic"; // opt out of static generation

export default async function Home() {
  const api = process.env.NEXT_PUBLIC_API_URL;
  let notes = [];
  try {
    const res = await fetch(`${api}/notes`, { cache: "no-store" });
    if (res.ok) notes = await res.json();
  } catch { /* handle gracefully */ }

  return <NoteList notes={notes} />;
}
```

### Client Component pattern
```tsx
"use client";
import { useState } from "react";

export function SomeClientComponent({ initialData }: Props) {
  const [state, setState] = useState(initialData);
  // ...
}
```

---

## API Calls from the Frontend

Always use `process.env.NEXT_PUBLIC_API_URL` — **never hardcode** `http://localhost:4000`.

```typescript
const api = process.env.NEXT_PUBLIC_API_URL;

// Authenticated request
const response = await fetch(`${api}/notes`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```

### Storing the JWT
The JWT is stored in `localStorage` under the key `"token"`.
Retrieve with `localStorage.getItem("token")` — always check for null before use.

---

## Styling Conventions

### Rule 1: Single CSS file
All styles live in `frontend/app/styles.css`. Do NOT:
- Create per-component `.css` or `.module.css` files
- Use Tailwind utilities
- Use `style={{}}` props for layout (only for truly one-off computed values)

### Rule 2: Design tokens
Use CSS custom properties defined at `:root`:
```css
/* Use these tokens */
var(--bg)          /* page background */
var(--surface)     /* card background */
var(--border)      /* border color */
var(--text)        /* primary text */
var(--text-muted)  /* secondary text */
var(--accent)      /* brand accent */
var(--radius)      /* border radius */
```

### Rule 3: Class naming
Use descriptive, kebab-case class names:
```css
.note-card { }
.note-card-title { }
.admin-table { }
.rich-editor .toolbar { }
```

### Rule 4: Responsive design
- Mobile-first breakpoints
- The bottom navigation (`bottom-nav`) is visible on mobile, hidden on desktop
- Header navigation (`header-nav`) is visible on desktop, hidden on mobile
- Test at 375px, 768px, and 1280px widths

---

## Component Catalog

### `RichTextEditor`
```tsx
<RichTextEditor
  value={htmlString}
  onChange={(html) => setContent(html)}
  onImageUpload={async (file) => uploadAndReturnUrl(file)}  // optional
/>
```
- Toolbar buttons: Bold, Italic, Strike, H2, H3, Bullet list, Ordered list, Blockquote, Link, Image URL, Upload image, Clear
- Fires `onChange` with full HTML on every keystroke
- `onImageUpload` prop enables the "Upload" button; returns the Cloudinary URL or null

### `NoteEditor`
Admin create/edit form. Manages:
- Title, status, tags (comma-separated input), resources (label+URL pairs)
- `RichTextEditor` for content
- Image upload via `POST /api/uploads/:noteId`
- Export (Markdown, PDF) via GET endpoints

### `NoteList`
Public note grid. Props: `notes: Note[]`.
Renders note cards with title, tags, excerpt, and "Read" link.

### `NoteView`
Full note reading view. Renders sanitized HTML content, resource links, and metadata.

### `AdminNoteList`
Admin table with search, status filter, edit/delete actions.

### `AdminDashboard`
Login form + authenticated dashboard shell. Stores JWT in localStorage on login.

### `ServiceWorkerRegistration`
Client component that registers `public/sw.js` on mount. No props.

---

## HTML Rendering & Sanitization

When rendering note content from the API, **always** sanitize:
```tsx
import sanitizeHtml from "sanitize-html";

const clean = sanitizeHtml(note.content, {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ["src", "alt"],
    a: ["href", "target", "rel"],
  },
});

return <div dangerouslySetInnerHTML={{ __html: clean }} />;
```

---

## Accessibility Checklist

For every new component, verify:
- [ ] Buttons have `aria-label` or visible text
- [ ] Toggle buttons have `aria-pressed`
- [ ] Forms have associated `<label>` elements
- [ ] Images have `alt` text
- [ ] Only one `<h1>` per page
- [ ] Heading levels are sequential (h1 -> h2 -> h3)
- [ ] Color contrast meets WCAG AA (4.5:1 for normal text)
- [ ] Interactive elements are keyboard-navigable
- [ ] Loading states are communicated (e.g., `aria-busy` or descriptive text)

---

## PWA Assets

Located in `frontend/public/`:
- `manifest.webmanifest` — app name, icons, theme color
- `sw.js` — service worker for offline caching

Do not modify these without understanding the caching strategy.
The service worker caches static assets; API responses are always fetched fresh.

---

## Adding a New Page

1. Create `frontend/app/<path>/page.tsx`
2. Make it `async` if it fetches data (Server Component)
3. Add `"use client"` only if it needs browser APIs
4. Add navigation links in `frontend/app/layout.tsx` (header + bottom nav)
5. Add styles to `frontend/app/styles.css`
