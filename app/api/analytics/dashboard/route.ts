import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data-manager';
import { verifyCompanyAdminAccess } from '@/lib/auth-utils';
import { calculateRecoveredRevenue } from '@/lib/attribution';

// GET /api/analytics/dashboard - Get dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

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

    // Parse date range
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get revenue metrics
    const revenueMetrics = await calculateRecoveredRevenue(
      companyId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    // Get send stats
    const sendStats = await prisma.send.groupBy({
      by: ['status'],
      where: {
        companyId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      _count: true,
    });

    const sends = {
      total: sendStats.reduce((sum, s) => sum + s._count, 0),
      queued: sendStats.find(s => s.status === 'queued')?._count || 0,
      sent: sendStats.find(s => s.status === 'sent')?._count || 0,
      failed: sendStats.find(s => s.status === 'failed')?._count || 0,
      skipped: sendStats.find(s => s.status === 'skipped')?._count || 0,
    };

    // Get playbook stats
    const playbooks = await prisma.playbook.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        type: true,
        enabled: true,
        _count: {
          select: {
            sends: true,
          },
        },
      },
    });

    // Get recent conversions
    const recentConversions = await prisma.conversion.findMany({
      where: {
        companyId,
        ...(Object.keys(dateFilter).length > 0 && {
          createdAt: dateFilter,
        }),
      },
      include: {
        member: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        send: {
          select: {
            playbook: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      revenue: {
        ...revenueMetrics,
        recoveredRevenue: revenueMetrics.attributedRevenueCents / 100, // Convert to dollars
      },
      sends,
      playbooks,
      recentConversions,
    });

  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

