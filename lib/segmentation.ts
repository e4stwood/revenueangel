/**
 * Segmentation Engine
 * 
 * Evaluates targeting rules to determine if members/leads match playbook criteria.
 */

import { logger } from './shared-utils';
import { calculateTenure } from './whop-memberships';
import { checkUserAccess } from './whop-memberships';

export interface TargetRules {
  // Member filters
  tenure?: {
    gte?: number; // Days
    lte?: number;
  };
  status?: string[]; // membership statuses
  planId?: {
    eq?: string;
    ne?: string;
    in?: string[];
    notIn?: string[];
  };
  experienceAccess?: {
    experienceId: string;
    hasAccess: boolean;
  };
  
  // Lead filters
  source?: string[];
  contactType?: string[];
  
  // Common
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface EvaluationTarget {
  type: 'member' | 'lead';
  data: any; // Member or Lead with relations
}

/**
 * Evaluate if a target matches the provided rules
 */
export async function evaluateTargetRules(
  rules: TargetRules | any,
  target: EvaluationTarget
): Promise<boolean> {
  try {
    // If no rules, match everyone
    if (!rules || Object.keys(rules).length === 0) {
      return true;
    }

    const parsedRules = typeof rules === 'string' ? JSON.parse(rules) : rules;

    if (target.type === 'member') {
      return await evaluateMemberRules(parsedRules, target.data);
    } else {
      return evaluateLeadRules(parsedRules, target.data);
    }

  } catch (error) {
    logger.error('Failed to evaluate target rules', error as Error, {
      targetType: target.type,
      rules,
    });
    return false;
  }
}

async function evaluateMemberRules(rules: TargetRules, member: any): Promise<boolean> {
  // Check tenure
  if (rules.tenure && member.memberships && member.memberships.length > 0) {
    const primaryMembership = member.memberships[0];
    const membershipData = {
      id: primaryMembership.id,
      userId: member.whopUserId,
      planId: primaryMembership.planId,
      productId: primaryMembership.productId,
      status: primaryMembership.status,
      createdAt: primaryMembership.startedAt,
    };
    
    const tenure = calculateTenure(membershipData);
    
    if (rules.tenure.gte !== undefined && tenure < rules.tenure.gte) {
      return false;
    }
    
    if (rules.tenure.lte !== undefined && tenure > rules.tenure.lte) {
      return false;
    }
  }

  // Check status
  if (rules.status && member.memberships && member.memberships.length > 0) {
    const memberStatus = member.memberships[0].status;
    if (!rules.status.includes(memberStatus)) {
      return false;
    }
  }

  // Check planId
  if (rules.planId && member.memberships && member.memberships.length > 0) {
    const memberPlanId = member.memberships[0].planId;
    
    if (rules.planId.eq && memberPlanId !== rules.planId.eq) {
      return false;
    }
    
    if (rules.planId.ne && memberPlanId === rules.planId.ne) {
      return false;
    }
    
    if (rules.planId.in && !rules.planId.in.includes(memberPlanId)) {
      return false;
    }
    
    if (rules.planId.notIn && rules.planId.notIn.includes(memberPlanId)) {
      return false;
    }
  }

  // Check experience access
  if (rules.experienceAccess) {
    const hasAccess = await checkUserAccess(
      member.whopUserId,
      rules.experienceAccess.experienceId
    );
    
    if (hasAccess !== rules.experienceAccess.hasAccess) {
      return false;
    }
  }

  // Check creation date
  if (rules.createdAfter && new Date(member.createdAt) < new Date(rules.createdAfter)) {
    return false;
  }
  
  if (rules.createdBefore && new Date(member.createdAt) > new Date(rules.createdBefore)) {
    return false;
  }

  return true;
}

function evaluateLeadRules(rules: TargetRules, lead: any): boolean {
  // Check source
  if (rules.source && !rules.source.includes(lead.source)) {
    return false;
  }

  // Check contact type
  if (rules.contactType && !rules.contactType.includes(lead.contactType)) {
    return false;
  }

  // Check creation date
  if (rules.createdAfter && new Date(lead.createdAt) < new Date(rules.createdAfter)) {
    return false;
  }
  
  if (rules.createdBefore && new Date(lead.createdAt) > new Date(rules.createdBefore)) {
    return false;
  }

  return true;
}

/**
 * Preview audience size for given rules
 */
export async function previewAudienceSize(
  companyId: string,
  type: 'member' | 'lead',
  rules: TargetRules
): Promise<number> {
  try {
    const { prisma } = await import('./data-manager');
    
    if (type === 'member') {
      const members = await prisma.member.findMany({
        where: { companyId },
        include: { memberships: true },
      });
      
      let count = 0;
      for (const member of members) {
        if (await evaluateMemberRules(rules, member)) {
          count++;
        }
      }
      return count;
      
    } else {
      const leads = await prisma.lead.findMany({
        where: { companyId },
      });
      
      let count = 0;
      for (const lead of leads) {
        if (evaluateLeadRules(rules, lead)) {
          count++;
        }
      }
      return count;
    }

  } catch (error) {
    logger.error('Failed to preview audience size', error as Error, { companyId, type });
    return 0;
  }
}

