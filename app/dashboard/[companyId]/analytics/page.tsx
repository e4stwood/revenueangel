import { Suspense } from 'react';
import { prisma } from '@/lib/data-manager';
import { calculateRecoveredRevenue } from '@/lib/attribution';
import { verifyUserToken } from '@whop/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  // Verify user is authenticated
  try {
    await verifyUserToken(await headers());
  } catch {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="mb-8">
          <Link 
            href={`/dashboard/${companyId}`}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Track revenue recovery, conversions, and playbook performance
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <AnalyticsContent companyId={companyId} />
        </Suspense>
      </div>
    </div>
  );
}

async function AnalyticsContent({ companyId }: { companyId: string }) {
  try {
    const revenue = await calculateRecoveredRevenue(companyId);

    const sendStats = await prisma.send.groupBy({
      by: ['status'],
      where: { companyId },
      _count: true,
    });

    const sends = {
      total: sendStats.reduce((sum: number, s: any) => sum + s._count, 0),
      queued: sendStats.find((s: any) => s.status === 'queued')?._count || 0,
      sent: sendStats.find((s: any) => s.status === 'sent')?._count || 0,
      failed: sendStats.find((s: any) => s.status === 'failed')?._count || 0,
      skipped: sendStats.find((s: any) => s.status === 'skipped')?._count || 0,
    };

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
        <div className="grid gap-6 md:grid-cols-4">
          <MetricCard
            title="Recovered Revenue"
            value={`$${(data.revenue.recoveredRevenue || 0).toFixed(2)}`}
            subtitle="From attributed sends"
            icon="💰"
            color="green"
          />
          <MetricCard
            title="Conversions"
            value={data.revenue.attributedConversionCount || 0}
            subtitle={`${data.revenue.conversionCount || 0} total`}
            icon="✅"
            color="blue"
          />
          <MetricCard
            title="Messages Sent"
            value={data.sends.sent || 0}
            subtitle={`${data.sends.total || 0} total`}
            icon="📧"
            color="purple"
          />
          <MetricCard
            title="Active Playbooks"
            value={data.playbooks.filter((p: any) => p.enabled).length}
            subtitle={`${data.playbooks.length} total`}
            icon="🎯"
            color="orange"
          />
        </div>

        {/* Playbooks Performance */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>📊</span>
            Playbook Performance
          </h2>
          <div className="space-y-4">
            {data.playbooks.map((playbook: any) => (
              <div
                key={playbook.id}
                className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{playbook.name}</h3>
                  <p className="text-sm text-gray-500 capitalize">{playbook.type}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-gray-900">{playbook._count.sends}</p>
                  <p className="text-xs text-gray-500">
                    {playbook.enabled ? (
                      <span className="text-green-600 font-medium">● Active</span>
                    ) : (
                      <span className="text-gray-400">○ Disabled</span>
                    )}
                  </p>
                </div>
              </div>
            ))}
            {data.playbooks.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-3">📋</span>
                <p className="font-medium">No playbooks created yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Conversions */}
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
            <span>🎉</span>
            Recent Conversions
          </h2>
          <div className="space-y-4">
            {data.recentConversions.map((conversion: any) => (
              <div
                key={conversion.id}
                className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:border-green-300 hover:shadow-md transition-all"
              >
                <div>
                  <p className="font-semibold text-lg text-gray-900">
                    {conversion.member?.firstName} {conversion.member?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {conversion.send?.playbook?.name || 'Direct'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl text-green-600">
                    ${(conversion.revenueCents / 100).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(conversion.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {data.recentConversions.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <span className="text-4xl block mb-3">💵</span>
                <p className="font-medium">No conversions yet</p>
                <p className="text-sm mt-2">Start by enabling a playbook!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <span className="text-4xl mb-4 block">⚠️</span>
        <p className="text-red-800 font-semibold">Failed to load analytics</p>
      </div>
    );
  }
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
}) {
  const colorClasses = {
    green: 'from-green-500 to-emerald-600',
    blue: 'from-blue-500 to-cyan-600',
    purple: 'from-purple-500 to-pink-600',
    orange: 'from-orange-500 to-red-600',
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-gray-600">{title}</h3>
      </div>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      {subtitle && (
        <p className="text-sm text-gray-500">{subtitle}</p>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded mb-4"></div>
            <div className="h-10 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

