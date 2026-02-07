"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/wallet";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  if (pathname === "/") {
    return [];
  }

  const segments = pathname.split("/").filter(Boolean);

  if (segments[0] === "topics") {
    breadcrumbs.push({ label: "Topics", href: "/topics" });
    if (segments[1]) {
      const topicName = decodeURIComponent(segments[1]).replace(/-/g, " ");
      breadcrumbs.push({ label: topicName });
    }
  } else if (segments[0] === "backtest") {
    breadcrumbs.push({ label: "Topics", href: "/topics" });
    breadcrumbs.push({ label: "Backtest" });
  }

  return breadcrumbs;
}

export function GlobalNavbar() {
  const pathname = usePathname();
  const isLandingPage = pathname === "/";
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-200 ${
        isLandingPage
          ? "bg-bg-primary/80 backdrop-blur-xl"
          : "bg-bg-secondary/95 backdrop-blur-xl"
      } border-b border-border`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Logo + Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg gradient-pink flex items-center justify-center shadow-lg shadow-pink-500/20 group-hover:shadow-pink-500/40 transition-shadow">
            <span className="text-white font-bold text-base">P</span>
          </div>
          <span className="font-[family-name:var(--font-chakra)] font-bold text-xl text-pink-50 hidden sm:block">
            PredictBack
          </span>
        </Link>

        {/* Center: Breadcrumbs (only on inner pages) */}
        {breadcrumbs.length > 0 && (
          <div className="hidden md:flex items-center gap-2 text-sm absolute left-1/2 -translate-x-1/2">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <svg
                    className="w-4 h-4 text-text-tertiary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-text-secondary hover:text-pink-400 transition-colors capitalize"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-pink-400 font-medium capitalize">
                    {crumb.label}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Right: Nav links + Wallet */}
        <div className="flex items-center gap-6">
          {/* Landing page nav links */}
          {isLandingPage && (
            <div className="hidden sm:flex items-center gap-6">
              <a
                href="#features"
                className="text-sm text-text-secondary hover:text-pink-400 transition-colors"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-text-secondary hover:text-pink-400 transition-colors"
              >
                How It Works
              </a>
            </div>
          )}

          {/* Inner page quick nav */}
          {!isLandingPage && (
            <Link
              href="/topics"
              className="hidden sm:flex items-center gap-1.5 text-sm text-text-secondary hover:text-pink-400 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
              Browse Topics
            </Link>
          )}

          {/* Divider */}
          <div className="h-6 w-px bg-border hidden sm:block" />

          {/* Wallet Button */}
          <WalletButton />
        </div>
      </div>
    </nav>
  );
}
