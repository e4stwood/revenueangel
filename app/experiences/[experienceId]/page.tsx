import { verifyUserToken } from '@whop/api';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/data-manager';

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  // Verify user is authenticated
  let userId: string | null = null;
  try {
    const result = await verifyUserToken(await headers());
    userId = result.userId;
  } catch {
    redirect('/');
  }

  // Get user's engagement data
  const member = await prisma.member.findFirst({
    where: {
      whopUserId: userId,
    },
    include: {
      sends: {
        where: {
          status: 'sent',
        },
        orderBy: {
          sentAt: 'desc',
        },
        take: 5,
        include: {
          playbook: {
            select: {
              name: true,
              type: true,
            },
          },
        },
      },
      conversions: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      },
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl">
            <span className="text-4xl">💰</span>
          </div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to RevenueAngel
          </h1>
          <p className="text-xl text-gray-600">
            Your personalized engagement hub
          </p>
        </div>

        {/* Member Stats */}
        {member && (
          <div className="grid gap-6 md:grid-cols-3 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📧</span>
                <h3 className="font-semibold text-gray-700">Messages</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{member.sends.length}</p>
              <p className="text-sm text-gray-500">Messages received</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">✅</span>
                <h3 className="font-semibold text-gray-700">Engagement</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {member.sends.filter((s: any) => s.clickedAt).length}
              </p>
              <p className="text-sm text-gray-500">Messages clicked</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎉</span>
                <h3 className="font-semibold text-gray-700">Activity</h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">{member.conversions.length}</p>
              <p className="text-sm text-gray-500">Total actions</p>
            </div>
          </div>
        )}

        {/* Recent Messages */}
        {member && member.sends.length > 0 ? (
          <div className="bg-white rounded-2xl border-2 border-gray-200 p-8 shadow-lg mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <span>📬</span>
              Recent Messages
            </h2>
            <div className="space-y-4">
              {member.sends.map((send: any) => (
                <div
                  key={send.id}
                  className="p-4 border-2 border-gray-100 rounded-xl hover:border-purple-300 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {send.playbook?.name}
                      </h3>
                      <span className="text-xs text-gray-500 capitalize">
                        {send.playbook?.type} campaign
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {send.sentAt && new Date(send.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{send.content}</p>
                  {send.clickedAt && (
                    <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      ✓ Clicked
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* No Activity State */}
        {(!member || member.sends.length === 0) && (
          <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl p-12 text-white text-center shadow-xl">
            <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">🚀</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Welcome Aboard!</h2>
            <p className="text-lg text-purple-100 mb-6 max-w-md mx-auto">
              You&apos;re all set! We&apos;ll send you personalized updates and exclusive offers to help you get the most out of your membership.
            </p>
            <div className="inline-block bg-white/20 backdrop-blur border-2 border-white/30 rounded-xl px-6 py-3">
              <p className="text-sm font-medium">
                Stay tuned for your first message! 💌
              </p>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 mt-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">ℹ️</span>
            </div>
            <div>
              <h3 className="font-bold text-blue-900 mb-2">About RevenueAngel</h3>
              <p className="text-blue-800 text-sm">
                RevenueAngel helps this community send you timely, personalized messages about new features, 
                upgrades, and exclusive offers. You&apos;ll only receive messages that are relevant to your interests.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

