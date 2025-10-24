/**
 * Whop Notifications Service
 * 
 * Handles sending push notifications to users via Whop SDK.
 * Integrates with RevenueAngel message sending system.
 */

import { WhopAPI } from '@whop-apps/sdk';
import { logger, retry } from './shared-utils';

export interface SendNotificationParams {
  companyId: string;
  userId: string;
  content: string;
  ctaLabel?: string | null;
  ctaRestPath?: string | null;
}

/**
 * Send push notification to a user
 * Returns the notification ID if successful, null if failed
 */
export async function sendPushNotification(params: SendNotificationParams): Promise<string | null> {
  const { companyId, userId, content, ctaLabel, ctaRestPath } = params;

  try {
    logger.debug('Sending push notification', {
      userId,
      companyId,
      contentPreview: content.substring(0, 50),
    });

    const result = await retry(async () => {
      // Build notification payload
      const notificationData: any = {
        user_id: userId,
        title: 'New Message',
        body: content,
      };

      // Add CTA if provided
      if (ctaLabel && ctaRestPath) {
        notificationData.action = {
          label: ctaLabel,
          url: ctaRestPath, // This will be a deep link within the app
        };
      }

      // Send via Whop SDK
      const response = await WhopAPI.app().POST('/app/notifications', {
        body: notificationData,
      });

      if (!response.data) {
        throw new Error('No response data from Whop notifications API');
      }

      return response.data;
    });

    if (result && (result as any).id) {
      logger.info('Push notification sent successfully', {
        notificationId: (result as any).id,
        userId,
      });
      return (result as any).id;
    }

    return null;

  } catch (error) {
    logger.error('Failed to send push notification', error as Error, {
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

