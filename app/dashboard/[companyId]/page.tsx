import Link from 'next/link';
import { verifyUserToken } from '@whop/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardPage({
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
      <div className="container mx-auto py-12 px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">💰</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            RevenueAngel Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Automated revenue recovery for your Whop community
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">💵</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Recovered Revenue</p>
                <p className="text-2xl font-bold text-gray-900">$0.00</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Playbooks</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl">📧</span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Messages Sent</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Link
            href={`/dashboard/${companyId}/playbooks`}
            className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-blue-500 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-3xl">📋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Playbooks</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage your automated revenue sequences. Create nurture campaigns, upsell flows, and churn prevention.
            </p>
            <div className="flex items-center text-blue-600 font-semibold group-hover:gap-3 gap-2 transition-all">
              Manage Playbooks
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <Link
            href={`/dashboard/${companyId}/analytics`}
            className="group bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-green-500 hover:shadow-xl transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-3xl">📊</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
            </div>
            <p className="text-gray-600 mb-4">
              View revenue metrics, conversion rates, and playbook performance data in real-time.
            </p>
            <div className="flex items-center text-green-600 font-semibold group-hover:gap-3 gap-2 transition-all">
              View Analytics
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </Link>

          <div className="group bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl hover:shadow-2xl transition-all">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-3xl">⚙️</span>
              </div>
              <h2 className="text-2xl font-bold">Settings</h2>
            </div>
            <p className="mb-4 text-white/90">
              Configure your RevenueAngel setup, API keys, and notification preferences.
            </p>
            <div className="flex items-center font-semibold group-hover:gap-3 gap-2 transition-all">
              Coming Soon
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🚀</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-2">Getting Started with RevenueAngel</h2>
              <p className="text-blue-100">
                Follow these steps to start automating your revenue recovery
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 font-bold text-xl">
                1
              </div>
              <h3 className="font-semibold mb-2 text-lg">Enable a Playbook</h3>
              <p className="text-sm text-blue-100">
                Go to Playbooks and enable your first automated sequence
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 font-bold text-xl">
                2
              </div>
              <h3 className="font-semibold mb-2 text-lg">Monitor Performance</h3>
              <p className="text-sm text-blue-100">
                Track your recovered revenue in the Analytics dashboard
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mb-4 font-bold text-xl">
                3
              </div>
              <h3 className="font-semibold mb-2 text-lg">Optimize & Scale</h3>
              <p className="text-sm text-blue-100">
                Refine your sequences based on performance data
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

