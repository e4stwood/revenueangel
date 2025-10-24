/**
 * Webhook Processor Job
 * 
 * Processes Whop webhook events (payment.failed, payment.succeeded, etc.)
 * and triggers appropriate playbook actions.
 */

import { prisma } from '../data-manager';
import { logger } from '../shared-utils';
import type { WebhookProcessorJob } from '../job-queue';
import { recordConversion } from '../attribution';

export async function processWebhook(job: WebhookProcessorJob): Promise<void> {
  const { webhookEventId, eventType, companyId } = job;

  try {
    logger.info('Processing webhook event', { webhookEventId, eventType });

    // Get webhook event
    const event = await prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
    });

    if (!event) {
      logger.warn(`Webhook event ${webhookEventId} not found`);
      return;
    }

    // Check if already processed
    if (event.processed) {
      logger.debug(`Webhook event ${webhookEventId} already processed`);
      return;
    }

    // Process based on event type
    switch (eventType) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(event);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event);
        break;

      case 'membership.activated':
        await handleMembershipActivated(event);
        break;

      case 'membership.deactivated':
        await handleMembershipDeactivated(event);
        break;

      default:
        logger.warn(`Unknown webhook event type: ${eventType}`);
    }

    // Mark as processed
    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        processed: true,
        processedAt: new Date(),
      },
    });

    logger.info('Webhook event processed', { webhookEventId, eventType });

  } catch (error) {
    logger.error('Webhook processing failed', error as Error, {
      webhookEventId,
      eventType,
    });
    throw error;
  }
}

async function handlePaymentSucceeded(event: any): Promise<void> {
  const payload = event.raw as any;
  
  // Extract payment data
  const paymentId = payload.id;
  const userId = payload.user?.id;
  const amount = payload.final_amount;
  const membershipId = payload.membership?.id;

  if (!userId || !membershipId) {
    logger.warn('Payment succeeded event missing required data', { paymentId });
    return;
  }

  // Find or create member
  const member = await prisma.member.upsert({
    where: {
      companyId_whopUserId: {
        companyId: event.companyId,
        whopUserId: userId,
      },
    },
    create: {
      companyId: event.companyId,
      whopUserId: userId,
      email: payload.user?.email,
      firstName: payload.user?.name?.split(' ')[0],
      lastName: payload.user?.name?.split(' ').slice(1).join(' '),
    },
    update: {},
  });

  // Find or create membership
  const membership = await prisma.membership.upsert({
    where: {
      whopMembershipId: membershipId,
    },
    create: {
      companyId: event.companyId,
      memberId: member.id,
      whopMembershipId: membershipId,
      productId: payload.product?.id || 'unknown',
      planId: payload.plan?.id || 'unknown',
      status: 'active',
      startedAt: new Date(),
    },
    update: {
      status: 'active',
    },
  });

  // Record conversion (check for attribution)
  await recordConversion({
    companyId: event.companyId,
    memberId: member.id,
    membershipId: membership.id,
    paymentId,
    revenueCents: amount || 0,
  });

  logger.info('Payment succeeded processed', {
    paymentId,
    memberId: member.id,
    membershipId: membership.id,
  });
}

async function handlePaymentFailed(event: any): Promise<void> {
  const payload = event.raw as any;
  
  const userId = payload.user?.id;
  const membershipId = payload.membership?.id;

  if (!userId || !membershipId) {
    logger.warn('Payment failed event missing required data');
    return;
  }

  // Find member
  const member = await prisma.member.findFirst({
    where: {
      companyId: event.companyId,
      whopUserId: userId,
    },
  });

  if (!member) {
    logger.warn('Member not found for payment failed event', { userId });
    return;
  }

  // Trigger churn save playbook
  const churnPlaybooks = await prisma.playbook.findMany({
    where: {
      companyId: event.companyId,
      type: 'churnsave',
      enabled: true,
    },
    include: {
      steps: {
        include: { template: true },
        orderBy: { order: 'asc' },
      },
    },
  });

  for (const playbook of churnPlaybooks) {
    // Check if member already in this playbook
    const existingSend = await prisma.send.findFirst({
      where: {
        playbookId: playbook.id,
        memberId: member.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Within last 7 days
        },
      },
    });

    if (existingSend) continue;

    // Create send for first step
    const firstStep = playbook.steps[0];
    if (!firstStep) continue;

    await prisma.send.create({
      data: {
        companyId: event.companyId,
        playbookId: playbook.id,
        stepId: firstStep.id,
        memberId: member.id,
        channel: firstStep.channel,
        content: firstStep.template.body, // TODO: Render with variables
        status: 'queued',
        scheduledFor: new Date(), // Send immediately
      },
    });

    logger.info('Churn save playbook triggered', {
      playbookId: playbook.id,
      memberId: member.id,
    });
  }
}

async function handleMembershipActivated(event: any): Promise<void> {
  const payload = event.raw as any;
  
  const membershipId = payload.id;
  const userId = payload.user?.id;

  if (!userId || !membershipId) {
    logger.warn('Membership activated event missing required data');
    return;
  }

  // Find or create member
  const member = await prisma.member.upsert({
    where: {
      companyId_whopUserId: {
        companyId: event.companyId,
        whopUserId: userId,
      },
    },
    create: {
      companyId: event.companyId,
      whopUserId: userId,
    },
    update: {},
  });

  // Update membership status
  await prisma.membership.upsert({
    where: {
      whopMembershipId: membershipId,
    },
    create: {
      companyId: event.companyId,
      memberId: member.id,
      whopMembershipId: membershipId,
      productId: payload.product?.id || 'unknown',
      planId: payload.plan?.id || 'unknown',
      status: 'active',
      startedAt: new Date(),
    },
    update: {
      status: 'active',
    },
  });

  logger.info('Membership activated processed', { membershipId, memberId: member.id });
}

async function handleMembershipDeactivated(event: any): Promise<void> {
  const payload = event.raw as any;
  
  const membershipId = payload.id;

  if (!membershipId) {
    logger.warn('Membership deactivated event missing required data');
    return;
  }

  // Update membership status
  await prisma.membership.update({
    where: {
      whopMembershipId: membershipId,
    },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  logger.info('Membership deactivated processed', { membershipId });
}

