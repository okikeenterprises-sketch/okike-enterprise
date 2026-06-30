# Design Document: OKIKE AI Upgrade

## Overview

This document covers the technical design for five AI capability upgrades to the OKIKE enterprise platform. All five areas share the same foundational tech stack — TanStack Start server functions (`createServerFn`), OpenRouter for LLM calls, Supabase for persistence, and Tailwind CSS v4 for UI — so the design focuses on the specific wiring, data shapes, and component changes for each feature.

The five upgrades are:

1. **WelcomeAI Fix** — Replace the hardcoded `responses` dict with real `askPublicAI` calls
2. **AI Project Creation Assistant** — Add an AI-assisted mode to the `/book` project builder
3. **Proactive AI Insights** — Surface rule-based + LLM insights on the client dashboard
4. **Admin AI Tools** — Draft project updates and generate milestone plans from the admin panel
5. **Autonomous AI Blog Publisher** — Daily cron + manual trigger to publish AI-written blog posts

No new npm packages are required. All server-side AI work goes through OpenRouter via `fetch()`.

---

## Architecture

The system follows TanStack Start's "server functions as the API layer" pattern throughout. Client components call `useServerFn(fn)` to get a callable, pass a `{ data: ... }` envelope, and receive a typed result. Auth-required server functions use the `requireSupabaseAuth` middleware which extracts the `Authorization: Bearer <jwt>` header and returns a typed `context.supabase` + `context.userId`.

```
Browser Component
  └─ useServerFn(serverFn)
        └─ POST /server-fn/...  (TanStack Start runtime)
              └─ handler({ data, context })
                    ├─ ensureAdmin(context.supabase, context.userId)  [admin fns only]
                    ├─ fetch("https://openrouter.ai/...")             [LLM fns]
                    └─ context.supabase.from("...").upsert(...)       [DB writes]
```

The cron path bypasses this entirely — the Cloudflare Worker receives a GET/POST to `/api/cron/publish-blog`, validates the `X-Cron-Secret` header against `process.env.CRON_SECRET`, then calls the shared `publishAIBlogPost` core logic directly (no Supabase JWT needed).

```
Cloudflare Cron Trigger (07:00 UTC daily)
  └─ GET /api/cron/publish-blog
        └─ validate X-Cron-Secret header
              └─ publishAIBlogPostCore()   [shared logic, no auth middleware]
                    ├─ fetch OpenRouter (topic selection)
                    ├─ fetch OpenRouter (post writing)
                    ├─ check slug uniqueness in Supabase
                    └─ supabase.from("blog_posts").upsert(row)
```

---

## Components and Interfaces

### Feature 1: WelcomeAI Fix

**File changed:** `src/components/site/WelcomeAI.tsx`

No new files needed. The change is:

1. Add `import { useServerFn } from "@tanstack/react-start"` and `import { askPublicAI } from "@/lib/public-ai.functions"`.
2. Call `const askAI = useServerFn(askPublicAI)` at the top of the component.
3. Replace the `setTimeout` + `responses` dict inside `send()` with an `async` call to `askAI`. The `messages` array passed is the `next` conversation state (all prior turns + the new user message), sliced to the last 20 items.
4. On `{ ok: true, text }` — append the assistant bubble as before.
5. On `{ ok: false, error }` — append an assistant bubble with a user-friendly message like "Sorry, I couldn't process that request. Please try again." (never expose `error` directly).
6. Remove the `responses` Record entirely and the `quickQuestions` wiring that referenced it (quick questions still pass their text as user messages to `askAI`).

**Interface:**

```ts
// No new types — reuses the existing askPublicAI signature:
// input:  { messages: ChatMsg[], system?: string, model?: string }
// output: { ok: true, text: string } | { ok: false, error: string }
```

---

### Feature 2: AI Project Creation Assistant

**New file:** `src/lib/ai-assistant.functions.ts` — add `askProjectAssistant` (alongside the existing `askAssistant`).

**Modified file:** `src/routes/book.tsx`

#### `askProjectAssistant` server function

```ts
// Input
type AskProjectAssistantInput = {
  description: string;           // 20–2000 chars
  packages: PackageSummary[];    // [{ id, name, base, timeline }]
  addons: AddonSummary[];        // [{ id, label, price }]
  timelineOptions: string[];     // ["rush", "standard", "flexible"]
};

// Output (success)
type ProjectRecommendation = {
  pkg: "starter" | "business" | "custom";
  scopeGoal: string;
  scopePages: string;
  scopeBrand: string;
  addons: string[];              // array of addon ids
  timeline: string;              // one of the timeline option ids
  needs_clarification?: false;
};

// Output (needs clarification)
type ProjectClarification = {
  needs_clarification: true;
  clarification_question: string;
};

// Server function return type
type AskProjectAssistantResult =
  | { ok: true; recommendation: ProjectRecommendation }
  | { ok: true; recommendation: ProjectClarification }
  | { ok: false; error: string };
```

The server function builds a system prompt instructing the model to return a JSON object matching one of those shapes, then calls OpenRouter with `model: "openai/gpt-4o-mini"`. It parses the JSON from the response and validates the shape before returning. On JSON parse failure or missing required fields, it returns `{ ok: false, error: "..." }`.

Authentication: requires `requireSupabaseAuth` middleware (user must be logged in to use the `/book` page, which already enforces this via the existing `useEffect` redirect).

#### `BookPage` state additions

```ts
const [aiMode, setAiMode] = useState(false);
const [aiDescription, setAiDescription] = useState("");
const [aiClarificationCount, setAiClarificationCount] = useState(0);
const [aiSuggested, setAiSuggested] = useState<Record<string, boolean>>({});
// aiSuggested keys: "pkg", "scope.goal", "scope.pages", "scope.brand",
//                  "timeline", and any addon id prefixed with "addon."
```

#### AI mode panel (rendered above the stepper when `aiMode === true`)

```tsx
// Rendered before the <ol> stepper and the step card
{aiMode && (
  <div className="...">
    <textarea value={aiDescription} onChange={...} placeholder="Describe what you want to build..." />
    {aiClarificationCount > 0 && clarificationQuestion && (
      <p className="...">{clarificationQuestion}</p>
    )}
    <button onClick={handleAISubmit} disabled={aiLoading || description.length < 20}>
      {aiLoading ? <Loader2 ... /> : "Get AI Recommendation"}
    </button>
  </div>
)}
```

After a successful recommendation, `BookPage` sets the relevant state fields and populates `aiSuggested` for each field that was filled. "AI suggested" badges are rendered inline next to each field using the `aiSuggested` record. Overriding a field manually calls `setAiSuggested(s => ({ ...s, [key]: false }))` for that key.

---

### Feature 3: Proactive AI Insights

**New file:** `src/lib/ai-assistant.functions.ts` — add `generateInsights` (alongside existing functions).

**Modified file:** `src/routes/dashboard.tsx` — add `AIInsightsCard` component and wire it into `DashboardOverview`.

#### `generateInsights` server function

```ts
// Input
type GenerateInsightsInput = {
  projects: { id: string; title: string; package_name: string | null; stage: string; created_at: string }[];
  milestones: { id: string; project_id: string; name: string; status: string; updated_at?: string; created_at: string }[];
  updates: { id: string; project_id: string; message: string; created_at: string }[];
};

// Output
type Insight = {
  id: string;                        // deterministic: e.g. "stalled-<milestone-id>"
  severity: "warning" | "info";
  title: string;                     // ≤60 chars
  message: string;
};

type GenerateInsightsResult =
  | { ok: true; insights: Insight[] }
  | { ok: false; error: string };
```

**Rule-based insights (no LLM call):**

| Rule | Condition | Severity | Title pattern |
|------|-----------|----------|---------------|
| Stalled milestone | `milestone.status === "active"` AND `daysAgo(milestone.updated_at ?? milestone.created_at) > 7` | `"warning"` | `"Milestone stalled: {name}"` |
| Completion-ready | `project.stage === "in_progress"` AND all milestones for that project have `status === "done"` | `"info"` | `"Ready to complete: {title}"` |
| Cross-project pattern | `projects.length >= 2` AND at least 1 project has `stage === "completed"` | `"info"` | `"{N} projects completed"` |

The function computes all rule-based insights, then makes a single short LLM call to generate a summary "overall health" insight if at least one project is in `"in_progress"` or `"accepted"` stage. This LLM insight is appended with severity `"info"` and id `"ai-summary"`.

The function returns all insights (unsorted) and lets the client-side `AIInsightsCard` handle sorting (warning > info, then by staleness within each severity) and capping at 3.

Authentication: requires `requireSupabaseAuth`.

#### `AIInsightsCard` component

Located inline in `dashboard.tsx`:

```ts
// Props
type AIInsightsCardProps = {
  projects: Project[];
  milestones: Milestone[];
  updates: Update[];
};
```

Lifecycle:
- Calls `generateInsights` in a `useEffect` on mount when `projects.length > 0`.
- Uses an `AbortController` and a `setTimeout(abort, 10_000)` for the 10-second timeout; clears both on unmount.
- State: `{ status: "idle" | "loading" | "done" | "hidden"; insights: Insight[]; dismissed: Set<string> }`.
- If status is `"loading"`, renders 3 skeleton rows.
- If status is `"done"` and `visible.length === 0`, renders nothing.
- If status is `"hidden"` (timeout), renders nothing.
- Each insight row has an ×-button that adds the insight id to `dismissed`; dismissed insights are filtered from `visible` before rendering.

Placement in `DashboardOverview`: rendered in the right rail `<aside>`, just above the "Latest updates" section.

---

### Feature 4: Admin AI Tools

**Modified file:** `src/lib/admin.functions.ts` — add `draftProjectUpdate` and `generateMilestonePlan`.

**Modified file:** `src/routes/admin.projects.tsx` — add UI for both.

#### `draftProjectUpdate` server function

```ts
// Input
type DraftProjectUpdateInput = {
  projectId: string;              // uuid — used to look up context
  projectTitle: string;
  stage: string;
  packageName: string | null;
  milestones: { name: string; status: string }[];
  recentUpdates: string[];        // last 3 update messages
};

// Output
type DraftProjectUpdateResult =
  | { ok: true; draft: string }
  | { ok: false; error: string };
```

Calls `ensureAdmin`, then sends a concise prompt to OpenRouter asking for a 1–3 sentence professional project update. Returns the raw text string. If the response is empty or the fetch throws, returns an error.

#### `generateMilestonePlan` server function

```ts
// Input
type GenerateMilestonePlanInput = {
  projectTitle: string;
  packageName: string | null;
  stage: string;
  inquiryDetails: string;         // the "details" text from the linked project_inquiry
};

// Output
type GenerateMilestonePlanResult =
  | { ok: true; milestones: string[] }   // 3–8 names
  | { ok: false; error: string };
```

Calls `ensureAdmin`, then prompts OpenRouter for a numbered list of milestone names. The handler parses numbered lines from the LLM response. If the result has >8 items, it truncates to the first 8. If the result has <3 parseable items, it returns `{ ok: false, error: "..." }` without inserting.

#### Admin UI additions in `admin.projects.tsx`

Two new pieces of state in `AdminProjects`:

```ts
const [aiDraftBusy, setAiDraftBusy] = useState(false);
const [milestonePlan, setMilestonePlan] = useState<string[] | null>(null);
const [milestonePlanBusy, setMilestonePlanBusy] = useState(false);
```

"Draft with AI" button: rendered adjacent to the existing `<input value={newMsg} ...>`. On click, calls `draftProjectUpdate` and sets `newMsg` to the returned draft. Shows a spinner inside the button while loading.

"Generate Milestones with AI" button: rendered only when `ms.length === 0`. On click, calls `generateMilestonePlan` and sets `milestonePlan` to the returned array. Renders a preview list below the button with "Confirm" and "Discard" buttons. On Confirm, inserts milestones via the Supabase client directly (not via `cmsUpsert`) with `status: "pending"` and `position: 1..N`, then reloads the milestone list. On Discard, clears `milestonePlan`.

---

### Feature 5: Autonomous AI Blog Publisher

**Modified file:** `src/lib/admin.functions.ts` — add `publishAIBlogPost`.

**New file:** `src/routes/api.cron.publish-blog.ts` — cron endpoint.

**Modified file:** `src/routes/admin.content.$type.tsx` — add "Publish AI Post" button and last-post timestamp display.

**Modified file:** `wrangler.toml` — add cron trigger.

**Modified file:** `.env.example` — add `CRON_SECRET=`.

#### `publishAIBlogPost` server function

Authentication: uses `requireSupabaseAuth` middleware when called from the admin UI. When called from the cron route, it is bypassed and the cron handler passes a pre-authenticated Supabase service-role client.

The server function accepts an optional `supabaseOverride` that the cron handler can pass (a service-role client created with `process.env.SUPABASE_SERVICE_ROLE_KEY`). This avoids needing to duplicate all the LLM+DB logic.

**Step-by-step logic:**

```
1. Call OpenRouter → select a tech topic relevant to software, AI, or Nigerian tech ecosystem
2. Call OpenRouter → write a blog post on that topic
   - Response schema: { title, excerpt, content, tags: string[] }
3. Derive slug: title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
4. Check slug uniqueness in Supabase; append -2 through -10 if conflicts found (up to 10 attempts)
5. Construct Pollinations image URL:
   "https://image.pollinations.ai/prompt/{encodeURIComponent(prompt)}?width=1200&height=630&nologo=true"
   where prompt = `${title}, tech illustration, professional, clean, modern`
6. Call cmsUpsert (or direct supabase.upsert for cron path) with the full row
7. Return { ok: true, title, slug } or { ok: false, error }
```

Timeout: the handler wraps the OpenRouter calls in a `Promise.race` with a 60-second abort signal. If it fires, returns `{ ok: false, error: "Timeout: blog post generation exceeded 60 seconds." }`.

**Input/Output types:**

```ts
// No required input from admin UI (uses authenticated session context)
type PublishAIBlogPostResult =
  | { ok: true; title: string; slug: string }
  | { ok: false; error: string };
```

#### Cron route `src/routes/api.cron.publish-blog.ts`

```ts
// TanStack Start API route (GET handler)
// Validates X-Cron-Secret header against process.env.CRON_SECRET
// Creates a Supabase service-role client
// Calls publishAIBlogPostCore() directly
// Returns Response(JSON, { status: 200 | 401 | 500 })
```

This is a file route that uses TanStack Start's `createAPIFileRoute` pattern. It does not use `createServerFn` since it needs to return a raw HTTP response with specific status codes for Cloudflare to interpret cron health.

#### `wrangler.toml` addition

```toml
[triggers]
crons = ["0 7 * * *"]
```

The Cloudflare cron trigger calls the Worker's `fetch` handler with a `scheduled` event, which routes to the `/api/cron/publish-blog` path.

#### Admin blog UI additions

In `admin.content.$type.tsx`, when `type === "blog"`:

- A "Publish AI Post" button rendered in the header bar, next to the existing "+ New" button.
- A "Last AI post" line below the header showing the `created_at` timestamp of the most recent row where `author = "OKIKE AI"` (fetched alongside `load()`).
- State: `{ publishBusy: boolean; lastAiPost: string | null }`.

---

## Data Models

### New `Insight` type (client-only, not persisted)

```ts
type Insight = {
  id: string;           // deterministic key for dedup/dismissal
  severity: "warning" | "info";
  title: string;        // ≤60 chars
  message: string;
};
```

### `ProjectRecommendation` (server function response, not persisted)

```ts
type ProjectRecommendation = {
  pkg: "starter" | "business" | "custom";
  scopeGoal: string;
  scopePages: string;
  scopeBrand: string;
  addons: string[];
  timeline: string;
  needs_clarification?: false;
};
```

### `blog_posts` row (existing Supabase table, no schema change)

| Column | Value set by `publishAIBlogPost` |
|--------|----------------------------------|
| `title` | LLM-generated |
| `slug` | derived from title, de-duped |
| `author` | `"OKIKE AI"` |
| `excerpt` | LLM-generated (1–2 sentences) |
| `content` | LLM-generated (≥400 words) |
| `image_url` | Pollinations.ai URL |
| `tags` | LLM-generated array (2–5 strings) |
| `published` | `true` |
| `position` | `0` (appears first) |

### `project_milestones` insert (AI milestone plan)

Each confirmed milestone from `generateMilestonePlan` is inserted as:

```ts
{
  project_id: string,
  name: string,          // from LLM plan
  status: "pending",
  position: 1..N,        // sequential, 1-indexed
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: WelcomeAI conversation history is preserved and bounded

*For any* sequence of user messages sent through the WelcomeAI widget, each call to `askPublicAI` must include all prior turns in the `messages` array, and the total number of messages passed must never exceed 20.

**Validates: Requirements 1.6**

---

### Property 2: WelcomeAI correctly routes quick questions

*For any* quick-question button label, clicking the button must pass that exact string as the user message content to `askPublicAI` — no transformation, truncation, or substitution.

**Validates: Requirements 1.5**

---

### Property 3: AI response text is displayed verbatim

*For any* non-empty `text` string returned in an `{ ok: true, text }` response from `askPublicAI`, the WelcomeAI chat window must contain that exact string as the content of the most recent assistant message bubble.

**Validates: Requirements 1.2**

---

### Property 4: Project description validation gates the AI call

*For any* description string, `askProjectAssistant` must be called if and only if the description length is in the range [20, 2000] inclusive; descriptions outside this range must never reach the server.

**Validates: Requirements 2.3**

---

### Property 5: AI recommendation fully populates builder state

*For any* valid `ProjectRecommendation` payload returned by `askProjectAssistant`, every specified field (`pkg`, `scope.goal`, `scope.pages`, `scope.brand`, selected addon ids, `timeline`) must be reflected in the corresponding BookPage state variables after the recommendation is applied.

**Validates: Requirements 2.4**

---

### Property 6: AI suggested badge tracks field state

*For any* set of AI-populated fields, each field that has been AI-populated and not yet overridden by the user must display an "AI suggested" badge; any field that has been manually overridden must not display the badge.

**Validates: Requirements 2.5, 2.6**

---

### Property 7: Clarification cycle is bounded at 2 rounds

*For any* sequence of `askProjectAssistant` responses that return `needs_clarification: true`, after exactly 2 such responses the BookPage must fall back to manual mode — the AI description panel is closed and all builder fields remain in their default empty state.

**Validates: Requirements 2.7**

---

### Property 8: Stalled milestone rule fires for all qualifying milestones

*For any* milestone with `status === "active"` where the value of `updated_at` (or `created_at` when `updated_at` is null) is more than 7 days before the current UTC timestamp, `generateInsights` must include a `"warning"` severity insight whose title references that milestone's name.

**Validates: Requirements 3.4**

---

### Property 9: Completion-ready rule fires for all qualifying projects

*For any* project with `stage === "in_progress"` where every one of its associated milestones has `status === "done"`, `generateInsights` must include an `"info"` severity insight referencing that project's title.

**Validates: Requirements 3.5**

---

### Property 10: Insight display sorts warnings before info and caps at 3

*For any* list of insights returned by `generateInsights`, the AI Insights card must display at most 3 insights, where all `"warning"` severity items appear before all `"info"` severity items, and within the same severity items are ordered by staleness descending.

**Validates: Requirements 3.1**

---

### Property 11: Insight severity maps to the correct icon

*For any* `Insight` object with severity `"warning"`, the rendered insight row must use the amber flag icon; for severity `"info"`, it must use the sparkles icon.

**Validates: Requirements 3.7**

---

### Property 12: Milestone plan positions are sequential from 1

*For any* milestone plan of N names (where 3 ≤ N ≤ 8) confirmed by the admin, the `position` field of the Nth inserted `project_milestones` row must equal N (1-indexed, contiguous, no gaps).

**Validates: Requirements 4.10**

---

### Property 13: Blog post slug is URL-safe and derived from the title

*For any* title string generated by the LLM, the derived slug must satisfy the regex `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/` (all lowercase, alphanumeric and hyphens only, no leading/trailing hyphens) and must be derivable solely from the title via the defined transformation rules.

**Validates: Requirements 5.5**

---

### Property 14: Slug uniqueness is enforced with suffix appending

*For any* scenario where a slug has K existing conflicts in the `blog_posts` table (where 1 ≤ K ≤ 9), `publishAIBlogPost` must append the suffix `-{K+1}` and successfully insert. When K equals 10 (all 10 attempts collide), the function must return `{ ok: false }` without inserting any row.

**Validates: Requirements 5.12**

---

### Property 15: Published blog post row contains all required fields

*For any* successful execution of `publishAIBlogPost`, the upserted `blog_posts` row must contain all of the following with correct values: `title` (non-empty string), `slug` (URL-safe, unique), `author` (exactly `"OKIKE AI"`), `excerpt` (non-empty string), `content` (non-empty string), `image_url` (Pollinations URL matching the expected format), `tags` (array of 2–5 strings), `published: true`, `position: 0`.

**Validates: Requirements 5.7**

---

## Error Handling

### WelcomeAI

- On `{ ok: false, error }`: render a generic assistant bubble — "Sorry, I couldn't process that request. Please try again." Never surface `error.message` to visitors.
- On network failure (fetch throws): same generic bubble.
- Input > 8000 chars: `maxLength={8000}` on the `<input>` prevents submission at the DOM level.

### AI Project Assistant

- On error or empty response: `toast.error("AI couldn't parse your description. Please fill in the form manually.")`. All builder fields stay in their pre-AI state.
- On 2 clarification rounds exceeded: close AI mode silently, leave fields empty.
- The 20-char minimum is enforced on the description textarea `disabled={description.length < 20}`.

### Proactive AI Insights

- On any error (network, auth, timeout): silently suppress — do not render the card, do not toast.
- On timeout (>10s): `AbortController.abort()` is called; any late-arriving response is discarded because the component checks `if (aborted) return`.
- Zero insights returned: card is not rendered (conditional render, not hidden).

### Admin AI Tools

- `draftProjectUpdate` failure: `toast.error("AI draft failed. Try writing the update manually.")`. `newMsg` is unchanged.
- `generateMilestonePlan` failure or <3 items: `toast.error("Couldn't generate a milestone plan. Check the inquiry details.")`.
- Milestone insert failure on Confirm: `toast.error(error.message)`, milestone plan preview stays visible so admin can retry.

### Blog Publisher

- Any OpenRouter failure during topic selection or writing: return `{ ok: false, error: descriptive message }`. Nothing is written to `blog_posts`.
- Slug uniqueness exhausted (10 attempts): return `{ ok: false, error: "Could not generate a unique slug after 10 attempts." }`.
- 60-second timeout: `Promise.race` resolves with `{ ok: false, error: "Timeout..." }`. Admin UI shows error toast.
- Cron path errors: logged to Cloudflare Workers runtime log via `console.error`; HTTP 500 returned so Cloudflare marks the cron as failed.
- Missing `CRON_SECRET` or mismatch: HTTP 401, no execution.
- Missing `OPENROUTER_API_KEY`: early return `{ ok: false, error: "AI is not configured." }`.

---

## Testing Strategy

### Unit Tests

Unit tests cover specific examples, edge cases, and pure-function logic. They should be sparse — focused on things the property tests can't easily cover:

- **Slug derivation**: specific examples including titles with special characters, leading/trailing spaces, Unicode, and numbers.
- **Insight sorting**: specific examples of mixed-severity insight arrays to verify the sort order.
- **Milestone plan truncation**: a response with exactly 9 items should return only the first 8.
- **Milestone plan minimum**: a response with 2 parseable items should return an error.
- **`cmsUpsert` row shape**: verify all required fields are present in the payload for a known post.
- **Cron secret validation**: missing header → 401, wrong secret → 401, correct secret → passes through.

### Property-Based Tests

This feature involves several pure-function transformations and state machines that are well-suited to property-based testing. The recommended library is **fast-check** (already available via npm, no install needed).

Each property test runs a minimum of 100 iterations.

**Tag format:** `// Feature: okike-ai-upgrade, Property {N}: {property_text}`

#### Property 1 — WelcomeAI conversation history is bounded
```
// Feature: okike-ai-upgrade, Property 1: conversation history preserved and bounded
// Generate: array of ChatMsg (role, content), new user message
// Assert: askPublicAI called with all prior messages + new message, length ≤ 20
```

#### Property 2 — WelcomeAI quick questions pass exact text
```
// Feature: okike-ai-upgrade, Property 2: quick questions route exactly
// Generate: pick one of the 4 quick question labels
// Assert: askPublicAI receives message with content === that label
```

#### Property 3 — AI response text appears verbatim
```
// Feature: okike-ai-upgrade, Property 3: response text displayed verbatim
// Generate: non-empty string (arbitrary printable text)
// Assert: after askPublicAI resolves with { ok: true, text }, last assistant message.content === text
```

#### Property 4 — Description validation gates the AI call
```
// Feature: okike-ai-upgrade, Property 4: description length gates submission
// Generate: strings of various lengths (0-3000 chars, including boundaries 19, 20, 2000, 2001)
// Assert: askProjectAssistant called iff length in [20, 2000]
```

#### Property 5 — AI recommendation fully populates builder state
```
// Feature: okike-ai-upgrade, Property 5: recommendation populates all fields
// Generate: valid ProjectRecommendation objects (arbitrary pkg, goal, pages, brand, addons, timeline)
// Assert: BookPage state matches recommendation after applyRecommendation()
```

#### Property 6 — AI badge tracks field state
```
// Feature: okike-ai-upgrade, Property 6: AI badge tracks field override state
// Generate: set of AI-populated field keys, set of manually-overridden keys
// Assert: badge visible iff key in aiSuggested and not in overridden
```

#### Property 7 — Clarification bounded at 2
```
// Feature: okike-ai-upgrade, Property 7: clarification cycle bounded
// Generate: sequences of needs_clarification=true responses (N=1..5)
// Assert: after N≥2 responses, aiMode=false and fields reset
```

#### Property 8 — Stalled milestone rule fires
```
// Feature: okike-ai-upgrade, Property 8: stalled milestone insight generated
// Generate: milestone with status="active", updated_at=(now - K days) where K in [8..30]
// Assert: generateInsights() returns at least 1 warning insight referencing the milestone
```

#### Property 9 — Completion-ready rule fires
```
// Feature: okike-ai-upgrade, Property 9: completion-ready insight generated
// Generate: project with stage="in_progress", all milestones with status="done"
// Assert: generateInsights() returns an info insight referencing the project title
```

#### Property 10 — Insight display sorts and caps at 3
```
// Feature: okike-ai-upgrade, Property 10: insight display sorted and capped
// Generate: list of 1..10 insights with random severities
// Assert: displayed ≤ 3, warnings before infos, within severity sorted by staleness desc
```

#### Property 11 — Severity → icon mapping
```
// Feature: okike-ai-upgrade, Property 11: severity maps to icon
// Generate: Insight with severity "warning" | "info"
// Assert: rendered component uses the correct icon component for each severity
```

#### Property 12 — Milestone positions are sequential
```
// Feature: okike-ai-upgrade, Property 12: milestone positions sequential from 1
// Generate: milestone name list of length 3..8
// Assert: inserted positions are exactly [1, 2, ..., N] with no gaps
```

#### Property 13 — Slug is URL-safe
```
// Feature: okike-ai-upgrade, Property 13: derived slug is URL-safe
// Generate: arbitrary non-empty string titles (including Unicode, spaces, punctuation)
// Assert: derived slug matches /^[a-z0-9][a-z0-9-]*$/ (or returns fallback for empty result)
```

#### Property 14 — Slug uniqueness with suffix
```
// Feature: okike-ai-upgrade, Property 14: slug uniqueness enforced
// Generate: base slug, K existing conflicts in [0..10]
// Assert: for K<10, result slug ends with -(K+1) if K>0 else base; for K=10, returns error
```

#### Property 15 — Published blog row has all required fields
```
// Feature: okike-ai-upgrade, Property 15: blog post row complete
// Generate: mock OpenRouter responses with various title/content/tag combos
// Assert: upserted row contains all required fields with correct types and values
```

### Integration Tests

Integration tests verify wiring between components and are run with 1–3 representative examples:

- **`askPublicAI` end-to-end**: call the real server function with a valid token and a simple message; verify `{ ok: true, text }` is returned.
- **`generateInsights` auth enforcement**: call without a bearer token; verify it throws an auth error.
- **Cron endpoint secrets**: send GET to `/api/cron/publish-blog` without `X-Cron-Secret`; verify HTTP 401.
- **Admin `ensureAdmin` enforcement**: call `draftProjectUpdate` with a non-admin user token; verify 403.
- **Slug uniqueness in Supabase**: insert a blog post with a known slug, then call `publishAIBlogPost` core logic; verify the resulting slug has a `-2` suffix.

### Smoke Tests

Single-execution checks for configuration and environment:

- `OPENROUTER_API_KEY` is present in the runtime environment.
- `CRON_SECRET` is present in the runtime environment.
- `requireSupabaseAuth` middleware is correctly wired on all protected server functions.
- `wrangler.toml` contains the `[triggers]` cron entry.
