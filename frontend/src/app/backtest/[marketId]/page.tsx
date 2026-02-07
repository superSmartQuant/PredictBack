"use client";

import { useParams } from "next/navigation";
import { BacktestForm } from "@/components/backtest";

export default function BacktestPage() {
  const params = useParams();
  const marketId = decodeURIComponent(params.marketId as string);

  return (
    <BacktestForm
      mode="event-based"
      marketId={marketId}
      backLink={{
        href: "/topics",
        label: "Back to Topics",
      }}
      title="Run Backtest"
      subtitle={`Market: ${marketId}`}
    />
  );
}
