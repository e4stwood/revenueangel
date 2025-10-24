import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data-manager';
import { jobQueue } from '@/lib/job-queue';

// POST /api/webhooks/whop - Receive Whop webhooks
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Extract event type and company ID
    const eventType = payload.type || payload.event;
    const companyId = payload.company?.id || payload.company_id;

    if (!eventType || !companyId) {
      console.error('Missing event type or company ID in webhook payload');
      return NextResponse.json(
        { error: 'Invalid webhook payload' },
        { status: 400 }
      );
    }

    console.log('📥 Received webhook:', {
      eventType,
      companyId,
      payloadKeys: Object.keys(payload),
    });

    // Store webhook event
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        companyId,
        eventType,
        raw: payload,
        processed: false,
      },
    });

    // Enqueue for processing
    await jobQueue.processWebhook(
      webhookEvent.id,
      eventType,
      companyId
    );

    console.log('✅ Webhook queued for processing:', {
      webhookEventId: webhookEvent.id,
      eventType,
    });

    return NextResponse.json({
      success: true,
      webhookEventId: webhookEvent.id,
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

