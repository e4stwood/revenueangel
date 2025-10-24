import { NextRequest, NextResponse } from 'next/server';
import { trackSendClick } from '@/lib/attribution';

// POST /api/attribution/track-click - Track when a user clicks a send link
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sendId = searchParams.get('sendId');

    if (!sendId) {
      return NextResponse.json(
        { error: 'sendId is required' },
        { status: 400 }
      );
    }

    await trackSendClick(sendId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error tracking click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}

