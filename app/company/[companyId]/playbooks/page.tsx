import { Suspense } from 'react';
import { prisma } from '@/lib/data-manager';

export default async function PlaybooksPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Playbooks</h1>
        <p className="text-gray-600">
          Automated sequences to nurture leads, upgrade members, and prevent churn
        </p>
      </div>

      <Suspense fallback={<div>Loading playbooks...</div>}>
        <PlaybooksList companyId={companyId} />
      </Suspense>
    </div>
  );
}

async function PlaybooksList({ companyId }: { companyId: string }) {
  try {
    // Fetch playbooks directly from database
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
        <div className="bg-white rounded-lg border p-8 text-center">
          <h3 className="text-lg font-semibold mb-2">No playbooks yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first automated sequence to start generating revenue
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Create Playbook
          </button>
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {playbooks.map((playbook: any) => (
          <PlaybookCard key={playbook.id} playbook={playbook} />
        ))}
      </div>
    );
  } catch (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Failed to load playbooks</p>
      </div>
    );
  }
}

function PlaybookCard({ playbook }: { playbook: any }) {
  const typeLabels = {
    nurture: 'Lead Nurture',
    upsell: 'Member Upsell',
    churnsave: 'Churn Prevention',
  };

  const typeColors = {
    nurture: 'bg-blue-100 text-blue-800',
    upsell: 'bg-green-100 text-green-800',
    churnsave: 'bg-orange-100 text-orange-800',
  };

  return (
    <div className="bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg mb-1">{playbook.name}</h3>
          <span className={`text-xs px-2 py-1 rounded ${typeColors[playbook.type as keyof typeof typeColors]}`}>
            {typeLabels[playbook.type as keyof typeof typeLabels]}
          </span>
        </div>
        <div className={`w-3 h-3 rounded-full ${playbook.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>

      <p className="text-sm text-gray-600 mb-4">
        {playbook.description || 'No description'}
      </p>

      <div className="flex items-center justify-between text-sm">
        <div>
          <span className="text-gray-500">{playbook.steps?.length || 0} steps</span>
        </div>
        <div>
          <span className="text-gray-500">{playbook._count?.sends || 0} sends</span>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button className="flex-1 px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
          View Details
        </button>
        <button 
          className={`px-3 py-1.5 text-sm rounded ${
            playbook.enabled 
              ? 'bg-gray-200 hover:bg-gray-300' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {playbook.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

