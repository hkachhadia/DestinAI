# DestinAI — Deployment Guide

## Overview

| Layer | Platform | Cost |
|---|---|---|
| Frontend | Vercel | Free |
| Backend | Render | Free / $7/mo Starter |
| Database | MongoDB Atlas | Free (M0) |
| AI | Google Gemini API | Pay-as-you-go |

Estimated production cost: **$0–$7/month** for indie/startup scale.

---

## Step 1 — MongoDB Atlas

1. Sign up at https://cloud.mongodb.com
2. Create a **free M0 cluster** (any region)
3. **Database Access** → Add New Database User:
   - Username: `destinai-prod`
   - Password: generate a strong password
   - Role: **Atlas Admin** or **readWriteAnyDatabase**
4. **Network Access** → Add IP Address:
   - For Render: use `0.0.0.0/0` (allow all) — Render uses dynamic IPs
   - For stricter security: add Render's static outbound IPs after deployment
5. **Connect** → Drivers → copy the URI:
   ```
   mongodb+srv://destinai-prod:<password>@<cluster>.mongodb.net/destinai?retryWrites=true&w=majority
   ```
6. Save this as `MONGO_URI` — you'll need it in Step 3.

---

## Step 2 — Gemini API Key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account
3. Click **Create API Key** → **Create API key in new project**
4. Copy the key — save as `GEMINI_API_KEY`
5. (Optional) Set a budget alert in Google Cloud Console to avoid surprise bills

---

## Step 3 — Backend on Render

1. Push your code to GitHub (both `client/` and `server/` in the same repo)
2. Go to https://dashboard.render.com → **New** → **Web Service**
3. Connect your GitHub repository
4. Configure the service:

   | Setting | Value |
   |---|---|
   | **Name** | `destinai-api` |
   | **Root Directory** | `server` |
   | **Runtime** | **Docker** |
   | **Instance Type** | Free (Starter for always-on) |
   | **Health Check Path** | `/api/v1/health` |

5. Under **Environment Variables**, add every variable from `server/.env.example`:

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `API_PREFIX` | `/api/v1` |
   | `CORS_ALLOWED_ORIGINS` | `https://your-app.vercel.app` |
   | `MONGO_URI` | *(from Step 1)* |
   | `JWT_ACCESS_SECRET` | *(32+ char random string)* |
   | `JWT_REFRESH_SECRET` | *(different 32+ char random string)* |
   | `JWT_ACCESS_EXPIRY` | `15m` |
   | `JWT_REFRESH_EXPIRY` | `30d` |
   | `BCRYPT_SALT_ROUNDS` | `10` |
   | `RATE_LIMIT_WINDOW_MS` | `900000` |
   | `RATE_LIMIT_MAX_REQUESTS` | `100` |
   | `AUTH_RATE_LIMIT_MAX_REQUESTS` | `20` |
   | `RESUME_UPLOAD_DIR` | `uploads/resumes` |
   | `RESUME_MAX_FILE_SIZE_MB` | `5` |
   | `LOG_LEVEL` | `info` |
   | `GEMINI_API_KEY` | *(from Step 2)* |
   | `GEMINI_MODEL` | `gemini-3.8-flash` |
   | `GITHUB_API_TOKEN` | *(your GitHub PAT — optional but recommended)* |

6. Click **Deploy**. First deploy takes ~3 minutes.
7. Note your backend URL: `https://destinai-api.onrender.com`

---

## Step 4 — Frontend on Vercel

1. Go to https://vercel.com → **Add New Project** → Import from GitHub
2. Set the **Root Directory** to `client`
3. Framework: **Vite** (auto-detected)
4. Build settings (auto-detected from `vercel.json`):
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Under **Environment Variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://destinai-api.onrender.com/api/v1` |
   | `VITE_USE_MOCKS` | `false` |

6. Click **Deploy**. Done in ~1 minute.
7. Your app is live at `https://destinai-app.vercel.app`

---

## Step 5 — Update CORS

Go back to **Render → destinai-api → Environment**:
```
CORS_ALLOWED_ORIGINS=https://destinai-app.vercel.app
```
Click **Save Changes** — Render auto-redeploys.

---

## Step 6 — Smoke Test

```bash
# 1. Health check
curl https://destinai-api.onrender.com/api/v1/health

# 2. Sign up
curl -X POST https://destinai-api.onrender.com/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!"}'

# Expected: 201 with accessToken
```

---

## GitHub API Token (Optional)

Without a token, GitHub limits API calls to 60/hour (shared across all server requests).
With a token: 5,000/hour.

1. Go to https://github.com/settings/tokens → **Generate new token (classic)**
2. Select scopes: `read:user`, `public_repo`
3. Copy and add as `GITHUB_API_TOKEN` in Render environment variables

---

## Free Tier Limitations

| Limit | Render Free | Mitigation |
|---|---|---|
| Server sleeps after 15min inactivity | Render Free | Upgrade to Starter ($7/mo) or use UptimeRobot to ping `/health` every 10min |
| 750 hours/month | Render Free | Enough for one always-on service |
| No persistent disk | Render Free | Resume files are stored in-memory (buffer) and parsed — no disk needed with current architecture |

---

## Monitoring

- **Render Logs**: Dashboard → Service → Logs
- **MongoDB Atlas**: Atlas → Monitoring → Metrics
- **Gemini usage**: Google Cloud Console → APIs → Generative Language API
- **Error tracking** (optional): Add [Sentry](https://sentry.io) — set `SENTRY_DSN` and call `Sentry.init()` in `server.ts`
