# DestinAI Backend — Server Phase 1

Express + TypeScript + MongoDB Atlas (Mongoose) foundation: authentication, user profile,
resume upload/storage/parsing skeleton, and analysis history logging.

**Explicitly out of scope for this phase** (interfaces left clean for Phase 2, nothing stubbed
with fake data):
- Gemini AI integration (`aiInsights` field reserved on `AnalysisHistory`, no `ai` module yet)
- GitHub integration (`githubSnapshot` field reserved, no `github` module yet)
- Competitive programming integrations
- Scoring engine / analytics (`score` field reserved on `AnalysisHistory`)

## Stack

Express 4, TypeScript (strict), Mongoose 8, Zod validation, JWT (access + refresh, rotated),
bcryptjs, Multer (disk storage), pdf-parse, Helmet, CORS, express-rate-limit, Winston + Morgan.

## Folder structure

```
src/
├── config/            # env, db, logger, storage — one file per external dependency
├── modules/
│   ├── auth/           # signup, login, refresh, logout, /auth/me
│   ├── user/            # profile get/update (used by onboarding + settings)
│   ├── resume/           # upload, parsing skeleton, status, CRUD
│   └── analysisHistory/  # read-only history of each "scan" (Phase 2 fields reserved)
├── middlewares/        # auth, validation, upload, rate limiting, error handling, logging
├── utils/              # ApiError, ApiResponse, asyncHandler, jwt/hash helpers
├── routes/index.ts     # mounts every module under API_PREFIX, health check
├── app.ts              # Express app: security middleware -> routes -> error handler
└── server.ts            # connects Mongo, starts HTTP server, graceful shutdown
```

Each module follows `routes -> controller -> service -> model`, so a new dev (or Phase 2 work)
can add `modules/github/`, `modules/ai/`, etc. without touching any file above.

## Setup

```bash
cp .env.example .env   # fill in MONGO_URI (Atlas) + JWT secrets
npm install
npm run dev             # ts-node-dev, hot reload
```

```bash
npm run build && npm start   # production build
npm run typecheck             # tsc --noEmit
```

## API surface (Phase 1)

All routes are prefixed with `API_PREFIX` (default `/api/v1`). Every response uses the
envelope `{ success, message, data }` on success or `{ success: false, message, error }` on
failure (see `utils/ApiResponse.ts` / `middlewares/error.middleware.ts`).

| Method | Route | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Liveness check |
| POST | `/auth/signup` | none (rate-limited) | Create account, returns tokens |
| POST | `/auth/login` | none (rate-limited) | Returns tokens |
| POST | `/auth/refresh` | none (rate-limited) | Rotates refresh token, returns new pair |
| POST | `/auth/logout` | Bearer | Invalidates refresh token + all sessions |
| GET | `/auth/me` | Bearer | Current user |
| GET | `/users/me` | Bearer | Current user profile |
| PATCH | `/users/me` | Bearer | Update profile (onboarding steps write here) |
| DELETE | `/users/me` | Bearer | Delete account |
| POST | `/resumes/upload` | Bearer | Multipart upload (`resume` field, PDF/DOCX ≤5MB), parses inline |
| GET | `/resumes/me` | Bearer | Latest resume for the user |
| GET | `/resumes/:id` | Bearer | Resume by id |
| GET | `/resumes/:id/status` | Bearer | Parsing status only |
| DELETE | `/resumes/:id` | Bearer | Delete resume + file |
| GET | `/analysis-history/me` | Bearer | List scan history |
| GET | `/analysis-history/:id` | Bearer | One scan's detail |

## Resume parsing (Phase 1 skeleton)

`modules/resume/resume.parser.ts` extracts raw text from PDFs only (via `pdf-parse`) and
returns a correctly-shaped but mostly-empty `parsedData` object, plus a best-effort email/link
regex extraction. Structured section parsing (education/experience/skills), DOCX support, and
Gemini-assisted extraction are marked as `TODO(Phase 2)` at the exact call sites — no other file
needs to change when that work lands, since `resume.service.ts` only depends on
`resumeParserService.parse()`'s existing return shape.

## Storage

`config/storage.ts` defines a `StorageProvider` interface and a `localStorageProvider`
implementation (disk, under `RESUME_UPLOAD_DIR`). Swapping to S3/Cloudinary in Phase 2 means
implementing the same interface and changing one import in `resume.service.ts`.

## Auth model

Access tokens (short-lived, 15m default) are verified per-request by `auth.middleware.ts`.
Refresh tokens are long-lived, hashed with bcrypt before storage (`user.refreshTokenHash`), and
rotated on every use. Logout — and any future "log out of all devices" action — increments
`user.tokenVersion`, which immediately invalidates every outstanding refresh token.
