import { Suspense } from 'react';
import { prisma } from '@/lib/data-manager';
import { calculateRecoveredRevenue } from '@/lib/attribution';

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Track revenue recovery, conversions, and playbook performance
        </p>
      </div>

      <Suspense fallback={<div>Loading analytics...</div>}>
        <AnalyticsContent companyId={companyId} />
      </Suspense>
    </div>
  );
}

async function AnalyticsContent({ companyId }: { companyId: string }) {
  try {
    // Fetch data directly from database
    const revenue = await calculateRecoveredRevenue(companyId);

    // Get send stats
    const sendStats = await prisma.send.groupBy({
      by: ['status'],
      where: { companyId },
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
      where: { companyId },
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

    const data = {
      revenue: {
        ...revenue,
        recoveredRevenue: revenue.attributedRevenueCents / 100,
      },
      sends,
      playbooks,
      recentConversions,
    };

    return (
      <div className="space-y-6">
        {/* Revenue Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Recovered Revenue"
            value={`$${(data.revenue.recoveredRevenue || 0).toFixed(2)}`}
            subtitle="From attributed sends"
            color="green"
          />
          <MetricCard
            title="Conversions"
            value={data.revenue.attributedConversionCount || 0}
            subtitle={`${data.revenue.conversionCount || 0} total`}
          />
          <MetricCard
            title="Messages Sent"
            value={data.sends.sent || 0}
            subtitle={`${data.sends.total || 0} total`}
          />
          <MetricCard
            title="Active Playbooks"
            value={data.playbooks.filter((p: any) => p.enabled).length}
            subtitle={`${data.playbooks.length} total`}
          />
        </div>

        {/* Playbooks Performance */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Playbook Performance</h2>
          <div className="space-y-3">
            {data.playbooks.map((playbook: any) => (
              <div
                key={playbook.id}
                className="flex items-center justify-between p-3 border rounded hover:bg-gray-50"
              >
                <div>
                  <h3 className="font-medium">{playbook.name}</h3>
                  <p className="text-sm text-gray-500">{playbook.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{playbook._count.sends} sends</p>
                  <p className="text-xs text-gray-500">
                    {playbook.enabled ? 'Active' : 'Disabled'}
                  </p>
                </div>
              </div>
            ))}
            {data.playbooks.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No playbooks created yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Conversions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Conversions</h2>
          <div className="space-y-3">
            {data.recentConversions.map((conversion: any) => (
              <div
                key={conversion.id}
                className="flex items-center justify-between p-3 border rounded"
              >
                <div>
                  <p className="font-medium">
                    {conversion.member?.firstName} {conversion.member?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {conversion.send?.playbook?.name || 'Direct'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    ${(conversion.revenueCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversion.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {data.recentConversions.length === 0 && (
              <p className="text-gray-500 text-center py-8">
                No conversions yet
              </p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load analytics</p>
      </div>
    );
  }
}

function MetricCard({
  title,
  value,
  subtitle,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}) {
  const colorClasses = {
    green: 'text-green-600',
    blue: 'text-blue-600',
  };

  return (
    <div className="bg-white rounded-lg border p-6">
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className={`text-3xl font-bold ${colorClasses[color as keyof typeof colorClasses] || 'text-gray-900'}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

