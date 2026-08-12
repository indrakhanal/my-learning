# 10 — Deployment

## Deployment Targets

| Component | Platform | Notes |
|---|---|---|
| **Frontend** | Vercel (recommended) or Cloudflare Pages | Free tier, automatic deployments from GitHub |
| **Backend** | Render | Free tier available; sleeps on inactivity |
| **Database** | Render PostgreSQL add-on (or Railway) | Free tier PostgreSQL |
| **Media storage** | Cloudinary | Free tier (25 GB storage, 25 GB bandwidth/month) |

This setup has **zero mandatory paid dependencies**.

---

## Frontend Deployment (Vercel)

### Steps
1. Push the repo to GitHub
2. Import the project on [vercel.com](https://vercel.com)
3. Set the **Root Directory** to `frontend`
4. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL = https://<your-render-backend-url>/api
   ```
5. Deploy — Vercel handles `next build` automatically

### Vercel Configuration
- Build command: `next build` (auto-detected)
- Output directory: `.next` (auto-detected)
- Install command: `npm install`
- Node.js version: 20.x

### Vercel Preview Deployments
Every push to a non-main branch gets a preview URL (`*.vercel.app`).
The backend CORS config already allows `*.vercel.app`, so previews work automatically.

---

## Backend Deployment (Render)

### Steps
1. Create a new **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. Settings:
   - **Root directory**: `backend`
   - **Build command**: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - **Start command**: `npm run start` (runs `node dist/src/server.js`)
   - **Node version**: 20

4. Add environment variables on Render:
   ```
   DATABASE_URL       = (from Render PostgreSQL add-on)
   JWT_SECRET         = (generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
   ADMIN_EMAIL        = admin@yourdomain.com
   ADMIN_PASSWORD     = strong-unique-password
   CLOUDINARY_URL     = cloudinary://key:secret@cloud
   WEB_ORIGIN         = https://your-app.vercel.app
   API_PORT           = 10000  (Render assigns $PORT; the server should use process.env.PORT || 4000)
   ```

### Database (Render PostgreSQL)
- Create a Render PostgreSQL instance
- Copy the **Internal Database URL** into `DATABASE_URL` on the backend service
- Run initial migration via Render Shell or the build command

### Seeding on Render
```bash
# In Render shell or as a one-time job:
npx tsx prisma/seed.ts
```

---

## HTTPS & PWA

### Why HTTPS matters
- Service worker (offline caching) requires HTTPS
- PWA installation on mobile requires HTTPS
- Cloudinary and modern browsers enforce HTTPS for mixed-content

### Local development
- HTTP only — PWA features (service worker, install prompt) are NOT available locally
- Use Chrome's `--allow-insecure-localhost` flag if needed for SW testing

### After deployment
- Vercel and Render provide automatic HTTPS with TLS certificates
- No configuration needed — HTTPS is the default

---

## Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. In your dashboard, find the **API Environment variable** — it looks like:
   ```
   CLOUDINARY_URL=cloudinary://123456789012345:abc-def-ghi@yourcloudname
   ```
3. Add this to `backend/.env` (local) and Render environment variables (production)
4. **Never** add it to Vercel environment variables

### Upload configuration (backend/src/routes/uploads.ts)
- Files are uploaded to Cloudinary as-is
- Cloudinary stores them permanently until deleted via the Cloudinary dashboard
- The returned `secure_url` (HTTPS) is saved to the `Attachment.url` field in PostgreSQL

---

## Deployment Checklist

### Before first deployment
- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] `ADMIN_PASSWORD` is strong and unique (not `change-me`)
- [ ] `CLOUDINARY_URL` is set on Render
- [ ] `WEB_ORIGIN` on Render matches the Vercel production URL
- [ ] `NEXT_PUBLIC_API_URL` on Vercel points to the Render backend URL
- [ ] Database migrations have been applied (`prisma migrate deploy`)
- [ ] Admin user has been seeded (`prisma:seed`)

### After deployment
- [ ] Visit the frontend URL — published notes are visible
- [ ] `/api/health` returns `{ "status": "ok" }`
- [ ] Admin login works at `/admin`
- [ ] Creating a note works and uploads to Cloudinary

---

## Environment-Specific Behavior

| Feature | Local (HTTP) | Production (HTTPS) |
|---|---|---|
| PWA install prompt | Not available | Available |
| Service worker cache | Not active | Active |
| Cloudinary uploads | Optional (local `uploads/` fallback) | Required |
| CORS | `localhost:3000` | Render + Vercel URLs |
| `force-dynamic` SSR | Works | Works |

---

## Rollback Strategy

Since there is no Docker:
- **Frontend**: Vercel maintains deployment history — click "Redeploy" on a previous deployment
- **Backend**: Render maintains deploy history — roll back via Render dashboard
- **Database**: No automatic rollback — use `prisma migrate resolve` to mark a failed migration
  ```bash
  npx prisma migrate resolve --rolled-back <migration-name>
  ```
