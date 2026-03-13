# SpotsApp

A collaborative map app for discovering and documenting spots. Users drop pins on a map, attach wiki-style pages, and contribute local knowledge. Built with Expo (React Native) on the frontend and Express on the backend.

## Prerequisites

- Node.js 20+
- PostgreSQL 14+


## Getting Started

### 1. Backend

```bash
cd server
cp .env.example .env          # adjust DATABASE_URL if needed
npm install
npx prisma migrate dev        # create tables
npx prisma db seed             # seed demo data (admin/password123, testuser/password123)
npm run dev                    # starts on http://localhost:3000
```

### Start routine
  Test db with command pg_isready
If that says "accepting connections" you're good — PostgreSQL is already running and Prisma connects to it automatically when the Express server starts. No extra steps needed. 

  If it's not running, start it with:
  sudo service postgresql start   

  If the database was rebuilt since last time, you'll also need to re-seed first:
  cd /opt/spotapp/server && npx prisma migrate dev && npx prisma db seed



The backend responds on port 3000. If the port is already in use, kill the existing process first:
  lsof -ti:3000 | xargs -r kill -9                          
  cd /opt/spotapp/server && npx tsx src/server.ts  
                                                                                    
  Frontend (from project root):
  npx expo start --web

  For iPhone testing, see "Testing on iPhone (via Tunnels)" section below.

### 2. Frontend

```bash
# from project root
npm install
npx expo start --web --clear        # opens on http://localhost:8081
```



## Architecture

```
spotsapp/
├── app/                  # Expo Router screens & layouts
├── features/             # Feature modules (spots, wiki, auth, admin)
│   └── <feature>/
│       ├── api/          # API call functions
│       ├── hooks/        # React Query hooks
│       ├── components/   # Feature-specific UI
│       └── types.ts
├── stores/               # Zustand stores (auth, map)
├── lib/                  # Shared utilities (apiClient, queryClient)
├── components/           # Shared UI components
└── server/               # Express 5 backend (ESM + TypeScript)
    ├── src/
    │   ├── routes/       # Thin route handlers
    │   ├── services/     # Business logic & DB access
    │   ├── schemas/      # Zod validation schemas
    │   └── middleware/    # Auth, error handling
    └── prisma/           # Schema, migrations, seed
```

**Frontend:** Expo SDK 54, Expo Router, React Query, Zustand

**Backend:** Express 5, Prisma 6, PostgreSQL, JWT auth, Zod validation

**API pattern:** All responses use `{ data, meta?, error? }` envelope. Auth via Bearer token.

## Validation

```bash
npm run validate    # runs frontend typecheck + server typecheck + web build
```

## Database
PostgreSQL has psql. You can connect and explore:
psql -U postgres -d spotsapp                                                       
                                                                                  
  Some useful commands once inside:                                                 
                                                                                    
  - \dt — list all tables
  - \d condition_confirmations — show table structure
  - \d condition_reports — show table structure
  - SELECT * FROM condition_reports LIMIT 5; — query data
  - \q — quit
  Alternatively, Prisma Studio gives you a visual UI:

  cd /opt/spotapp/server && npx prisma studio

  It opens a web interface (usually on port 5555) where you can browse and edit
  data.

## Testing on iPhone (via Tunnels)

The backend and frontend run inside a **dev container** on WSL2 (a Linux VM on Windows).
iPhones on the same Wi-Fi network **cannot** reach the container's `localhost` directly
— port forwarding and firewall rules across Windows, WSL2, and the container are
unreliable. The workaround is to use **tunnels** that expose both services to the
public internet over HTTPS.

Two tunnels are needed:

| Service  | Tool               | What it does                                                 |
|----------|--------------------|--------------------------------------------------------------|
| Backend  | `cloudflared`      | Exposes Express (port 3000) via a random `*.trycloudflare.com` URL |
| Frontend | Expo `--tunnel`    | Exposes Metro bundler (port 8081) via ngrok so Expo Go can load the JS bundle |

### Prerequisites

- **Expo Go** installed on the iPhone (from App Store)
- **`cloudflared`** installed in the dev container (the Cloudflare Tunnel client):
  ```bash
  # Check if already installed:
  cloudflared --version

  # Install if missing (Debian/Ubuntu):
  curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
    | sudo tee /usr/share/keyrings/cloudflare-archive-keyring.gpg >/dev/null
  echo "deb [signed-by=/usr/share/keyrings/cloudflare-archive-keyring.gpg] https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
    | sudo tee /etc/apt/sources.list.d/cloudflared.list
  sudo apt update && sudo apt install cloudflared
  ```

### Step-by-step setup

You need **three terminal tabs/panes** inside the dev container.

#### Terminal 1 — Start the backend

```bash
cd /opt/spotapp/server
npm run dev                          # Express starts on http://localhost:3000
```

#### Terminal 2 — Start the Cloudflare tunnel for the backend API

```bash
cloudflared tunnel --url http://localhost:3000
```

This prints output like:

```
INF +--------------------------------------------------------------------------------------------+
INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
INF |  https://some-random-words.trycloudflare.com                                               |
INF +--------------------------------------------------------------------------------------------+
```

Copy that `https://....trycloudflare.com` URL — you'll need it in the next steps.
The URL changes every time you restart `cloudflared`.

> **How it works:** `cloudflared tunnel` opens an outbound connection from the container to
> Cloudflare's edge network. Cloudflare assigns a random public hostname and proxies
> incoming HTTPS requests back through that connection to your local port 3000. No
> account, login, or config file is needed — it's a "quick tunnel" (sometimes called
> TryCloudflare). The tunnel stays open as long as the command is running.

#### Terminal 3 — Configure env files and start the frontend

**a) Tell the frontend where the API is:**

Edit `/opt/spotapp/.env` and set the tunnel URL:

```env
EXPO_PUBLIC_API_BASE_URL=https://some-random-words.trycloudflare.com
```

**b) Allow CORS from the tunnel origin:**

Edit `/opt/spotapp/server/.env` and add the tunnel URL to `CORS_ORIGIN` (comma-separated):

```env
CORS_ORIGIN=http://localhost:8081,https://some-random-words.trycloudflare.com
```

Then **restart the backend** (Terminal 1) so it picks up the new CORS setting.

**c) Start the frontend with tunnel mode:**

```bash
cd /opt/spotapp
npx expo start --tunnel --clear
```

Expo's `--tunnel` flag uses ngrok under the hood to expose the Metro bundler. On first
use, Expo will prompt you to install `@expo/ngrok` — say yes. After startup, a QR code
is shown in the terminal.

**d) Open on iPhone:**

Open the Camera app on your iPhone and scan the QR code. It opens Expo Go, which
downloads the JS bundle through the ngrok tunnel and connects to the API through the
Cloudflare tunnel.

### How the pieces connect

```
iPhone (Expo Go)
  │
  ├─ JS bundle ──→ ngrok tunnel ──→ Metro bundler (container :8081)
  │
  └─ API calls ──→ Cloudflare tunnel ──→ Express server (container :3000)
```

The frontend code in `lib/getDevServerUrl.ts` reads `EXPO_PUBLIC_API_BASE_URL` from the
environment. When set, it uses that URL for all API requests instead of trying to
auto-detect a local IP.

### Tearing down

- Press `Ctrl+C` in each terminal to stop the frontend, tunnel, and backend.
- The Cloudflare tunnel URL becomes invalid immediately.
- No cleanup is needed — quick tunnels are stateless.

### Troubleshooting

- **New tunnel URL after restart:** The `cloudflared` URL changes every time. Update
  both `.env` files and restart the backend + frontend when that happens.
- **CORS errors in Expo Go logs:** Make sure the Cloudflare URL in `server/.env`
  `CORS_ORIGIN` matches exactly (no trailing slash) and you restarted the backend.
- **"Network request failed" on iPhone:** Verify the Cloudflare tunnel is still running
  in Terminal 2. You can test by opening the tunnel URL in a browser — it should return
  the health check JSON.

### Switching back to web-only development

For regular web development (no iPhone), revert to the simpler local setup:

```bash
# .env (project root)
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000

# server/.env — CORS_ORIGIN can just be:
CORS_ORIGIN=http://localhost:8081

# Start normally without --tunnel:
npx expo start --web --clear
```

---

## Frontend issue reset
Try nuking the Metro cache completely and restarting:                             
                                                                                    
  rm -rf /tmp/metro-* /tmp/haste-map-* /opt/spotapp/.expo/web && npx expo  
  start --web --clear                                                               
                                                                                    
  If that still fails, it may be that the node_modules got into a bad state. In that
   case, reinstall:                                                                 

  rm -rf node_modules && npm install && npx expo start --web --clear 