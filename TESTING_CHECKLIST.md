# DestinAI — Testing Checklist

Use this checklist before every deployment.

---

## 1. Build Checks

- [ ] `cd server && npm run typecheck` — 0 errors
- [ ] `cd server && npm run build` — exits 0
- [ ] `cd client && npm run typecheck` — 0 errors
- [ ] `cd client && npm run build` — exits 0, no warnings

---

## 2. Authentication Flow

- [ ] **Signup** — POST `/auth/signup` with new email returns 201 + tokens
- [ ] **Duplicate email** — returns 409 `EMAIL_TAKEN`
- [ ] **Login** — POST `/auth/login` returns 200 + tokens
- [ ] **Wrong password** — returns 401 `INVALID_CREDENTIALS`
- [ ] **Refresh** — POST `/auth/refresh` with valid refresh token returns new pair
- [ ] **Expired refresh** — returns 401 `REFRESH_TOKEN_INVALID`
- [ ] **Logout** — POST `/auth/logout` returns 200; subsequent refresh returns 401
- [ ] **Protected route without token** — returns 401

---

## 3. Onboarding Wizard

- [ ] Step 1 (Personal Info) — PATCH `/users/me` saves name/college/location/experienceLevel
- [ ] Step 2 (Resume Upload) — POST `/resumes/upload` with PDF returns parsed resume
- [ ] Step 2 — DOCX upload parses successfully
- [ ] Step 2 — File > 5MB returns 413
- [ ] Step 2 — Non-PDF/DOCX returns 415 `UNSUPPORTED_FILE_TYPE`
- [ ] Step 3 (GitHub) — POST `/github/connect` with valid username returns profile
- [ ] Step 3 (GitHub) — Invalid username returns 404 `GITHUB_USER_NOT_FOUND`
- [ ] Step 3 (CP) — POST `/cp/connect` with LeetCode handle returns profile
- [ ] Step 4 (Target Role) — PATCH `/users/me` sets targetRole, `isOnboarded` becomes true
- [ ] After onboarding — redirect goes to `/dashboard`, not `/onboarding`

---

## 4. Analysis Engine

- [ ] POST `/analysis` triggers full pipeline (resume + github + cp + scoring + gemini)
- [ ] Response contains `scores.careerScore` between 0–100
- [ ] Response contains `skillMatch.matchedSkills` array
- [ ] GET `/analysis/latest` returns most recent analysis
- [ ] Analysis without resume connected returns 422 `ANALYSIS_PREREQUISITES_MISSING`

---

## 5. AI / Gemini

- [ ] GET `/ai/insights/career-report/latest` returns insight with `executiveSummary`
- [ ] Insight contains `learningRoadmap` array
- [ ] Insight contains `interviewQuestions` array
- [ ] POST `/ai/insights/career-report/regenerate` creates a new insight
- [ ] GET `/ai/insights/interview-prep` returns questions for target role
- [ ] Missing `GEMINI_API_KEY` returns 503 `GEMINI_NOT_CONFIGURED`

---

## 6. Score Endpoints

- [ ] GET `/score/overview` returns all 5 score dimensions
- [ ] `connectedSources.resume` is `true` after resume upload
- [ ] GET `/score/history` returns paginated list with `total`
- [ ] GET `/score/comparison?baseId=X&compareId=Y` returns `deltaPercent`
- [ ] Missing `baseId` or `compareId` returns 400 `VALIDATION_ERROR`
- [ ] POST `/score/recompute` updates `careerScore`

---

## 7. Frontend Pages

- [ ] `/` (landing) — loads without errors
- [ ] `/auth` — login/signup toggle works
- [ ] `/onboarding` — 4 steps navigate correctly
- [ ] `/dashboard` — score rings render with live data (not mocks)
- [ ] `/analytics` — all 6 charts render (radar, pie, timeline, heatmap, etc.)
- [ ] `/ai-report` — career report loads; interview tab shows questions
- [ ] `/history` — list renders; clicking a row shows details
- [ ] `/comparison` — both dropdowns populate; comparison card renders
- [ ] `/settings` — profile form pre-fills; saves successfully
- [ ] Sidebar active link highlights correctly for all 6 routes
- [ ] Mobile: Sidebar hidden; MobileNav visible and functional

---

## 8. Error Handling

- [ ] Expired session (401) — auto-refreshes token transparently
- [ ] Refresh token expired — redirects to `/auth`
- [ ] Network error — `ErrorState` component shown, not blank page
- [ ] Gemini timeout — `ErrorState` with retry button shown
- [ ] 500 from server — user-friendly error message, not raw stack trace

---

## 9. Security

- [ ] `Authorization: Bearer invalid` returns 401, not 500
- [ ] SQL/NoSQL injection attempt in request body rejected by Zod
- [ ] File upload with `.exe` extension returns 415
- [ ] Rapid login attempts hit rate limiter (20 req/15min)
- [ ] Response headers include `X-Content-Type-Options: nosniff` (Helmet)
- [ ] CORS rejects requests from unlisted origins

---

## 10. Deployment Smoke Test

```bash
BASE=https://your-backend.onrender.com/api/v1

# Health
curl $BASE/health

# Auth roundtrip
TOKEN=$(curl -s -X POST $BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}' | jq -r '.data.accessToken')

# Protected endpoint
curl $BASE/users/me -H "Authorization: Bearer $TOKEN"

# Score
curl $BASE/score/overview -H "Authorization: Bearer $TOKEN"
```
