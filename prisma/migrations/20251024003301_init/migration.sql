-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('active', 'trialing', 'canceled', 'past_due', 'paused', 'incomplete', 'incomplete_expired');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('email', 'phone', 'handle');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('whop_store', 'manual', 'import', 'api', 'capture');

-- CreateEnum
CREATE TYPE "PlaybookType" AS ENUM ('nurture', 'upsell', 'churnsave');

-- CreateEnum
CREATE TYPE "Channel" AS ENUM ('push', 'dm', 'forum', 'email');

-- CreateEnum
CREATE TYPE "ABGroup" AS ENUM ('A', 'B', 'All');

-- CreateEnum
CREATE TYPE "Tone" AS ENUM ('friendly', 'expert', 'hype', 'minimal', 'custom');

-- CreateEnum
CREATE TYPE "SendStatus" AS ENUM ('queued', 'sent', 'failed', 'skipped');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('member', 'lead');

-- CreateTable
CREATE TABLE "companies" (
    "id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "config" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experience_mappings" (
    "experienceId" VARCHAR(255) NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "experience_mappings_pkey" PRIMARY KEY ("experienceId")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "whopUserId" VARCHAR(255) NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "email" VARCHAR(500),
    "phone" VARCHAR(100),
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "firstSeenAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "memberId" UUID NOT NULL,
    "whopMembershipId" VARCHAR(255) NOT NULL,
    "productId" VARCHAR(255) NOT NULL,
    "planId" VARCHAR(255) NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'active',
    "startedAt" TIMESTAMPTZ NOT NULL,
    "currentPeriodEnd" TIMESTAMPTZ,
    "canceledAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "contact" VARCHAR(500) NOT NULL,
    "contactType" "ContactType" NOT NULL,
    "source" "LeadSource" NOT NULL,
    "consentFlags" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbooks" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "type" "PlaybookType" NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "description" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "targetRules" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "playbooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playbook_steps" (
    "id" UUID NOT NULL,
    "playbookId" UUID NOT NULL,
    "order" INTEGER NOT NULL,
    "delayMinutes" INTEGER NOT NULL,
    "channel" "Channel" NOT NULL,
    "templateId" UUID NOT NULL,
    "abGroup" "ABGroup" NOT NULL DEFAULT 'All',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "playbook_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(500) NOT NULL,
    "tone" "Tone" NOT NULL DEFAULT 'friendly',
    "body" TEXT NOT NULL,
    "ctaLabel" VARCHAR(255),
    "ctaRestPath" VARCHAR(1000),
    "ctaExternalUrl" VARCHAR(2000),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sends" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "playbookId" UUID NOT NULL,
    "stepId" UUID NOT NULL,
    "memberId" UUID,
    "leadId" UUID,
    "channel" "Channel" NOT NULL,
    "status" "SendStatus" NOT NULL DEFAULT 'queued',
    "externalId" VARCHAR(500),
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMPTZ,
    "openedAt" TIMESTAMPTZ,
    "clickedAt" TIMESTAMPTZ,
    "scheduledFor" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "sends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversions" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "memberId" UUID NOT NULL,
    "membershipId" UUID NOT NULL,
    "paymentId" VARCHAR(255) NOT NULL,
    "revenueCents" INTEGER NOT NULL,
    "attributedSendId" UUID,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "eventType" VARCHAR(255) NOT NULL,
    "raw" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processedAt" TIMESTAMPTZ,
    "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiment_assignments" (
    "id" UUID NOT NULL,
    "companyId" VARCHAR(255) NOT NULL,
    "experimentKey" VARCHAR(255) NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectId" UUID NOT NULL,
    "variant" "ABGroup" NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "experiment_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "companies_createdAt_idx" ON "companies"("createdAt");

-- CreateIndex
CREATE INDEX "experience_mappings_companyId_idx" ON "experience_mappings"("companyId");

-- CreateIndex
CREATE INDEX "members_companyId_idx" ON "members"("companyId");

-- CreateIndex
CREATE INDEX "members_whopUserId_idx" ON "members"("whopUserId");

-- CreateIndex
CREATE INDEX "members_email_idx" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_companyId_whopUserId_key" ON "members"("companyId", "whopUserId");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_whopMembershipId_key" ON "memberships"("whopMembershipId");

-- CreateIndex
CREATE INDEX "memberships_companyId_idx" ON "memberships"("companyId");

-- CreateIndex
CREATE INDEX "memberships_memberId_idx" ON "memberships"("memberId");

-- CreateIndex
CREATE INDEX "memberships_status_idx" ON "memberships"("status");

-- CreateIndex
CREATE INDEX "memberships_planId_idx" ON "memberships"("planId");

-- CreateIndex
CREATE INDEX "memberships_whopMembershipId_idx" ON "memberships"("whopMembershipId");

-- CreateIndex
CREATE INDEX "leads_companyId_idx" ON "leads"("companyId");

-- CreateIndex
CREATE INDEX "leads_source_idx" ON "leads"("source");

-- CreateIndex
CREATE UNIQUE INDEX "leads_companyId_contact_contactType_key" ON "leads"("companyId", "contact", "contactType");

-- CreateIndex
CREATE INDEX "playbooks_companyId_idx" ON "playbooks"("companyId");

-- CreateIndex
CREATE INDEX "playbooks_type_idx" ON "playbooks"("type");

-- CreateIndex
CREATE INDEX "playbooks_enabled_idx" ON "playbooks"("enabled");

-- CreateIndex
CREATE INDEX "playbook_steps_playbookId_idx" ON "playbook_steps"("playbookId");

-- CreateIndex
CREATE UNIQUE INDEX "playbook_steps_playbookId_order_key" ON "playbook_steps"("playbookId", "order");

-- CreateIndex
CREATE INDEX "message_templates_companyId_idx" ON "message_templates"("companyId");

-- CreateIndex
CREATE INDEX "sends_companyId_idx" ON "sends"("companyId");

-- CreateIndex
CREATE INDEX "sends_memberId_idx" ON "sends"("memberId");

-- CreateIndex
CREATE INDEX "sends_leadId_idx" ON "sends"("leadId");

-- CreateIndex
CREATE INDEX "sends_playbookId_idx" ON "sends"("playbookId");

-- CreateIndex
CREATE INDEX "sends_stepId_idx" ON "sends"("stepId");

-- CreateIndex
CREATE INDEX "sends_status_idx" ON "sends"("status");

-- CreateIndex
CREATE INDEX "sends_scheduledFor_idx" ON "sends"("scheduledFor");

-- CreateIndex
CREATE INDEX "sends_sentAt_idx" ON "sends"("sentAt");

-- CreateIndex
CREATE INDEX "conversions_companyId_idx" ON "conversions"("companyId");

-- CreateIndex
CREATE INDEX "conversions_memberId_idx" ON "conversions"("memberId");

-- CreateIndex
CREATE INDEX "conversions_paymentId_idx" ON "conversions"("paymentId");

-- CreateIndex
CREATE INDEX "conversions_attributedSendId_idx" ON "conversions"("attributedSendId");

-- CreateIndex
CREATE INDEX "conversions_createdAt_idx" ON "conversions"("createdAt");

-- CreateIndex
CREATE INDEX "webhook_events_companyId_idx" ON "webhook_events"("companyId");

-- CreateIndex
CREATE INDEX "webhook_events_eventType_idx" ON "webhook_events"("eventType");

-- CreateIndex
CREATE INDEX "webhook_events_processed_idx" ON "webhook_events"("processed");

-- CreateIndex
CREATE INDEX "webhook_events_receivedAt_idx" ON "webhook_events"("receivedAt");

-- CreateIndex
CREATE INDEX "experiment_assignments_companyId_idx" ON "experiment_assignments"("companyId");

-- CreateIndex
CREATE INDEX "experiment_assignments_experimentKey_idx" ON "experiment_assignments"("experimentKey");

-- CreateIndex
CREATE UNIQUE INDEX "experiment_assignments_companyId_experimentKey_subjectType__key" ON "experiment_assignments"("companyId", "experimentKey", "subjectType", "subjectId");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbooks" ADD CONSTRAINT "playbooks_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_steps" ADD CONSTRAINT "playbook_steps_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playbook_steps" ADD CONSTRAINT "playbook_steps_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "message_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_playbookId_fkey" FOREIGN KEY ("playbookId") REFERENCES "playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "playbook_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sends" ADD CONSTRAINT "sends_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversions" ADD CONSTRAINT "conversions_attributedSendId_fkey" FOREIGN KEY ("attributedSendId") REFERENCES "sends"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_member_fkey" FOREIGN KEY ("subjectId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiment_assignments" ADD CONSTRAINT "experiment_assignments_lead_fkey" FOREIGN KEY ("subjectId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
