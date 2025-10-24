# RevenueAngel - Initial Implementation Documentation

## Overview

RevenueAngel is a complete revenue automation system for Whop communities, implementing three core modules:
- **Nurture AI**: Convert leads into first-time customers
- **TierLift**: Upsell existing members to higher tiers
- **ChurnSave**: Recover failed payments and prevent cancellations

This document covers the initial implementation, architecture, and next steps for production deployment.

---

## ✅ What Has Been Implemented

### 1. Database Schema (Prisma)

**Location**: `prisma/schema.prisma`

Complete data model with 11 tables covering all RevenueAngel functionality:

#### Core Tables
- **Member** - Shadow table for Whop users with email/phone/name
- **Membership** - Active/canceled memberships with plan details and status
- **Lead** - Captured leads from various sources

#### Automation Tables
- **Playbook** - Automation sequences (nurture/upsell/churnsave)
- **PlaybookStep** - Individual steps with delays and templates
- **MessageTemplate** - AI-generated message templates with CTA
- **Send** - All outbound messages with tracking (queued/sent/failed)

#### Revenue & Analytics Tables
- **Conversion** - Revenue attribution to sends
- **WebhookEvent** - Raw Whop webhook storage
- **ExperimentAssignment** - A/B testing assignments

All tables include proper relations, indexes, and cascading deletes.

**Enums Defined**:
- `MembershipStatus`, `PlaybookType`, `Channel`, `Tone`, `SendStatus`, `ContactType`, `LeadSource`, `ABGroup`, `SubjectType`

### 2. Background Job System (pg-boss)

**Location**: `lib/job-queue.ts`, `lib/jobs/`

Implemented PostgreSQL-based job queue using pg-boss:

#### Job Types
1. **Playbook Scheduler** (`lib/jobs/scheduler.ts`)
   - Runs every minute
   - Finds enabled playbooks and evaluates target audiences
   - Creates Send records for members/leads matching criteria
   - Handles multi-step sequences with proper delays

2. **Message Dispatcher** (`lib/jobs/dispatcher.ts`)
   - Processes queued sends
   - Calls Whop notifications API
   - Updates send status and tracks external IDs
   - Includes auto-dispatch function for backup processing

3. **Webhook Processor** (`lib/jobs/webhook-processor.ts`)
   - Processes `payment.succeeded`, `payment.failed`, `membership.activated/deactivated`
   - Creates/updates members and memberships
   - Records conversions with attribution
   - Triggers churn save playbooks on payment failures

#### Background Worker
**Location**: `lib/background-worker.ts`

Standalone worker process that:
- Connects to job queue
- Registers all job handlers
- Runs auto-dispatch every 30 seconds
- Handles graceful shutdown

**Run with**: `yarn jobs` or `tsx lib/background-worker.ts`

### 3. Whop Platform Integration

**Location**: `lib/whop-*.ts`

Complete integration with Whop SDK:

#### whop-notifications.ts
- `sendPushNotification()` - Send push with CTA deep links
- `sendBatchNotifications()` - Batch sending with rate limiting
- Uses official Whop SDK for reliability

#### whop-memberships.ts
- `listCompanyMemberships()` - Fetch with filters
- `getMembershipDetails()` - Get specific membership
- `checkUserAccess()` - Validate experience access
- `calculateTenure()` - Calculate membership age in days

#### whop-payments.ts
- `retryPayment()` - Retry failed payment
- `createCheckoutSession()` - Generate checkout URLs
- `getPaymentDetails()` - Fetch payment info

### 4. Core Business Logic

#### Segmentation Engine (`lib/segmentation.ts`)
- `evaluateTargetRules()` - Check if member/lead matches playbook criteria
- Supports tenure, status, planId, experience access filters
- `previewAudienceSize()` - Calculate matching audience count

#### Attribution System (`lib/attribution.ts`)
- `recordConversion()` - Track revenue with last-touch attribution (7-day window)
- `trackSendClick()` - Mark when user clicks send deep link
- `calculateRecoveredRevenue()` - Total and attributed revenue
- `getPlaybookStats()` - Per-playbook performance metrics

#### Revenue AI Engine (`lib/revenue-ai-engine.ts`)
Built on existing OpenRouter integration:
- `generateNurtureMessage()` - First purchase sequences
- `generateUpsellMessage()` - Tier upgrade prompts
- `generateChurnSaveMessage()` - Retention offers
- `substituteVariables()` - Variable replacement in templates

Supports tones: friendly, expert, hype, minimal, custom

#### Default Playbooks (`lib/default-playbooks.ts`)
Pre-configured templates:
1. **First Purchase - 3 Step Sequence**
   - T+1h: Reminder
   - T+24h: Social proof
   - T+72h: Final incentive

2. **Upgrade to Pro**
   - Immediate: Initial pitch
   - T+48h: Follow-up with benefits

3. **Payment Failed Recovery**
   - Immediate: Update payment
   - T+24h: Downgrade/pause offer

`createDefaultPlaybooks()` - Install templates for new companies

### 5. API Endpoints

**Location**: `app/api/`

Complete REST API with authentication:

#### Playbook Management
- `GET /api/playbooks` - List playbooks for company
- `POST /api/playbooks` - Create new playbook
- `GET /api/playbooks/[id]` - Get playbook details
- `PATCH /api/playbooks/[id]` - Update playbook
- `DELETE /api/playbooks/[id]` - Delete playbook
- `POST /api/playbooks/[id]/enable` - Toggle enabled state

#### Webhooks
- `POST /api/webhooks/whop` - Receive Whop webhooks
  - Stores events, enqueues processing
  - Handles all payment and membership events

#### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
  - Recovered revenue, conversions, sends, playbook stats
- `GET /api/analytics/playbook/[id]` - Per-playbook metrics
  - Sends, clicks, conversions, click-through rate

#### Segmentation & Attribution
- `POST /api/segments/preview` - Preview audience size
- `POST /api/attribution/track-click` - Track deep link clicks

All endpoints use `verifyCompanyAdminAccess()` for authorization.

### 6. Frontend Dashboard (Basic)

**Location**: `app/company/[companyId]/`

Server-rendered pages using Next.js App Router:

#### Dashboard (`dashboard/page.tsx`)
- Quick links to Playbooks and Analytics
- Getting started guide

#### Playbooks Page (`playbooks/page.tsx`)
- List all playbooks with status
- Shows type (nurture/upsell/churnsave), steps, sends
- Enable/disable toggle
- Create new playbook button

#### Analytics Page (`analytics/page.tsx`)
- Recovered revenue metric
- Conversions and sends stats
- Playbook performance table
- Recent conversions list

All pages use Suspense for loading states and error boundaries.

---

## 📐 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Frontend   │  │   API Routes │  │   Webhooks   │      │
│  │  Dashboard   │──│  (Playbooks, │──│   Receiver   │      │
│  │              │  │   Analytics) │  │              │      │
│  └──────────────┘  └──────────────┘  └───────┬──────┘      │
└───────────────────────────────────────────────┼──────────────┘
                                                │
                    ┌───────────────────────────┼───────────────┐
                    │        pg-boss Queue      │               │
                    │  (PostgreSQL-based jobs)  │               │
                    └───────────────────────────┬───────────────┘
                                                │
        ┌───────────────────────────────────────┼───────────────────────────┐
        │              Background Worker (lib/background-worker.ts)         │
        │                                                                   │
        │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
        │  │  Scheduler   │  │  Dispatcher  │  │   Webhook    │          │
        │  │  (Every 1m)  │  │  (Batches)   │  │  Processor   │          │
        │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
        │         │                  │                  │                  │
        └─────────┼──────────────────┼──────────────────┼──────────────────┘
                  │                  │                  │
                  ▼                  ▼                  ▼
        ┌─────────────────────────────────────────────────────┐
        │           PostgreSQL Database (Prisma)              │
        │  Members, Playbooks, Sends, Conversions, etc.       │
        └─────────────────────────────────────────────────────┘
                            │
                            ▼
        ┌─────────────────────────────────────────────────────┐
        │              Whop Platform APIs                      │
        │  Notifications, Memberships, Payments, Access        │
        └─────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (Supabase recommended)
- Whop app credentials
- OpenRouter API key

### Installation

1. **Install dependencies**:
```bash
yarn install
```

2. **Configure environment** (see `.env.example`):
```bash
cp env.example .env
# Fill in:
# - DATABASE_URL and DIRECT_URL
# - WHOP_API_KEY, WHOP_AGENT_USER_ID, WHOP_APP_ID
# - OPENROUTER_API_KEY
```

3. **Run database migrations**:
```bash
yarn db:push
```

4. **Start development server**:
```bash
yarn dev
```

5. **Start background worker** (separate terminal):
```bash
yarn jobs
```

### First-Time Setup

1. **Create default playbooks** for a company:
```typescript
import { createDefaultPlaybooks } from '@/lib/default-playbooks';
await createDefaultPlaybooks('biz_your_company_id');
```

2. **Enable a playbook** via API:
```bash
POST /api/playbooks/[id]/enable
{ "enabled": true }
```

3. **Configure Whop webhooks**:
- In Whop dashboard: Settings → Webhooks
- Add endpoint: `https://your-domain.com/api/webhooks/whop`
- Subscribe to: `payment.failed`, `payment.succeeded`, `membership.activated`, `membership.deactivated`

---

## 🔧 Configuration

### Environment Variables

**Required**:
- `DATABASE_URL` - Pooled connection string
- `DIRECT_URL` - Direct connection for migrations
- `WHOP_API_KEY` - Whop app API key
- `OPENROUTER_API_KEY` - OpenRouter API key

**Optional**:
- `WHOP_AGENT_USER_ID` - Bot user ID for sending messages
- `WHOP_APP_ID` - Your Whop app ID
- `LOG_LEVEL` - debug | info | warn | error (default: info)
- `AI_RATE_LIMIT_PER_MINUTE` - AI requests per minute (default: 10)
- `MESSAGE_RATE_LIMIT_PER_MINUTE` - Message sends per minute (default: 30)
- `NEXT_PUBLIC_BASE_URL` - Base URL for API calls (default: http://localhost:3000)

### pg-boss Configuration

The job queue uses a separate `pgboss` schema in your PostgreSQL database. Configuration in `lib/job-queue.ts`:
- Retry limit: 3 attempts
- Retry delay: 5 seconds with exponential backoff
- Completed job retention: 7 days
- Archive old jobs: 30 days

---

## 📊 Database Schema Reference

### Key Relations

```
Company (1) ──┬── (N) Members
              ├── (N) Leads
              ├── (N) Playbooks
              ├── (N) MessageTemplates
              ├── (N) Sends
              ├── (N) Conversions
              └── (N) WebhookEvents

Member (1) ──┬── (N) Memberships
             ├── (N) Sends
             └── (N) Conversions

Playbook (1) ──┬── (N) PlaybookSteps
               └── (N) Sends

PlaybookStep (1) ── (1) MessageTemplate

Send (1) ──── (N) Conversions (via attributedSendId)
```

### Important Indexes

Optimized for common queries:
- `members`: `companyId`, `whopUserId`, `email`
- `memberships`: `companyId`, `memberId`, `status`, `planId`
- `sends`: `status`, `scheduledFor`, `sentAt` (for job processing)
- `conversions`: `createdAt`, `attributedSendId` (for analytics)
- `webhookEvents`: `processed`, `eventType` (for webhook processing)

---

## 🧪 Testing Guide

### Manual Testing

1. **Test Playbook Scheduler**:
```bash
# Manually trigger scheduler
POST /api/playbooks/scheduler (create this endpoint or run directly)
```

2. **Test Message Dispatch**:
```bash
# Check queued sends
SELECT * FROM sends WHERE status = 'queued' LIMIT 10;

# Manually trigger dispatcher
yarn jobs
```

3. **Test Webhooks**:
```bash
# Send test webhook
POST /api/webhooks/whop
{
  "type": "payment.succeeded",
  "company_id": "biz_xxx",
  "id": "pay_test_xxx",
  "user": { "id": "user_xxx", "email": "test@example.com" },
  "membership": { "id": "mem_xxx" },
  "final_amount": 2999
}
```

4. **Test Attribution**:
```bash
# Track click
POST /api/attribution/track-click?sendId=[uuid]

# Check attributed conversions
SELECT * FROM conversions WHERE "attributedSendId" IS NOT NULL;
```

### Database Queries for Debugging

```sql
-- Check playbook status
SELECT id, name, type, enabled, "createdAt" FROM playbooks;

-- Check recent sends
SELECT 
  s.id,
  s.status,
  s."scheduledFor",
  s."sentAt",
  p.name as playbook_name
FROM sends s
JOIN playbooks p ON s."playbookId" = p.id
ORDER BY s."createdAt" DESC
LIMIT 20;

-- Check conversion attribution
SELECT 
  c.id,
  c."revenueCents" / 100 as revenue_dollars,
  c."createdAt",
  s.id as send_id,
  p.name as playbook_name
FROM conversions c
LEFT JOIN sends s ON c."attributedSendId" = s.id
LEFT JOIN playbooks p ON s."playbookId" = p.id
ORDER BY c."createdAt" DESC;

-- Check webhook processing
SELECT 
  "eventType",
  processed,
  "receivedAt",
  "processedAt"
FROM "webhook_events"
ORDER BY "receivedAt" DESC
LIMIT 20;
```

---

## 🚨 Common Issues & Solutions

### Issue: Jobs not processing

**Symptoms**: Sends stuck in `queued` status

**Solutions**:
1. Check background worker is running: `yarn jobs`
2. Check pg-boss tables exist: `SELECT * FROM pgboss.version;`
3. Check database connection: Ensure `DIRECT_URL` is set
4. Check logs for errors in background worker

### Issue: Webhooks not processing

**Symptoms**: Webhook events marked as `processed=false`

**Solutions**:
1. Check webhook processor job handler is registered
2. Check logs: `SELECT * FROM "webhook_events" WHERE processed = false;`
3. Manually reprocess: Update `processed=false` and restart worker

### Issue: Members/Memberships not syncing

**Symptoms**: Empty members table despite active community

**Solutions**:
1. Webhooks create members automatically on `payment.succeeded`
2. Manually sync: Call Whop memberships API and create records
3. Ensure Whop webhook URL is configured correctly

### Issue: Attribution not working

**Symptoms**: Conversions created but `attributedSendId` is null

**Solutions**:
1. Ensure deep links include `sendId` parameter
2. Call `/api/attribution/track-click` when user clicks
3. Check attribution window: Default 7 days, may need adjustment

---

## 📈 Performance Optimization

### Current Optimizations
- Database indexes on frequently queried columns
- Batch processing in message dispatcher (100 sends per batch)
- Rate limiting on Whop API calls
- Exponential backoff on retries
- Cached audience evaluation results

### Recommended for Production
1. **Redis caching** for audience size previews
2. **CDN** for static assets
3. **Database connection pooling** (already using pgBouncer)
4. **Horizontal scaling** of background workers
5. **Monitoring** with Sentry/DataDog

---

## 📦 Deployment Checklist

### Pre-Deployment

- [ ] Run `yarn build` successfully
- [ ] Run `yarn type-check` with no errors
- [ ] Test all API endpoints with Postman/Thunder Client
- [ ] Verify database migrations applied: `yarn db:push`
- [ ] Set production environment variables
- [ ] Configure Whop webhook URL to production domain
- [ ] Test background worker in staging: `yarn jobs`

### Deployment Steps

1. **Deploy Next.js application** (Vercel/Railway/etc.)
2. **Deploy background worker** separately (Railway/Render/Fly.io)
   - Use `yarn jobs` as start command
   - Ensure same database and environment variables
3. **Configure Whop webhooks** to production URL
4. **Create default playbooks** for each company
5. **Monitor logs** for first 24 hours

### Post-Deployment

- [ ] Verify webhooks arriving: Check `webhook_events` table
- [ ] Verify jobs processing: Check `sends` table for sent messages
- [ ] Monitor error logs for failures
- [ ] Set up alerts for critical failures
- [ ] Document any production-specific configurations

---

## 🔮 Next Steps & Roadmap

### Immediate (Week 1-2)

1. **Enhanced UI Components**
   - Playbook creation wizard
   - Step editor with drag-drop reordering
   - Real-time message preview
   - A/B test configuration UI

2. **Message Template Editor**
   - Rich text editor for message templates
   - Variable picker/autocomplete
   - Tone selector with previews
   - Test send functionality

3. **Analytics Enhancements**
   - Time-series charts (using recharts/visx)
   - Cohort analysis
   - Funnel visualization
   - Export to CSV

### Short-Term (Month 1)

4. **Lead Capture Integration**
   - Widget for capturing leads on landing pages
   - API endpoint for lead import
   - Zapier/Make.com integration
   - CSV import UI

5. **Advanced Segmentation**
   - Visual query builder for target rules
   - Saved segments
   - Dynamic segments that update automatically
   - Segment overlap analysis

6. **A/B Testing UI**
   - Create test variants
   - Statistical significance calculator
   - Winner auto-selection
   - Test results dashboard

### Mid-Term (Month 2-3)

7. **Multi-Channel Support**
   - Email integration (SendGrid/Postmark)
   - SMS support (Twilio)
   - Forum post scheduling
   - Channel preference management

8. **Advanced Playbook Features**
   - Conditional branching (if/then logic)
   - Wait-until triggers (e.g., "wait until user opens app")
   - Playbook templates marketplace
   - Playbook cloning/versioning

9. **Revenue Intelligence**
   - Predictive churn scoring
   - Lifetime value predictions
   - Optimal send time recommendations
   - Automated incentive optimization

### Long-Term (Month 4+)

10. **Enterprise Features**
    - Multi-company management
    - Team collaboration (comments, approvals)
    - Custom branding
    - SSO integration
    - Audit logs

11. **AI Enhancements**
    - Auto-generate playbooks from goals
    - Natural language playbook creation
    - Sentiment analysis on member responses
    - Dynamic message optimization

12. **Integrations**
    - Stripe Connect for direct revenue tracking
    - Shopify for e-commerce
    - Custom webhook forwarding
    - API webhooks for external systems

---

## 🛠️ Development Guidelines

### Code Organization

```
lib/
├── job-queue.ts              # pg-boss wrapper
├── jobs/                     # Job handlers
│   ├── scheduler.ts
│   ├── dispatcher.ts
│   └── webhook-processor.ts
├── whop-*.ts                 # Whop platform services
├── segmentation.ts           # Audience targeting
├── attribution.ts            # Revenue tracking
├── revenue-ai-engine.ts      # Message generation
├── default-playbooks.ts      # Templates
└── background-worker.ts      # Main worker process

app/api/
├── playbooks/                # Playbook CRUD
├── webhooks/                 # Webhook receiver
├── analytics/                # Metrics endpoints
└── segments/                 # Audience preview

app/company/[companyId]/
├── dashboard/                # Main dashboard
├── playbooks/                # Playbook management
└── analytics/                # Analytics dashboard
```

### Best Practices

1. **Always use Prisma for database access**
2. **Add proper error handling and logging** in all async functions
3. **Use TypeScript strictly** - no `any` types without justification
4. **Test playbooks manually** before enabling for real users
5. **Monitor job queue health** - check for stuck jobs daily
6. **Validate webhook signatures** (add this in production)
7. **Rate limit all Whop API calls** to avoid hitting quotas

---

## 📚 Additional Resources

### Documentation Links

- [Whop API Docs](https://docs.whop.com)
- [pg-boss Documentation](https://github.com/timgit/pg-boss)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

### Internal Documentation

- See `README.md` for product spec and strategy
- See `prisma/schema.prisma` for complete data model
- See inline code comments for implementation details

---

## 📝 Changelog

### Initial Implementation (Current)

**Completed**:
- ✅ Complete Prisma schema with 11 models
- ✅ pg-boss job queue system
- ✅ Background worker with 3 job handlers
- ✅ Whop platform integration (notifications, memberships, payments)
- ✅ Segmentation and attribution engines
- ✅ Revenue AI engine with OpenRouter
- ✅ Default playbook templates
- ✅ Complete API endpoints with auth
- ✅ Basic frontend dashboard pages

**Pending**:
- ⏳ Webhook signature validation
- ⏳ Advanced UI components (step editor, message preview)
- ⏳ Lead capture integration
- ⏳ A/B testing UI
- ⏳ Analytics charts
- ⏳ Email/SMS channels

---

## 🙋 Support & Questions

For implementation questions or issues:

1. Check this documentation first
2. Review inline code comments
3. Check database queries above for debugging
4. Review error logs in application and worker
5. Test with manual API calls using curl/Postman

**Common Questions**:

**Q: How do I add a new playbook template?**
A: Add to `PLAYBOOK_TEMPLATES` array in `lib/default-playbooks.ts`

**Q: How do I customize message generation?**
A: Modify prompts in `lib/revenue-ai-engine.ts` - `buildNurturePrompt()`, etc.

**Q: How do I change attribution window?**
A: Update `ATTRIBUTION_WINDOW_DAYS` constant in `lib/attribution.ts`

**Q: How do I add a new webhook event type?**
A: Add case in `lib/jobs/webhook-processor.ts` `processWebhook()` function

---

**Version**: 1.0.0 (Initial Implementation)
**Last Updated**: October 24, 2025
**Status**: ✅ Complete - Ready for Testing

