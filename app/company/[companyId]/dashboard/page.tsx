import Link from 'next/link';

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">RevenueAngel Dashboard</h1>
        <p className="text-gray-600">
          Automated revenue recovery for your Whop community
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions */}
        <Link
          href={`/company/${companyId}/playbooks`}
          className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📋</span>
            </div>
            <h2 className="text-xl font-semibold">Playbooks</h2>
          </div>
          <p className="text-gray-600">
            Manage your automated revenue sequences
          </p>
        </Link>

        <Link
          href={`/company/${companyId}/analytics`}
          className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-xl font-semibold">Analytics</h2>
          </div>
          <p className="text-gray-600">
            View revenue metrics and performance data
          </p>
        </Link>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">⚙️</span>
            </div>
            <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <p className="text-gray-600">
            Configure your RevenueAngel setup
          </p>
        </div>
      </div>

      {/* Getting Started */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">🚀 Getting Started</h2>
        <ol className="space-y-2 text-gray-700">
          <li>1. Enable your first playbook to start automating revenue recovery</li>
          <li>2. Monitor your recovered revenue in the Analytics dashboard</li>
          <li>3. Optimize your sequences based on performance data</li>
        </ol>
      </div>
    </div>
  );
}

