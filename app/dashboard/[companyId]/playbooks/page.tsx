import { Suspense } from 'react';
import { prisma } from '@/lib/data-manager';
import { verifyUserToken } from '@whop/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function PlaybooksPage({
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
        {/* Header */}
        <div className="mb-8">
          <Link 
            href={`/dashboard/${companyId}`}
            className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Playbooks
          </h1>
          <p className="text-gray-600 text-lg">
            Automated sequences to nurture leads, upgrade members, and prevent churn
          </p>
        </div>

        <Suspense fallback={<LoadingSkeleton />}>
          <PlaybooksList companyId={companyId} />
        </Suspense>
      </div>
    </div>
  );
}

async function PlaybooksList({ companyId }: { companyId: string }) {
  try {
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

    if (playbooks.length === 0) {
      return (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">📋</span>
          </div>
          <h3 className="text-2xl font-bold mb-3 text-gray-900">No playbooks yet</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first automated sequence to start generating revenue. Choose from nurture campaigns, upsell flows, or churn prevention.
          </p>
          <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            Create Your First Playbook
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {playbooks.map((playbook: any) => (
          <PlaybookCard key={playbook.id} playbook={playbook} companyId={companyId} />
        ))}
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
        <span className="text-4xl mb-4 block">⚠️</span>
        <p className="text-red-800 font-semibold">Failed to load playbooks</p>
        <p className="text-red-600 text-sm mt-2">Please try refreshing the page</p>
      </div>
    );
  }
}

function PlaybookCard({ playbook, companyId }: { playbook: any; companyId: string }) {
  const typeConfig = {
    nurture: {
      label: 'Lead Nurture',
      color: 'bg-blue-100 text-blue-700 border-blue-200',
      icon: '🌱',
    },
    upsell: {
      label: 'Member Upsell',
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: '📈',
    },
    churnsave: {
      label: 'Churn Prevention',
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: '🛡️',
    },
  };

  const config = typeConfig[playbook.type as keyof typeof typeConfig];

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-200 p-6 hover:border-blue-400 hover:shadow-xl transition-all group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl">{config.icon}</div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
              {playbook.name}
            </h3>
            <span className={`text-xs px-3 py-1 rounded-full border ${config.color} inline-block mt-1`}>
              {config.label}
            </span>
          </div>
        </div>
        <div className={`w-4 h-4 rounded-full ${playbook.enabled ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-gray-300'}`} />
      </div>

      <p className="text-sm text-gray-600 mb-6 line-clamp-2">
        {playbook.description || 'No description provided'}
      </p>

      <div className="flex items-center justify-between text-sm mb-6 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📝</span>
          <span className="text-gray-700 font-medium">{playbook.steps?.length || 0} steps</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">📤</span>
          <span className="text-gray-700 font-medium">{playbook._count?.sends || 0} sends</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 text-sm border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all font-medium">
          View Details
        </button>
        <button 
          className={`px-4 py-2 text-sm rounded-lg font-medium transition-all ${
            playbook.enabled 
              ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
          }`}
        >
          {playbook.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-6 w-5/6"></div>
          <div className="flex gap-2">
            <div className="flex-1 h-10 bg-gray-200 rounded"></div>
            <div className="w-24 h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

