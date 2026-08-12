# 09 — Environment & Configuration

## Environment Files

| File | Who reads it | Committed? |
|---|---|---|
| `backend/.env` | Express/Node.js process | NO — gitignored |
| `frontend/.env.local` | Next.js build + runtime | NO — gitignored |
| `.env.example` | Documentation / template | YES — safe to commit |

---

## All Environment Variables

### Backend (`backend/.env`)

| Variable | Example | Required | Purpose |
|---|---|---|---|
| `DATABASE_URL` | `postgresql://notes:notes@localhost:5432/learning_notes?schema=public` | YES | Prisma database connection string |
| `API_PORT` | `4000` | NO (default: 4000) | Port the Express server listens on |
| `APP_URL` | `http://localhost:4000` | NO | Base URL of the API server (used in generated URLs) |
| `WEB_ORIGIN` | `http://localhost:3000` | YES | Comma-separated allowed CORS origins |
| `CLOUDINARY_URL` | `cloudinary://key:secret@cloud` | YES (prod) | Cloudinary connection string for file uploads |
| `JWT_SECRET` | `replace-with-32+-random-chars` | YES | Secret for signing/verifying JWTs |
| `ADMIN_EMAIL` | `admin@example.com` | YES | Email for the seeded admin user |
| `ADMIN_PASSWORD` | `strong-password-here` | YES | Password for the seeded admin user |

### Frontend (`frontend/.env.local`)

| Variable | Example | Required | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | YES | Base API URL used by the frontend — embedded in client JS |

---

## Variable Details

### `DATABASE_URL`
Standard PostgreSQL connection string format:
```
postgresql://<user>:<password>@<host>:<port>/<database>?schema=<schema>
```
Default local value assumes:
- User: `notes`, Password: `notes`
- Host: `localhost`, Port: `5432`
- Database: `learning_notes`, Schema: `public`

In production (Render), this is provided automatically when you attach a PostgreSQL add-on.

---

### `JWT_SECRET`
- **Minimum length**: 32 characters
- **Recommended**: 64+ random hex characters
- Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Rotating this value **invalidates all existing tokens** (all admins are effectively logged out)

---

### `CLOUDINARY_URL`
Format: `cloudinary://<api_key>:<api_secret>@<cloud_name>`

Found in your Cloudinary dashboard. The SDK parses this string automatically.
- **NEVER** add this to Vercel or any frontend environment
- Only goes in `backend/.env` or Render's environment variables

---

### `WEB_ORIGIN`
Controls which browser origins the Express API accepts CORS requests from.
- Local: `http://localhost:3000`
- Production with one domain: `https://my-notes.vercel.app`
- Production with multiple: `https://my-notes.vercel.app,https://my-notes.com`
- Vercel preview deployments: automatically allowed (regex match: `*.vercel.app`)

---

### `NEXT_PUBLIC_API_URL`
- Embedded into the Next.js client bundle at build time
- Must be the full API base URL including `/api`: `https://api.my-notes.com/api`
- In production, point to the Render backend URL
- **Do not** include a trailing slash

---

## Loading Order

### Backend
1. `dotenv` loads `backend/.env` at startup (in `server.ts` or `app.ts`)
2. All `process.env.*` reads happen after this point
3. `prisma` uses `DATABASE_URL` from the environment automatically

### Frontend
1. Next.js loads `frontend/.env.local` (and `.env.production`, `.env`) at build time
2. Variables prefixed `NEXT_PUBLIC_` are inlined into the JavaScript bundle
3. Server-only variables (no prefix) are available only during Next.js server-side rendering

---

## Security Rules

1. **Never commit** `.env` or `.env.local` files — verify `.gitignore` covers them
2. **Never log** environment variable values in code
3. **Rotate `JWT_SECRET`** if ever exposed
4. **Use different secrets** for development and production
5. **Check `.env.example`** is up to date whenever adding a new variable

---

## Adding a New Environment Variable

1. Add it to `.env.example` with a placeholder value and a comment explaining its purpose
2. Add it to `backend/.env` (or `frontend/.env.local`) with the real local value
3. Document it in this file
4. Add it to the production platform (Render for backend, Vercel for frontend if `NEXT_PUBLIC_`)
5. Update the SKILL.md file map if it affects the startup configuration
