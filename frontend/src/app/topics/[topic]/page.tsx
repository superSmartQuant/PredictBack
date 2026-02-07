"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { fetchMarkets, fetchTopicInfo, Market, Topic } from "@/lib/api";
import { BacktestForm } from "@/components/backtest";

export default function MarketsPage() {
  const params = useParams();
  const topic = decodeURIComponent(params.topic as string);

  // Common state
  const [topicInfo, setTopicInfo] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for non-continuous (market selection)
  const [markets, setMarkets] = useState<Market[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch topic info to check if continuous
        const info = await fetchTopicInfo(topic);
        setTopicInfo(info);

        // If not continuous, also fetch markets
        if (info && !info.continuous) {
          const data = await fetchMarkets(topic);
          setMarkets(data.markets);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [topic]);


  // Render loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-bg-secondary rounded-xl border border-border p-5">
                <div className="skeleton h-5 w-96 rounded mb-2"></div>
                <div className="skeleton h-4 w-24 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // Render error state
  if (error) {
    return (
      <main className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="bg-bearish/10 border border-bearish/20 rounded-xl p-6 text-center">
            <p className="text-bearish mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        </div>
      </main>
    );
  }

  // For continuous markets, use the shared BacktestForm component
  if (topicInfo?.continuous) {
    return (
      <BacktestForm
        mode="continuous"
        topic={topic}
        backLink={{
          href: "/topics",
          label: "Back to Topics",
        }}
        title={topic.replace(/-/g, " ")}
        subtitle="Continuous Market - Backtest across multiple sequential markets"
      />
    );
  }

  // Render non-continuous (market selection) - original behavior
  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <Link
            href="/topics"
            className="inline-flex items-center text-text-tertiary hover:text-pink-400 text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Topics
          </Link>
          <h1 className="font-[family-name:var(--font-chakra)] text-3xl md:text-4xl font-bold text-pink-50 mb-3 capitalize">
            {topic.replace(/-/g, " ")}
          </h1>
          <p className="text-text-secondary text-lg">
            Select a market to run backtests
          </p>
        </div>

        <div className="space-y-3">
          {markets.map((market, i) => (
            <Link
              key={market.clob_token_id}
              href={`/backtest/${encodeURIComponent(market.clob_token_id)}`}
              className="group flex items-center justify-between bg-bg-secondary rounded-xl border border-border p-5 card-hover animate-fade-in-up"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-text-primary text-sm pr-4">
                  {market.question}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-pink-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Run Backtest
                </span>
                <div className="w-10 h-10 rounded-lg bg-bg-tertiary group-hover:bg-pink-500/10 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-text-tertiary group-hover:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {markets.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-bg-secondary border border-border mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-text-primary text-lg font-medium mb-2">No markets available</h3>
            <p className="text-text-tertiary">This topic doesn&apos;t have any markets yet</p>
          </div>
        )}

        {markets.length > 0 && (
          <div className="mt-8 text-center text-text-tertiary text-sm">
            Showing {markets.length} market{markets.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>
    </main>
  );
}
