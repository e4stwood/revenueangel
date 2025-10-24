import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data-manager';
import { verifyCompanyAdminAccess } from '@/lib/auth-utils';

// POST /api/playbooks/[id]/enable - Toggle playbook enabled state
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'enabled must be a boolean' },
        { status: 400 }
      );
    }

    const existingPlaybook = await prisma.playbook.findUnique({
      where: { id },
    });

    if (!existingPlaybook) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    // Verify authentication
    const auth = await verifyCompanyAdminAccess(request, existingPlaybook.companyId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.userMessage || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Toggle enabled state
    const playbook = await prisma.playbook.update({
      where: { id },
      data: { enabled },
      include: {
        steps: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({
      playbook,
      message: `Playbook ${enabled ? 'enabled' : 'disabled'} successfully`,
    });

  } catch (error) {
    console.error('Error toggling playbook:', error);
    return NextResponse.json(
      { error: 'Failed to toggle playbook' },
      { status: 500 }
    );
  }
}

