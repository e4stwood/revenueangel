/**
 * Whop Payments Service
 * 
 * Handles payment operations and checkout session creation.
 */

import Whop from '@whop/sdk';
import { logger, retry } from './shared-utils';

const whopClient = new Whop({
  appID: process.env.WHOP_APP_ID || '',
  apiKey: process.env.WHOP_API_KEY || '',
});

/**
 * Retry a failed payment
 */
export async function retryPayment(paymentId: string): Promise<boolean> {
  try {
    logger.info('Retrying payment', { paymentId });

    const response = await retry(async () => {
      return await whopClient.payments.retry(paymentId);
    });

    if (response) {
      logger.info('Payment retry successful', { paymentId });
      return true;
    }

    return false;

  } catch (error) {
    logger.error('Failed to retry payment', error as Error, { paymentId });
    return false;
  }
}

/**
 * Create a checkout session for a user
 */
export async function createCheckoutSession(params: {
  companyId: string;
  planId: string;
  userId?: string;
  promoCode?: string;
  metadata?: Record<string, any>;
}): Promise<string | null> {
  try {
    logger.info('Creating checkout session', {
      companyId: params.companyId,
      planId: params.planId,
    });

    // Build checkout URL (Whop handles checkout via direct links)
    const baseUrl = `https://whop.com/checkout`;
    const queryParams = new URLSearchParams({
      plan: params.planId,
      ...(params.promoCode && { promo: params.promoCode }),
      ...(params.userId && { user: params.userId }),
    });

    const checkoutUrl = `${baseUrl}?${queryParams.toString()}`;

    logger.info('Checkout session created', {
      checkoutUrl,
      planId: params.planId,
    });

    return checkoutUrl;

  } catch (error) {
    logger.error('Failed to create checkout session', error as Error, params);
    return null;
  }
}

/**
 * Get payment details
 */
export async function getPaymentDetails(paymentId: string): Promise<any | null> {
  try {
    const payment = await retry(async () => {
      return await whopClient.payments.retrieve(paymentId);
    });

    return payment || null;

  } catch (error) {
    logger.error('Failed to get payment details', error as Error, { paymentId });
    return null;
  }
}

