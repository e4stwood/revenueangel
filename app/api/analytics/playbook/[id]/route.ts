import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data-manager';
import { verifyCompanyAdminAccess } from '@/lib/auth-utils';
import { getPlaybookStats } from '@/lib/attribution';

// GET /api/analytics/playbook/[id] - Get playbook-specific metrics
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const playbook = await prisma.playbook.findUnique({
      where: { id },
      include: {
        steps: {
          include: { template: true },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playbook) {
      return NextResponse.json(
        { error: 'Playbook not found' },
        { status: 404 }
      );
    }

    // Verify authentication
    const auth = await verifyCompanyAdminAccess(request, playbook.companyId);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.userMessage || 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get playbook stats
    const stats = await getPlaybookStats(id);

    // Get sends by status
    const sendsByStatus = await prisma.send.groupBy({
      by: ['status'],
      where: { playbookId: id },
      _count: true,
    });

    // Get sends by step
    const sendsByStep = await Promise.all(
      playbook.steps.map(async (step) => {
        const sends = await prisma.send.count({
          where: {
            playbookId: id,
            stepId: step.id,
            status: 'sent',
          },
        });

        const clicks = await prisma.send.count({
          where: {
            playbookId: id,
            stepId: step.id,
            clickedAt: { not: null },
          },
        });

        return {
          stepOrder: step.order,
          stepName: step.template.name,
          sends,
          clicks,
          clickRate: sends > 0 ? (clicks / sends) * 100 : 0,
        };
      })
    );

    return NextResponse.json({
      playbook: {
        id: playbook.id,
        name: playbook.name,
        type: playbook.type,
        enabled: playbook.enabled,
      },
      stats: {
        ...stats,
        conversionRate: stats.totalSends > 0
          ? (stats.attributedConversions / stats.totalSends) * 100
          : 0,
        clickThroughRate: stats.totalSends > 0
          ? (stats.clickedSends / stats.totalSends) * 100
          : 0,
      },
      sendsByStatus: sendsByStatus.map(s => ({
        status: s.status,
        count: s._count,
      })),
      sendsByStep,
    });

  } catch (error) {
    console.error('Error fetching playbook analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playbook analytics' },
      { status: 500 }
    );
  }
}

