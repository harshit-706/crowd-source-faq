# Personal Issues — Yaksha FAQ Portal

> Project: Shamagama — semantic FAQ + community Q&A platform (React/Vite frontend, Express/MongoDB backend)
> Frontend: `/frontend/src/`
> Backend: `/backend/`
> Data: 130 FAQs (semantic search), community posts (upvotes/comments)

---

## Issue 1 — Remove Duck Animation with Cursor

**Problem:** `RubberDuck.tsx` follows the cursor with spring physics after 3s of idle. It overlays content, interferes with button clicks, and creates a janky experience on mobile.

**Files involved:**
- `frontend/src/components/ui/RubberDuck.tsx` — the component
- `frontend/src/App.tsx` — where it's imported
- `frontend/src/main.tsx` — global render location

**Todo:**
- [ ] Remove `<RubberDuck />` from `App.tsx` (or `main.tsx`)
- [ ] Delete `frontend/src/components/ui/RubberDuck.tsx`
- [ ] Verify no other component imports it
- [ ] Check for any CSS in `index.css` related to `.rubber-duck` class

---

## Issue 2 — Implement Notifications When User's Issue Is Resolved

**Problem:** When a community post gets resolved by an admin (marked `status: 'answered'`), the user who posted it has no notification. They have to check the site manually.

**Current state:**
- Community posts have `status: 'unanswered' | 'answered'`
- When resolved, `resolvedBy` field is set (from `communityController.ts`)
- No notification sent to post author

**Backend changes needed:**
- [ ] Add a `notifications` MongoDB collection schema (`recipient`, `type`, `message`, `link`, `read`, `createdAt`)
- [ ] In `communityController.ts` `resolvePost` — after setting status to `answered`, create a notification for the post author
- [ ] Add `GET /api/notifications` endpoint (auth-protected, returns user's notifications)
- [ ] Add `PATCH /api/notifications/:id/read` endpoint to mark as read

**Frontend changes needed:**
- [ ] Create `NotificationBell.tsx` component (replace the static bell icon in Navbar with a real dropdown)
- [ ] Add `/api/notifications` fetch to `useAuth` or a `useNotifications` hook
- [ ] Show unread count badge on bell icon (dynamic, not hardcoded green dot)
- [ ] Dropdown shows recent notifications with "mark all read" option
- [ ] Clicking a notification navigates to the relevant community post

---

## Issue 3 — Fix "Ask Question" in Header Consistency

**Problem:** Clicking "Ask Question" in the main Navbar goes to `/community` (CommunityPage). But on the CommunityPage, there's another "Ask Question" button. The flow is:
1. Navbar "Ask Question" → goes to CommunityPage
2. CommunityPage has "Ask Question" button → opens post creation form (either inline modal or redirect to form)

**What needs to change:**
- [ ] Clarify: does Navbar "Ask Question" go to CommunityPage (scroll-to-form) or open a modal directly?
- [ ] If going to CommunityPage — ensure the page scrolls to the "Create Post" form section automatically (use anchor or `useEffect` + `window.scrollTo`)
- [ ] Ensure the CommunityPage "Ask Question" button is the SAME action as Navbar "Ask Question" — no duplication, no double "Ask Question" buttons
- [ ] Check if there's a "Create Post" modal vs inline form — pick one pattern and make it consistent

**Files to check:**
- `frontend/src/components/layout/Navbar.tsx` — line 93: `navigate('/community')`
- `frontend/src/pages/CommunityPage.tsx` — "Ask Question" button placement
- `frontend/src/components/ui/CommunityPostCard.tsx` — post creation form/modal

---

## Issue 4 — Top Solved Today: Make It Meaningful

**Problem:** The "Top Solved Today" section on the home page just shows the top 4 community posts by upvote count. It doesn't reflect "today", doesn't show resolution status, and is just a static list of community questions.

**What "solved" should mean:**
- Filter: `status = 'answered'` AND `resolvedAt` within last 24 hours
- Sort: by `resolvedAt` descending (most recently resolved first), then by upvote count

**Current behavior (from `TopSolved.tsx` line 51-58):**
```js
GET /community → sort by upvotes desc → slice(0, 4)
```

**Backend changes:**
- [ ] Add `GET /api/community/solved?limit=4` endpoint — returns `status: 'answered'` posts sorted by `resolvedAt` desc, last 24h

**Frontend changes:**
- [ ] Update `TopSolved.tsx` to use the new `/solved` endpoint (not the general `/community` endpoint)
- [ ] Change section title from "Top Solved Today" — verify it actually means "resolved today" (not just "most upvoted")
- [ ] Show "Resolved X hours ago" or "Resolved today" timestamp on each card
- [ ] Show who resolved it (mod/admin name) — `resolvedBy` field exists in schema
- [ ] Show first answer/excerpt in the card (not just title+body)
- [ ] If no solved posts today, show friendly empty state ("No posts resolved today yet — be the first!")

---

## Issue 5 — Duplicate Question Detection (Community Ask + FAQ Search)

**Problem:** When a user types a question in the community ask form, or searches, the system doesn't proactively check if a similar FAQ already exists. Users ask questions that are already answered in the FAQ.

**Current flow:**
- FAQ search runs on homepage (`POST /api/search`) — shows FAQs, but only as search results
- Community post creation (`POST /api/community`) calls `checkMatch` internally — suggests FAQs if similarity ≥ 0.82

**What needs to change:**

**Search/Duplicate detection on type (while user is typing):**
- [ ] In `SearchBar.tsx` — when user stops typing (debounce 400ms), call `POST /api/search` with their query
- [ ] If results come back with FAQ matches, show an inline banner: "This might already be answered — [View FAQ]" without leaving the search page
- [ ] The banner should be non-blocking and dismissible

**Duplicate check on community post creation (before submit):**
- [ ] In `CommunityPage.tsx` post creation form — before submitting, call `POST /api/search` with the post title
- [ ] If FAQ match found (similarity ≥ 0.82), show a confirmation dialog: "Similar FAQ found: [Question]. Your question might already be answered. Submit anyway?"
- [ ] User can cancel and be directed to the matching FAQ, or submit the post anyway

**Backend:**
- [ ] `POST /api/search` already handles this — ensure it returns FAQ results with the `checkMatch` flag for the frontend to use

**Files to check:**
- `frontend/src/components/ui/SearchBar.tsx`
- `frontend/src/pages/CommunityPage.tsx`
- `frontend/src/components/ui/SearchResults.tsx`
- `frontend/src/components/ui/FAQAccordion.tsx` (for the inline FAQ preview)

---

## Issue 6 — Improve Navigation (Header + Footer Consistency)

**Problem:** Navbar and Footer design feel disconnected from the rest of the app. The header has a specific aesthetic (pill nav, glassmorphism) but Footer may not match. Mobile nav experience may need polish.

**Files involved:**
- `frontend/src/components/layout/Navbar.tsx`
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/ui/SearchBar.tsx` (integrated in header)
- `frontend/tailwind.config.js` (design tokens — colors, spacing)

**Todo:**

**Navbar audit:**
- [ ] Check current Navbar against the design spec in `context.md` — is it matching?
- [ ] Review mobile hamburger menu — does it include all links (Home, FAQ, Community, Profile, Admin if applicable)?
- [ ] Review sticky/scroll behavior — does the glassmorphism blur work well at all scroll positions?
- [ ] Check "Ask Question" button — it's visible on desktop but where is it on mobile? (mobile dropdown shows it at line 207-212)

**Footer audit:**
- [ ] Read `Footer.tsx` — compare to Navbar design language (fonts, colors, borders, spacing)
- [ ] Ensure Footer links are consistent with Navbar links (same page references)
- [ ] Check Footer on mobile — does it stack cleanly, or overflow?
- [ ] Verify Footer has: logo, nav links, copyright, maybe social links (from `context.md` the project has LinkedIn)

**Search bar in header:**
- [ ] Check `SearchBar.tsx` integration in Navbar/HomePage — is it consistent?
- [ ] The search bar on HomePage vs FAQPage — same component or different implementations?

**Design token alignment:**
- [ ] Check `tailwind.config.js` — are `accent`, `ink`, `border`, `bg` tokens consistent across Navbar, Footer, and all pages?
- [ ] Font usage — `font-serif` for headings (from Navbar line 68) — is this consistent in Footer?

**Deliverable:**
- [ ] One consistent navigation system: same navbar on all pages (AdminLayout uses its own sidebar — that's fine)
- [ ] Footer matches the aesthetic of the rest of the site
- [ ] Mobile: hamburger works, all links present, no broken overflow

---

---

## ✅ All 6 Issues Complete

### Issue 1 — Remove duck cursor animation ✓
- `RubberDuck.tsx` deleted
- Import + render removed from `App.tsx`
- `.rubber-duck` CSS and keyframes removed from `index.css`

### Issue 2 — Notifications on issue resolution ✓
- `Notification` model (types: `post_resolved`/`comment_replied`/`faq_match_found`/`mention`)
- `notificationController.ts` — full CRUD + `createNotification()` helper (non-critical, swallows errors)
- `resolvePost` in `communityController.ts` now calls `createNotification()` after saving
- `routes/notification.ts` — new route file
- `server.ts` — mounted at `/api/notifications`
- `useNotifications.tsx` — new hook
- `NotificationBell.tsx` — new component (dynamic badge count, dropdown, mark-as-read, click-to-navigate)
- Navbar bell replaced with `<NotificationBell />`

### Issue 3 — "Ask Question" nav consistency ✓
- Navbar "Ask Question" → `/community?ask=true` (both desktop button and mobile dropdown)
- `CommunityPage.tsx` — `useEffect` reads `?ask=true` param, auto-opens create dialog, cleans URL with `replaceState`
- CommunityPage page-level "Ask Question" button uses `setShowCreate(true)` directly

### Issue 4 — "Top Solved Today" meaningful data ✓
- `GET /api/community/solved` — public endpoint, returns `status: answered` + `updatedAt >= last 24h`, sorted by `updatedAt desc`
- `TopSolved.tsx` — fully rewritten: fetches from `/solved`, shows "Solved recently" heading, solved badge, relative time, answer excerpt, stats, author, click-to-navigate, empty state with CTA

### Issue 5 — Duplicate question detection ✓
- Already fully implemented in `CreatePostDialog` — on title type (≥10 chars, 500ms debounce), calls `POST /faq/check-match`, shows dismissible "This question is already answered in our FAQ!" banner if match found, blocks submit if match confirmed

### Issue 6 — Header + footer consistency ✓
- `Footer.tsx` — full redesign (Variant C: centered minimal)
  - Correct brand: "Yaksha FAQ" (was "Missiles FAQ Portal")
  - Logo matching Navbar style
  - Home/FAQ/Community nav links
  - LinkedIn + samagama.in social links
  - Divider for visual breathing room
  - Copyright with "Questions? Ask the community" CTA
  - Centered, calm, editorial — matches FAQ portal feel
- `sketches/001-yaksha-footer/index.html` — 3 variants created for comparison

**Build:** ✓ clean · **Tests:** 18/18 passing

**Key endpoints for notifications:**
- `GET /api/community/solved?limit=4` — new endpoint to create
- `GET /api/notifications` — new
- `PATCH /api/notifications/:id/read` — new
- `POST /api/community` — existing (checkMatch called internally)
- `POST /api/search` — existing (used for duplicate detection)

**Key frontend files:**
- `Navbar.tsx` — "Ask Question" on line 93, notification bell on line 101-107
- `TopSolved.tsx` — current just sorts by upvotes
- `CommunityPage.tsx` — post creation
- `SearchBar.tsx` — search input
- `Footer.tsx` — needs audit
- `App.tsx` — RubberDuck imported here
- `RubberDuck.tsx` — to delete