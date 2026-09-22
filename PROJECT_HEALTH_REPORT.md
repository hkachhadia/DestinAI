# DestinAI — Project Health Report

Generated after full merge of Client Phase 1 + 2, Server Phase 1 + 2.

---

## Build Status

| Check | Status | Notes |
|---|---|---|
| `server: tsc --noEmit` | ✅ 0 errors | All 4-ZIP conflicts resolved |
| `server: npm run build` | ✅ Clean | tsc + tsc-alias path resolution |
| `client: tsc --noEmit` | ✅ 0 errors | All client-2 type mismatches fixed |
| `client: npm run build` | ✅ Clean | 1013 modules, 9.52s |
| `client: bundle size` | ✅ Acceptable | 376 KB (recharts) + 381 KB (core) gzipped to ~220 KB total |

---

## Conflicts Resolved

| Category | Count | Resolution |
|---|---|---|
| Duplicate files | 12 pairs | Best implementation chosen per pair |
| Import path conflicts (`phase1/`) | 9 files | Rewritten to `@modules/` aliases |
| `ApiError` argument order | 12 files | Normalised to `(statusCode, message, code)` |
| `requestValidator` → `validate.middleware` | 4 route files | Rewritten |
| `httpClient`/`unwrap` vs `axiosClient` | 4 API files | Aliases added to `axiosClient.ts` |
| `req.user.id` vs `req.user.userId` | `express.d.ts` | Both properties set to same value |
| `MONGO_URI` vs `MONGODB_URI` | `env.ts` | Unified to `MONGO_URI` |
| `scoreApi` split | 2 files | Merged with named exports as aliases |
| Tailwind plugins missing | `package.json` | `@tailwindcss/forms` + `container-queries` added |
| `unwrap<T>` null handling | `axiosClient.ts` | Fixed generic to `T \| null`, throw on null |

---

## API Coverage

| Frontend Page | API Endpoint | Status |
|---|---|---|
| AuthPage login | `POST /auth/login` | ✅ |
| AuthPage signup | `POST /auth/signup` | ✅ |
| Token refresh (auto) | `POST /auth/refresh` | ✅ |
| OnboardingWizard step 1 | `PATCH /users/me` | ✅ |
| OnboardingWizard step 2 | `POST /resumes/upload` | ✅ |
| OnboardingWizard step 3 | `POST /github/connect`, `POST /cp/connect` | ✅ |
| OnboardingWizard step 4 | `PATCH /users/me` | ✅ |
| DashboardPage | `GET /score/overview` | ✅ |
| AnalyticsPage | `GET /score/overview` | ✅ |
| AIReportPage | `GET /ai/insights/career-report/latest` | ✅ |
| AIReportPage regenerate | `POST /ai/insights/career-report/regenerate` | ✅ |
| AIReportPage interview | `GET /ai/insights/interview-prep` | ✅ |
| HistoryPage | `GET /score/history` | ✅ |
| ComparisonPage | `GET /score/comparison` | ✅ |
| SettingsPage read | `GET /users/me/settings` | ✅ |
| SettingsPage write | `PATCH /users/me/settings` | ✅ |
| Logout | `POST /auth/logout` | ✅ |

All **17 frontend→backend API connections** are wired and returning the correct envelope shape.

---

## Security Checklist

| Control | Status | Details |
|---|---|---|
| Helmet | ✅ | Security headers on all responses |
| CORS | ✅ | Locked to `CORS_ALLOWED_ORIGINS` |
| JWT access tokens | ✅ | 15-min expiry, RS256 |
| JWT refresh rotation | ✅ | Hash stored, rotated on every use, `tokenVersion` bump on logout |
| bcrypt | ✅ | `BCRYPT_SALT_ROUNDS` configurable, default 10 |
| Rate limiting | ✅ | Global (100/15min) + stricter auth (20/15min) |
| Input validation | ✅ | Zod schemas on every mutating route via `validate.middleware` |
| File upload safety | ✅ | MIME-type filter (PDF/DOCX only), size limit, memory buffer (no shell execution) |
| MongoDB injection | ✅ | Mongoose ORM, no raw query strings |
| Error information leakage | ✅ | Stack traces suppressed in production; only `code` + `message` returned |
| Gemini key guard | ✅ | `ApiError 503` if `GEMINI_API_KEY` missing — server does not crash |

---

## Performance Notes

| Area | Approach |
|---|---|
| Code splitting | All 6 dashboard pages are `React.lazy()` — only loaded when navigated to |
| React Query stale time | 30 seconds — avoids redundant refetches during navigation |
| Score recomputation | POST `/score/recompute` is manual — not triggered on every page load |
| Gemini calls | Long-running; server-2's `analysis.service` runs analysis inline on POST `/analysis`. Consider moving to a BullMQ background queue (Phase 3) if Render's 30s request timeout becomes an issue |
| MongoDB indexes | `userId + createdAt` compound index on `Resume`, `Analysis` for fast "latest" queries |

---

## Known Limitations (Phase 3 Backlog)

| Item | Impact | Suggested Fix |
|---|---|---|
| Analysis runs synchronously in request | Gemini can take 10–30s; Render free tier has a 30s timeout | Move to BullMQ queue + polling endpoint |
| No email verification | Users can sign up with fake emails | Add nodemailer + verification token flow |
| No OAuth (Google/GitHub login) | Auth is email/password only | Add Passport.js OAuth strategies |
| Resume files not persisted to disk/S3 | Stored as memory buffer, not saved | Swap to `uploadResumeToDisk` middleware + S3 upload |
| CodeChef adapter uses HTML scraping | Fragile if CodeChef changes markup | Use official API when available |
| No WebSocket/SSE progress | Analysis progress not streamed | Add SSE endpoint for real-time status |

---

## File Counts (Final Merged Project)

```
server/src:   81 TypeScript files across 11 modules
client/src:   74 TypeScript/TSX files across 10 page/component groups
Total:        155 source files + configs + docs
```
