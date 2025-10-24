/**
 * Default Playbooks
 * 
 * Pre-configured playbook templates that are created when a company first installs.
 */

import { prisma } from './data-manager';
import { logger } from './shared-utils';

export interface DefaultPlaybookTemplate {
  type: 'nurture' | 'upsell' | 'churnsave';
  name: string;
  description: string;
  targetRules: any;
  steps: Array<{
    order: number;
    delayMinutes: number;
    channel: 'push' | 'dm' | 'forum' | 'email';
    template: {
      name: string;
      tone: 'friendly' | 'expert' | 'hype' | 'minimal';
      body: string;
      ctaLabel: string;
      ctaRestPath: string;
    };
  }>;
}

const PLAYBOOK_TEMPLATES: DefaultPlaybookTemplate[] = [
  // First Purchase - 3 Step Nurture
  {
    type: 'nurture',
    name: 'First Purchase - 3 Step Sequence',
    description: 'Convert leads into first-time customers with automated follow-ups',
    targetRules: {
      source: ['whop_store', 'manual', 'capture'],
      createdAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
    },
    steps: [
      {
        order: 1,
        delayMinutes: 60, // 1 hour after lead capture
        channel: 'push',
        template: {
          name: 'First Purchase - Step 1 (Reminder)',
          tone: 'friendly',
          body: `Hey {{first_name}}! 👋

You checked out our community earlier. We wanted to make sure you didn't miss out.

Inside, you'll get instant access to exclusive content, our private community, and all the tools you need to succeed.

Ready to join? Click below to get started!`,
          ctaLabel: 'Join Now',
          ctaRestPath: '/offer/first-purchase',
        },
      },
      {
        order: 2,
        delayMinutes: 1440, // 24 hours
        channel: 'push',
        template: {
          name: 'First Purchase - Step 2 (Social Proof)',
          tone: 'friendly',
          body: `Hi {{first_name}},

Just wanted to share what members are saying:

"This community has completely changed how I approach my business. Best investment I've made!" - Sarah M.

Over 500+ members are already inside learning and growing together.

Don't wait - your spot is ready whenever you are.`,
          ctaLabel: 'See What\'s Inside',
          ctaRestPath: '/offer/first-purchase',
        },
      },
      {
        order: 3,
        delayMinutes: 4320, // 72 hours
        channel: 'push',
        template: {
          name: 'First Purchase - Step 3 (Final Incentive)',
          tone: 'friendly',
          body: `{{first_name}}, this is your last chance! ⏰

We're extending a special offer just for you: Join today and get your first month at 20% off.

This offer expires in 24 hours, so don't miss out.

Join hundreds of members who are already seeing results!`,
          ctaLabel: 'Claim Your Discount',
          ctaRestPath: '/offer/first-purchase-discount',
        },
      },
    ],
  },

  // Upgrade to Pro
  {
    type: 'upsell',
    name: 'Upgrade to Pro',
    description: 'Encourage engaged members to upgrade to a higher tier',
    targetRules: {
      tenure: { gte: 14 }, // At least 14 days as member
      status: ['active'],
      planId: { ne: 'pro' }, // Not already on Pro
    },
    steps: [
      {
        order: 1,
        delayMinutes: 0, // Send immediately when criteria met
        channel: 'push',
        template: {
          name: 'Upgrade - Initial Pitch',
          tone: 'expert',
          body: `Hey {{first_name}}! 🚀

We've noticed you're an active member on our {{plan_name}} plan. That's awesome!

We wanted to let you know about our Pro tier, which gives you:
• Priority support
• Advanced features & tools
• Exclusive Pro-only content
• Private coaching sessions

Many members who upgrade see 2-3x better results. Want to check it out?`,
          ctaLabel: 'See Pro Benefits',
          ctaRestPath: '/upgrade/pro',
        },
      },
      {
        order: 2,
        delayMinutes: 2880, // 48 hours
        channel: 'push',
        template: {
          name: 'Upgrade - Follow-up',
          tone: 'expert',
          body: `{{first_name}}, quick follow-up on upgrading to Pro!

Here's what you're missing with your current {{plan_name}} plan:

❌ Advanced analytics & insights
❌ 1-on-1 coaching calls
❌ Pro-only community channels
❌ Early access to new features

Upgrade now and unlock everything our Pro members get. The difference is night and day.`,
          ctaLabel: 'Upgrade Now',
          ctaRestPath: '/upgrade/pro',
        },
      },
    ],
  },

  // Payment Failed - Churn Save
  {
    type: 'churnsave',
    name: 'Payment Failed Recovery',
    description: 'Recover failed payments and prevent involuntary churn',
    targetRules: {
      status: ['past_due'],
    },
    steps: [
      {
        order: 1,
        delayMinutes: 0, // Immediate
        channel: 'push',
        template: {
          name: 'Payment Failed - Immediate',
          tone: 'friendly',
          body: `Hi {{first_name}},

We noticed your recent payment didn't go through. This can happen for many reasons - expired card, insufficient funds, or a bank decline.

Don't worry! Your access is still active for now, and you can fix this in just a few seconds.

Click below to update your payment method and we'll retry immediately.`,
          ctaLabel: 'Update Payment',
          ctaRestPath: '/account/payment/retry',
        },
      },
      {
        order: 2,
        delayMinutes: 1440, // 24 hours
        channel: 'push',
        template: {
          name: 'Payment Failed - Downgrade Offer',
          tone: 'friendly',
          body: `Hey {{first_name}},

We still haven't been able to process your payment. We don't want you to lose access!

If the current plan isn't working right now, that's okay. We have options:

• Downgrade to a lower-cost plan
• Pause your membership for up to 3 months
• Update your payment method

Let us know how we can help - we're here for you!`,
          ctaLabel: 'See Options',
          ctaRestPath: '/account/payment/options',
        },
      },
    ],
  },
];

/**
 * Create default playbooks for a company
 */
export async function createDefaultPlaybooks(companyId: string): Promise<void> {
  try {
    logger.info('Creating default playbooks', { companyId });

    for (const template of PLAYBOOK_TEMPLATES) {
      // Check if playbook already exists
      const existing = await prisma.playbook.findFirst({
        where: {
          companyId,
          name: template.name,
        },
      });

      if (existing) {
        logger.debug(`Playbook already exists: ${template.name}`);
        continue;
      }

      // Create message templates first
      const messageTemplates = await Promise.all(
        template.steps.map(async (step) => {
          return await prisma.messageTemplate.create({
            data: {
              companyId,
              name: step.template.name,
              tone: step.template.tone,
              body: step.template.body,
              ctaLabel: step.template.ctaLabel,
              ctaRestPath: step.template.ctaRestPath,
            },
          });
        })
      );

      // Create playbook with steps
      await prisma.playbook.create({
        data: {
          companyId,
          type: template.type,
          name: template.name,
          description: template.description,
          enabled: false, // Start disabled - creator can enable when ready
          targetRules: template.targetRules,
          steps: {
            create: template.steps.map((step, index) => ({
              order: step.order,
              delayMinutes: step.delayMinutes,
              channel: step.channel,
              templateId: messageTemplates[index].id,
            })),
          },
        },
      });

      logger.info(`Created playbook: ${template.name}`, { companyId });
    }

    logger.info('Default playbooks created successfully', { companyId });

  } catch (error) {
    logger.error('Failed to create default playbooks', error as Error, { companyId });
    throw error;
  }
}

/**
 * Get available playbook templates (for UI)
 */
export function getPlaybookTemplates(): DefaultPlaybookTemplate[] {
  return PLAYBOOK_TEMPLATES;
}

