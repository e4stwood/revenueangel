/**
 * Playbook Scheduler Job
 * 
 * Runs every minute to check for due playbook steps and create Send records.
 * This is the heart of the automation engine.
 */

import { prisma } from '../data-manager';
import { logger } from '../shared-utils';
import type { PlaybookSchedulerJob } from '../job-queue';
import { evaluateTargetRules } from '../segmentation';

export async function processPlaybookScheduler(job: PlaybookSchedulerJob): Promise<void> {
  const { companyId } = job;

  try {
    logger.info('Starting playbook scheduler', { companyId });

    // Get all enabled playbooks (optionally filtered by company)
    const playbooks = await prisma.playbook.findMany({
      where: {
        enabled: true,
        ...(companyId && { companyId }),
      },
      include: {
        steps: {
          include: {
            template: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    logger.debug(`Found ${playbooks.length} enabled playbooks`);

    let totalScheduled = 0;

    for (const playbook of playbooks) {
      try {
        const scheduled = await schedulePlaybookSends(playbook);
        totalScheduled += scheduled;

      } catch (error) {
        logger.error(`Failed to schedule playbook ${playbook.id}`, error as Error, {
          playbookId: playbook.id,
          playbookName: playbook.name,
        });
      }
    }

    logger.info('Playbook scheduler completed', {
      playbooksProcessed: playbooks.length,
      sendsScheduled: totalScheduled,
    });

  } catch (error) {
    logger.error('Playbook scheduler failed', error as Error);
    throw error;
  }
}

async function schedulePlaybookSends(playbook: any): Promise<number> {
  let scheduled = 0;
  const now = new Date();

  // Get target audience based on playbook type and rules
  let targets: Array<{ id: string; type: 'member' | 'lead' }> = [];

  if (playbook.type === 'nurture') {
    // Target leads
    const leads = await prisma.lead.findMany({
      where: {
        companyId: playbook.companyId,
      },
    });

    for (const lead of leads) {
      if (await evaluateTargetRules(playbook.targetRules, { type: 'lead', data: lead })) {
        targets.push({ id: lead.id, type: 'lead' });
      }
    }

  } else if (playbook.type === 'upsell' || playbook.type === 'churnsave') {
    // Target members
    const members = await prisma.member.findMany({
      where: {
        companyId: playbook.companyId,
      },
      include: {
        memberships: true,
      },
    });

    for (const member of members) {
      if (await evaluateTargetRules(playbook.targetRules, { type: 'member', data: member })) {
        targets.push({ id: member.id, type: 'member' });
      }
    }
  }

  // For each target, check if they need any steps scheduled
  for (const target of targets) {
    for (const step of playbook.steps) {
      // Check if this target already has this step scheduled/sent
      const existingSend = await prisma.send.findFirst({
        where: {
          playbookId: playbook.id,
          stepId: step.id,
          ...(target.type === 'member' ? { memberId: target.id } : { leadId: target.id }),
          status: { in: ['queued', 'sent'] }, // Don't re-send if already queued or sent
        },
      });

      if (existingSend) continue;

      // Check if previous step is complete (for multi-step sequences)
      if (step.order > 1) {
        const previousStepIndex = step.order - 2;
        const previousStep = playbook.steps[previousStepIndex];

        const previousSend = await prisma.send.findFirst({
          where: {
            playbookId: playbook.id,
            stepId: previousStep.id,
            ...(target.type === 'member' ? { memberId: target.id } : { leadId: target.id }),
            status: 'sent',
          },
        });

        if (!previousSend || !previousSend.sentAt) continue;

        // Calculate when this step should be sent
        const scheduledFor = new Date(previousSend.sentAt.getTime() + step.delayMinutes * 60 * 1000);

        // Only create if it's time to send
        if (scheduledFor > now) continue;
      }

      // Render message content
      const content = await renderMessageContent(step.template, target);

      // Create Send record
      const scheduledFor = step.order === 1
        ? now // First step sends immediately
        : new Date(now.getTime() + step.delayMinutes * 60 * 1000);

      await prisma.send.create({
        data: {
          companyId: playbook.companyId,
          playbookId: playbook.id,
          stepId: step.id,
          ...(target.type === 'member' ? { memberId: target.id } : { leadId: target.id }),
          channel: step.channel,
          content,
          status: 'queued',
          scheduledFor,
        },
      });

      scheduled++;
    }
  }

  return scheduled;
}

async function renderMessageContent(template: any, target: { id: string; type: 'member' | 'lead' }): Promise<string> {
  // Get target data for variable substitution
  let data: any = {};

  if (target.type === 'member') {
    const member = await prisma.member.findUnique({
      where: { id: target.id },
      include: { memberships: true },
    });
    data = {
      first_name: member?.firstName || 'there',
      email: member?.email || '',
      plan_name: member?.memberships[0]?.planId || 'member',
    };
  } else {
    const lead = await prisma.lead.findUnique({
      where: { id: target.id },
    });
    data = {
      first_name: 'there',
      contact: lead?.contact || '',
    };
  }

  // Simple variable substitution
  let content = template.body;
  for (const [key, value] of Object.entries(data)) {
    content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }

  return content;
}

