import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data-manager';
import { verifyCompanyAdminAccess } from '@/lib/auth-utils';

// GET /api/playbooks - List playbooks for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
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

    // Get playbooks with steps
    const playbooks = await prisma.playbook.findMany({
      where: { companyId },
      include: {
        steps: {
          include: {
            template: true,
          },
          orderBy: { order: 'asc' },
        },
        _count: {
          select: {
            sends: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ playbooks });

  } catch (error) {
    console.error('Error fetching playbooks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbooks' },
      { status: 500 }
    );
  }
}

// POST /api/playbooks - Create a new playbook
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyId, type, name, description, targetRules, steps } = body;

    if (!companyId || !type || !name) {
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

    // Create playbook
    const playbook = await prisma.playbook.create({
      data: {
        companyId,
        type,
        name,
        description,
        enabled: false,
        targetRules: targetRules || {},
        steps: steps
          ? {
              create: steps.map((step: any) => ({
                order: step.order,
                delayMinutes: step.delayMinutes,
                channel: step.channel,
                templateId: step.templateId,
                abGroup: step.abGroup || 'All',
              })),
            }
          : undefined,
      },
      include: {
        steps: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    return NextResponse.json({ playbook }, { status: 201 });

  } catch (error) {
    console.error('Error creating playbook:', error);
    return NextResponse.json(
      { error: 'Failed to create playbook' },
      { status: 500 }
    );
  }
}

