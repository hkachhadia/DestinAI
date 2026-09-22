# DestinAI API Documentation

Base URL: `https://your-backend.onrender.com/api/v1`
All endpoints return: `{ success, data, message, error }`

---

## Authentication

All protected endpoints require:
```
Authorization: Bearer <accessToken>
```
Access tokens expire in **15 minutes**. Use `/auth/refresh` to rotate.

---

## Auth  `/auth`

### POST `/auth/signup`
Create a new account.
```json
Body: { "name": "Alex Rivera", "email": "alex@example.com", "password": "Secure1234" }
Response 201: { "user": {...}, "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

### POST `/auth/login`
```json
Body: { "email": "alex@example.com", "password": "Secure1234" }
Response 200: { "user": {...}, "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

### POST `/auth/refresh`
Rotate refresh token (old token is invalidated).
```json
Body: { "refreshToken": "eyJ..." }
Response 200: { "user": {...}, "accessToken": "eyJ...", "refreshToken": "eyJ..." }
```

### POST `/auth/logout`  🔒
Invalidates all refresh tokens for the user.
```json
Response 200: { "data": null, "message": "Logged out successfully" }
```

### GET `/auth/me`  🔒
Returns current authenticated user.

---

## Users  `/users`

### GET `/users/me`  🔒
Full user profile.

### PATCH `/users/me`  🔒
Update profile (used by onboarding wizard steps).
```json
Body: {
  "name": "Alex Rivera",
  "college": "Stanford University",
  "location": "San Francisco, CA",
  "experienceLevel": "1-3",
  "targetRole": "Full Stack Developer",
  "targetCompanies": ["Google", "Stripe"]
}
```

### GET `/users/me/settings`  🔒
Fetch notification preferences and theme.

### PATCH `/users/me/settings`  🔒
```json
Body: {
  "profile": { "fullName": "Alex Rivera", "bio": "Software engineer..." },
  "notifications": { "weeklyDigest": true, "scoreAlerts": false },
  "theme": "dark"
}
```

### DELETE `/users/me`  🔒
Permanently delete account.

---

## Resumes  `/resumes`

### POST `/resumes/upload`  🔒
Upload and parse a resume (PDF or DOCX, max 5 MB).
```
Content-Type: multipart/form-data
Field name: "resume"
Response 201: { resume document with parsedData + atsFindings }
```

### GET `/resumes/me`  🔒
Latest resume for the authenticated user.

### GET `/resumes/:id`  🔒
Specific resume by ID.

---

## GitHub  `/github`

### POST `/github/connect`  🔒
Link a GitHub account by username.
```json
Body: { "username": "alex-codes" }
Response 201: { GitHub profile document }
```

### POST `/github/sync`  🔒
Re-fetch stats for the connected account (triggers live GitHub API calls).

### GET `/github/profile`  🔒
Stored GitHub stats.

---

## Competitive Programming  `/cp`

### POST `/cp/connect`  🔒
Link a platform handle.
```json
Body: {
  "platform": "leetcode",   // leetcode | codeforces | codechef | gfg | hackerrank
  "handle": "alex_leet"
}
```

### POST `/cp/sync`  🔒
Sync all connected platforms.

### POST `/cp/sync/:platform`  🔒
Sync a single platform (e.g. `POST /cp/sync/leetcode`).

### GET `/cp/profiles`  🔒
All connected CP profiles.

---

## Analysis  `/analysis`

### POST `/analysis`  🔒
**Trigger a full career scan.**  
Orchestrates: resume parsing → GitHub sync → CP sync → scoring → Gemini AI report.
```json
Body: { "targetRole": "Backend Developer" }   // optional — defaults to user's saved targetRole
Response 201: { analysis document }
```

### GET `/analysis/latest`  🔒
Most recent analysis for the user.

### GET `/analysis/:id`  🔒
Specific analysis by ID.

---

## AI Insights  `/ai`

### GET `/ai/insights/career-report/latest`  🔒
AI-generated career report from the latest analysis.
```json
Response 200: {
  "analysis": { scores, skillMatch, ... },
  "insight": {
    "report": {
      "executiveSummary": "...",
      "strengths": [...],
      "weaknesses": [...],
      "skillGapAnalysis": [...],
      "learningRoadmap": [...],
      "recommendedProjects": [...],
      "interviewQuestions": [...],
      "careerAdvice": "..."
    }
  }
}
```

### GET `/ai/insights/career-report/:analysisId`  🔒
AI report for a specific past analysis snapshot.

### POST `/ai/insights/career-report/regenerate`  🔒
Force Gemini to re-generate a fresh report based on current data.
```json
Body: { "targetRole": "AI Engineer" }   // optional
```

### GET `/ai/insights/interview-prep`  🔒
Role-specific interview questions from the latest analysis.
```json
Response 200: {
  "targetRole": "Full Stack Developer",
  "questions": [
    { "question": "...", "category": "technical", "difficulty": "medium", "hint": "..." }
  ],
  "careerAdvice": "..."
}
```

---

## Score  `/score`

### GET `/score/overview`  🔒
**Primary endpoint for the Dashboard and Analytics pages.**
```json
Response 200: {
  "careerScore": 74,
  "atsScore": 68,
  "resumeScore": 71,
  "githubScore": 82,
  "codingScore": 65,
  "skillMatch": {
    "matchedSkills": ["React", "TypeScript", "Node.js"],
    "missingSkills": ["Kubernetes", "Go"],
    "matchPercentage": 62
  },
  "recentActivity": [...],
  "connectedSources": { "resume": true, "github": true, "cp": true }
}
```

### GET `/score/history?page=1&limit=20`  🔒
Paginated list of past scans.
```json
Response 200: {
  "entries": [{ "id", "title", "date", "score", "icon" }],
  "total": 12
}
```

### GET `/score/comparison?baseId=&compareId=`  🔒
Side-by-side comparison of two analysis snapshots.
```json
Response 200: {
  "base": { "id", "label", "score", "roleTitle", "date" },
  "compare": { "id", "label", "score", "roleTitle", "date" },
  "deltaPercent": 8,
  "insight": "Your career score improved by 8%..."
}
```

### POST `/score/recompute`  🔒
Forces a fresh scoring run without re-calling Gemini (fast, deterministic).

---

## Dashboard  `/dashboard`

### GET `/dashboard`  🔒
Alias for `/score/overview`. Returns the same aggregated payload.

---

## History  `/history`

### GET `/history?page=1&limit=20`  🔒
Paginated full analysis history with detailed score breakdowns.

---

## Compare  `/compare?baseId=&compareId=`

### GET `/compare`  🔒
Raw comparison of two analysis documents (unformatted — prefer `/score/comparison`).

---

## Health

### GET `/health`
Liveness check — no auth required.
```json
Response 200: { "success": true, "message": "DestinAI API is healthy", "data": { "timestamp": "...", "version": "1.0.0" } }
```

---

## Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or expired access token |
| `TOKEN_INVALID` | 401 | Malformed JWT |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token expired or rotated |
| `EMAIL_TAKEN` | 409 | Signup with existing email |
| `INVALID_CREDENTIALS` | 401 | Wrong email/password |
| `RESUME_NOT_FOUND` | 404 | Resume ID not found for this user |
| `RESUME_PARSE_FAILED` | 422 | Text extraction failed |
| `UNSUPPORTED_FILE_TYPE` | 415 | Not PDF or DOCX |
| `GITHUB_USER_NOT_FOUND` | 404 | GitHub username does not exist |
| `GITHUB_RATE_LIMITED` | 429 | GitHub API rate limit hit |
| `GEMINI_NOT_CONFIGURED` | 503 | Server missing GEMINI_API_KEY |
| `AI_GENERATION_FAILED` | 500 | Gemini call failed after retry |
| `ANALYSIS_NOT_FOUND` | 404 | No analysis exists for this user yet |
| `ANALYSIS_PREREQUISITES_MISSING` | 422 | Need resume + GitHub before running analysis |
| `CP_PLATFORM_UNSUPPORTED` | 400 | Unknown CP platform key |
| `VALIDATION_ERROR` | 400 | Request body failed Zod schema |
