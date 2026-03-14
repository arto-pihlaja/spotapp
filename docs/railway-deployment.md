# SpotsApp Pilot Deployment on Railway

## Architecture

```
Railway Project: "spotsapp"
├── PostgreSQL          (managed plugin — free with Hobby plan)
├── "api" service       (Express backend, built from server/Dockerfile)
└── "web" service       (static Expo web build, served with `serve`)
```

- Backend gets a public URL like `api-production-xxxx.up.railway.app`
- Frontend gets a public URL like `web-production-yyyy.up.railway.app`
- No custom domain needed for pilot
- Railway supports WebSockets natively (Socket.IO works out of the box)

---

## Code Changes (done)

1. **`server/tsconfig.json`** — removed `"extends": "expo/tsconfig.base"` (fails in Docker without Expo)
2. **`package.json`** — added `serve` devDependency (serves static frontend on Railway)
3. **`nixpacks.toml`** — new file at repo root (tells Railway how to build/start frontend)

---

## Step-by-Step: Railway Setup

### A. Create project & database

1. **Sign up** at [railway.com](https://railway.com) → start the **Hobby plan** ($5/month, covers everything for pilot)
2. **New Project** → name it `spotsapp`
3. **Add PostgreSQL**: Click "New" → "Database" → "PostgreSQL"
   - Railway provisions it instantly
   - Note: the `DATABASE_URL` is auto-available as a variable to linked services

### B. Deploy the backend ("api" service)

4. Click **"New" → "GitHub Repo"** → connect your GitHub account → select `arto-pihlaja/spotapp`
5. In **Settings**:
   - **Root Directory:** `server`
   - **Builder:** Dockerfile (auto-detected)
6. In **Variables**, add:
   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` (click "Add Reference" to link) |
   | `JWT_ACCESS_SECRET` | Generate with: `openssl rand -hex 16` |
   | `JWT_REFRESH_SECRET` | Generate with: `openssl rand -hex 16` |
   | `PORT` | `3000` |
   | `NODE_ENV` | `production` |
   | `CORS_ORIGIN` | *(leave empty for now — fill after creating web service)* |
   | `APP_URL` | *(leave empty for now)* |
   | `EMAIL_FROM` | `SpotsApp <noreply@yourdomain.com>` |
7. In **Settings → Networking**, click **"Generate Domain"** to get a public URL
8. **Deploy** — Railway builds the Dockerfile and starts the container
9. **Verify:** `curl https://YOUR-API-URL/api/v1/health` → should return `{"data":{"status":"ok"}}`

### C. Deploy the frontend ("web" service)

10. Click **"New" → "GitHub Repo"** → select the same `arto-pihlaja/spotapp` repo again
11. In **Settings**:
    - **Root Directory:** *(leave as repo root)*
    - **Builder:** Nixpacks
    - If there's no `nixpacks.toml`, set manually:
      - **Build Command:** `npm ci && npx expo export --platform web`
      - **Start Command:** `npx serve dist --single --listen tcp://0.0.0.0:$PORT`
12. In **Variables**, add:
    | Variable | Value |
    |---|---|
    | `EXPO_PUBLIC_API_BASE_URL` | `https://YOUR-API-URL.up.railway.app` (from step 7) |
13. In **Settings → Networking**, click **"Generate Domain"**
14. **Deploy**

### D. Wire up CORS

15. Go back to the **"api" service → Variables**:
    - Set `CORS_ORIGIN` = `https://YOUR-WEB-URL.up.railway.app`
    - Set `APP_URL` = `https://YOUR-WEB-URL.up.railway.app`
16. Railway auto-redeploys the backend with updated env vars

### E. Seed the database

17. **Option A — Railway CLI** (recommended):
    ```bash
    npm install -g @railway/cli
    railway login
    railway link          # select your project + "api" service
    railway run npx prisma db seed
    ```
    **Option B — Railway dashboard shell:**
    - Go to "api" service → click the shell icon → run `npx prisma db seed`

This creates:
- Admin user: `admin` / `password123` (change immediately!)
- Test user: `testuser` / `password123`
- Invitation codes: `WELCOME2025` (50 uses), `BETA-TESTER` (20 uses), `FRIEND-INVITE` (10 uses)

### F. Verify end-to-end

18. Open `https://YOUR-WEB-URL.up.railway.app` in a browser
19. Log in as `admin` / `password123` → change password
20. Register a new user with invitation code `BETA-TESTER`
21. Verify map loads, spots are visible, you can create sessions/reports
22. On a phone: open the URL in Chrome/Safari → "Add to Home Screen" to install as PWA
23. Share the URL + an invitation code with your pilot users

---

## Cost
- Railway Hobby plan: **$5/month** (includes $5 credits)
- PostgreSQL + 2 services for ~5 users: well within the $5 credits
- No surprise bills — Railway pauses services if credits run out

## Notes
- **Service worker:** The SW caches API routes assuming same-origin. Since frontend/backend are on different subdomains, SW API caching won't activate. This is fine — the app works normally. Revisit if you add a custom domain with reverse proxy later.
- **Socket.IO:** Works on Railway without extra config (native WebSocket support)
- **Auto-deploy:** Railway redeploys on every push to `main` by default. You can change this in Settings.
- **Migrations:** Run automatically on every backend deploy (via Dockerfile CMD)
- **Email (Resend):** Optional. Add `RESEND_API_KEY` to backend variables if you want password reset emails to work.
