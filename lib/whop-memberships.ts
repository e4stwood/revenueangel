/**
 * Whop Memberships Service
 * 
 * Handles membership data fetching and access validation.
 */

import { WhopAPI } from '@whop-apps/sdk';
import { logger, retry } from './shared-utils';

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

    const response = await retry(async () => {
      return await WhopAPI.app().GET('/app/memberships', {
        params: {
          query: {
            company_id: companyId,
            ...(filters?.status && { status: filters.status }),
            ...(filters?.planId && { plan_id: filters.planId }),
            ...(filters?.limit && { per: filters.limit }),
          },
        },
      });
    });

    if (!response.data || !response.data.data) {
      logger.warn('No memberships found', { companyId });
      return [];
    }

    const memberships: MembershipData[] = response.data.data.map((m: any) => ({
      id: m.id,
      userId: m.user_id || m.user?.id,
      planId: m.plan_id,
      productId: m.product_id,
      status: m.status,
      createdAt: new Date(m.created_at * 1000),
      expiresAt: m.expires_at ? new Date(m.expires_at * 1000) : undefined,
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

    const response = await retry(async () => {
      return await WhopAPI.app().GET('/app/memberships/{id}', {
        params: {
          path: { id: membershipId },
        },
      });
    });

    if (!response.data) {
      logger.warn('Membership not found', { membershipId });
      return null;
    }

    const m = response.data;
    return {
      id: m.id,
      userId: m.user_id || m.user?.id,
      planId: m.plan_id,
      productId: m.product_id,
      status: m.status,
      createdAt: new Date(m.created_at * 1000),
      expiresAt: m.expires_at ? new Date(m.expires_at * 1000) : undefined,
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

    const response = await retry(async () => {
      return await WhopAPI.app().GET('/app/users/{id}/access/{resource_id}', {
        params: {
          path: {
            id: userId,
            resource_id: experienceId,
          },
        },
      });
    });

    if (!response.data) {
      return false;
    }

    // Check if user has any level of access
    const hasAccess = (response.data as any).has_access === true;

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

