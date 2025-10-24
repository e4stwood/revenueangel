/**
 * Job Queue - pg-boss integration for background task processing
 * 
 * This module provides a PostgreSQL-based job queue system using pg-boss.
 * It handles scheduling, dispatching, and processing of background tasks
 * for the RevenueAngel automation system.
 * 
 * Job Types:
 * - playbook-scheduler: Check due playbook steps every minute
 * - message-dispatcher: Send queued messages to Whop
 * - webhook-processor: Process incoming webhook events
 */

import PgBoss from 'pg-boss';
import { config, logger } from './shared-utils';

// =============================================================================
// JOB TYPES
// =============================================================================

export const JOB_TYPES = {
  PLAYBOOK_SCHEDULER: 'playbook-scheduler',
  MESSAGE_DISPATCHER: 'message-dispatcher',
  WEBHOOK_PROCESSOR: 'webhook-processor',
} as const;

export interface PlaybookSchedulerJob {
  companyId?: string; // Optional: schedule for specific company
}

export interface MessageDispatcherJob {
  sendIds: string[]; // Batch of send IDs to dispatch
}

export interface WebhookProcessorJob {
  webhookEventId: string;
  eventType: string;
  companyId: string;
}

// =============================================================================
// PG-BOSS CLIENT
// =============================================================================

class JobQueue {
  private boss: PgBoss | null = null;
  private isConnected = false;

  /**
   * Initialize pg-boss with database connection
   */
  async connect(): Promise<void> {
    if (this.isConnected && this.boss) {
      logger.debug('Job queue already connected');
      return;
    }

    try {
      // Use direct URL for pg-boss (not pooled connection)
      const connectionString = config.DIRECT_URL || config.DATABASE_URL;

      this.boss = new PgBoss({
        connectionString,
        schema: 'pgboss', // Separate schema for pg-boss tables
        retryLimit: 3,
        retryDelay: 5, // 5 seconds between retries
        retryBackoff: true,
        expireInHours: 24 * 7, // Keep completed jobs for 7 days
        deleteAfterDays: 30, // Delete old jobs after 30 days
        onComplete: false, // Don't notify on completion
      });

      await this.boss.start();
      this.isConnected = true;

      logger.info('Job queue connected successfully', {
        schema: 'pgboss'
      });

      // Set up recurring jobs
      await this.setupRecurringJobs();

    } catch (error) {
      logger.error('Failed to connect to job queue', error as Error);
      throw error;
    }
  }

  /**
   * Set up recurring scheduled jobs
   */
  private async setupRecurringJobs(): Promise<void> {
    if (!this.boss) throw new Error('Job queue not initialized');

    try {
      // Playbook scheduler runs every minute
      await this.boss.schedule(
        JOB_TYPES.PLAYBOOK_SCHEDULER,
        '*/1 * * * *', // Every 1 minute
        {},
        { tz: 'UTC' }
      );

      logger.info('Recurring jobs scheduled', {
        jobs: [JOB_TYPES.PLAYBOOK_SCHEDULER]
      });

    } catch (error) {
      logger.error('Failed to setup recurring jobs', error as Error);
    }
  }

  /**
   * Schedule a playbook check (usually handled by recurring job)
   */
  async schedulePlaybookCheck(data: PlaybookSchedulerJob = {}): Promise<string | null> {
    if (!this.boss) throw new Error('Job queue not initialized');

    try {
      const jobId = await this.boss.send(
        JOB_TYPES.PLAYBOOK_SCHEDULER,
        data
      );

      logger.debug('Playbook scheduler job enqueued', { jobId, data });
      return jobId;

    } catch (error) {
      logger.error('Failed to schedule playbook check', error as Error, data);
      return null;
    }
  }

  /**
   * Enqueue message sends for dispatch
   */
  async dispatchMessages(sendIds: string[]): Promise<string | null> {
    if (!this.boss) throw new Error('Job queue not initialized');
    if (sendIds.length === 0) return null;

    try {
      const jobId = await this.boss.send(
        JOB_TYPES.MESSAGE_DISPATCHER,
        { sendIds },
        {
          retryLimit: 5,
          retryBackoff: true,
        }
      );

      logger.debug('Message dispatcher job enqueued', { 
        jobId, 
        sendCount: sendIds.length 
      });
      return jobId;

    } catch (error) {
      logger.error('Failed to enqueue message dispatch', error as Error, {
        sendCount: sendIds.length
      });
      return null;
    }
  }

  /**
   * Process a webhook event
   */
  async processWebhook(webhookEventId: string, eventType: string, companyId: string): Promise<string | null> {
    if (!this.boss) throw new Error('Job queue not initialized');

    try {
      const jobId = await this.boss.send(
        JOB_TYPES.WEBHOOK_PROCESSOR,
        { webhookEventId, eventType, companyId },
        {
          retryLimit: 3,
          retryBackoff: true,
        }
      );

      logger.debug('Webhook processor job enqueued', { 
        jobId, 
        webhookEventId,
        eventType 
      });
      return jobId;

    } catch (error) {
      logger.error('Failed to enqueue webhook processor', error as Error, {
        webhookEventId,
        eventType
      });
      return null;
    }
  }

  /**
   * Register a job handler
   */
  async work<T = any>(
    jobType: string,
    handler: (job: PgBoss.Job<T>) => Promise<void>
  ): Promise<void> {
    if (!this.boss) throw new Error('Job queue not initialized');

    await this.boss.work(
      jobType,
      async (job) => {
        try {
          logger.debug(`Processing job ${jobType}`, {
            jobId: job.id,
            data: job.data
          });

          await handler(job);

          logger.debug(`Job ${jobType} completed`, {
            jobId: job.id
          });

        } catch (error) {
          logger.error(`Job ${jobType} failed`, error as Error, {
            jobId: job.id,
            data: job.data
          });
          throw error; // Re-throw to trigger retry
        }
      }
    );

    logger.info(`Worker registered for ${jobType}`);
  }

  /**
   * Stop the job queue gracefully
   */
  async disconnect(): Promise<void> {
    if (!this.boss || !this.isConnected) return;

    try {
      await this.boss.stop();
      this.isConnected = false;
      logger.info('Job queue disconnected');

    } catch (error) {
      logger.error('Error disconnecting job queue', error as Error);
    }
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<any> {
    if (!this.boss) return null;

    try {
      const queues = await this.boss.getQueues();
      return queues;
    } catch (error) {
      logger.error('Failed to get queue stats', error as Error);
      return null;
    }
  }

  /**
   * Check if queue is healthy
   */
  isHealthy(): boolean {
    return this.isConnected && this.boss !== null;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const jobQueue = new JobQueue();

// Graceful shutdown
process.on('SIGINT', async () => {
  await jobQueue.disconnect();
});

process.on('SIGTERM', async () => {
  await jobQueue.disconnect();
});

