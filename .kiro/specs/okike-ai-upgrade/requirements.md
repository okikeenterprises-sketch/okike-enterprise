# Requirements Document

## Introduction

This feature upgrades the AI capabilities of the OKIKE enterprise platform across five areas:

1. **WelcomeAI Fix** — Wire the public homepage chat widget to call the real `askPublicAI` server function instead of returning hardcoded static responses.
2. **AI Project Creation Assistant** — On the `/book` page (5-step project builder), add an AI-assisted mode where users describe what they want to build and the AI recommends the right package, scope answers, add-ons, and timeline.
3. **Proactive AI Insights** — On the client `/dashboard`, automatically surface smart insights (stalled milestones, next-action suggestions, cross-project patterns) without the user having to ask.
4. **AI-Powered Admin Tools** — In the admin panel, add AI assistance for drafting project update messages and generating milestone plans from inquiry/project context.
5. **Autonomous AI Blog Publisher** — A workflow that runs daily on a schedule (and can also be triggered manually by an admin) to research current tech news, write a full blog post, generate a cover image via Pollinations.ai, and publish it to the `blog_posts` table without manual editing.

**Tech stack:** TanStack Start (React 19), Supabase, Tailwind CSS v4, OpenRouter API (`openai/gpt-4o-mini` default), Cloudflare Workers. Server functions use the `createServerFn` pattern in `src/lib/`. Image storage uses Cloudflare R2 CDN URLs.

---

## Glossary

- **WelcomeAI**: The floating chat widget rendered on the public homepage (`src/components/site/WelcomeAI.tsx`).
- **askPublicAI**: The unauthenticated server function in `src/lib/public-ai.functions.ts` that proxies requests to the OpenRouter API.
- **askAssistant**: The authenticated server function in `src/lib/ai-assistant.functions.ts` used inside the client dashboard.
- **BookPage**: The 5-step project builder at `/book` (`src/routes/book.tsx`).
- **AI_Assistant_Mode**: The optional conversational overlay on the BookPage that helps users fill out the project brief using plain-English descriptions.
- **ProjectInsights_Engine**: The server function and dashboard component responsible for computing and displaying proactive AI insights on the client dashboard.
- **Insight**: A structured AI-generated observation about a user's projects or milestones, containing a type, severity, title, message, and optional action.
- **Stalled_Milestone**: A project milestone whose `status` is `"active"` and whose `updated_at` timestamp is more than 7 days in the past.
- **Admin_AI_Draft**: The AI-assisted text generation feature inside the admin project detail panel.
- **MilestonePlan**: An ordered list of milestone names generated from a project brief (inquiry details).
- **Blog_Publisher**: The server function and admin UI component that autonomously researches, writes, illustrates, and publishes a blog post.
- **Pollinations_API**: The free, no-key-required image generation API at `https://image.pollinations.ai/prompt/{encoded_prompt}`.
- **cmsUpsert**: The existing admin server function that upserts rows into CMS tables including `blog_posts`.
- **OpenRouter**: The LLM proxy API used for all AI text generation, called with model `openai/gpt-4o-mini` by default.
- **OKIKE_AI**: The branded name for all AI features within the OKIKE platform.
- **Inquiry**: A row in the `project_inquiries` Supabase table containing a client's project brief.
- **blog_posts**: The Supabase table storing blog post records with columns: `id`, `title`, `slug`, `author`, `excerpt`, `content`, `image_url`, `tags`, `published`, `position`, `created_at`, `updated_at`.
- **CRON_SECRET**: An environment variable holding a shared secret string used to authenticate requests from the Cloudflare Cron Trigger to the `/api/cron/publish-blog` endpoint.

---

## Requirements

### Requirement 1: WelcomeAI Live AI Integration

**User Story:** As a website visitor, I want the homepage chat widget to respond using real AI so that I get accurate, contextual answers about OKIKE's services instead of pre-scripted replies.

#### Acceptance Criteria

1. WHEN a visitor submits a message in the WelcomeAI widget, THE WelcomeAI SHALL call the `askPublicAI` server function with the full conversation history instead of matching against the hardcoded `responses` dictionary.
2. WHEN `askPublicAI` returns `{ ok: true, text }`, THE WelcomeAI SHALL display the returned `text` as the assistant's reply in the chat window.
3. IF `askPublicAI` returns `{ ok: false, error }`, THEN THE WelcomeAI SHALL display a non-blocking error message inside the chat window (in place of the assistant reply bubble) that communicates the failure without showing the raw error string to the visitor.
4. WHILE THE WelcomeAI is awaiting a response from `askPublicAI`, THE WelcomeAI SHALL display a visible loading indicator and disable the send button to prevent duplicate submissions.
5. IF the first message has been displayed and no user message has been sent yet, THEN THE WelcomeAI SHALL display the four quick-question buttons; WHEN a quick-question button is clicked, THE WelcomeAI SHALL pass the button's label text as the user message to `askPublicAI`.
6. THE WelcomeAI SHALL preserve the conversation history in component state and include all prior turns in each `askPublicAI` call; the total number of messages passed per call SHALL NOT exceed 20 (the server-side schema maximum).
7. IF the OpenRouter API key is not configured in the server environment, THEN THE `askPublicAI` server function SHALL return `{ ok: false, error: "AI is not configured." }`.
8. WHEN a visitor types a message in the WelcomeAI input field, THE WelcomeAI SHALL enforce a maximum input length of 8,000 characters client-side, preventing form submission beyond this limit without displaying a server validation error.

---

### Requirement 2: AI Project Creation Assistant on the Book Page

**User Story:** As a prospective client, I want to describe my project idea in plain English so that the AI can recommend the right OKIKE package, scope answers, add-ons, and timeline — saving me from guessing at technical options.

#### Acceptance Criteria

1. THE BookPage SHALL render a toggleable "Use AI Assistant" button at the top of the builder that activates AI_Assistant_Mode without replacing the existing manual flow.
2. WHILE AI_Assistant_Mode is active, THE BookPage SHALL display a natural-language text input labelled "Describe what you want to build" as the entry point before Step 1 (package selection).
3. WHEN a user submits a description of at least 20 characters and no more than 2,000 characters, THE BookPage SHALL call the `askProjectAssistant` server function with the description and the current list of available packages, add-ons, and timeline options.
4. WHEN `askProjectAssistant` returns recommendations, THE BookPage SHALL pre-populate the following builder fields: selected package (`pkg`), scope goal (`scope.goal`), scope pages (`scope.pages`), scope brand (`scope.brand`), active add-ons (`addons`), and timeline preference — while leaving `scope.description` pre-filled with the original plain-English input.
5. WHEN fields are pre-populated by the AI, THE BookPage SHALL display a visible "AI suggested" badge next to each auto-filled field so the user can identify which selections were AI-driven.
6. WHEN a user manually overrides an AI-suggested field, THE BookPage SHALL remove the "AI suggested" badge for that field only; all other AI-suggested badges SHALL remain visible.
7. IF `askProjectAssistant` returns `needs_clarification: true` with a follow-up question string, THEN THE BookPage SHALL display that follow-up question as a conversational prompt and SHALL NOT advance the builder to Step 1 until the user submits a refined description; the clarification cycle SHALL be limited to a maximum of 2 rounds before the BookPage falls back to the manual flow.
8. WHEN the user clicks "Use AI Assistant" a second time while AI_Assistant_Mode is active, THE BookPage SHALL deactivate AI_Assistant_Mode, clear any AI-suggested badges, and reset all pre-populated fields to their default empty state.
9. THE `askProjectAssistant` server function SHALL require Supabase authentication via the `requireSupabaseAuth` middleware.
10. IF `askProjectAssistant` fails or returns an error, THEN THE BookPage SHALL display a toast error and leave all builder fields unchanged, keeping the user in manual flow.
11. WHILE `askProjectAssistant` is processing, THE BookPage SHALL replace the AI description submit button with a loading spinner and disable it to prevent duplicate submissions.

---

### Requirement 3: Proactive AI Insights on the Client Dashboard

**User Story:** As a client, I want the dashboard to automatically surface relevant insights about my projects so that I stay informed about stalled progress, next actions, and patterns — without having to ask the AI a question.

#### Acceptance Criteria

1. THE Dashboard SHALL render a dedicated "AI Insights" card on the Overview section (`DashboardOverview`) that displays up to 3 active insights when the user has at least one project; when more than 3 insights are generated, the card SHALL display the 3 highest-priority insights ordered by severity descending (warning before info) and then by staleness descending within the same severity.
2. WHEN the dashboard loads and the user has at least one project, THE ProjectInsights_Engine SHALL compute insights automatically by calling the `generateInsights` server function with the user's current projects, milestones, and updates.
3. THE `generateInsights` server function SHALL require Supabase authentication via the `requireSupabaseAuth` middleware.
4. WHEN a milestone's `status` is `"active"` and the value of `updated_at` (or `created_at` if `updated_at` is null) is more than 7 days before the current UTC timestamp, THE `generateInsights` SHALL include a Stalled_Milestone Insight with severity `"warning"` identifying the milestone name and the number of days stalled.
5. WHEN a project's `stage` is `"in_progress"` and all of its milestones have `status` `"done"`, THE `generateInsights` SHALL include a completion-ready Insight with severity `"info"` suggesting the admin be notified for project sign-off.
6. WHEN a user has 2 or more projects and at least one project has a `stage` of `"completed"`, THE `generateInsights` SHALL include a cross-project pattern Insight with severity `"info"` stating the count of completed projects and the name of the package most frequently associated with those completed projects.
7. WHEN `generateInsights` returns insights, THE Dashboard SHALL render each Insight with an icon corresponding to its severity (`"warning"` → amber flag icon, `"info"` → sparkles icon), a title of no more than 60 characters, and the message text.
8. IF `generateInsights` returns no insights (e.g., no projects, all milestones are current), THE Dashboard SHALL NOT render the AI Insights card.
9. IF `generateInsights` fails or returns an error, THE Dashboard SHALL silently suppress the error without showing a toast or blocking the dashboard render.
10. WHILE `generateInsights` is in flight, THE Dashboard SHALL render the AI Insights card in a loading/skeleton state to communicate that insights are being computed.
11. WHEN a user dismisses an Insight by clicking its close button, THE Dashboard SHALL remove that Insight from the displayed list until the page is reloaded or the browser tab is closed, without making a server call.
12. IF the `generateInsights` server function has not responded within 10 seconds, THEN THE Dashboard SHALL hide the AI Insights card and suppress any late-arriving response.

---

### Requirement 4: AI-Powered Admin Tools

**User Story:** As an OKIKE admin, I want AI assistance in the admin panel so that I can quickly draft polished project update messages and generate structured milestone plans from a project brief — reducing manual writing effort.

#### Acceptance Criteria

##### 4A — AI Update Message Drafter

1. THE Admin_AI_Draft feature SHALL render a "Draft with AI" button adjacent to the project update message input field in the admin project detail panel (`src/routes/admin.projects.tsx`).
2. WHEN an admin clicks "Draft with AI", THE Admin_AI_Draft SHALL call the `draftProjectUpdate` server function within 30 seconds, passing the project's `title`, `stage`, `package_name`, the names and statuses of all milestones, and the last 3 project updates.
3. WHEN `draftProjectUpdate` returns a non-empty draft message, THE Admin_AI_Draft SHALL insert the draft text into the existing `newMsg` state field (the update message input), allowing the admin to edit it before posting.
4. THE `draftProjectUpdate` server function SHALL require admin-role authentication and SHALL call `ensureAdmin` before processing.
5. IF `draftProjectUpdate` fails, times out, or the AI returns an empty string, THEN THE Admin_AI_Draft SHALL display a toast error message and leave the input field unchanged.
6. WHILE `draftProjectUpdate` is processing, THE Admin_AI_Draft SHALL display a spinner inside the "Draft with AI" button and disable the button to prevent duplicate calls.

##### 4B — AI Milestone Plan Generator

7. IF a project has zero milestones, THEN THE Admin_AI_Draft feature SHALL render a "Generate Milestones with AI" button in the admin project detail panel.
8. WHEN an admin clicks "Generate Milestones with AI", THE Admin_AI_Draft SHALL call the `generateMilestonePlan` server function within 30 seconds, passing the project's linked Inquiry details (the `details` text field), `package_name`, and `stage`.
9. WHEN `generateMilestonePlan` returns a MilestonePlan, THE Admin_AI_Draft SHALL display a preview list of the suggested milestone names with "Confirm" and "Discard" buttons; clicking "Discard" SHALL dismiss the preview without inserting any records.
10. WHEN the admin clicks "Confirm" on the MilestonePlan preview, THE Admin_AI_Draft SHALL insert each milestone into the `project_milestones` table via the Supabase client with `status: "pending"` and sequential `position` values starting at 1.
11. THE `generateMilestonePlan` server function SHALL require admin-role authentication and SHALL call `ensureAdmin` before processing.
12. THE `generateMilestonePlan` server function SHALL return between 3 and 8 milestone names; IF the AI returns more than 8 items, the server function SHALL truncate the list to the first 8; IF the AI returns fewer than 3 parseable items, the server function SHALL return an error rather than inserting an incomplete plan.
13. IF `generateMilestonePlan` fails, times out, or returns an unparseable response, THEN THE Admin_AI_Draft SHALL display a toast error and leave the milestone list unchanged.

---

### Requirement 5: Autonomous AI Blog Publisher

**User Story:** As an OKIKE admin, I want a fully autonomous AI workflow that runs daily and publishes a fresh tech blog post — with cover image — so that the blog stays up to date without any manual effort. I also want to be able to trigger it manually on demand.

#### Acceptance Criteria

1. THE Admin panel content section (`src/routes/admin.content.$type.tsx` when `type === "blog_posts"`) SHALL render a "Publish AI Post" button visible only to authenticated admins.
2. WHEN an admin clicks "Publish AI Post", THE Blog_Publisher SHALL call the `publishAIBlogPost` server function with no required parameters beyond the authenticated session.
3. THE `publishAIBlogPost` server function SHALL require admin-role authentication and SHALL call `ensureAdmin` before processing when invoked from the admin UI; WHEN invoked from the daily scheduler (Requirement 5, criterion 13), the auth check SHALL be bypassed using a shared secret header instead.
4. THE `publishAIBlogPost` server function SHALL first call the OpenRouter API to select a relevant tech topic, then make a second OpenRouter API call to write a full blog post (minimum 400 words) on that topic, including a title, excerpt (1–2 sentences), body content (plain text, no markdown syntax), and 2–5 relevant tags.
5. THE `publishAIBlogPost` server function SHALL derive a URL-safe `slug` from the generated title by lowercasing, replacing spaces with hyphens, and removing all characters that are not alphanumeric or hyphens.
6. THE `publishAIBlogPost` server function SHALL generate a cover image URL by constructing a Pollinations_API URL of the form `https://image.pollinations.ai/prompt/{encoded_prompt}?width=1200&height=630&nologo=true`, where `encoded_prompt` is a `encodeURIComponent`-encoded description derived from the blog post title and topic.
7. THE `publishAIBlogPost` server function SHALL call `cmsUpsert` with `table: "blog_posts"` and a row containing: `title`, `slug`, `author: "OKIKE AI"`, `excerpt`, `content`, `image_url` (the Pollinations_API URL), `tags` (array of strings), `published: true`, and `position` set to 0 so it appears first.
8. WHEN `publishAIBlogPost` completes successfully from the admin UI, THE Blog_Publisher SHALL display a success toast containing the published post's title and slug, and SHALL re-fetch the blog posts list in the admin UI to reflect the new post.
9. IF `publishAIBlogPost` encounters any error during topic selection, writing, or database upsert, THEN THE server function SHALL return a descriptive error without inserting any row into `blog_posts`, and THE Admin panel SHALL display a toast error with that message.
10. WHILE `publishAIBlogPost` is processing from the admin UI, THE Admin panel SHALL display a spinner inside the "Publish AI Post" button with a "Publishing…" label and disable all interactive controls on the button to prevent duplicate submissions.
11. IF the `publishAIBlogPost` server function has not completed within 60 seconds, THE server function SHALL abort execution and return a timeout error, and THE Admin panel SHALL display a timeout error toast.
12. THE `publishAIBlogPost` server function SHALL check whether a `blog_posts` row with the generated `slug` already exists in Supabase before inserting; IF a conflict is found, THE server function SHALL append a numeric suffix (e.g., `-2`, `-3`) and retry up to a maximum of 10 times; IF no unique slug is found within 10 attempts, THE server function SHALL return an error without inserting.
13. THE system SHALL expose a public `/api/cron/publish-blog` HTTP endpoint that calls `publishAIBlogPost` when the request includes a valid `CRON_SECRET` header matching the `CRON_SECRET` environment variable; IF the header is missing or incorrect, THE endpoint SHALL return HTTP 401 without running the pipeline.
14. THE Cloudflare Workers deployment SHALL include a Cron Trigger configured to call `/api/cron/publish-blog` once per day at 07:00 UTC using the `wrangler.toml` `[triggers]` configuration.
15. WHEN the daily cron job runs and `publishAIBlogPost` completes successfully, THE system SHALL NOT send a toast (no browser context); errors SHALL be logged to the Cloudflare Workers runtime log and the function SHALL return an appropriate HTTP status code (200 on success, 500 on failure) so Cloudflare can report cron job health.
16. THE Admin panel content section SHALL display the timestamp of the last AI-published post (read from the `created_at` field of the most recent `blog_posts` row where `author = "OKIKE AI"`) so admins can verify the daily job ran.
