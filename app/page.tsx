import { verifyUserToken } from '@whop/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  // Try to verify user token
  let isAuthenticated = false;
  try {
    await verifyUserToken(await headers());
    isAuthenticated = true;
  } catch {
    // User is not authenticated
  }

  // If authenticated, redirect to discover (they can navigate to their dashboard)
  // If not authenticated, show public landing
  if (isAuthenticated) {
    // Show quick navigation
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <span className="text-5xl">💰</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome Back!
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Navigate to your company dashboard to manage your RevenueAngel
          </p>
          <div className="flex gap-4 justify-center">
            <Link 
              href="/discover"
              className="px-6 py-3 bg-white border-2 border-gray-300 rounded-xl font-semibold hover:border-blue-500 transition-all"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to discover
  redirect('/discover');
}
