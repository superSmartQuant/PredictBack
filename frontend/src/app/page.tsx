"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-bg-primary sakura-pattern">
      {/* Hero Section */}
      <section className="pt-16 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-500/10 border border-pink-500/20 mb-8 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse-soft"></span>
              <span className="text-pink-400 text-sm font-medium">Now in Beta</span>
            </div>

            {/* Main Heading */}
            <h1 className="font-[family-name:var(--font-chakra)] text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up stagger-1">
              <span className="text-pink-50">The Future of</span>
              <br />
              <span className="bg-gradient-to-r from-pink-400 via-pink-500 to-pink-600 bg-clip-text text-transparent">
                Prediction Markets
              </span>
              <br />
              <span className="text-pink-50">Backtesting</span>
            </h1>

            {/* Subtitle */}
            <p className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up stagger-2">
              Test your trading strategies with historical data from prediction markets.
              Analyze performance, optimize parameters, and trade with confidence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Link
                href="/topics"
                className="group inline-flex items-center gap-3 bg-pink-500 hover:bg-pink-400 text-white px-7 py-3.5 rounded-xl font-medium text-base transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,71,133,0.5)]"
              >
                Get Started
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-pink-500/50 text-text-primary hover:text-pink-400 px-7 py-3.5 rounded-xl font-medium text-base transition-all duration-200 hover:bg-bg-tertiary"
              >
                Learn More
              </a>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="mt-20 relative animate-fade-in-up stagger-4">
            <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent z-10"></div>
            <div className="bg-bg-secondary rounded-2xl border border-border overflow-hidden shadow-2xl">
              <div className="bg-bg-tertiary px-4 py-3 flex items-center gap-2 border-b border-border">
                <div className="w-3 h-3 rounded-full bg-bearish"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-bullish"></div>
                <span className="text-text-tertiary text-sm ml-4 font-[family-name:var(--font-mono)]">
                  Backtest Results
                </span>
              </div>
              <div className="p-6">
                {/* Mock Chart Preview */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[
                    { label: "Total Return", value: "+1.64%", color: "text-bullish" },
                    { label: "Win Rate", value: "76.54%", color: "text-pink-400" },
                    { label: "Total Trades", value: "162", color: "text-text-primary" },
                    { label: "Max Drawdown", value: "-0.93%", color: "text-bearish" },
                  ].map((stat, i) => (
                    <div key={i} className="bg-bg-tertiary rounded-lg p-4">
                      <div className="text-text-tertiary text-sm mb-1">{stat.label}</div>
                      <div className={`font-[family-name:var(--font-mono)] text-2xl font-semibold ${stat.color}`}>
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Mock Chart */}
                <div className="h-48 bg-bg-tertiary rounded-lg flex items-end justify-around px-4 pb-4">
                  {[65, 45, 78, 52, 88, 70, 55, 82, 60, 95, 48, 72, 58, 85, 40, 68, 75, 90, 62, 50].map((height, i) => (
                    <div
                      key={i}
                      className="w-3 rounded-t bg-gradient-to-t from-pink-600 to-pink-400"
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-chakra)] text-3xl md:text-4xl font-bold text-pink-50 mb-4">
              Powerful Features
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Everything you need to test and optimize your prediction market strategies
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
                title: "Multiple Strategies",
                description: "Test Grid and Momentum strategies with customizable parameters"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: "Real-Time Results",
                description: "Get instant backtest results with detailed statistics and visualizations"
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                ),
                title: "Historical Data",
                description: "Access historical market data from various prediction market topics"
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="bg-bg-secondary border border-border rounded-xl p-6 card-hover"
              >
                <div className="w-14 h-14 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-[family-name:var(--font-chakra)] text-xl font-semibold text-pink-50 mb-2">
                  {feature.title}
                </h3>
                <p className="text-text-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-6 bg-bg-secondary/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-chakra)] text-3xl md:text-4xl font-bold text-pink-50 mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary text-lg max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Select a Topic",
                description: "Choose from available prediction market categories like elections or BTC price movements"
              },
              {
                step: "02",
                title: "Pick a Market",
                description: "Browse markets within your selected topic and choose one to backtest"
              },
              {
                step: "03",
                title: "Run Backtest",
                description: "Configure your strategy parameters and get instant results with detailed analytics"
              },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-[family-name:var(--font-chakra)] font-bold text-pink-500/10 absolute -top-4 -left-2">
                  {item.step}
                </div>
                <div className="relative pt-8">
                  <h3 className="font-[family-name:var(--font-chakra)] text-xl font-semibold text-pink-50 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary">
                    {item.description}
                  </p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-px bg-gradient-to-r from-pink-500/50 to-transparent"></div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/topics"
              className="group inline-flex items-center gap-3 bg-pink-500 hover:bg-pink-400 text-white px-7 py-3.5 rounded-xl font-medium text-base transition-all duration-200 hover:shadow-[0_0_24px_rgba(255,71,133,0.5)]"
            >
              Start Backtesting
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md gradient-pink flex items-center justify-center">
              <span className="text-white font-bold text-xs">P</span>
            </div>
            <span className="font-[family-name:var(--font-chakra)] font-semibold text-pink-50">
              PredictBack
            </span>
          </div>
          <p className="text-text-tertiary text-sm">
            © 2026 PredictBack. Built for the future of prediction markets.
          </p>
        </div>
      </footer>
    </main>
  );
}
