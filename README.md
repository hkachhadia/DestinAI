# DestinAI — AI Career Intelligence Platform

## Quick Start (Local)

```bash
# 1. Clone / unzip
# 2. Server setup
cd server
cp .env.example .env       # fill in MONGO_URI, JWT secrets, GEMINI_API_KEY, GITHUB_API_TOKEN
npm install
npm run dev                # runs on http://localhost:5000

# 3. Client setup (new terminal)
cd client
cp .env.example .env       # VITE_API_BASE_URL=http://localhost:5000/api/v1
npm install
npm run dev                # runs on http://localhost:5173
```

## Required Environment Variables

### server/.env
| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | ✅ | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | ✅ | 32+ char random hex |
| `JWT_REFRESH_SECRET` | ✅ | Different 32+ char random hex |
| `GEMINI_API_KEY` | ✅ | From https://aistudio.google.com/app/apikey |
| `GITHUB_API_TOKEN` | Recommended | From https://github.com/settings/tokens (read:user, public_repo) |

**Generate JWT secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### client/.env
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_USE_MOCKS=false
```

## Architecture

```
client/ (React 18 + Vite + TypeScript + Tailwind)
  src/
    pages/         — Dashboard, Analytics, AI Report, History, Settings
    components/    — Reusable UI components
    hooks/         — React Query data hooks
    api/           — Axios API calls

server/ (Express + TypeScript + MongoDB)
  src/
    modules/
      auth/        — JWT auth (signup, login, refresh, logout)
      analysis/    — Career analysis orchestration
      ai/          — Gemini AI pipeline
      scoring/     — Deterministic scoring engine
      github/      — GitHub REST API integration
      resume/      — PDF/DOCX parsing + ATS scoring
      competitiveProgramming/ — LeetCode/Codeforces/CodeChef/GFG/HackerRank
      dashboard/   — Aggregated score overview
      history/     — Analysis history
      compare/     — Side-by-side comparison
```

## Deployment

### Backend → Render
1. Create Web Service, connect GitHub repo, root: `server/`
2. Runtime: Docker (uses `server/Dockerfile`)
3. Add all env vars from `server/.env.example`

### Frontend → Vercel
1. Import repo, root: `client/`
2. Add `VITE_API_BASE_URL=https://your-render-url.onrender.com/api/v1`

## API Key Setup

### Gemini AI
1. Go to https://aistudio.google.com/app/apikey
2. Create API key → copy to `GEMINI_API_KEY`

### GitHub Token
1. GitHub → Settings → Developer settings → Personal access tokens → Classic
2. Scopes: `read:user`, `public_repo`
3. Copy to `GITHUB_API_TOKEN`

### No API keys needed for
- LeetCode (public GraphQL endpoint)
- Codeforces (official public REST API)
- CodeChef (HTML scraping)
- GeeksForGeeks (API + HTML scraping fallback)
- HackerRank (HTML scraping)
