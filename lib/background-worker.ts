/**
 * Background Worker
 * 
 * Starts pg-boss and registers all job handlers.
 * Run this in production with: tsx lib/background-worker.ts
 */

import { jobQueue, JOB_TYPES } from './job-queue';
import { processPlaybookScheduler } from './jobs/scheduler';
import { processMessageDispatcher, autoDispatchDueSends } from './jobs/dispatcher';
import { processWebhook } from './jobs/webhook-processor';
import { logger } from './shared-utils';

async function startWorker() {
  try {
    logger.info('🚀 Starting RevenueAngel background worker...');

    // Connect to job queue
    await jobQueue.connect();

    // Register job handlers
    await jobQueue.work(
      JOB_TYPES.PLAYBOOK_SCHEDULER,
      async (job) => {
        await processPlaybookScheduler(job.data);
      },
      { teamSize: 1 } // Only one scheduler should run at a time
    );

    await jobQueue.work(
      JOB_TYPES.MESSAGE_DISPATCHER,
      async (job) => {
        await processMessageDispatcher(job.data);
      },
      { teamSize: 5 } // Can process multiple batches in parallel
    );

    await jobQueue.work(
      JOB_TYPES.WEBHOOK_PROCESSOR,
      async (job) => {
        await processWebhook(job.data);
      },
      { teamSize: 10 } // Can process many webhooks in parallel
    );

    logger.info('✅ Background worker started successfully');
    logger.info('Registered job handlers:', {
      handlers: Object.values(JOB_TYPES),
    });

    // Also run auto-dispatch every 30 seconds as backup
    setInterval(async () => {
      try {
        await autoDispatchDueSends();
      } catch (error) {
        logger.error('Auto-dispatch failed', error as Error);
      }
    }, 30 * 1000);

    // Keep process alive
    process.on('SIGINT', async () => {
      logger.info('🛑 Shutting down background worker...');
      await jobQueue.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('🛑 Shutting down background worker...');
      await jobQueue.disconnect();
      process.exit(0);
    });

  } catch (error) {
    logger.error('Failed to start background worker', error as Error);
    process.exit(1);
  }
}

// Start the worker
startWorker();

