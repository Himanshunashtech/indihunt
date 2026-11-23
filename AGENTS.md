# IndiHunt — Agent Rules

## Project Overview
IndiHunt is a Next.js 15 (App Router) + Supabase full-stack platform for discovering and launching indie software products built by Indian makers.

---

## Tech Stack
- **Framework**: Next.js 15 App Router with TypeScript
- **Styling**: TailwindCSS (NOT Tailwind v4 — uses standard v3 class utilities)
- **Database**: Supabase (PostgreSQL). All DB logic lives in `src/lib/supabase.ts`
- **State**: Redux Toolkit — dispatch from `@/lib/store`
- **Icons**: Lucide React
- **UI primitives**: Radix UI (Dialog, DropdownMenu)

---

## Key Conventions

### File Structure
- All page routes are in `src/app/`
- Shared DB logic, types, and helpers are **all in one file**: `src/lib/supabase.ts`
- Add new exported functions to the bottom of `supabase.ts`

### localStorage Fallback
- The app fully works without a live Supabase connection
- Every DB function must have a `localStorage`-based fallback for local dev
- Mock data lives in `supabase.ts` as `MOCK_PROFILES`, `MOCK_PRODUCTS`, etc.

### TypeScript
- Run `npx tsc --noEmit` after every significant code change to confirm no type errors
- Never use `any` unless absolutely necessary (existing code has some — don't add more)

### Scoring System (v1.9.0+)
- `calculateQualityScore(product, maker)` → 0–100 points
- `calculateEngagementScore(product, commentsCount)` → unbounded score
- `evaluateFeaturing(product, maker, commentsCount)` → returns `featured: boolean`
- `featureProduct(productId, action)` → admin manual override
- `checkContentViolation(text)` → validates text before any comment/reply/review submission

### Content Moderation
- **Always call** `checkContentViolation(text)` before `addComment`, `addReview`, `createThread`, or `addStoryComment`
- If `hasViolation` is true, show `alert(violation.message)` and `return` early — do NOT submit

### Feed Logic (Home Page — `app/page.tsx`)
- `timeFilter` state drives time-range filtering (today / yesterday / week / month)
- `activeFeedTab` state drives tab (featured / trending / all)
- `paginatedProducts` = 20 items per page from `activeProductsList`
- Reset `currentPage` to 1 whenever filter or tab changes
- Banner ad renders inside the paginated map at `idx === 4` (after 5th product)

### Mobile Responsiveness
- Always use responsive grid variants: `grid-cols-1 sm:grid-cols-2` instead of static `grid-cols-2`
- Dropdowns should use `left-0 sm:left-auto sm:right-0` on mobile to prevent overflow
- Select inputs should have `max-w-full` class

---

## Important Files
| File | Purpose |
|---|---|
| `src/lib/supabase.ts` | All DB calls, types, mock data, scoring, moderation |
| `src/app/page.tsx` | Home page — main feed with tabs, filters, pagination |
| `src/app/products/[id]/page.tsx` | Product detail — comments, reviews, threads, scoring sidebar |
| `src/app/profile/page.tsx` | User profile — stories, campaigns, tech stack |
| `src/app/threads/[id]/page.tsx` | Thread detail — linked product card |
| `src/app/stories/[id]/page.tsx` | Story detail — threaded comments |
| `src/app/changelog/page.tsx` | Platform changelog — always update with new releases |
| `supabase/migrations/` | SQL migration files for schema changes |

---

## DO NOT
- Do not use `featureProduct` admin buttons on the frontend feed cards (removed in v1.9.0)
- Do not bypass `checkContentViolation` on any user text input
- Do not add external link patterns (regex) as valid text in comments
- Do not use TailwindCSS v4 syntax — this project uses standard v3 utilities

---

## When Adding New Features
1. Add types to `supabase.ts`
2. Add DB function with Supabase + localStorage fallback to `supabase.ts`
3. Export and import into page components
4. Run `npx tsc --noEmit` to verify
5. Update `src/app/changelog/page.tsx` with the new entry
