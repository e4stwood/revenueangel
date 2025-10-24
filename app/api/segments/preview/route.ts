import { NextRequest, NextResponse } from 'next/server';
import { verifyCompanyAdminAccess } from '@/lib/auth-utils';
import { previewAudienceSize } from '@/lib/segmentation';

// POST /api/segments/preview - Preview audience size for targeting rules
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, type, targetRules } = body;

    if (!companyId || !type || !targetRules) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify authentication
    const auth = await verifyCompanyAdminAccess(request, companyId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.userMessage || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Calculate audience size
    const audienceSize = await previewAudienceSize(
      companyId,
      type,
      targetRules
    );

    return NextResponse.json({
      audienceSize,
      type,
      targetRules,
    });

  } catch (error) {
    console.error('Error previewing audience:', error);
    return NextResponse.json(
      { error: 'Failed to preview audience' },
      { status: 500 }
    );
  }
}

