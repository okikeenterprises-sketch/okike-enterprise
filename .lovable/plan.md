# Replace mock data with live data + functional wiring

Scope is wide so I'm grouping by surface. Every section ends in a fully working page that pulls from Supabase (no hardcoded arrays) and every button either routes somewhere real, opens a working dialog, or is removed.

## 1. Shared building blocks

- **`src/lib/public-content.ts`** — central client helpers: `getServices()`, `getPackages()`, `getPortfolio()`, `getPartners()`, `getTeam()`, `getSiteSetting(key)`. All published-row filtered, ordered by `position`.
- **`src/lib/dashboard.functions.ts`** (server fn, `requireSupabaseAuth`) — returns the signed-in user's `projects`, `milestones`, `updates`, plus aggregate `stats` (active count, completed count, next-due milestone). One round-trip.
- **`src/lib/admin-stats.functions.ts`** (server fn, admin-only) — returns: users count (from `profiles`), inquiries count + recent, projects + stage breakdown + recent 5, role distribution from `user_roles`, daily counts of inquiries + projects + signups over last 14 days for the line chart.

## 2. Public site

- **`/` (index.tsx)** — replace the three hardcoded `PricingCard`s with `packages` from DB (top 3 published, featured one highlighted). Replace the hardcoded "Trusted by" string list with `partners` rows (fallback: hide block if empty). Replace founder quote with `site_settings['founder_quote']` value (fallback to current copy).
- **`/services` (services.tsx)** — `coreServices` grid reads from `services` table; only fall back to current copy if DB is empty. `PortfolioGrid` already DB-wired.
- **`/about` (about.tsx)** — team grid reads from `team_members`; about/hero copy from `site_settings`. Falls back to current static copy when key missing.

## 3. Client dashboard (`/dashboard`)

- Trim from a packed 2-row × 5-stat layout to a clean **2-column responsive grid**:
  - Hero strip (greeting + primary CTA)
  - Stats row (3 real tiles: Active Projects, Completed, Next milestone)
  - Active projects list (real `client_projects` for this user with milestone progress bars)
  - Right rail: recent project updates feed + Quick links
- Remove the mock "Continue Learning" card, mock teammate avatars, mock "AI Requests / Files Uploaded" stats, mock "78%" progress numbers — replaced by computed progress from milestones (done/total).
- Realtime subscribe to `client_projects` + `project_milestones` + `project_updates` filtered to this user (already RLS-scoped).
- Functional buttons:
  - "Continue Project" → scrolls to / opens the top active project
  - "Open AI Assistant" → routes to a working `/dashboard?section=ai` panel that calls Lovable AI Gateway (`google/gemini-2.5-flash`) via a server fn `askAssistant`
  - Sidebar sections (Messages, Files, Calendar, etc.) that have no data yet show an honest empty state, not a placeholder card
  - Search field is removed from header until wired (keeps notifications + profile)
  - Sign-out works (already)

## 4. Admin dashboard (`/admin` overview)

- Replace every `const ...Data = [...]` mock with values from `admin-stats.functions.ts`:
  - 6 stat tiles → real counts (Users, Inquiries, Projects running, Completed projects, Pending approvals, Open complaints — drop "Revenue/Uptime" since we don't track them, or compute from `client_projects.total`)
  - Line chart "Platform Analytics" → 14-day rolling counts of new signups (toggle between Users/Projects/Inquiries from the same payload)
  - Users-by-role pie → real `user_roles` distribution
  - Recent Signups → last 5 `profiles`
  - Recent Projects table → real `client_projects` joined with `profiles` for owner name + computed progress
  - Platform Activity → unioned recent rows from `project_inquiries`, `client_projects`, `project_updates`, `contact_messages`
  - Summary tiles → real counts (open inquiries, pending approvals = inquiries.status='reviewing', etc.)
- Drop the mock "OKIKE Admin AI" suggested-actions list down to actual links: Add user (`/admin/content/...`), Generate report (CSV export server fn), Broadcast (later).
- System Health card → simple ping to Supabase (returns "Operational" if `select 1` succeeds) — honest, not invented numbers.

## 5. Cleanups

- Remove `src/assets/dashboard-hero.jpg` usage in the "Continue Learning" mock (no learning data yet).
- Delete `defaultProjects` fallback in dashboard.
- Hide nav badges (`Messages: 3`, `Bell: 7`) until real counts exist; show only when count > 0.

## Tech notes

- Client-side reads (public pages, dashboard) use the `supabase` browser client — RLS already permits published-row public reads and user-scoped private reads.
- Aggregated/admin reads go through `createServerFn` + `requireSupabaseAuth` + `has_role` check to keep the query in one trip and avoid N+1 from RLS.
- Charts: compute series in the server fn with `date_trunc('day', created_at)` groupings.
- AI assistant: new server fn `askAssistant` → `https://ai.gateway.lovable.dev/v1/chat/completions` with `LOVABLE_API_KEY`, model `google/gemini-2.5-flash`.

After approval I'll ship it in one batch (one migration is not needed — schema already exists).