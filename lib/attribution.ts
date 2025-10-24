/**
 * Attribution Logic
 * 
 * Tracks conversion attribution from sends to revenue.
 * Implements last-touch attribution within a 7-day window.
 */

import { prisma } from './data-manager';
import { logger } from './shared-utils';

const ATTRIBUTION_WINDOW_DAYS = 7;

export interface ConversionParams {
  companyId: string;
  memberId: string;
  membershipId: string;
  paymentId: string;
  revenueCents: number;
  metadata?: Record<string, any>;
}

/**
 * Record a conversion and attribute it to a send if applicable
 */
export async function recordConversion(params: ConversionParams): Promise<void> {
  try {
    logger.info('Recording conversion', {
      memberId: params.memberId,
      paymentId: params.paymentId,
      revenueCents: params.revenueCents,
    });

    // Find the most recent send to this member within attribution window
    const attributionCutoff = new Date(Date.now() - ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const recentSend = await prisma.send.findFirst({
      where: {
        memberId: params.memberId,
        companyId: params.companyId,
        status: 'sent',
        clickedAt: {
          not: null,
          gte: attributionCutoff,
        },
      },
      orderBy: {
        clickedAt: 'desc',
      },
    });

    // Create conversion record
    await prisma.conversion.create({
      data: {
        companyId: params.companyId,
        memberId: params.memberId,
        membershipId: params.membershipId,
        paymentId: params.paymentId,
        revenueCents: params.revenueCents,
        attributedSendId: recentSend?.id || null,
        metadata: params.metadata,
      },
    });

    if (recentSend) {
      logger.info('Conversion attributed to send', {
        conversionPaymentId: params.paymentId,
        sendId: recentSend.id,
        revenueCents: params.revenueCents,
      });
    } else {
      logger.info('Conversion recorded without attribution', {
        conversionPaymentId: params.paymentId,
        revenueCents: params.revenueCents,
      });
    }

  } catch (error) {
    logger.error('Failed to record conversion', error as Error, params);
    throw error;
  }
}

/**
 * Track a click on a send deep link
 */
export async function trackSendClick(sendId: string): Promise<void> {
  try {
    await prisma.send.update({
      where: { id: sendId },
      data: {
        clickedAt: new Date(),
      },
    });

    logger.info('Send click tracked', { sendId });

  } catch (error) {
    logger.error('Failed to track send click', error as Error, { sendId });
  }
}

/**
 * Calculate total recovered revenue for a company
 */
export async function calculateRecoveredRevenue(
  companyId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  totalRevenueCents: number;
  attributedRevenueCents: number;
  conversionCount: number;
  attributedConversionCount: number;
}> {
  try {
    const where: any = {
      companyId,
      ...(startDate && { createdAt: { gte: startDate } }),
      ...(endDate && { createdAt: { lte: endDate } }),
    };

    const conversions = await prisma.conversion.findMany({
      where,
    });

    const totalRevenueCents = conversions.reduce((sum, c) => sum + c.revenueCents, 0);
    const attributedRevenueCents = conversions
      .filter(c => c.attributedSendId)
      .reduce((sum, c) => sum + c.revenueCents, 0);

    const conversionCount = conversions.length;
    const attributedConversionCount = conversions.filter(c => c.attributedSendId).length;

    return {
      totalRevenueCents,
      attributedRevenueCents,
      conversionCount,
      attributedConversionCount,
    };

  } catch (error) {
    logger.error('Failed to calculate recovered revenue', error as Error, { companyId });
    return {
      totalRevenueCents: 0,
      attributedRevenueCents: 0,
      conversionCount: 0,
      attributedConversionCount: 0,
    };
  }
}

/**
 * Get conversion statistics by playbook
 */
export async function getPlaybookStats(playbookId: string): Promise<{
  totalSends: number;
  clickedSends: number;
  attributedConversions: number;
  attributedRevenueCents: number;
}> {
  try {
    const sends = await prisma.send.findMany({
      where: { playbookId },
      include: { conversions: true },
    });

    const totalSends = sends.length;
    const clickedSends = sends.filter(s => s.clickedAt).length;
    
    const attributedConversions = sends
      .flatMap(s => s.conversions)
      .length;
    
    const attributedRevenueCents = sends
      .flatMap(s => s.conversions)
      .reduce((sum, c) => sum + c.revenueCents, 0);

    return {
      totalSends,
      clickedSends,
      attributedConversions,
      attributedRevenueCents,
    };

  } catch (error) {
    logger.error('Failed to get playbook stats', error as Error, { playbookId });
    return {
      totalSends: 0,
      clickedSends: 0,
      attributedConversions: 0,
      attributedRevenueCents: 0,
    };
  }
}

