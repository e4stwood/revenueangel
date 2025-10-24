/**
 * Message Dispatcher Job
 * 
 * Processes queued Send records and dispatches them via Whop notifications.
 * Handles batching, rate limiting, and error handling.
 */

import { prisma } from '../data-manager';
import { logger } from '../shared-utils';
import { sendPushNotification } from '../whop-notifications';
import type { MessageDispatcherJob } from '../job-queue';

export async function processMessageDispatcher(job: MessageDispatcherJob): Promise<void> {
  const { sendIds } = job;

  try {
    logger.info('Starting message dispatcher', { sendCount: sendIds.length });

    let successCount = 0;
    let failureCount = 0;

    for (const sendId of sendIds) {
      try {
        await dispatchSingleSend(sendId);
        successCount++;

      } catch (error) {
        logger.error(`Failed to dispatch send ${sendId}`, error as Error);
        failureCount++;

        // Mark as failed
        await prisma.send.update({
          where: { id: sendId },
          data: {
            status: 'failed',
            metadata: {
              error: (error as Error).message,
            },
          },
        });
      }
    }

    logger.info('Message dispatcher completed', {
      total: sendIds.length,
      success: successCount,
      failed: failureCount,
    });

  } catch (error) {
    logger.error('Message dispatcher job failed', error as Error);
    throw error;
  }
}

async function dispatchSingleSend(sendId: string): Promise<void> {
  // Get send with related data
  const send = await prisma.send.findUnique({
    where: { id: sendId },
    include: {
      member: true,
      lead: true,
      step: {
        include: {
          template: true,
        },
      },
    },
  });

  if (!send) {
    logger.warn(`Send ${sendId} not found`);
    return;
  }

  // Check if already sent
  if (send.status === 'sent') {
    logger.debug(`Send ${sendId} already sent`);
    return;
  }

  // Check if it's time to send
  if (new Date() < send.scheduledFor) {
    logger.debug(`Send ${sendId} not yet scheduled`, {
      scheduledFor: send.scheduledFor,
    });
    return;
  }

  // Determine recipient
  const recipientUserId = send.member?.whopUserId || null;

  if (!recipientUserId) {
    logger.warn(`Send ${sendId} has no valid recipient`);
    await prisma.send.update({
      where: { id: sendId },
      data: { status: 'skipped' },
    });
    return;
  }

  // Send via Whop
  const notificationId = await sendPushNotification({
    companyId: send.companyId,
    userId: recipientUserId,
    content: send.content,
    ctaLabel: send.step.template.ctaLabel,
    ctaRestPath: send.step.template.ctaRestPath,
  });

  if (!notificationId) {
    throw new Error('Failed to send notification via Whop');
  }

  // Update send record
  await prisma.send.update({
    where: { id: sendId },
    data: {
      status: 'sent',
      sentAt: new Date(),
      externalId: notificationId,
    },
  });

  logger.info(`Send ${sendId} dispatched successfully`, {
    notificationId,
    recipient: recipientUserId,
  });
}

/**
 * Auto-dispatch job - finds due sends and dispatches them
 * Can be called independently or from a cron
 */
export async function autoDispatchDueSends(): Promise<void> {
  try {
    const now = new Date();

    // Find all queued sends that are due
    const dueSends = await prisma.send.findMany({
      where: {
        status: 'queued',
        scheduledFor: {
          lte: now,
        },
      },
      take: 100, // Batch size
      orderBy: {
        scheduledFor: 'asc',
      },
    });

    if (dueSends.length === 0) {
      logger.debug('No due sends found');
      return;
    }

    logger.info(`Found ${dueSends.length} due sends, dispatching...`);

    // Process each send
    for (const send of dueSends) {
      try {
        await dispatchSingleSend(send.id);
      } catch (error) {
        logger.error(`Failed to dispatch send ${send.id}`, error as Error);
      }
    }

  } catch (error) {
    logger.error('Auto-dispatch failed', error as Error);
    throw error;
  }
}

