# Implementation Plan: OKIKE AI Upgrade

## Overview

Five independent feature areas, each fully implementable and testable in isolation. Tasks are grouped by feature area; within each group, implementation tasks come first, followed by optional property-based test tasks. All code is TypeScript/React following the existing TanStack Start + Supabase + OpenRouter patterns in the codebase.

---

## Tasks

### Feature 1: WelcomeAI Live AI Integration

- [x] 1. Wire `WelcomeAI` to `askPublicAI`
  - [x] 1.1 Replace hardcoded responses with real `askPublicAI` calls in `src/components/site/WelcomeAI.tsx`
    - Import `useServerFn` from `@tanstack/react-start` and `askPublicAI` from `@/lib/public-ai.functions`
    - Call `const askAI = useServerFn(askPublicAI)` at the top of the component
    - Replace the `setTimeout` + `responses` dict inside `send()` with an `async` call to `askAI`, passing the full `next` conversation array (the updated history including the new user message), sliced to the last 20 items
    - On `{ ok: true, text }`: append the assistant bubble with `text` as content
    - On `{ ok: false }` or thrown error: append an assistant bubble with the generic message `"Sorry, I couldn't process that request. Please try again."` — never surface `error` directly
    - Remove the `responses` Record and its type entirely
    - Keep the `quickQuestions` array and buttons; they still call `send(q)` which now calls `askAI`
    - Add `maxLength={8000}` to the `<input>` element
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.8_

  - [ ]* 1.2 Write property tests for WelcomeAI conversation history and routing
    - Set up a `src/tests/welcomeai.property.test.ts` file using `vitest` and `fast-check`
    - **Property 1: Conversation history is preserved and bounded**
      - Generate arrays of `ChatMsg` objects plus a new user message string
      - Mock `askAI` and capture the `messages` argument passed to it
      - Assert the messages array equals all prior turns plus the new user turn, with total length ≤ 20
      - `// Feature: okike-ai-upgrade, Property 1: conversation history preserved and bounded`
    - **Property 2: Quick questions pass exact text**
      - Generate one of the 4 quick question labels via `fc.constantFrom(...)`
      - Call `send(q)` and assert `askAI` was called with `messages` where the last item has `content === q`
      - `// Feature: okike-ai-upgrade, Property 2: quick questions route exactly`
    - **Property 3: Response text displayed verbatim**
      - Generate an arbitrary non-empty printable string as the mocked `text` value
      - Assert the most recent assistant message in state equals that string exactly
      - `// Feature: okike-ai-upgrade, Property 3: response text displayed verbatim`
    - _Requirements: 1.1, 1.2, 1.5, 1.6_

- [x] 2. Checkpoint — Feature 1
  - Ensure all Feature 1 tests pass, ask the user if questions arise.

---

### Feature 2: AI Project Creation Assistant

- [x] 3. Add `askProjectAssistant` server function
  - [x] 3.1 Implement `askProjectAssistant` in `src/lib/ai-assistant.functions.ts`
    - Add input types: `PackageSummary`, `AddonSummary`, `AskProjectAssistantInput`, `ProjectRecommendation`, `ProjectClarification`, `AskProjectAssistantResult`
    - Use `requireSupabaseAuth` middleware
    - Build a system prompt instructing the model to return JSON matching `ProjectRecommendation` (with `needs_clarification: false`) or `ProjectClarification` (with `needs_clarification: true` and `clarification_question` string)
    - Validate input: `description` 20–2000 chars, `packages` non-empty array
    - Call OpenRouter with `model: "openai/gpt-4o-mini"`, parse JSON from the response
    - Validate the returned shape; on JSON parse failure or missing required fields return `{ ok: false, error: "..." }`
    - Return `{ ok: true, recommendation }` on success
    - _Requirements: 2.3, 2.9, 2.10_

  - [ ]* 3.2 Write property test for description length validation gate
    - **Property 4: Description length gates the AI call**
    - Generate strings of lengths 0–2100 using `fc.string()` and length-specific arbitraries for boundary values (19, 20, 2000, 2001)
    - Assert `askProjectAssistant` is called if and only if description length is in `[20, 2000]`
    - `// Feature: okike-ai-upgrade, Property 4: description length gates submission`
    - _Requirements: 2.3_

- [x] 4. Wire AI Assistant Mode into `BookPage`
  - [x] 4.1 Add AI mode state and UI overlay to `src/routes/book.tsx`
    - Add state: `aiMode`, `aiDescription`, `aiClarificationCount`, `clarificationQuestion`, `aiSuggested` (Record keyed by field name), `aiLoading`
    - Render a `"Use AI Assistant"` toggle button above the `<ol>` stepper; toggling it on/off follows requirement 2.1 and 2.8
    - When `aiMode` is true, render a panel above the stepper with: a `<textarea>` for description (20–2000 char limit), a clarification question paragraph when `aiClarificationCount > 0`, a submit button that calls `handleAISubmit`, and a loading spinner state
    - Disable the submit button when `aiDescription.length < 20` or `aiLoading === true`
    - _Requirements: 2.1, 2.2, 2.11_

  - [x] 4.2 Implement `handleAISubmit` to call `askProjectAssistant` and populate builder state
    - Import `useServerFn` + `askProjectAssistant`
    - Call with `{ description: aiDescription, packages: PACKAGES.map(...), addons: ADDONS.map(...), timelineOptions: TIMELINE_OPTIONS.map(t => t.id) }`
    - On `needs_clarification: true`: increment `aiClarificationCount`, set `clarificationQuestion`; if count reaches 2, clear `aiMode` and reset all AI state silently
    - On `needs_clarification: false` (full recommendation): set `pkg`, `scope.goal`, `scope.pages`, `scope.brand`, `addons`, `timeline` from the recommendation; set `scope.description` to `aiDescription`; populate `aiSuggested` with a `true` entry for every field that was filled
    - On `{ ok: false }`: call `toast.error("AI couldn't parse your description. Please fill in the form manually.")` and leave all builder fields unchanged
    - _Requirements: 2.3, 2.4, 2.5, 2.7, 2.10_

  - [x] 4.3 Add "AI suggested" badges and override-clearing logic
    - For each builder field rendered in the step cards (`pkg`, `scope.goal`, `scope.pages`, `scope.brand`, addon checkboxes, `timeline`), render a small "AI suggested" badge when `aiSuggested[fieldKey] === true`
    - On any manual override of a field, call `setAiSuggested(s => ({ ...s, [fieldKey]: false }))`
    - _Requirements: 2.5, 2.6_

  - [ ]* 4.4 Write property tests for recommendation state population and badge tracking
    - **Property 5: AI recommendation fully populates builder state**
    - Generate valid `ProjectRecommendation` objects with `fc.record({...})`
    - Call the `applyRecommendation` helper (extracted from `handleAISubmit`) and assert all state matches
    - `// Feature: okike-ai-upgrade, Property 5: recommendation populates all fields`
    - **Property 6: AI badge tracks field override state**
    - Generate a set of AI-populated field keys and a subset of manually-overridden keys
    - Assert badge is visible for keys in `aiSuggested` but NOT in the overridden set
    - `// Feature: okike-ai-upgrade, Property 6: AI badge tracks field override state`
    - **Property 7: Clarification cycle bounded at 2**
    - Generate sequences of 1–5 `needs_clarification: true` responses from the mocked server function
    - Assert that after exactly 2 such responses, `aiMode === false` and all builder fields are in default empty state
    - `// Feature: okike-ai-upgrade, Property 7: clarification cycle bounded`
    - _Requirements: 2.4, 2.5, 2.6, 2.7_

- [x] 5. Checkpoint — Feature 2
  - Ensure all Feature 2 tests pass, ask the user if questions arise.

---

### Feature 3: Proactive AI Insights on the Client Dashboard

- [x] 6. Implement `generateInsights` server function
  - [x] 6.1 Add `generateInsights` to `src/lib/ai-assistant.functions.ts`
    - Add types: `GenerateInsightsInput`, `Insight` (`{ id, severity: "warning" | "info", title, message }`), `GenerateInsightsResult`
    - Use `requireSupabaseAuth` middleware
    - Implement the three rule-based insights:
      - Stalled milestone: `status === "active"` AND `daysAgo(updated_at ?? created_at) > 7` → `{ id: "stalled-<milestone-id>", severity: "warning", title: "Milestone stalled: <name>", message: "<N> days without progress" }`
      - Completion-ready: `stage === "in_progress"` AND all milestones `status === "done"` → `{ id: "complete-ready-<project-id>", severity: "info", title: "Ready to complete: <title>", message: "All milestones done — notify admin for sign-off" }`
      - Cross-project pattern: `projects.length >= 2` AND at least 1 `stage === "completed"` → `{ id: "cross-project-pattern", severity: "info", title: "<N> projects completed", message: "Most common package: <name>" }`
    - If at least one project is `"in_progress"` or `"accepted"`, make one short LLM call to generate an `"ai-summary"` insight appended with `severity: "info"`
    - Return `{ ok: true, insights }` (unsorted; sorting is client-side)
    - Wrap the LLM call in a try/catch; if it throws, return the rule-based insights only (do not fail the whole function)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 6.2 Write property tests for rule-based insight generation
    - **Property 8: Stalled milestone rule fires for all qualifying milestones**
    - Generate milestones with `status === "active"` and `updated_at = now - K days` where K is drawn from `fc.integer({ min: 8, max: 30 })`
    - Assert `generateInsights` pure logic returns at least one `"warning"` insight referencing the milestone
    - `// Feature: okike-ai-upgrade, Property 8: stalled milestone insight generated`
    - **Property 9: Completion-ready rule fires for all qualifying projects**
    - Generate a project with `stage === "in_progress"` and all milestones `status === "done"`
    - Assert an `"info"` insight with the project's title is returned
    - `// Feature: okike-ai-upgrade, Property 9: completion-ready insight generated`
    - _Requirements: 3.4, 3.5_

- [x] 7. Add `AIInsightsCard` component to the client dashboard
  - [x] 7.1 Implement `AIInsightsCard` inline in `src/routes/dashboard.tsx`
    - Define props type `{ projects: Project[]; milestones: Milestone[]; updates: Update[] }`
    - State: `status: "idle" | "loading" | "done" | "hidden"`, `insights: Insight[]`, `dismissed: Set<string>`
    - On mount (when `projects.length > 0`): call `generateInsights` via `useServerFn`; set `status = "loading"` while in-flight
    - Set up `AbortController` + `setTimeout(abort, 10_000)`; on timeout set `status = "hidden"` and return; clear both on unmount
    - Client-side sort before rendering: warnings before infos, then by staleness descending within each severity; cap display at 3 after filtering out dismissed IDs
    - Render each insight row with: severity icon (`Flag` for warning, `Sparkles` for info), title (≤60 chars), message, and an ×-dismiss button that adds the ID to `dismissed`
    - Render 3 skeleton rows while `status === "loading"`
    - Render nothing when `status === "done"` and 0 visible insights, or `status === "hidden"`
    - Place `<AIInsightsCard>` in the `DashboardOverview` right rail `<aside>`, above the "Latest updates" section
    - _Requirements: 3.1, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_

  - [ ]* 7.2 Write property tests for insight display sorting and capping
    - **Property 10: Insight display sorts warnings before info and caps at 3**
    - Generate lists of 1–10 insights with random severities using `fc.array(fc.record({...}))`
    - Call the pure sort/filter helper and assert: length ≤ 3, all warnings before infos, within severity sorted by staleness descending
    - `// Feature: okike-ai-upgrade, Property 10: insight display sorted and capped`
    - **Property 11: Severity maps to the correct icon**
    - Generate an `Insight` with `fc.constantFrom("warning", "info")` for severity
    - Assert the rendered row uses `Flag` for `"warning"` and `Sparkles` for `"info"`
    - `// Feature: okike-ai-upgrade, Property 11: severity maps to icon`
    - _Requirements: 3.1, 3.7_

- [x] 8. Checkpoint — Feature 3
  - Ensure all Feature 3 tests pass, ask the user if questions arise.

---

### Feature 4: AI-Powered Admin Tools

- [x] 9. Implement `draftProjectUpdate` and `generateMilestonePlan` server functions
  - [x] 9.1 Add `draftProjectUpdate` to `src/lib/admin.functions.ts`
    - Add types: `DraftProjectUpdateInput`, `DraftProjectUpdateResult`
    - Use `requireSupabaseAuth` and call `ensureAdmin`
    - Build a concise prompt asking for a 1–3 sentence professional project update using the passed `projectTitle`, `stage`, `packageName`, milestone names+statuses, and `recentUpdates` (last 3 messages)
    - Call OpenRouter; return `{ ok: true, draft: text }` where `text` is the raw response string
    - If the response is empty or the fetch throws, return `{ ok: false, error: "..." }`
    - _Requirements: 4.2, 4.4, 4.5_

  - [x] 9.2 Add `generateMilestonePlan` to `src/lib/admin.functions.ts`
    - Add types: `GenerateMilestonePlanInput`, `GenerateMilestonePlanResult`
    - Use `requireSupabaseAuth` and call `ensureAdmin`
    - Prompt OpenRouter for a numbered list (3–8) of milestone names based on `projectTitle`, `packageName`, `stage`, and `inquiryDetails`
    - Parse numbered lines from the LLM response (strip leading `1.`, `2.` etc.)
    - Truncate to first 8 if > 8; return `{ ok: false, error: "..." }` if < 3 parseable items
    - Return `{ ok: true, milestones: string[] }` on success
    - _Requirements: 4.8, 4.11, 4.12_

  - [ ]* 9.3 Write property test for milestone plan position sequencing
    - **Property 12: Milestone positions are sequential from 1**
    - Generate a list of N milestone names where N is drawn from `fc.integer({ min: 3, max: 8 })`
    - Simulate the insert loop and assert the `position` values are exactly `[1, 2, ..., N]` with no gaps
    - `// Feature: okike-ai-upgrade, Property 12: milestone positions sequential from 1`
    - _Requirements: 4.10_

- [x] 10. Wire Admin AI Tools into `admin.projects.tsx`
  - [x] 10.1 Add "Draft with AI" button to the project update section in `src/routes/admin.projects.tsx`
    - Import `useServerFn` + `draftProjectUpdate`
    - Add state: `aiDraftBusy`
    - Render a "Draft with AI" button adjacent to the existing `newMsg` input
    - On click: set `aiDraftBusy = true`, call `draftProjectUpdate` with `{ projectId: open.id, projectTitle: open.title, stage: open.stage, packageName: open.package_name, milestones: ms.map(m => ({ name: m.name, status: m.status })), recentUpdates: up.slice(0, 3).map(u => u.message) }`
    - On success: set `newMsg` to the returned `draft`
    - On failure: `toast.error("AI draft failed. Try writing the update manually.")`
    - While busy: show a `Loader2` spinner inside the button and disable it
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6_

  - [x] 10.2 Add "Generate Milestones with AI" button and preview flow in `src/routes/admin.projects.tsx`
    - Import `useServerFn` + `generateMilestonePlan`
    - Add state: `milestonePlan: string[] | null`, `milestonePlanBusy`
    - Fetch the linked inquiry's `details` field from `project_inquiries` where `id = open.inquiry_id` (fetch alongside `loadDetail`)
    - Render "Generate Milestones with AI" button only when `ms.length === 0`
    - On click: set `milestonePlanBusy = true`, call `generateMilestonePlan` with the inquiry details, `package_name`, and `stage`
    - On success: set `milestonePlan` to the returned array and render the preview list with "Confirm" and "Discard" buttons
    - On "Discard": clear `milestonePlan`
    - On "Confirm": insert each milestone into `project_milestones` via the Supabase client directly with `{ project_id: open.id, name, status: "pending", position: index + 1 }` for each name; on error `toast.error(error.message)`; on success reload milestones and clear `milestonePlan`
    - On failure: `toast.error("Couldn't generate a milestone plan. Check the inquiry details.")`
    - While busy: show spinner and disable the button
    - _Requirements: 4.7, 4.8, 4.9, 4.10, 4.13_

- [x] 11. Checkpoint — Feature 4
  - Ensure all Feature 4 tests pass, ask the user if questions arise.

---

### Feature 5: Autonomous AI Blog Publisher

- [x] 12. Implement `publishAIBlogPost` server function
  - [x] 12.1 Add `publishAIBlogPost` to `src/lib/admin.functions.ts`
    - Add types: `PublishAIBlogPostResult`
    - Export a shared `publishAIBlogPostCore(supabase: SupabaseClient)` function containing the full pipeline logic so both the admin server function and the cron route can call it
    - **Pipeline steps inside `publishAIBlogPostCore`:**
      1. Call OpenRouter to select a tech topic relevant to software, AI, or the Nigerian tech ecosystem
      2. Call OpenRouter to write a blog post on that topic — system prompt MUST specify: write plain prose only, no markdown syntax (headers, bold, asterisks, bullet points), because content is rendered with `whitespace-pre-wrap` only
      3. Parse the JSON response: `{ title, excerpt, content, tags: string[] }`
      4. Derive slug: `title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")`
      5. Check slug uniqueness; try suffixes `-2` through `-10`; if all 10 attempts collide return error
      6. Construct Pollinations image URL: `https://image.pollinations.ai/prompt/{encodeURIComponent(title + ", tech illustration, professional, clean, modern")}?width=1200&height=630&nologo=true`
      7. Call `supabase.from("blog_posts").upsert({ title, slug, author: "OKIKE AI", excerpt, content, image_url, tags, published: true, position: 0 })`
      8. Return `{ ok: true, title, slug }`
    - Wrap all OpenRouter calls in a `Promise.race` with a 60-second abort signal; on timeout return `{ ok: false, error: "Timeout: blog post generation exceeded 60 seconds." }`
    - Admin-UI server function: use `requireSupabaseAuth` and call `ensureAdmin`; pass `context.supabase` to `publishAIBlogPostCore`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.9, 5.11, 5.12_

  - [ ]* 12.2 Write property tests for slug derivation and uniqueness
    - **Property 13: Blog post slug is URL-safe**
    - Generate arbitrary non-empty title strings (including Unicode, spaces, punctuation) using `fc.string()`
    - Assert the derived slug matches `/^[a-z0-9][a-z0-9-]*$/` or is a safe fallback string if the title would yield an empty slug
    - `// Feature: okike-ai-upgrade, Property 13: derived slug is URL-safe`
    - **Property 14: Slug uniqueness enforced with suffix appending**
    - Generate a base slug and K conflicts where K is drawn from `fc.integer({ min: 0, max: 10 })`
    - Mock the Supabase uniqueness check; assert that for K < 10 the result slug ends with `-${K+1}` when K > 0, or is the base slug when K = 0; assert that for K = 10 the function returns `{ ok: false }`
    - `// Feature: okike-ai-upgrade, Property 14: slug uniqueness enforced`
    - **Property 15: Published blog post row contains all required fields**
    - Generate mock OpenRouter responses with various title/content/tag combinations
    - Assert the `upsert` call receives a row containing all of: `title` (string), `slug` (URL-safe), `author === "OKIKE AI"`, `excerpt` (non-empty), `content` (non-empty), `image_url` (starts with `https://image.pollinations.ai/`), `tags` (array length 2–5), `published === true`, `position === 0`
    - `// Feature: okike-ai-upgrade, Property 15: blog post row complete`
    - _Requirements: 5.5, 5.7, 5.12_

- [ ] 13. Create cron route and wire up Cloudflare trigger
  - [x] 13.1 Create `src/routes/api.cron.publish-blog.ts`
    - Use `createAPIFileRoute` from `@tanstack/react-start/api` for the `/api/cron/publish-blog` path
    - Implement a GET handler that:
      1. Reads `request.headers.get("x-cron-secret")`
      2. If missing or does not match `process.env.CRON_SECRET`, returns `new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } })`
      3. Creates a Supabase service-role client using `process.env.SUPABASE_URL` and `process.env.SUPABASE_SERVICE_ROLE_KEY`
      4. Calls `publishAIBlogPostCore(serviceRoleClient)`
      5. Returns `new Response(JSON.stringify(result), { status: result.ok ? 200 : 500, headers: { "Content-Type": "application/json" } })`
      6. Logs errors to `console.error` for Cloudflare Workers runtime log
    - _Requirements: 5.13, 5.14, 5.15_

  - [x] 13.2 Add `CRON_SECRET` to `.env.example`
    - Append `CRON_SECRET=` to `.env.example` so the variable is documented
    - Also add `SUPABASE_SERVICE_ROLE_KEY=` if not already present (needed for cron's service-role client)
    - _Requirements: 5.13_

  - [x] 13.3 Add cron trigger to `wrangler.toml` (create file if it does not exist)
    - Add or update the `[triggers]` section with `crons = ["0 7 * * *"]` to fire at 07:00 UTC daily
    - _Requirements: 5.14_

- [ ] 14. Add "Publish AI Post" button and last-post timestamp to `admin.content.$type.tsx`
  - [ ] 14.1 Wire the blog publisher UI into `src/routes/admin.content.$type.tsx`
    - Import `useServerFn` + `publishAIBlogPost`
    - Add state: `publishBusy: boolean`, `lastAiPost: string | null`
    - After `load()`, find the most recent row where `author === "OKIKE AI"` and set `lastAiPost` to its `created_at`
    - Render a "Publish AI Post" button in the header bar, next to the existing "+ New" button, only when `type === "blog"`
    - Render a "Last AI post: {timestamp}" line below the header when `lastAiPost` is not null
    - On click "Publish AI Post": set `publishBusy = true`, call `publishAIBlogPost({})`
    - On success: `toast.success(`Published: "${result.title}" (/${result.slug})`)`, call `load()` to refresh the list, set `publishBusy = false`
    - On failure or timeout: `toast.error(result.error)`, set `publishBusy = false`
    - While busy: show `Loader2` spinner inside the button with "Publishing…" label, disable all interactive controls on the button
    - _Requirements: 5.1, 5.2, 5.8, 5.9, 5.10, 5.11, 5.16_

- [x] 15. Final checkpoint — All features
  - Ensure all tests pass across all 5 feature areas, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all non-starred tasks must be implemented.
- All property tests use `fast-check` (already in the npm tree via vitest ecosystem); no new packages needed.
- The `publishAIBlogPostCore` function is extracted from the admin server function specifically so the cron route can call it with a service-role Supabase client — this avoids duplicating the LLM + DB logic.
- Blog post content prompt MUST specify no markdown syntax since the site renders posts with `whitespace-pre-wrap` only.
- `wrangler.toml` may not exist yet; task 13.3 should create it if absent.
- Slug derivation edge case: if the cleaned slug is empty (e.g., a title of all Unicode), fall back to `"ai-post-${Date.now()}`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "3.1", "6.1", "9.1", "9.2", "12.1"] },
    { "id": 1, "tasks": ["1.2", "3.2", "4.1", "6.2", "9.3", "12.2", "13.1", "13.2", "13.3"] },
    { "id": 2, "tasks": ["4.2", "7.1", "10.1", "10.2", "14.1"] },
    { "id": 3, "tasks": ["4.3", "4.4", "7.2"] }
  ]
}
```
