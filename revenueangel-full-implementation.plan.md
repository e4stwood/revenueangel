<!-- b753da73-a7c6-4a0d-887c-f6452f37bfc3 0a3c0cff-9e1c-4ad5-8c41-f4d8cf830330 -->
# RevenueAngel Full Implementation

## Overview

Implement complete RevenueAngel functionality with Nurture AI (lead → first purchase), TierLift (member upsell), and ChurnSave (churn prevention) modules. Build on existing patterns from the codebase including auth-utils, data-manager, ai-engine, and api-services.

## Phase 1: Database Schema & Core Models

### Update Prisma Schema

Add all revenue models to `prisma/schema.prisma`:

- **Member** - Whop user shadow table with email/phone
- **Membership** - Track active/canceled memberships with plan details
- **Lead** - Captured leads from various sources
- **Playbook** - Automation sequences (nurture/upsell/churnsave)
- **PlaybookStep** - Individual steps with delays and channels
- **MessageTemplate** - AI-generated message templates with tone/CTA
- **Send** - Track all outbound messages with status
- **Conversion** - Revenue attribution to sends
- **WebhookEvent** - Raw webhook storage with processing flags
- **ExperimentAssignment** - A/B testing assignments

All models follow spec from README lines 381-508 with proper relations, indexes, and constraints.

## Phase 2: Background Job System with pg-boss

### Install & Configure pg-boss

- Add `pg-boss` dependency
- Create `lib/job-queue.ts` with PgBoss initialization
- Set up job types: `playbook-scheduler`, `message-dispatcher`, `webhook-processor`

### Job Workers

- **Scheduler** (`lib/jobs/scheduler.ts`) - Every minute, check due playbook steps, create Send records
- **Dispatcher** (`lib/jobs/dispatcher.ts`) - Batch process queued sends, call Whop notifications API
- **Webhook Processor** (`lib/jobs/webhook-processor.ts`) - Process payment.failed/succeeded events, trigger appropriate playbooks

### Background Runner

- Create `lib/background-worker.ts` for running jobs outside Next.js
- Add npm script `"jobs": "tsx lib/background-worker.ts"` for production deployment

## Phase 3: AI Message Generation

### Revenue Message Generator

Create `lib/revenue-ai-engine.ts` building on existing `ai-engine.ts`:

- Adapt existing OpenRouter integration
- Add message generation functions:
- `generateNurtureMessage(lead, settings, step)` - First purchase sequences
- `generateUpsellMessage(member, targetPlan, settings)` - Tier upgrade prompts
- `generateChurnSaveMessage(member, reason, settings)` - Retention offers
- Use company/member context for personalization
- Variable substitution: `{{first_name}}`, `{{plan_name}}`, `{{discount}}`
- Respect tone settings from MessageTemplate

## Phase 4: Core API Endpoints

### Playbook Management

- `POST /api/playbooks` - Create new playbook
- `GET /api/playbooks` - List all playbooks for company
- `GET /api/playbooks/[id]` - Get playbook details with steps
- `PATCH /api/playbooks/[id]` - Update playbook settings
- `POST /api/playbooks/[id]/enable` - Toggle enabled state
- `POST /api/playbooks/[id]/test-send` - Send test message

### Webhook Handler

- `POST /api/webhooks/whop` - Receive Whop webhooks
- Validate signature
- Store raw payload in WebhookEvent
- Enqueue appropriate processor jobs
- Handle: `payment.failed`, `payment.succeeded`, `membership.activated`, `membership.deactivated`

### Analytics & Reporting

- `GET /api/analytics/dashboard` - Revenue metrics (recovered revenue, conversions, sends)
- `GET /api/analytics/playbook/[id]` - Per-playbook performance
- `GET /api/segments/preview` - Preview audience matching rules

### Attribution

- `POST /api/attribution/record` - Track conversion from deep link click
- Internal tracking via `restPath` with UTM-style params

## Phase 5: Whop Platform Integration

### Notifications Service

Create `lib/whop-notifications.ts`:

- `sendPushNotification(experienceId, userId, content, restPath)` - Using Whop SDK
- Deep link format: `/dashboard/[companyId]/offer/[offerId]`
- Track external notification IDs in Send records

### Membership Service  

Create `lib/whop-memberships.ts`:

- `listCompanyMemberships(companyId, filters)` - Fetch for segmentation
- `getMembershipDetails(membershipId)` - Get plan/status/tenure
- `checkAccess(userId, experienceId)` - Validate upsell eligibility
- Use existing Whop API patterns from `api-services.ts`

### Payment Service

Create `lib/whop-payments.ts`:

- `retryPayment(paymentId)` - For failed payment recovery
- `createCheckoutSession(params)` - Generate checkout links
- Helper for promo code application

## Phase 6: Frontend Dashboard UI

### Playbook Management Pages

- `app/company/[companyId]/playbooks/page.tsx` - List view with cards
- `app/company/[companyId]/playbooks/[id]/page.tsx` - Edit playbook
- `app/company/[companyId]/playbooks/new/page.tsx` - Create playbook wizard

### Analytics Dashboard

- `app/company/[companyId]/analytics/page.tsx` - Main dashboard
- Recovered revenue counter (animated)
- Conversion charts
- Top performing playbooks
- Recent sends timeline

### Playbook Components

Create in `components/playbooks/`:

- `PlaybookCard.tsx` - Display playbook with enable toggle
- `PlaybookStepEditor.tsx` - Edit step delays, messages, channels
- `MessagePreview.tsx` - Preview with variable substitution
- `AudiencePreview.tsx` - Show matching member count

Use existing Shadcn UI components and Whop theme from layout.

## Phase 7: Core Business Logic

### Segmentation Engine

Create `lib/segmentation.ts`:

- `evaluateRules(targetRules, member)` - Check if member matches playbook rules
- Rule types: tenure >= X, status in [...], plan != Y, experience access == false
- Efficient batch evaluation for scheduler

### Attribution Logic

Create `lib/attribution.ts`:

- Last-touch within 7 days (configurable)
- Track click → conversion flow via restPath params
- Calculate recovered revenue by summing attributed conversions

### Default Playbooks

Create `lib/default-playbooks.ts`:

- **First Purchase (3 steps)**: T+1h reminder, T+24h value case, T+72h incentive
- **Upgrade to Pro (2 steps)**: tenure >= 14d trigger, T+48h follow-up
- **Payment Failed (2 steps)**: Immediate retry, T+24h downgrade offer
- Auto-create on company first install

## Phase 8: Integration & Testing Helpers

### Data Seeding

- Add seed script for development: `prisma/seed.ts`
- Sample playbooks, templates, test sends

### API Client Types

- Generate TypeScript types from Prisma for frontend
- Create `lib/types.ts` with all API response interfaces

### Error Handling

- Extend existing patterns from auth-utils
- Graceful degradation when Whop APIs fail
- Retry logic for transient failures

## Phase 9: Documentation

### Create `docs/InitialImplementation.md`

Document all completed work:

- Schema overview with ER diagram (text)
- API endpoint reference with examples
- Background job architecture
- Message generation flow
- Whop integration points
- Environment variables needed
- Next steps for production deployment

### Update README

- Add quick start instructions
- Link to InitialImplementation.md
- Deployment checklist

## Key Implementation Notes

### Leverage Existing Code

- Use `verifyCompanyAdminAccess` from `auth-utils.ts` for all admin endpoints
- Extend `DataManager` class in `data-manager.ts` for playbook/send operations
- Adapt `AIEngine` patterns from `ai-engine.ts` for message generation
- Use `whopAPI` from `api-services.ts` for Whop platform calls
- Reuse `logger`, `retry`, `config` from `shared-utils.ts`

### Follow Existing Patterns

- Server Components by default, Client Components only when needed
- Route handlers in `app/api/` with proper error handling
- Prisma client usage via `dataManager.prisma`
- Environment config via `shared-utils.ts` config object

### Package Dependencies to Add

Will list at end of implementation:

- `pg-boss` - PostgreSQL-based job queue
- Any additional Whop SDK utilities needed

### Security & Permissions

- All playbook endpoints require company admin verification
- Webhook endpoint validates Whop signatures
- Rate limiting on message sends (use existing patterns)
- PII handling follows existing data-manager patterns

## Success Criteria

- ✅ All 3 modules (Nurture, TierLift, ChurnSave) functional
- ✅ Complete Prisma schema with migrations
- ✅ Background jobs processing with pg-boss
- ✅ AI message generation working with OpenRouter
- ✅ Whop webhooks receiving and processing
- ✅ Basic UI for playbook management
- ✅ Analytics dashboard showing metrics
- ✅ Documentation complete in InitialImplementation.md

### To-dos

- [ ] Extend Prisma schema with all RevenueAngel models (Member, Membership, Lead, Playbook, PlaybookStep, MessageTemplate, Send, Conversion, WebhookEvent, ExperimentAssignment)
- [ ] Create revenue-engine.ts (segmentation, attribution), message-generator.ts (OpenRouter AI), job-queue.ts (pg-boss wrapper)
- [ ] Implement playbook API routes (CRUD, enable, test-send) with auth
- [ ] Create webhook receiver and install callback endpoints
- [ ] Build analytics and segment preview API routes
- [ ] Implement scheduler, dispatcher, and webhook processor jobs with pg-boss
- [ ] Create Whop SDK integration utilities (notifications, memberships, access, checkout)
- [ ] Define default playbook templates for First Purchase, Upgrade, and Churn Save
- [ ] Build basic dashboard views for playbook management and analytics
- [ ] Update package.json with pg-boss, update env.example with job queue config
- [ ] Write InitialImplementation.md with architecture, testing guide, and next steps