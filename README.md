# SpotApp

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

The backend responds on port 3000. If the port is already in use, kill the existing process first:
  lsof -ti:3000 | xargs -r kill -9                          
  cd /opt/spotapp/server && npx tsx src/server.ts  
                                                                                    
  Frontend (from project root):
  npx expo start --web

    
  Test db with command pg_isready
  If it's not running, start it with:
  service postgresql start                    
  
  If the database was rebuilt since last time, you'll also need to re-seed first:
  cd /opt/spotapp/server && npx prisma migrate dev && npx prisma db seed


### 2. Frontend

```bash
# from project root
npm install
npx expo start --web --clear        # opens on http://localhost:8081
```

## Architecture

```
spotapp/
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
psql -U postgres -d spotapp                                                       
                                                                                  
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

## Frontend issue reset
Try nuking the Metro cache completely and restarting:                             
                                                                                    
  rm -rf /tmp/metro-* /tmp/haste-map-* /opt/spotapp/.expo/web && npx expo  
  start --web --clear                                                               
                                                                                    
  If that still fails, it may be that the node_modules got into a bad state. In that
   case, reinstall:                                                                 

  rm -rf node_modules && npm install && npx expo start --web --clear 