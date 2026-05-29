# Issues & TODO

## 🔴 Blocking (needs Atlas vector index + DB auth)

- [ ] **Create vector index in Atlas UI** — name=`vector_index`, `numDimensions=768`, similarity=`cosine`. See `tutorial.md`
- [ ] **Runtime smoke test** — backend starts + MongoDB connects + `/api/health` returns `db: connected`. Blocked until vector index exists

---

## 🟡 Planned / In Progress

### Admin Features
- [x] ~~**AdminUsers page**~~ — role edit modal + delete confirm modal added. `DELETE /api/auth/users/:id` endpoint also added.
- [x] ~~**AdminSettings page**~~ — `NotificationSettings` model + `GET /api/notifications/settings` + `PATCH /api/notifications/settings` (per-user, per-preference upsert). AdminSettings page now loads on mount and saves each toggle individually with optimistic revert on failure.

### Search & Embeddings
- [ ] ~~**Atlas managed embeddings** (Option B)~~ — switch from local `@xenova/transformers` to MongoDB Atlas `autoEmbed` with Voyage AI. Removes model download requirement, works properly on Vercel serverless
- [ ] **Search pipeline audit** — documented below

### Lifecycle Documentation
- [x] **FAQ lifecycle** — documented below
- [x] **Community post lifecycle** — documented below

---

## FAQ Lifecycle

**Source:** `backend/models/FAQ.ts`, `backend/controllers/faqController.ts`

```
                    ┌──────────────────────────────┐
                    │  POST /api/faq              │
                    │  (Admin/Mod only)           │
                    │  Defaults status='approved'  │
                    └──────────────┬───────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │  status = 'approved'          │
                    │  → indexed, searchable,       │
                    │    visible in FAQ list        │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
              ▼                                         ▼
    ┌─────────────────────┐               ┌─────────────────────┐
    │ PATCH /faq/:id     │               │ PATCH /faq/:id     │
    │ (set status='rejected')             │ (set status='pending')│
    │ Admin only                         │ Admin/Mod only     │
    └─────────────┬───────────┘               └─────────────────────┘
                  │                                         │
                  ▼                                         ▼
        Removed from public          Held for review.
        search results.               Admin dashboard shows
        Not deleted.                 as "pending approval".
```

**Check-match at post creation** (`POST /api/faq/check-match`):
- Runs before user posts to community
- Compares title against FAQ vector store
- If `vectorScore >= 0.82` → suggests existing FAQ
- Does NOT auto-create or block posting

**Admin moderation endpoints:**
- `PATCH /api/faq/:id` — update any field (status, question, answer, category)
- `DELETE /api/faq/:id` — hard delete (Admin only)

---

## Community Post Lifecycle

**Source:** `backend/models/CommunityPost.ts`, `backend/controllers/communityController.ts`

```
          POST /api/community (any authenticated user)
          Title + body → checkMatch (FAQ suggestion if vectorScore >= 0.82)
          Status defaults to 'unanswered'
                         │
                         ▼
          ┌────────────────────────────────────────────┐
          │  Status: 'unanswered'                       │
          │  - Anyone can upvote/downvote              │
          │  - Anyone can comment                      │
          │  - Comments can be verified as "top answer"│
          │  - Comments with netScore <= -5 auto-deleted│
          └──────────────────────┬─────────────────────┘
                                 │
            ┌───────────────────┴───────────────────┐
            │                                       │
            ▼                                       ▼
  ┌───────────────────────┐           ┌───────────────────────────┐
  │ POST /community/:id/  │           │ POST /community/:id/      │
  │ resolve               │           │ comment                   │
  │ (Admin/Mod only)      │           │ (Any authenticated user)  │
  │ Body = official answer│           │ Adds comment to post       │
  │ Status → 'answered'   │           │ Triggers notification to   │
  └───────────┬───────────┘           │ post author                │
              │                       └───────────────────────────┘
              ▼
  ┌────────────────────────────────────────────┐
  │  Status: 'answered'                          │
  │  - Official answer shown as top result       │
  │  - Post author gets notification             │
  │  - Appears in "Top Solved Today" widget     │
  └────────────────────────────────────────────┘
```

**Comment auto-delete:** When `netScore <= -5` (upvotes - downvotes), the comment is deleted via a TTL index on `comments.createdAt` OR via an explicit cleanup hook. See `commentSchema`.

**Verified comments:** `comments[].verified = true` — set by moderators. The `verified` comment is surfaced as the "top answer" in the UI.

---

### Lifecycle Documentation
- [x] **FAQ lifecycle** — documented above
- [x] **Community post lifecycle** — documented above

---

## Search Pipeline — Audit Summary

**Source files:**
- `backend/controllers/searchController.ts` — main hybrid search
- `backend/controllers/communitySearchController.ts` — community post search (same pattern)
- `backend/utils/search.ts` — shared RRF + threshold utilities
- `backend/utils/embeddings.ts` — local embedding generation (`@xenova/transformers`)

---

### Pipeline: `POST /api/search`

```
Query: "internship stipend"
         │
         ▼
  ┌─ LRU Cache (500 items, 1h TTL) ─────────────┐
  │  Key: "internship stipend" (lowercased)      │
  │  Hit? → return cached results immediately     │
  └──────────────────────────────────────────────┘
         │ Cache miss
         ▼
  ┌─ generateEmbedding(query) ───────────────────┐
  │  Model: Xenova/multi-qa-mpnet-base-dot-v1   │
  │  Dimensions: 768  |  Singleton pipeline       │
  │  Output: number[] (768-dim vector)           │
  └──────────────────────────────────────────────┘
         │
         ▼
  ┌─ 4 parallel queries ─────────────────────────┐
  │  runVectorSearch(yaksha_faq_faqs, vec, 5)  │
  │  runVectorSearch(yaksha_faq_communityposts,vec,5) │
  │  runTextSearch(yaksha_faq_faqs, query, 5)  │
  │  runTextSearch(yaksha_faq_communityposts,query,5)│
  └──────────────────────────────────────────────┘
         │
         ▼
  ┌─ Tag with source: 'faq' | 'community' ───────┐
  │  allVec = faqVec + commVec                  │
  │  allTxt = faqTxt + commTxt                  │
  └──────────────────────────────────────────────┘
         │
         ▼
  ┌─ computeRRF(allVec, allTxt) ────────────────┐
  │  k = 60 (RRF_K)                             │
  │  Formula: score = 1/(k + rank)              │
  │  Same doc in both lists → scores ADD         │
  │  Sort descending by rrfScore                 │
  └──────────────────────────────────────────────┘
         │
         ▼
  ┌─ applySearchThreshold(results) ───────────────┐
  │  Kept if: textScore > 0  OR  vectorScore ≥ 0.80 │
  │  (Note: threshold array parameter is IGNORED —  │
  │   hardcoded checks in the function itself)     │
  └──────────────────────────────────────────────┘
         │
         ▼
  slice(0, 5) → cache → log → return JSON
```

**Key facts:**
- Vector index: `vector_index` (768-dim, cosine similarity) — must exist in Atlas UI
- `numCandidates: limit * 10` — over-fetches 50 candidates before limiting to top 5
- `runVectorSearch` and `runTextSearch` fail gracefully (return `[]`) if index not ready
- `SearchLog` created async (`.catch(() => {})`) — never blocks response
- LRU cache: `lru-cache` npm package, in-memory only (per-instance)

---

### FAQ Check-Match: `POST /api/faq/check-match`

```
User types title in community post form
         │
         ▼ debounce 500ms (frontend) + min 10 chars
  POST /faq/check-match { query: "..." }
         │
         ▼
  generateEmbedding(query)
         │
         ▼
  $vectorSearch on yaksha_faq_faqs (numCandidates=5, limit=5)
         │
         ▼
  If topResult.vectorScore >= 0.82 → { matched: true, faq: { question } }
  Else → { matched: false }
         │
         ▼
  Frontend shows banner: "This question is already answered in FAQ!"
  + blocks form submission
```

---

### Embedding Backfill

```bash
# Re-generate embeddings for existing FAQs (if model changes)
npm run backfill:embeddings

# Community post embeddings
npm run backfill:community
```

Both scripts read all docs from MongoDB, call `generateEmbedding()`, update the `embedding` field in-place.

---

### Known Issues / Notes

1. **Cache is per-instance** — LRU cache doesn't survive restarts and is useless on multi-instance deployments (Vercel serverless). See Redis item.
2. **`applySearchThreshold` ignores threshold array** — the function accepts a `thresholds` parameter but never uses it; filtering is hardcoded to `textScore > 0 || vectorScore >= 0.80`.
3. **Atlas autoEmbed (Option B)** — swap `generateEmbedding()` + `$vectorSearch` for Atlas-managed embeddings. Requires M10+ cluster and Voyage AI API key configured in Atlas UI. Removes the ~500MB model dependency from serverless.
4. **Text index required** — `runTextSearch` uses MongoDB `$text` search. The `addIndexes.js` script creates compound indexes including text indexes on `question + answer` fields.

### Scale Readiness (context.md §8)
- [ ] **Redis shared cache** — in-memory LRU is per-instance, useless on Vercel serverless. Need Redis for cross-instance cache
- [ ] **User-level rate limiting** — IP-based rate limiting breaks NAT (multiple users same IP). Need per-user rate limiting via auth token
- [ ] **Cursor pagination** — replace offset pagination in community feed and FAQ list pages for consistency and performance at scale
- [ ] **Email domain restriction** — restrict registration to approved domains (from context.md §8)
- [ ] **Admin 2FA (TOTP)** — admin accounts should require two-factor authentication (from context.md §8)

### Deployment
- [ ] **Vercel env vars** — document which env vars are needed in Vercel dashboard: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`
- [ ] **Backend build pipeline** — `backend/package.json` has no `build` script wired into Vercel deploy. `tsc` compilation needs to run on Vercel before serving

### Observability
- [ ] **Sentry** — add error tracking and source maps for production debugging
- [ ] **Structured logging** — replace `console.log`/`console.error` with a logger that emits JSON (timestamp, request ID, level)
- [ ] **Request IDs** — attach a unique ID to every incoming request for tracing

### Search Bug / Gap
- [ ] **No failed-query workflow** — `SearchLog` collects zero-result queries but there's no admin workflow to act on them (route to FAQ creation)

---

## ✅ Done

- [x] **backend/vercel.json** — `server.js` → `server.ts` + added `builds` entry
- [x] **Shared RRF utility** — `backend/utils/search.ts` with `computeRRF()` + `applySearchThreshold()`, both search controllers updated
- [x] **Backend TypeScript migration** — all 73 files converted, `tsc --noEmit --skipLibCheck` → exit 0, both strict: true
- [x] **Frontend TypeScript migration** — all pages + components converted to TSX, build passes
- [x] **Backend endpoints added** — `PATCH /api/auth/profile`, `PUT /api/auth/password`
- [x] **AdminSettings wired** — `saveProfile()` and `changePassword()` now call real API endpoints
- [x] **Empty catch blocks fixed** — AdminDashboard, AdminUsers, AdminSearch, AdminFAQs, AdminAnalytics, FAQPage
- [x] **`@xenova/transformers`** installed for local embeddings (Option A for dev)
- [x] **FAQ data** — 130 FAQs parsed from live site, written to `faqs.json`
- [x] **`npm run seed`** — added to `backend/package.json` scripts
- [x] **18 Vitest tests passing**
- [x] **RubberDuck removed** — deleted component, CSS, import from App.tsx
- [x] **Notification system** — `Notification` model, controller, route, `useNotifications` hook, `NotificationBell` component
- [x] **"Ask Question" nav consistency** — Navbar → `/community?ask=true`, CommunityPage auto-opens create dialog
- [x] **"Top Solved Today" meaningful** — `GET /api/community/solved` endpoint + `TopSolved.tsx` fully rewritten
- [x] **Duplicate FAQ detection** — already implemented in `CreatePostDialog` (check-match on title type)
- [x] **Footer redesigned** — centered minimal, "Yaksha FAQ" brand, Home/FAQ/Community nav, LinkedIn + samagama.in social links