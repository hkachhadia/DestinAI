# DestinAI — API Configuration Guide

## Required Environment Variables

Copy `server/.env.example` to `server/.env` and fill in each value.

---

## 1. MongoDB Atlas (Required)

**What:** Cloud-hosted MongoDB database  
**Where to get:**
1. Sign up at https://cloud.mongodb.com
2. Create a free M0 cluster
3. Go to **Database Access** → Add a database user
4. Go to **Network Access** → Allow your IP (or 0.0.0.0/0 for development)
5. Go to **Connect** → Drivers → copy the URI

**Format:**
```
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/destinai?retryWrites=true&w=majority
```

**Test:** `npm run dev` will print "MongoDB connected" on success.

---

## 2. JWT Secrets (Required)

**What:** Random strings used to sign authentication tokens  
**Generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Run twice — once for ACCESS_SECRET, once for REFRESH_SECRET
```

```
JWT_ACCESS_SECRET=<64-char-hex>
JWT_REFRESH_SECRET=<different-64-char-hex>
```

**Never reuse** the same value for both secrets.

---

## 3. Gemini AI (Required for AI Career Reports)

**What:** Google's Gemini 1.5 Pro — powers all AI-generated content  
**Where to get:** https://aistudio.google.com/app/apikey  
**Click:** Create API key → Copy  

```
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.8-flash
```

**Without this:** The server boots, but all `/ai/*` endpoints return 503.  
**Test:** POST `/api/v1/analysis` — check if `aiInsightId` is populated.

---

## 4. GitHub API Token (Strongly Recommended)

**What:** GitHub Personal Access Token to fetch repository and contribution data  
**Where to get:** https://github.com/settings/tokens → Generate new token (classic)  
**Scopes needed:** `read:user`, `public_repo`

```
GITHUB_API_TOKEN=ghp_...
```

**Without this:** 60 API requests/hour (shared across all users). With it: 5,000/hour.  
**Contribution graph:** Requires authentication — GitHub score will be 0 without this.

---

## Integration Methods by Platform

| Platform | Method | API Required? | Notes |
|---|---|---|---|
| **GitHub** | Official REST API + GraphQL | Yes — `GITHUB_API_TOKEN` | Token needed for >60 req/hr |
| **LeetCode** | Public GraphQL endpoint | No | Headers/referer required to avoid 403 |
| **Codeforces** | Official REST API | No | Fully public |
| **CodeChef** | HTML scraping | No | May break if CodeChef changes markup |
| **GeeksForGeeks** | Practice API + HTML scraping | No | API-first with scrape fallback |
| **HackerRank** | Profile HTML scraping | No | May break if HackerRank changes markup |

---

## Testing Each Integration

### GitHub
```bash
curl -H "Authorization: Bearer ghp_yourtoken" \
  https://api.github.com/users/torvalds
# Should return 200 with user data
```

### LeetCode
```bash
curl -X POST https://leetcode.com/graphql \
  -H "Content-Type: application/json" \
  -H "Referer: https://leetcode.com" \
  -d '{"query":"query { matchedUser(username: \"leetcode\") { username } }"}'
```

### Codeforces
```bash
curl https://codeforces.com/api/user.info?handles=tourist
# Should return 200 with user data
```

### Gemini
```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

---

## Environment Checklist

| Variable | Required | Default |
|---|---|---|
| `MONGO_URI` | ✅ Yes | — |
| `JWT_ACCESS_SECRET` | ✅ Yes | — |
| `JWT_REFRESH_SECRET` | ✅ Yes | — |
| `GEMINI_API_KEY` | ✅ Yes (for AI) | — |
| `GEMINI_MODEL` | No | `gemini-3.8-flash` |
| `GITHUB_API_TOKEN` | Recommended | — |
| `PORT` | No | `5000` |
| `API_PREFIX` | No | `/api/v1` |
| `NODE_ENV` | No | `development` |
| `BCRYPT_SALT_ROUNDS` | No | `10` |
| `LOG_LEVEL` | No | `info` |

---

## Running Without API Keys

For local frontend development only:
```env
VITE_USE_MOCKS=true
```
This serves mock data for all charts/pages without a running backend.
