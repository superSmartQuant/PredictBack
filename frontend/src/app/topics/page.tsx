"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchTopics, Topic } from "@/lib/api";

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTopics() {
      try {
        const data = await fetchTopics();
        setTopics(data.topics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load topics");
      } finally {
        setLoading(false);
      }
    }
    loadTopics();
  }, []);

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-10">
          <h1 className="font-[family-name:var(--font-chakra)] text-3xl md:text-4xl font-bold text-pink-50 mb-3">
            Select a Topic
          </h1>
          <p className="text-text-secondary text-lg">
            Choose a prediction market category to explore available markets
          </p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-secondary rounded-xl border border-border p-6">
                <div className="skeleton h-12 w-12 rounded-xl mb-4"></div>
                <div className="skeleton h-6 w-32 rounded mb-2"></div>
                <div className="skeleton h-4 w-48 rounded"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-bearish/10 border border-bearish/20 rounded-xl p-6 text-center">
            <p className="text-bearish mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic, i) => (
              <Link
                key={topic.name}
                href={`/topics/${encodeURIComponent(topic.name)}`}
                className="group bg-bg-secondary rounded-xl border border-border p-6 card-hover animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 group-hover:bg-pink-500/20 transition-colors">
                  {topic.continuous ? (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  ) : (
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  )}
                </div>
                <h2 className="font-[family-name:var(--font-chakra)] text-xl font-semibold text-pink-50 mb-2 capitalize">
                  {topic.name.replace(/-/g, " ")}
                </h2>
                <div className="flex items-center gap-2 text-text-tertiary text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    topic.continuous
                      ? "bg-bullish/10 text-bullish"
                      : "bg-pink-500/10 text-pink-400"
                  }`}>
                    {topic.continuous ? "Continuous" : "Event-based"}
                  </span>
                </div>
                <div className="mt-4 flex items-center text-pink-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  View Markets
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && !error && topics.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-bg-secondary border border-border mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-text-primary text-lg font-medium mb-2">No topics available</h3>
            <p className="text-text-tertiary">Check back later for available prediction markets</p>
          </div>
        )}
      </div>
    </main>
  );
}
