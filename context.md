# Project Context — Shamagama FAQ & Community Platform

> Semantic search-powered FAQ and community Q&A platform targeting **10,00,000 users (10 lakh / 1 million)**.
> Project name: **Shamagama** (also known internally as "yaksha-faq-portal").

---

## 1. Overview

**What it does:** Resolves FAQs and manages community Q&A for internship students at scale. Users search for answers semantically; unanswered questions flow into a community board; admins moderate and respond.

**Target scale:** 10 lakh (1 million) registered users, high concurrent search load.

> **Current status:** MVP complete. TypeScript migration done. Local embeddings (`@xenova/transformers`) working. 130 FAQs seeded. Admin features (role edit, notification persistence) implemented. Notification system live. Vercel-deploy skill created. Production: Atlas autoEmbed (Option B) pending. Runtime smoke test pending Atlas setup.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | React 18, Tailwind CSS, Vite | SPA; no SSR; deployed on Vercel |
| Backend | Node.js, Express.js | ES modules; deployed on Vercel serverless |
| Database | MongoDB Atlas | M0 free tier at dev; M10+ for production |
| Search | MongoDB Atlas Vector Search (cosine similarity) + MongoDB $text keyword search | Hybrid merge via Reciprocal Rank Fusion (RRF_K=60) |
| Embeddings | **`@xenova/transformers` `Xenova/multi-qa-mpnet-base-dot-v1`** (768-dim, singleton pipeline) | Local dev: no API key needed. Production: switch to Atlas autoEmbed (Option B) |
| Auth | JWT (7d expiry) + bcrypt (salt factor 12) | Passwords hashed pre-save via Mongoose pre-hook |
| Rate limiting | `express-rate-limit` | 300 req/15min general; 1000 req/15min admin routes |
| Security | Helmet.js, CORS (whitelist + Vercel subdomain auto-allow) | |

---

## 3. Project Structure

```
shamagama/
├── backend/
│   ├── config/
│   │   └── db.js                  # Lazy MongoDB connection (cached across requests)
│   ├── controllers/
│   │   ├── adminController.js     # Dashboard stats, FAQ/user/reports management
│   │   ├── analyticsController.js # Search analytics (failed/popular queries)
│   │   ├── authController.js      # Register, login, getMe, role management
│   │   ├── communityController.js # CRUD for posts, upvotes, comments, resolve
│   │   ├── communitySearchController.js # Community-specific semantic search
│   │   ├── faqController.js       # FAQ CRUD + check-match (dedup)
│   │   └── searchController.js    # Hybrid search (vector + text, RRF merge)
│   ├── middleware/
│   │   ├── admin.js               # adminOnly middleware (admin/moderator only)
│   │   └── auth.js                # protect + authorize() RBAC middleware
│   ├── models/
│   │   ├── AdminLog.js            # Admin action audit log (approve/reject/edit/delete)
│   │   ├── CommunityPost.js       # Community posts + embedded comments sub-schema
│   │   ├── FAQ.js                 # FAQs with embedding field (select: false)
│   │   ├── SearchLog.js           # Search analytics log (TTL: 90 days)
│   │   └── User.js                # Users with bcrypt pre-save hook
│   ├── routes/
│   │   ├── admin.js               # All /api/admin/* admin-only routes
│   │   ├── analytics.js           # /api/analytics (admin/mod only)
│   │   ├── auth.js                # /api/auth/* public + protected routes
│   │   ├── community.js           # /api/community/* routes
│   │   ├── faq.js                 # /api/faq/* routes (incl. /faq/paginated)
│   │   └── search.js              # /api/search/* routes
│   ├── scripts/
│   │   ├── addIndexes.js          # Migration: creates TTL + compound indexes
│   │   ├── backfillEmbeddings.js  # Regenerate all stored embeddings via OpenAI
│   │   ├── seed.js                # Seeds users + FAQs + community posts
│   │   └── seedPosts.js           # Additional community post seeder
│   ├── utils/
│   │   └── embeddings.js          # OpenAI embedding generator (text-embedding-3-small)
│   ├── server.js                  # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   └── ui/                # 20+ UI components (SearchBar, FAQAccordion, etc.)
│   │   ├── hooks/
│   │   │   └── useAuth.jsx        # Auth context + JWT persistence
│   │   ├── pages/
│   │   │   ├── AdminPage.jsx      # Admin dashboard (analytics, FAQ/社区/user tabs)
│   │   │   ├── CommunityPage.jsx  # Community Q&A board + post dialogs
│   │   │   ├── FAQPage.jsx        # Category browser + FAQ search + detail view
│   │   │   ├── HomePage.jsx       # Hero search + trending + category grid
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── utils/
│   │   │   ├── api.js             # Axios instance with JWT interceptor
│   │   └── App.jsx / main.jsx
│   ├── index.html
│   ├── package.json
│   └── .env.example
├── openapi.yaml                   # Full OpenAPI 3.0.3 spec (1386 lines)
├── samagama_faq.json              # Raw FAQ seed data (~150 entries)
└── temp/                          # Stale copy (pre-refactor) — ignore for active dev
```

---

## 4. Features

### 4.1 Semantic Search (Core Feature)

- **Hybrid search** merges vector similarity + keyword text search via **Reciprocal Rank Fusion** (RRF_K=60)
- User types query → backend generates embedding via **`@xenova/transformers` `Xenova/multi-qa-mpnet-base-dot-v1`** (768-dim, singleton pipeline in Node.js)
- 4 parallel queries: FAQ vector, community vector, FAQ text, community text
- Results filtered by threshold: `textScore > 0 || vectorScore > 0.80`
- Returns top 5 merged + ranked results
- In-memory LRU cache (500 items, 1-hour TTL) for repeated queries
- **SearchLog** records every query for analytics: `{ query, resultsCount, topResultId, topResultSource }`
- `GET /api/search/trending` returns top 6 queries by search volume

### 4.2 FAQ System

- FAQs grouped by **category** on the frontend
- Each FAQ has: `question`, `answer`, `category`, `searchCount`, `views`, `helpfulVotes`, `status` (pending/approved/rejected)
- `embedding` field stored but `select: false` — never returned in normal queries
- `POST /api/faq/check-match` — detects if a user's community post question already has a high-similarity FAQ match (threshold 0.82) and surfaces the FAQ inline
- **Pagination:** `/faq` supports `?page=&limit=&category=` for paginated flat responses; `/faq/paginated` is the dedicated paginated endpoint

### 4.3 Community Q&A Board

- Users post questions (title + body, 150/2000 char limits)
- Post creation auto-checks FAQ duplicates via `check-match` before allowing submission
- **Post statuses:** `unanswered` | `answered`
- **Voting:** Upvote posts; upvote/downvote comments (stored as user ID arrays)
- **Comment auto-delete:** Net score ≤ −5 → comment deleted + "Faah" sound effect on frontend
- **Verified comments:** Moderators can mark a comment as the verified top answer
- **Resolve flow:** Admin/moderator writes an official answer → post status → `answered`, post shows "Official Answer" banner
- Community search via `GET /community/search?q=` uses the same hybrid search against community posts

### 4.4 Admin Dashboard

- **4 tabs:** Analytics, FAQs, Community, Users
- **Analytics:** Total searches, popular queries, failed queries, fail rate, recent activity chart
- **FAQ management:** Create/edit/delete/approve/reject FAQs; filter by status/category; search; sort
- **Community moderation:** View all posts, resolve unanswered posts with official answers
- **User management:** List users (paginated), search by name/email, update user roles
- **AdminLog:** Every admin action is logged with `{ adminId, action, targetId, targetType, details }`
- **Admin activity feed:** Shows last 20 admin actions

### 4.5 Analytics

- `GET /api/analytics` — popular queries, failed queries (0 results), total searches (admin/mod only)
- `GET /api/admin/faq-growth` — FAQ creation trend over configurable days
- `GET /api/admin/top-categories` — FAQ count + views per category
- `GET /api/admin/search-insights` — top 15 queries, fail rate, daily activity
- `GET /api/admin/user-activity-chart` — daily search volume over N days

---

## 5. Data Models

### User
```js
{ name, email, password (hashed, select:false), role: 'user'|'moderator'|'admin'|'ai_moderator' }
// Pre-save: bcrypt salt factor 12
// comparePassword() instance method
```

### FAQ
```js
{ question, answer, category, embedding (select:false), searchCount, views, helpfulVotes, status, createdBy }
// Status enum: 'pending' | 'approved' | 'rejected'
// Text index on question + answer
// Collection: yaksha_faq_faqs
```

### CommunityPost
```js
{ title, body, author, status, answer, upvotes[], embedding (select:false),
  comments: [{ author, body, upvotes[], downvotes[], verified }] }
// Status enum: 'unanswered' | 'answered'
// Text index on title + body
// Collection: yaksha_faq_communityposts
```

### SearchLog
```js
{ query, resultsCount, topResultId, topResultSource: 'faq'|'community'|null }
// TTL index: auto-delete after 90 days
// Collection: yaksha_faq_searchlogs
```

### AdminLog
```js
{ adminId, action, targetId, targetType, details }
// Collection: yaksha_faq_adminlogs
```

---

## 6. API Reference (Summary)

### Public
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account, returns JWT |
| POST | `/api/auth/login` | Login, returns JWT |

### User (Authenticated)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/auth/me` | Current user profile |
| GET | `/api/faq` | All FAQs grouped by category |
| GET | `/api/faq/paginated` | Paginated flat FAQ list |
| GET | `/api/faq/:id` | Single FAQ |
| POST | `/api/faq/check-match` | Check if query has FAQ duplicate |
| GET | `/api/community` | Paginated community posts |
| GET | `/api/community/:id` | Single post with comments |
| POST | `/api/community` | Create post |
| POST | `/api/community/:id/upvote` | Toggle upvote |
| POST | `/api/community/:id/comments` | Add comment |
| POST | `/api/community/:id/comments/:cid/upvote` | Upvote comment |
| POST | `/api/community/:id/comments/:cid/downvote` | Downvote comment (auto-deletes at net −5) |
| PATCH | `/api/community/:id/comments/:cid/verify` | Mark comment as verified (mod/admin) |
| PATCH | `/api/community/:id/resolve` | Mark post answered (mod/admin) |
| POST | `/api/search` | Hybrid semantic search |
| GET | `/api/search/trending` | Top 6 trending queries |

### Admin / Moderator
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Dashboard summary |
| GET | `/api/admin/faq-growth` | FAQ creation trend |
| GET | `/api/admin/top-categories` | Category breakdown |
| GET | `/api/admin/search-insights` | Search analytics |
| GET | `/api/admin/users` | User list (paginated) |
| GET | `/api/admin/faqs` | FAQ list (paginated, filterable) |
| GET | `/api/admin/reports` | Date-range report export |
| GET | `/api/admin/activity-feed` | Recent admin actions |
| GET | `/api/admin/user-activity-chart` | Daily activity chart |
| POST | `/api/admin/faq` | Create FAQ |
| POST | `/api/admin/faq/approve` | Approve FAQ |
| POST | `/api/admin/faq/reject` | Reject FAQ |
| PUT | `/api/admin/faq/:id` | Update FAQ |
| DELETE | `/api/admin/faq/:id` | Delete FAQ |
| PATCH | `/api/auth/users/:id/role` | Update user role |
| GET | `/api/analytics` | Search log analytics |
| DELETE | `/api/community/:id` | Delete community post |

### Test Credentials
| Role | Email | Password |
|------|-------|----------|
| Student | user@yaksha.com | password123 |
| Admin | admin@yaksha.com | admin123 |

---

## 7. Architecture Decisions

### 7.1 Embedding: Local Transformers (not OpenAI)
- **Current:** `@xenova/transformers` runs `Xenova/multi-qa-mpnet-base-dot-v1` in-process in Node.js — no API key needed, works offline
- **Model:** 768-dim, cosine similarity
- **First call:** downloads ~500MB to `~/.cache/huggingface/`, cached thereafter
- **Production (Option B):** Switch to MongoDB Atlas autoEmbed with Voyage AI — Atlas fetches embeddings at query time, no model download needed in serverless

### 7.2 Hybrid Search — RRF over naive union
- Vector search captures semantic similarity; text search captures exact keyword matches
- Merging with RRF (Reciprocal Rank Fusion) outperforms simple score addition
- `RRF_K=60` is the standard academic default; `k=0` would overweight top-rank documents too heavily

### 7.3 Embedding field `select: false`
- Prevents accidental exposure of 1536-float arrays in API responses
- Always explicitly `.select('-embedding')` in query chains

### 7.4 Lazy DB connection
- `connectDB()` uses a module-level cache; calling it on every request handles Vercel serverless cold starts gracefully without a singleton guarantee at the process level

### 7.5 Community posts go live immediately
- No moderation queue for user posts — they appear instantly
- Moderators resolve and delete post-create; the `deletePost` admin route exists
- **Planned:** moderation queue for pending review before public visibility

---

## 8. Scale Readiness — What's Done vs. What's Pending

### ✅ Done (v0.2)

| Feature | Details |
|---------|---------|
| **Pagination** | Community posts paginated (20/page); FAQ paginated endpoint exists (`/faq/paginated`) |
| **SearchLog TTL** | 90-day auto-expiry via MongoDB TTL index; prevents unbounded growth |
| **Compound indexes** | `{ category, status, createdAt }` on FAQs; `{ status, createdAt }` on posts; `{ query, createdAt }` for search logs |
| **Embedding API** | Replaced blocking in-process model with OpenAI async calls |

### ⚠️ Partially Done

| Feature | Status |
|---------|--------|
| **Cache** | In-memory LRU (500 items, 1-hour TTL) exists but **breaks across Vercel serverless instances** — each Lambda has its own heap |

### ❌ Not Yet Done (blocking 1M users)

| Priority | Feature | Why It Matters |
|----------|---------|---------------|
| **P0** | **Redis shared cache** | In-memory LRU is per-instance; with Vercel serverless, cache hit rate ≈ 0% |
| **P0** | **User-level rate limiting** | IP-based 300 req/15min breaks legitimate users behind corporate NAT; need per-user JWT-based limits |
| **P1** | **Email domain restriction** | Anyone can register; no spam/dormant account guardrail |
| **P1** | **Admin 2FA (TOTP)** | No two-factor auth for admin accounts; target for credential stuffing at 1M users |
| **P1** | **Cursor-based pagination** | Offset pagination is fine for 1K items; cursor-based is needed for extreme scale + consistent infinite scroll |
| **P2** | **Push notifications** | Users have no in-app notification when their post is answered |
| **P2** | **Failed search → FAQ workflow** | Failed queries (0 results) identify gaps but aren't routed to admin FAQ creation |
| **P2** | **Bulk CSV FAQ import** | Admins must create FAQs one-by-one; needed at scale |
| **P3** | **Sentry / error tracking** | No observability; production errors invisible |
| **P3** | **Load testing suite** | No k6/Artillery tests; can't predict breaking points |
| **P3** | **Multi-language support** | Embedding model + UI are English-only; India user base needs Indic language support |

---

## 9. MongoDB Atlas — Required Setup

### 9.1 Vector Search Index

Each collection (`faqs`, `communityposts`) needs a search index named `vector_index`:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    }
  ]
}
```

> **Note:** Vector search is free on M0 (free tier) as of 2024+. No cluster upgrade needed. The `backend/scripts/addIndexes.js` creates non-vector indexes only — vector index must be created manually in Atlas UI.

### 9.2 Running the Migration

After pulling, set env vars and run:
```bash
cd backend
export MONGODB_URI="mongodb+srv://<user>:***@cluster0.xxxxx.mongodb.net/yaksha_faq"
npm run migrate        # Creates TTL + compound indexes
npm run backfill:embeddings  # Regenerate stored embeddings (if switching models)
```

---

## 10. Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | Token expiry |
| `PORT` | No | `6767` | Server port (Vercel overrides automatically) |
| `CLIENT_URL` | No | — | Frontend URL for CORS |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:6767/api` | Backend API base URL |

---

## 11. Database Collections

| Collection | Purpose |
|------------|---------|
| `yaksha_faq_users` | User accounts |
| `yaksha_faq_faqs` | FAQ entries with embeddings |
| `yaksha_faq_communityposts` | Community Q&A posts with embedded comments |
| `yaksha_faq_searchlogs` | Search analytics (90-day TTL) |
| `yaksha_faq_adminlogs` | Admin action audit log |

---

## 12. Role-Based Access Control

| Role | Access |
|------|--------|
| `user` | Browse FAQs, community, search |
| `moderator` | All user access + resolve posts, delete posts, verify comments, manage FAQs |
| `admin` | All moderator access + user management, all admin endpoints |
| `ai_moderator` | Placeholder for future AI auto-moderation integration |

---

## 13. Key Implementation Notes

- The in-memory LRU cache (`searchCache`) is **not shared across Vercel serverless instances**. A Redis cache is the planned replacement — **P0 priority** before production traffic.
- The seed script (`backend/scripts/seed.js`) reads from `./faqs.json` at the backend root directory — this is the 130-FAQ file regenerated from `endpoints.txt`
- The `temp/` directory is a stale pre-refactor copy — do not use it as a reference.
- Community posts are **not paginated in the admin page** (`fetchPosts` uses the default un-paginated behavior internally; this is a known gap for admins reviewing large volumes).
- Comment voting uses optimistic UI updates — upvote state is toggled locally before the API call resolves.
- The "Faah" sound effect (`fahhhhh.mp3`) is played client-side when a comment is auto-deleted at net −5 score.

---

## 14. Glossary

| Term | Definition |
|------|------------|
| RRF | Reciprocal Rank Fusion — algorithm for merging ranked lists from different rankers |
| Embedding | Dense numerical vector representation of text for semantic similarity comparison |
| Cosine similarity | Similarity metric between vectors; 1.0 = identical, 0.0 = orthogonal |
| TTL index | MongoDB feature that auto-deletes documents after a set time |
| select:false | Mongoose option that excludes a field from default queries (privacy + perf) |
| LRU | Least Recently Used — cache eviction strategy |
| RRF_K | Constant in RRF formula controlling rank smoothing (k=60 is standard) |