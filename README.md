# RevenueAngel — the Whop “Revenue OS” for creators

*(Nurture leads → convert first purchase → upsell members → save churn)*

Below is a complete, build-ready plan covering strategy, features, tech, data, permissions, pricing, analytics, and GTM — optimized for Whop’s APIs/SDKs so you can ship fast and natively.

---

## Value Proposition

**“Turn every visitor and member event on Whop into revenue — automatically.”**
RevenueAngel captures leads, runs AI-personalized follow-ups, upgrades engaged members, and rescues failed payments using Whop’s native notifications, forums, checkouts, and webhooks. ([Whop Docs][1])

---

## Target Avatar

* **Who:** Mid-size Whop creators (100–2,000 members) in Trading Signals, AI Tools, Reselling, and Content.
* **Pain:** Lots of views/DMs, low conversion, little time to run proper nurturing, upgrades, and churn save flows.
* **Why current solutions fail:** Discord/email CRMs don’t sync with Whop identity, access, or payments; they can’t trigger in-app flows or 1-click Whop checkouts. RevenueAngel is native to Whop (auth, notifications, forums, payments). ([Whop Docs][2])

---

## Core Problems Solved

1. **Lost first purchases** — visitors and captured leads go cold without timely, personalized nudges.
2. **Missed upgrades** — engaged members don’t see higher tiers or bundles at the right moment.
3. **Preventable churn** — payment failures and cancellations don’t get automated save offers.

**Why Whop makes this uniquely solvable:** you can (a) verify the current user securely inside your iframe app, (b) segment by membership/plan/status, (c) react to real-time webhooks (e.g., `payment.failed`, `payment.succeeded`), and (d) send in-app push/DM and post to forums for social proof — all with official SDK/API. ([Whop Docs][2])

---

## Product Modules (v1 scope covers all three, with First-Purchase as primary)

### 1) Nurture AI (Lead → First Purchase)

* **Trigger sources:** New lead captured or store visitor who didn’t buy (creator installs RevenueAngel + enables capture; your app stores the lead or consumes lead events once available).
* **Flow:**

  * T+1h reminder → T+24h value case → T+72h incentive (optional promo).
  * All messages via **Whop push/DM** with deep links to the product/checkout.
* **Tech:** Whop user verification, notifications, and (optional) forum post for social proof (“New members welcomed today”). ([Whop Docs][2])

### 2) TierLift (Upsell Engine)

* **Segments:** tenure ≥ X days, feature-gated experience not owned, high session activity (proxied via creator signal or your tracked events), product fit tags.
* **Actions:** If `!hasAccess(experienceId)`, send targeted upgrade DM/push + optional forum announcement; link to checkout. ([Whop Docs][3])

### 3) ChurnSave (Rescue Bot)

* **Triggers:** `payment.failed`, cancel initiated, trial ending soon.
* **Actions:** DM/push with retry, downgrade, pause options; 1-click rescue checkout; optional follow-up if no action in 24h.
* **Why now:** Whop exposes payment webhooks with event types you can subscribe to in your app settings. ([Whop Docs][4])

---

## Key Features & UX

* **Playbooks Library:** “3-Step First Purchase,” “Upgrade to Pro,” “Failed Payment Save,” each with AI tone presets (friendly, expert, hype-lite).
* **One-click enable:** Creator toggles a playbook → RevenueAngel auto-creates needed forum (if wanted) and starts listening to events. ([Whop Docs][5])
* **In-app Alerts & Deep Links:** Push/DM with `[Buy Now]`, `[Upgrade]`, `[Fix Payment]` buttons that jump into the target experience or checkout. ([Whop Docs][1])
* **Live Revenue Board:** “Recovered revenue,” “Conversions,” “Upgrades,” “Saves,” with breakdown by playbook.
* **Compliance Guardrails:** Respect granted permissions; fail closed with clear notices when a permission isn’t approved. ([Whop Docs][6])

---

## Monetization Strategy

* **Free** — up to 50 nurtures/mo, 1 active playbook, basic analytics.
* **Pro ($29/mo)** — 1,000 nurtures/mo, all playbooks, promo code field, forum autogeneration, basic A/B.
* **Scale ($99/mo)** — unlimited nurtures, multi-product/experience rules, full A/B, webhooks export, Slack alerts.
* **Optional success fee:** 2–3% of recovered revenue when you initiate the checkout. (Toggleable.)

Psychology: “Set and forget.” Creators approve permissions on install, then see a live **Recovered Revenue** counter update in real time. ([Whop Docs][6])

---

## Competitive Positioning

| Alternative               | Weakness                                        | RevenueAngel advantage                                 |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------ |
| Discord bots / email CRMs | No Whop identity/payments context; off-platform | Native Whop auth, memberships, payments, notifications |
| Manual DMs                | Inconsistent, slow                              | Automated, timed, personalized sequences               |
| Generic “growth” apps     | Not actioned on Whop events                     | Full webhook + checkout loop inside Whop               |

---

## Technical Architecture (Next.js + Whop SDK)

**Frontend**

* Next.js app embedded as a **Dashboard View**: `/dashboard/[companyId](/[restPath])` for deep links (e.g., `/playbooks/upgrade`). ([Whop Docs][6])
* Shadcn UI, server components for data fetch.

**Backend**

* **Auth:** `whopSdk.verifyUserToken(headers())` to identify the current user/session. ([Whop Docs][2])
* **Notifications:** `whopSdk.notifications.sendPushNotification({ experienceId | companyTeamId, content, restPath })`. ([Whop Docs][7])
* **Forums:** `findOrCreateForum({ experienceId, name })` → `createForumPost({ experience_id, content, attachments? })`. ([Whop Docs][5])
* **Memberships:** read via **API v2/v5** to segment by plan/status/tenure and to attribute conversions. ([Whop Docs][8])
* **Webhooks:** App settings → create/list/manage inbound webhooks; subscribe to `payment.failed|pending|succeeded`, membership changes, etc. ([Whop Docs][4])
* **Payments/Checkout:** initiate Whop checkout/charges from server (creator chooses product/plan/discount). ([Whop Docs][9])

**Data Store**

* Postgres (Supabase): tables for Leads, Members (shadow table keyed by Whop user id), Playbooks, Steps, Sends, Opens/Clicks, Conversions, WebhookEvents, Experiments.

**Jobs & Scheduling**

* Queue (e.g., pg-boss or Cloud Tasks) to schedule step N at T+Δ and to retry transient failures.

**Security & Permissions**

* Request only the scopes you truly need (e.g., `member:basic:read`, `member:email:read`, `member:phone:read`, `payment:*:read`, forum/notification scopes). Users must **approve permissions** during install; your app should gracefully handle unapproved scopes with UI hints. ([Whop Docs][6])

---

## Permissions Map (by module)

* **Common:** company + experience context, user verification. ([Whop Docs][2])
* **Nurture AI:** read leads (or store via your capture), send notifications, optional forum post. ([Whop Docs][1])
* **TierLift:** read memberships (plan/status/tenure), validate access per experience, send notifications. ([Whop Docs][8])
* **ChurnSave:** payment webhooks + notifications + checkout. ([Whop Docs][6])

---

## Data Model (core tables)

* **companies**: id, name, installed_at, whop_company_id
* **members**: id, whop_user_id, email, phone, first_seen_at
* **memberships**: id, whop_membership_id, plan_id, status, started_at, canceled_at, current_period_end
* **leads**: id, contact (email/phone), source, consent_flags, created_at
* **playbooks**: id, type (`nurture|upsell|churnsave`), enabled, target_rules (JSON)
* **steps**: id, playbook_id, delay_minutes, template_id, channel (`push|dm|email|forum`)
* **sends**: id, member_id/lead_id, step_id, status, sent_at, clicked_at
* **conversions**: id, membership_id/payment_id, revenue_cents, attributed_to_send_id

---

## Event→Action Blueprints

**1) payment.failed → save flow**

* Receive webhook → write `webhook_events` → generate offer (retry → downgrade → pause) → `sendPushNotification` with deep link → if no click by T+24h, escalate with second message. ([Whop Docs][6])

**2) membership.created (or payment.succeeded) → welcome & mini-upsell**

* Welcome DM/push → optional forum “Welcome new members” post with links to starter content + Pro teaser. ([Whop Docs][10])

**3) no-access experience view (or tenure ≥ X) → upsell**

* Check access → if false, send upgrade prompt with features gained and checkout link. ([Whop Docs][3])

---

## AI Personalization (prompting strategy)

* **Inputs:** creator niche, product benefits, user state (lead/member), plan, tenure, last event, desired CTA, tone style.
* **Output:** subject + 2–3 short message variants with inline variables ({{first_name}}, {{plan_name}}, {{discount}}).
* **Safety:** never fabricate access; condition all claims on `hasAccess`.

---

## Analytics & Experimentation

* **Core KPIs:** First-Purchase Conversion %, Upgrade Rate %, Churn Save Rate %, Recovered Revenue.
* **Attribution:** last-touch by send; secondary touch (assist) tracking.
* **A/B:** randomly assign playbook step variants by member/lead id hash.
* **Dashboards:** time trends, by segment, by playbook, by message template.

---

## MVP Scope (2 weeks)

**Week 1**

* App scaffold (Next.js + Whop SDK), Dashboard View, install/permission flow. ([Whop Docs][6])
* Webhook receiver + storage for `payment.failed|succeeded`. ([Whop Docs][4])
* Notifications send (single experience target) + deep link. ([Whop Docs][1])
* Simple Playbooks editor (toggle + delays).

**Week 2**

* Nurture AI: 3-step lead sequence + checkout link.
* Basic analytics: sends, clicks, conversions (from payment/membership read). ([Whop Docs][8])
* Optional forum integration for social proof. ([Whop Docs][5])

**V2 (weeks 3–6)**

* TierLift segmentation (tenure, plan gaps).
* ChurnSave offers (retry/downgrade/pause paths).
* A/B testing and promo code insertion.
* Multi-experience routing & topics.

---

## Example Server Snippets (sketch)

* **Verify current user in a route:**
  `const { userId } = await whopSdk.verifyUserToken(headers());` ([Whop Docs][2])

* **Send a targeted push:**
  `await whopSdk.notifications.sendPushNotification({ experienceId, content, restPath: "/offers/pro" });` ([Whop Docs][7])

* **Create forum post (optional):**
  `const forum = await whopSdk.forums.findOrCreateForum({ experienceId, name: "Announcements" }); await whopSdk.forums.createForumPost({...});` ([Whop Docs][5])

* **List memberships for segmentation:** (API call to fetch plan/status/tenure) ([Whop Docs][8])

* **Register webhooks:** Dashboard → Webhooks → set URL; or programmatically via SDK endpoints. ([Whop Docs][4])

---

## Privacy, Consent, and Safety

* Request only needed scopes; clearly explain in the install prompt how data is used to increase creator revenue. Creators can re-approve or revoke in **Authorized Apps** at any time; handle missing scopes gracefully. ([Whop Docs][6])
* Respect email/phone permissions (`member:email:read`, `member:phone:read`) and fall back to in-app notifications when not granted. ([Whop Docs][6])

---

## Go-to-Market (first 10–20 paying creators)

1. **Category focus:** Trading Signals + AI Tools (highest willingness to pay for revenue lift).
2. **Offer:** Free setup + 14-day trial, public case studies with “Recovered Revenue” screenshots.
3. **Distribution:**

   * Post before/after forum templates that creators can one-click import (dogfooding the social-proof loop). ([Whop Docs][5])
   * “RevenueAngel for Whop” content on X/YouTube showing webhook→notification→checkout loops.
   * Partner with 2–3 medium creators for rev-share pilots.
4. **Land & expand:** Start with **Nurture AI**; after week 2, enable **TierLift** and **ChurnSave** toggles to upsell your own Pro/Scale plans.

---

## Why this wins

* **Natively Whop:** Uses official auth, notifications, webhooks, forums, memberships — less glue, faster time-to-value. ([Whop Docs][2])
* **Outcome-centric:** Clear “Recovered Revenue” proof drives retention.
* **Composability:** One architecture powers lead nurture, upsell, and churn save without rebuilding.

[1]: https://docs.whop.com/apps/features/send-push-notification?utm_source=chatgpt.com "Send push notification"
[2]: https://docs.whop.com/sdk/retrieve-current-user?utm_source=chatgpt.com "Retrieve current user"
[3]: https://docs.whop.com/sdk/validate-access?utm_source=chatgpt.com "Validate access"
[4]: https://docs.whop.com/apps/features/webhooks?utm_source=chatgpt.com "Webhooks"
[5]: https://docs.whop.com/apps/features/post-to-feed?utm_source=chatgpt.com "Create forum post"
[6]: https://docs.whop.com/llms-full.txt "Loading animation"
[7]: https://docs.whop.com/sdk/api/notifications/send-push-notification?utm_source=chatgpt.com "Send Push Notification"
[8]: https://docs.whop.com/api-reference/v2/memberships/list-memberships?utm_source=chatgpt.com "List Memberships"
[9]: https://docs.whop.com/apps/features/subscriptions?utm_source=chatgpt.com "Subscriptions"
[10]: https://docs.whop.com/api-reference/forum-posts/create-forum-post?utm_source=chatgpt.com "Create forum post"
[11]: https://docs.whop.com/apps/get-api-key?utm_source=chatgpt.com "Get an API key"

# Product spec — RevenueAngel (Whop “Revenue OS”)

Nurture leads → convert first purchase → upsell members → save churn, using Whop-native auth, memberships, webhooks, notifications, forums and checkouts.

* **Send push notifications with deep links:** Whop SDK supports push and `restPath` deep linking. ([docs.whop.com][1])
* **Forum-based social proof:** find/create forum, post programmatically. ([docs.whop.com][2])
* **User identity inside your app:** verify current user via SDK token. ([docs.whop.com][3])
* **Membership segmentation:** list/retrieve memberships (v2/v5). ([docs.whop.com][4])
* **Check access for targeting:** access checks in SDK examples. ([docs.whop.com][5])
* **Payments + webhooks:** payment.failed|pending|succeeded available; permissions model + API keys and install flow documented. ([docs.whop.com][6])

---

## 1) Objectives & KPIs

**Primary KPI:** First-purchase conversion rate (lead → paid).
**Secondary:** Upgrade rate (% of members moving to higher tier/bundle), Churn save rate, Recovered revenue.
**Diagnostic metrics:** sends, opens, clicks, time-to-purchase, attribution by playbook/step.

---

## 2) User Roles & Permissions

* **Creator (owner/admin):** installs app, grants permissions, configures playbooks, views analytics, triggers sends.
* **Team member:** limited settings + analytics access.
* **Member/Lead:** receives in-app push/DM; clicks deep link into Whop checkout or experience.

**Whop permissions to request at install (mark “required” unless noted):**

* Read: `member:basic:read` (+ optional `member:email:read`, `member:phone:read` for off-platform outreach), `plan:basic:read`, `access_pass:basic:read`, relevant forum/chat read if you list posts. ([docs.whop.com][6])
* Write/Actions: notifications send, forum post create, payments/checkout creation or charge user (if applicable). ([docs.whop.com][1])
* Webhooks: subscribe to payments events. ([docs.whop.com][6])

**Views:** configure a Dashboard View path like `/dashboard/[companyId](/[restPath])` for deep links. ([docs.whop.com][6])

---

## 3) Core Modules & Flows

### A) Nurture AI (Lead → First Purchase)

* **Triggers:** New lead captured (creator opt-in) or high-intent page view events you track; optional manual import.
* **Sequence template:**

  * T+1h: reminder with crisp value prop → deep link to `/dashboard/[companyId]/offer/checkout` (via `restPath`).
  * T+24h: proof + short case usage → checkout deep link.
  * T+72h: incentive (optional promo) → checkout deep link.
* **Delivery:** push notifications (primary). Fallback: forum post (if opted) for social proof (e.g., “New members welcomed”). ([docs.whop.com][1])

### B) TierLift (Upsell Engine)

* **Segments:** tenure ≥ X, no access to `experienceId` but matching usage tag, or on lower plan than recommended.
* **Gate:** `checkIfUserHasAccessToExperience` before sending. ([docs.whop.com][5])
* **Action:** push with upgrade CTA → Whop checkout (plan/bundle). Optional forum “Drop” post for social proof. ([docs.whop.com][1])

### C) ChurnSave (Rescue Bot)

* **Triggers:** `payment.failed` (involuntary), cancel-initiation (voluntary), trial ending soon. ([docs.whop.com][6])
* **Pathing:**

  * Failed payment ➊ retry link → ➋ downgrade option → ➌ pause offer.
  * Cancel ➊ feedback capture → ➋ alternative plan/discount → ➌ “pause instead?”
* **Delivery:** push with `restPath` to rescue flow; optional follow-up at T+24h if no click. ([docs.whop.com][1])

---

## 4) Functional requirements (what you will build)

### 4.1 Install & Auth

* App install page with clear permission rationale.
* On app load: verify current user via Whop SDK token; resolve `companyId` from dashboard route. ([docs.whop.com][3])

### 4.2 Playbooks UI

* Library of templates: “3-Step First Purchase,” “Upgrade to Pro,” “Failed Payment Save.”
* Per-playbook config: enable/disable, targeting rules (filters), schedule delays, incentive/promo text, CTA destinations.
* Tone/style presets: Friendly, Expert, Minimal.

### 4.3 Audience & Segmentation

* Membership filters: status, plan, tenure, experience access. (Use memberships APIs.) ([docs.whop.com][4])
* Lead sources: manual import CSV, webhook capture, API import.
* Exclusions: already upgraded, churned, opted out.

### 4.4 Message Delivery

* Push notifications with `restPath` deep linking back into your app routes (for contextual offer pages). ([docs.whop.com][1])
* Optional forum posts (announcements/“wins” roundups). ([docs.whop.com][2])
* **Reliability:** retry policy, idempotency keys, status logs.

### 4.5 Checkout & Monetization Actions

* Generate checkout sessions or charge flows the creator selects (product/plan/amount). ([docs.whop.com][5])
* Attribute conversions to playbook/step via last-touch.

### 4.6 Webhooks & Event Processing

* Subscribe to: `payment.failed`, `payment.succeeded` (+ membership created/updated if exposed in your scope). ([docs.whop.com][6])
* Store raw payloads, parse into normalized internal events; fan-out to playbooks.

### 4.7 Analytics & Experimentation

* Dashboards: Recovered revenue, Conversions, Upgrade rate, Save rate, by playbook & step.
* A/B variants per step with 50/50 randomization and per-member stickiness.
* Export CSV; filter by date range, segment, plan.

### 4.8 Compliance, Consent, and Safety

* Respect granted scopes; degrade gracefully when an optional scope is missing (e.g., email/phone).
* Clear unsubscribe/opt-out toggle per member (local list) + respect “do not contact”.

---

## 5) Non-functional requirements

* **Performance:** p95 < 300ms for dashboard reads; background sends decoupled.
* **Availability:** graceful degradation if Whop APIs rate-limit or fail.
* **Security:** store only minimal PII; encrypt at rest; rotate secrets; log access.
* **Observability:** request tracing, webhook dead-letter queue, send failure reasons, anomaly alerts.
* **Data retention:** raw webhook payloads (30–90 days), aggregates (forever), PII purge on request.

---

## 6) Data model (Prisma-ready, but here as structured spec — no code)

> Use these as **models** in your ORM. I’m listing names, fields, types, indexes, relations, and constraints so you can paste into your schema later.

### Company

* `id` (uuid, pk)
* `whop_company_id` (string, unique, indexed, e.g., `biz_xxx`)
* `installed_at` (datetime)
* `name` (string)
* Indexes: `whop_company_id`

### Member

* `id` (uuid, pk)
* `whop_user_id` (string, unique, indexed)
* `company_id` (fk → Company)
* `email` (string, nullable)
* `phone` (string, nullable)
* `first_seen_at` (datetime)
* Unique: (`company_id`, `whop_user_id`)
* Indexes: `company_id`, `whop_user_id`

### Membership

* `id` (uuid, pk)
* `company_id` (fk)
* `member_id` (fk → Member)
* `whop_membership_id` (string, unique)
* `product_id` (string)
* `plan_id` (string)
* `status` (enum: active, trialing, canceled, past_due, paused, etc.)
* `started_at` (datetime)
* `current_period_end` (datetime, nullable)
* `canceled_at` (datetime, nullable)
* Indexes: `company_id`, `member_id`, `status`, `plan_id`

### Lead

* `id` (uuid, pk)
* `company_id` (fk)
* `contact` (string)
* `contact_type` (enum: email, phone, handle)
* `source` (enum: whop_store, manual, import, api)
* `consent_flags` (json)
* `created_at` (datetime)
* Unique: (`company_id`, `contact`, `contact_type`)

### ExperienceShadow (optional cache of experiences for gating)

* `id` (uuid, pk)
* `company_id` (fk)
* `whop_experience_id` (string, unique per company)
* `name` (string)
* `created_at` (datetime)

### Playbook

* `id` (uuid, pk)
* `company_id` (fk)
* `type` (enum: nurture, upsell, churnsave)
* `name` (string)
* `enabled` (boolean)
* `target_rules` (json — DSL for filters: status in […], tenure ≥ X, experience access false, etc.)
* `created_at` (datetime), `updated_at` (datetime)

### PlaybookStep

* `id` (uuid, pk)
* `playbook_id` (fk)
* `order` (int)
* `delay_minutes` (int)
* `channel` (enum: push, dm, forum)
* `template_id` (fk → MessageTemplate)
* `ab_group` (enum: A, B, All)
* Index: (`playbook_id`, `order`)

### MessageTemplate

* `id` (uuid, pk)
* `company_id` (fk)
* `name` (string)
* `tone` (enum: friendly, expert, hype, minimal, custom)
* `body` (text with variables like `{{first_name}}`, `{{plan_name}}`)
* `cta_label` (string), `cta_rest_path` (string), `cta_external_url` (string, nullable)
* `created_at`, `updated_at`

### Send

* `id` (uuid, pk)
* `company_id` (fk)
* `playbook_id` (fk)
* `step_id` (fk)
* `member_id` (fk, nullable if lead send)
* `lead_id` (fk, nullable)
* `channel` (enum)
* `status` (enum: queued, sent, failed, skipped)
* `external_id` (string, nullable — notification/topic id)
* `sent_at`, `opened_at` (nullable), `clicked_at` (nullable)
* Indexes: `company_id`, `member_id`, `lead_id`, `playbook_id`, `step_id`, `status`

### Conversion

* `id` (uuid, pk)
* `company_id` (fk)
* `member_id` (fk)
* `membership_id` (fk)
* `payment_id` (string)
* `revenue_cents` (int)
* `attributed_send_id` (fk → Send)
* `created_at` (datetime)
* Indexes: `company_id`, `member_id`, `payment_id`, `attributed_send_id`

### WebhookEvent

* `id` (uuid, pk)
* `company_id` (fk)
* `event_type` (string, e.g., `payment.failed`)
* `raw` (jsonb)
* `received_at` (datetime)
* `processed` (boolean), `processed_at` (datetime, nullable)
* Indexes: `company_id`, `event_type`, `processed`

### ExperimentAssignment

* `id` (uuid, pk)
* `company_id` (fk)
* `experiment_key` (string)
* `subject_type` (enum: member, lead)
* `subject_id` (uuid)
* `variant` (enum: A, B)
* Unique: (`company_id`, `experiment_key`, `subject_type`, `subject_id`)

---

## 7) API surfaces you’ll implement (server)

*(These are **your** app’s endpoints; all Whop API calls happen inside them.)*

* `POST /api/install/callback` — record installation + granted scopes (if you implement an install callback).
* `POST /api/webhooks/whop` — receive `payment.failed|succeeded|…`, validate signature if provided, write `WebhookEvent`, enqueue processors. ([docs.whop.com][6])
* `POST /api/playbooks/:id/enable` — toggle.
* `POST /api/playbooks/:id/test-send` — send sample to a given member id (for QA).
* `POST /api/sends/dispatch` — internal job worker to pull due sends and call Whop Notifications API. ([docs.whop.com][1])
* `POST /api/attribution/record` — called post-checkout (if you add return tracking) to bind payment → send.
* `GET /api/segments/preview` — compute audience given rules for UX previews.
* `GET /api/analytics/*` — timeseries and breakdowns for dashboard.

---

## 8) Background jobs & scheduling

* **Scheduler**: every minute, select due `PlaybookStep`s per audience, materialize `Send` rows with `queued` status.
* **Dispatcher**: batches queued sends → Whop `sendPushNotification` → update status, external id. ([docs.whop.com][1])
* **Click/Open tracking**: if using rest paths back into your app, mark `clicked_at` on route entry.
* **Webhook processors**:

  * `payment.failed` → create save path tasks.
  * `payment.succeeded` → create welcome/mini-upsell tasks and record `Conversion`. ([docs.whop.com][6])
* **Dead-letter**: failed sends or parsing issues → `webhook_events` with `processed=false` and retry policy.

---

## 9) Third-party/Whop integrations you will call

* **Current user / verify** — identify user/company context in dashboard view. ([docs.whop.com][3])
* **Memberships (list/retrieve)** — for segmentation & attribution. ([docs.whop.com][4])
* **Access check** — decide if upsell applies. ([docs.whop.com][5])
* **Notifications** — push with `restPath`. ([docs.whop.com][1])
* **Forums** — create/find forum & post proof drops. ([docs.whop.com][2])
* **Payments/Checkout** — create checkout sessions or direct charges for conversions. ([docs.whop.com][5])

---

## 10) Offer & Message templating (LLM use)

* **Inputs:** niche, product benefits, member/lead state, plan, tenure, last event, CTA, tone.
* **Outputs:** 2–3 short variants per step with variables `{{first_name}}`, `{{plan_name}}`, `{{discount}}`, `{{deadline}}`.
* **Constraints:** never claim access; gate all offers with access check before send.

---

## 11) Analytics & attribution model

* **Attribution:** last-touch `Send` within 7 days before `payment.succeeded` (configurable).
* **Recovered revenue:** sum of `revenue_cents` for payments initiated from RevenueAngel deep links (mark by `restPath` token or metadata).
* **Experiments:** store `ExperimentAssignment`; render A/B lift and significance (simple z-test acceptable later).

---

## 12) Security, privacy, and error handling

* **PII**: store minimal, hash sensitive identifiers where feasible.
* **Permissions drift**: if creator revokes a scope, surface in UI and auto-pause affected playbooks. ([docs.whop.com][6])
* **Rate limiting**: exponential backoff on Whop API; chunk sends; preserve order per member.
* **Idempotency**: use `externalId` for notification requests; dedupe webhooks by event id if available. ([docs.whop.com][7])

---

## 13) Admin UX (creator dashboard)

* **Home:** Recovered revenue counter, top playbooks, “Sends today”, recent wins (optional forum link).
* **Playbooks:** card list → detail editor (rules, steps, messages).
* **Audience Preview:** “This playbook will target 248 members today.”
* **Experiments:** toggle A/B per step, view lift.
* **Logs:** webhooks, sends, failures, retry actions.
* **Settings:** default forum name, default `restPath` destinations, promo code text, guardrails.

---

## 14) Testing plan

* **Unit:** segmentation rules → deterministic fixtures for memberships, leads.
* **Integration:** simulate `payment.failed` webhook → verify save flow sends in order.
* **End-to-end (staging Whop company):** install app → approve permissions → fire test sends via button → validate push received with deep link → complete checkout → see conversion recorded.
* **Load:** simulate 10k sends/h with queue backpressure, verify no duplicate sends.

---

## 15) Rollout checklist

* Request permissions & create a clear “why we need this” rationale (required vs optional). ([docs.whop.com][6])
* Configure Dashboard View paths and test `restPath` deep links. ([docs.whop.com][6])
* Register webhook URL; test with payments sandbox if available; log raw payloads. ([docs.whop.com][6])
* Publish app listing copy focused on **Recovered Revenue** proof.

---

## 16) Initial playbooks (defaults you’ll ship)

* **First Purchase — 3 steps**: T+1h, T+24h, T+72h with optional incentive at step 3.
* **Upgrade — 2 steps**: tenure ≥ 14d & `!hasAccess(Pro)` → T+0 upgrade teaser; T+48h “what you’ll unlock”.
* **Churn Save — 2 steps**: `payment.failed` → immediate retry; T+24h downgrade/pause.

---

## 17) Data retention & lifecycle

* **Webhook raw JSON:** 60–90 days (configurable).
* **Sends & attribution:** permanent (for analytics), but remove PII on creator uninstall.
* **Leads:** purge on opt-out or after 12 months of inactivity.

---

## 18) What *not* to build in v1

* Off-platform email/SMS sending (unless scopes granted and you’ve confirmed deliverability stack). Stay in Whop push/DM first. ([docs.whop.com][1])
* Complex multi-touch attribution — start with last-touch.

---

## 19) Risks & mitigations

* **Permission denial:** mark some scopes optional; degrade to “best effort” (e.g., skip phone/email). ([docs.whop.com][6])
* **Notification deliverability variance:** add forum announcements as secondary proof channel. ([docs.whop.com][8])
* **Creator overwhelm:** ship with 3 proven templates and sane defaults; hide advanced toggles by default.

---

## 20) Success definition (first 30 days, per creator)

* +10–20% first-purchase conversion lift vs. baseline month.
* > 5% of active members exposed to an upgrade offer click at least once.
* Recover ≥3% of failed payments.

---

### You’re set

This spec maps directly to tasks your starter will need: models, endpoints, jobs, SDK calls, webhooks, and dashboards — all Whop-native and validated by docs. If you want, I can convert the data model above into a **Prisma schema** and a **route/job file tree** when you’re ready to paste into your repo — just say the word.

[1]: https://docs.whop.com/sdk/api/notifications/send-push-notification?utm_source=chatgpt.com "Send Push Notification"
[2]: https://docs.whop.com/sdk/api/forums/find-or-create-forum?utm_source=chatgpt.com "Find Or Create Forum"
[3]: https://docs.whop.com/sdk/retrieve-current-user?utm_source=chatgpt.com "Retrieve current user"
[4]: https://docs.whop.com/api-reference/v2/memberships/list-memberships?utm_source=chatgpt.com "List Memberships"
[5]: https://docs.whop.com/apps/features/subscriptions?utm_source=chatgpt.com "Subscriptions"
[6]: https://docs.whop.com/llms-full.txt "Loading animation"
[7]: https://docs.whop.com/api-reference/v5/apps/notifications/create-request?utm_source=chatgpt.com "Create a Notification Request"
[8]: https://docs.whop.com/sdk/api/forums/create-forum-post?utm_source=chatgpt.com "Create Forum Post"
