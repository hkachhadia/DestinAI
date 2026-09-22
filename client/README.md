# DestinAI Frontend

Google Stitch's exported design (`stitch-source/`) reused verbatim — **no component was
redesigned**. Every page in `src/pages` copies the Stitch markup and Tailwind classes 1:1;
the only changes are converting static HTML into React (`class` → `className`, inline
`<script>` handlers → React state/hooks) and wiring real data through Axios + React Query.

## What's implemented (Server Phase 1)

- **Auth:** `/auth` — login + signup, toggled in one page (matches the Stitch design), backed
  by `AuthContext` + `authApi`. Google/GitHub OAuth buttons link to backend OAuth start routes.
- **Protected routes:** `ProtectedRoute` / `PublicOnlyRoute` guards in `src/guards`, driven by
  `AuthContext`. Unauthenticated users are redirected to `/auth`; users who haven't finished
  onboarding are redirected to `/onboarding`.
- **Dashboard shell:** `DashboardLayout` (Sidebar + Navbar, converted from
  `main_dashboard/code.html`) wraps every protected page. Sidebar links are real `NavLink`s
  with active-state styling; Logout calls `AuthContext.logout()`.
- **Profile setup wizard:** `/onboarding`, a 4-step flow converted from
  `profile_setup_wizard/code.html`:
  1. Personal info → `PATCH /users/me`
  2. Resume upload (drag/drop, progress %, polls parse status) → `POST /resumes/upload` +
     `GET /resumes/status/:jobId`
  3. GitHub + Codeforces/LeetCode/CodeChef usernames → `POST /github/connect`,
     `POST /cp/connect` (each field submits independently)
  4. Target role + target companies → `PATCH /users/me`
- **Dashboard page:** live Destin Score, per-category breakdown, and connected-account summary
  cards, all fetched via React Query with loading/empty states.
- **Stub routes** (`/analytics`, `/report`, `/history`, `/settings`) are wired into the router
  and layout now; converting their remaining Stitch markup is a drop-in follow-up using the
  same pattern as `DashboardPage.tsx`.

## Stack

React 18 + TypeScript + Vite, Tailwind (config copied verbatim from
`stitch-source/electric_verve/DESIGN.md`), React Router, TanStack React Query, Axios,
React Hook Form + Zod for validation.

## Running locally

```bash
cp .env.example .env   # point VITE_API_BASE_URL at your backend
npm install
npm run dev
```

## Folder guide

- `src/api` — one Axios file per backend module (mirrors the backend's route modules 1:1).
- `src/contracts` — shared request/response types; keep in sync with the backend's contracts.
- `src/hooks` — React Query hooks; this is the only layer pages/components should import from.
- `src/context` / `src/guards` — auth session state and route protection.
- `src/layouts` + `src/components/layout` — the Sidebar/Navbar shell, reused by every protected
  page instead of being redefined per page.
- `src/pages` — one folder per route, matching `stitch-source/` screen names.
- `stitch-source/` — the original, untouched Google Stitch export. Treat as the design source
  of truth; if a screen needs new markup, copy it from here first.
