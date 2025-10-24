/**
 * Whop Memberships Service
 * 
 * Handles membership data fetching and access validation.
 */

import Whop from '@whop/sdk';
import { logger, retry } from './shared-utils';

const whopClient = new Whop({
  appID: process.env.WHOP_APP_ID || '',
  apiKey: process.env.WHOP_API_KEY || '',
});

export interface MembershipData {
  id: string;
  userId: string;
  planId: string;
  productId: string;
  status: string;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * List all memberships for a company
 */
export async function listCompanyMemberships(
  companyId: string,
  filters?: {
    status?: string;
    planId?: string;
    limit?: number;
  }
): Promise<MembershipData[]> {
  try {
    logger.debug('Fetching company memberships', { companyId, filters });

    const page = await retry(async () => {
      return await whopClient.memberships.list({
        company_id: companyId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.planId && { plan_id: filters.planId }),
        ...(filters?.limit && { per: filters.limit }),
      });
    });

    const memberships: MembershipData[] = page.data.map((membership: any) => ({
      id: membership.id,
      userId: membership.user_id,
      planId: membership.plan_id,
      productId: membership.product_id,
      status: membership.status,
      createdAt: new Date(membership.created_at * 1000),
      expiresAt: membership.expires_at ? new Date(membership.expires_at * 1000) : undefined,
    }));

    logger.info('Fetched company memberships', {
      companyId,
      count: memberships.length,
    });

    return memberships;

  } catch (error) {
    logger.error('Failed to fetch company memberships', error as Error, { companyId });
    return [];
  }
}

/**
 * Get membership details
 */
export async function getMembershipDetails(membershipId: string): Promise<MembershipData | null> {
  try {
    logger.debug('Fetching membership details', { membershipId });

    const m = await retry(async () => {
      return await whopClient.memberships.retrieve(membershipId);
    });

    if (!m) {
      logger.warn('Membership not found', { membershipId });
      return null;
    }

    return {
      id: m.id,
      userId: (m as any).user_id || m.id,
      planId: (m as any).plan_id || '',
      productId: (m as any).product_id || '',
      status: m.status,
      createdAt: new Date((m as any).created_at * 1000 || Date.now()),
      expiresAt: (m as any).expires_at ? new Date((m as any).expires_at * 1000) : undefined,
    };

  } catch (error) {
    logger.error('Failed to fetch membership details', error as Error, { membershipId });
    return null;
  }
}

/**
 * Check if user has access to a specific experience
 */
export async function checkUserAccess(userId: string, experienceId: string): Promise<boolean> {
  try {
    logger.debug('Checking user access', { userId, experienceId });

    // Use SDK's checkAccess method
    const response = await retry(async () => {
      return await whopClient.users.checkAccess(experienceId, { id: userId });
    });

    const hasAccess = response?.has_access === true;

    logger.debug('User access check result', {
      userId,
      experienceId,
      hasAccess,
    });

    return hasAccess;

  } catch (error) {
    logger.error('Failed to check user access', error as Error, { userId, experienceId });
    return false;
  }
}

/**
 * Calculate membership tenure in days
 */
export function calculateTenure(membership: MembershipData): number {
  const now = new Date();
  const diffMs = now.getTime() - membership.createdAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

