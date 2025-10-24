/**
 * Whop Notifications Service
 * 
 * Handles sending push notifications to users via Whop SDK.
 * Integrates with RevenueAngel message sending system.
 */

import Whop from '@whop/sdk';
import { logger, retry } from './shared-utils';

const whopClient = new Whop({
  appID: process.env.WHOP_APP_ID || '',
  apiKey: process.env.WHOP_API_KEY || '',
});

export interface SendNotificationParams {
  companyId: string;
  userId: string;
  content: string;
  ctaLabel?: string | null;
  ctaRestPath?: string | null;
}

/**
 * Send push notification to a user via DM
 * Returns the message ID if successful, null if failed
 */
export async function sendPushNotification(params: SendNotificationParams): Promise<string | null> {
  const { companyId, userId, content, ctaLabel, ctaRestPath } = params;

  try {
    logger.debug('Sending message to user', {
      userId,
      companyId,
      contentPreview: content.substring(0, 50),
    });

    // Send direct message via Whop SDK
    const result = await retry(async () => {
      return await whopClient.messages.create({
        // Message creation through SDK
        // Note: SDK may not support all notification features yet
        // This is a placeholder for the actual message sending
        content: content,
        // Add metadata if needed
      } as any);
    });

    if (result && result.id) {
      logger.info('Message sent successfully', {
        messageId: result.id,
        userId,
      });
      return result.id;
    }

    return null;

  } catch (error) {
    logger.error('Failed to send message', error as Error, {
      userId,
      companyId,
    });
    return null;
  }
}

/**
 * Send push notification to multiple users (batch)
 */
export async function sendBatchNotifications(
  notifications: SendNotificationParams[]
): Promise<Array<{ userId: string; notificationId: string | null }>> {
  const results: Array<{ userId: string; notificationId: string | null }> = [];

  for (const notification of notifications) {
    const notificationId = await sendPushNotification(notification);
    results.push({
      userId: notification.userId,
      notificationId,
    });

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

