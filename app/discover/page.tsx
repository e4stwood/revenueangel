export default function DiscoverPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 py-20 max-w-6xl">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-3xl flex items-center justify-center shadow-2xl">
                <span className="text-5xl">💰</span>
              </div>
            </div>
            <h1 className="text-6xl font-bold mb-6 leading-tight">
              Turn Every Member Event
              <br />
              Into <span className="text-yellow-300">Revenue</span>
            </h1>
            <p className="text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Automated revenue recovery for Whop communities. Nurture leads, upsell members, 
              and prevent churn — all on autopilot.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all hover:scale-105">
                Get Started Free
              </button>
              <button className="bg-white/20 backdrop-blur border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/30 transition-all">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">10-20%</div>
              <div className="text-blue-100">First-purchase lift</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">5%+</div>
              <div className="text-blue-100">Upgrade click-through</div>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">3%+</div>
              <div className="text-blue-100">Payment recovery</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Three Powerful Modules
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to maximize revenue from your community
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Nurture AI */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8 border-2 border-blue-200 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl">🌱</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Nurture AI</h3>
            <p className="text-gray-700 mb-6">
              Convert leads into first-time customers with automated 3-step sequences. 
              T+1h reminder, T+24h social proof, T+72h final incentive.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Lead capture & tracking
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Deep link CTAs
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                AI personalization
              </div>
            </div>
          </div>

          {/* TierLift */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-8 border-2 border-green-200 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl">📈</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">TierLift</h3>
            <p className="text-gray-700 mb-6">
              Upsell engaged members to higher tiers automatically. Target by tenure, 
              plan type, and experience access.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Smart segmentation
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Tenure-based targeting
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Feature comparison
              </div>
            </div>
          </div>

          {/* ChurnSave */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-3xl p-8 border-2 border-orange-200 hover:shadow-2xl transition-all">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
              <span className="text-3xl">🛡️</span>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">ChurnSave</h3>
            <p className="text-gray-700 mb-6">
              Recover failed payments and prevent cancellations. Automated retry, 
              downgrade, and pause offers.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Payment failure detection
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Auto-retry flows
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-600">✓</span>
                Flexible alternatives
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50 py-20">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">
              Set It and Forget It
            </h2>
            <p className="text-xl text-gray-600">
              RevenueAngel runs completely on autopilot
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                1
              </div>
              <h3 className="font-bold text-lg mb-2">Enable Playbooks</h3>
              <p className="text-gray-600 text-sm">
                Choose from pre-built templates or customize your own
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                2
              </div>
              <h3 className="font-bold text-lg mb-2">Auto-Detect Events</h3>
              <p className="text-gray-600 text-sm">
                Webhooks trigger sequences for leads, upgrades, and failed payments
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                3
              </div>
              <h3 className="font-bold text-lg mb-2">Send Messages</h3>
              <p className="text-gray-600 text-sm">
                AI-personalized push notifications with deep links to checkout
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg">
                4
              </div>
              <h3 className="font-bold text-lg mb-2">Track Revenue</h3>
              <p className="text-gray-600 text-sm">
                7-day attribution shows exactly how much revenue recovered
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-gray-900">
            Built for Whop Creators
          </h2>
          <p className="text-xl text-gray-600">
            Native integration with Whop&apos;s platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span>⚡</span>
              Native Whop Integration
            </h3>
            <p className="text-gray-600 mb-4">
              Uses official Whop SDK for auth, notifications, memberships, and payments. 
              No external tools or complicated setup required.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                Push Notifications
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                Memberships API
              </span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                Payment Webhooks
              </span>
            </div>
          </div>

          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 shadow-lg">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
              <span>🤖</span>
              AI-Powered Personalization
            </h3>
            <p className="text-gray-600 mb-4">
              OpenRouter AI generates messages tailored to your community&apos;s voice and 
              each member&apos;s context. Multiple tone options available.
            </p>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                Friendly
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                Professional
              </span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                Hype
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 py-20">
        <div className="container mx-auto px-4 max-w-4xl text-center text-white">
          <h2 className="text-5xl font-bold mb-6">
            Start Recovering Revenue Today
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join Whop creators who are already automating their revenue recovery. 
            Set up in minutes, see results in days.
          </p>
          <button className="bg-white text-purple-600 px-10 py-5 rounded-xl font-bold text-xl hover:shadow-2xl transition-all hover:scale-105">
            Install RevenueAngel Free
          </button>
          <p className="text-sm text-blue-200 mt-6">
            Free plan includes 50 nurtures/mo • No credit card required
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <span className="text-xl font-bold text-white">RevenueAngel</span>
          </div>
          <p className="text-sm">
            Automated revenue recovery for Whop communities
          </p>
          <p className="text-xs mt-4">
            Built with ❤️ for Whop creators
          </p>
        </div>
      </div>
    </div>
  );
}

