# Soccer Score Manager

A full-featured soccer score manager built with **React + Vite** (frontend), **Node.js + Express** (backend), and **Supabase** (free PostgreSQL database).

All hosting and database tiers are **free**:
- Frontend: [Vercel](https://vercel.com) (free)
- Backend: [Render](https://render.com) (free web service)
- Database: [Supabase](https://supabase.com) (free — 500MB PostgreSQL)

---

## Features

- **Leagues** — create and manage leagues with seasons
- **Teams** — add teams assigned to a league
- **Matches** — schedule matches, filter by league / status / date, click to manage live
- **Match Detail** — start/end a match, record goals (player + minute), live scoreboard
- **Standings** — auto-computed league table (W/D/L/GD/Pts) from finished matches
- **Players** — add players to teams, view goal tallies sorted by top scorer

---

## Project Structure

```
soccer-score-manager/
├── backend/                 # Node.js + Express API
│   ├── db/supabase.js       # Supabase client
│   ├── routes/              # leagues, teams, matches, players, goals, standings
│   ├── index.js
│   └── .env.example
├── frontend/                # React + Vite + Tailwind
│   ├── src/
│   │   ├── api/client.js    # Axios base client
│   │   ├── components/      # Modal, Spinner, EmptyState
│   │   └── pages/           # LeaguesPage, TeamsPage, MatchesPage, MatchDetailPage, StandingsPage, PlayersPage
│   └── .env.example
└── supabase/
    └── schema.sql           # Run this in Supabase SQL Editor
```

---

## Local Development

### 1. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Open the **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql).
3. In your project settings → **API**, copy:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` key (secret) → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase values
npm install
npm run dev       # starts on http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
# .env already points to http://localhost:4000
npm install
npm run dev       # starts on http://localhost:5173
```

---

## Deployment

### Supabase (already done in local setup)

Make sure your schema is applied and note your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

### Backend → Render

1. Push this repo to GitHub.
2. Go to [render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repo, set **Root Directory** to `backend`.
4. Build command: `npm install`
5. Start command: `npm start`
6. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT` = `4000`
7. Deploy. Copy the Render service URL (e.g. `https://soccer-api.onrender.com`).

> Note: Free Render services spin down after 15 minutes of inactivity. First request may take ~30s to wake up.

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repo, set **Root Directory** to `frontend`.
3. Framework: **Vite**.
4. Add environment variable:
   - `VITE_API_URL` = your Render backend URL (e.g. `https://soccer-api.onrender.com`)
5. Deploy.

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/leagues` | List / create leagues |
| GET/PUT/DELETE | `/api/leagues/:id` | Get / update / delete league |
| GET/POST | `/api/teams?league_id=` | List / create teams |
| GET/PUT/DELETE | `/api/teams/:id` | Get / update / delete team |
| GET/POST | `/api/matches?league_id=&status=&date=` | List / create matches |
| GET/PUT/DELETE | `/api/matches/:id` | Get (with goals) / update score+status / delete |
| GET/POST | `/api/players?team_id=` | List / create players |
| GET/PUT/DELETE | `/api/players/:id` | Get / update / delete player |
| GET | `/api/goals?match_id=` | List goals |
| POST | `/api/goals` | Record goal (auto-updates match score) |
| DELETE | `/api/goals/:id` | Remove goal (auto-updates match score) |
| GET | `/api/standings/:leagueId` | Computed standings table |
