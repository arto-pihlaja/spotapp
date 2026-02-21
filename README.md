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


### 2. Frontend

```bash
# from project root
npm install
npx expo start --web           # opens on http://localhost:8081
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
