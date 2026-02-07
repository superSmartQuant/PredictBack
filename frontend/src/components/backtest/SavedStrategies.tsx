"use client";

import { useState } from "react";
import {
  useSavedStrategiesStore,
  type SavedStrategy,
  type FormStrategyData,
  type VisualStrategyData,
} from "@/lib/stores/savedStrategiesStore";

interface SavedStrategiesProps {
  onLoadFormStrategy: (data: FormStrategyData) => void;
  onLoadVisualStrategy: (data: VisualStrategyData) => void;
}

export function SavedStrategies({
  onLoadFormStrategy,
  onLoadVisualStrategy,
}: SavedStrategiesProps) {
  const { strategies, deleteStrategy, duplicateStrategy } = useSavedStrategiesStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleLoad = (strategy: SavedStrategy) => {
    if (strategy.data.type === "form") {
      onLoadFormStrategy(strategy.data);
    } else {
      onLoadVisualStrategy(strategy.data);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this saved strategy?")) {
      deleteStrategy(id);
    }
  };

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateStrategy(id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStrategyTypeLabel = (strategy: SavedStrategy) => {
    if (strategy.data.type === "visual") return "Visual";
    return "Form";
  };

  const getIndicatorCount = (strategy: SavedStrategy) => {
    if (strategy.data.type === "form") {
      return strategy.data.indicators.length;
    }
    // For visual, count indicator nodes
    return strategy.data.workflow.nodes.filter((n) =>
      ["sma", "ema", "rsi", "macd", "bollinger"].includes(n.data.nodeType)
    ).length;
  };

  const getRulesCount = (strategy: SavedStrategy) => {
    if (strategy.data.type === "form") {
      return strategy.data.buy_rules.length + strategy.data.sell_rules.length;
    }
    // For visual, count signal nodes
    return strategy.data.workflow.nodes.filter((n) =>
      ["buy-signal", "sell-signal"].includes(n.data.nodeType)
    ).length;
  };

  if (strategies.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-bg-tertiary mx-auto mb-3 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
            />
          </svg>
        </div>
        <p className="text-text-tertiary text-sm">No saved strategies yet</p>
        <p className="text-text-tertiary text-xs mt-1">
          Configure a strategy and click Save to store it
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {strategies.map((strategy) => (
        <div
          key={strategy.id}
          className="border border-border rounded-lg overflow-hidden transition-all hover:border-border-pink"
        >
          <div
            className="p-3 cursor-pointer flex items-start justify-between gap-3"
            onClick={() =>
              setExpandedId(expandedId === strategy.id ? null : strategy.id)
            }
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-text-primary text-sm font-medium truncate">
                  {strategy.name}
                </h4>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    strategy.data.type === "visual"
                      ? "bg-pink-500/20 text-pink-400"
                      : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {getStrategyTypeLabel(strategy)}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
                <span>{getIndicatorCount(strategy)} indicators</span>
                <span>{getRulesCount(strategy)} rules</span>
                <span>{formatDate(strategy.updatedAt)}</span>
              </div>
            </div>
            <svg
              className={`w-4 h-4 text-text-tertiary transition-transform flex-shrink-0 ${
                expandedId === strategy.id ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {expandedId === strategy.id && (
            <div className="px-3 pb-3 pt-0 border-t border-border/50">
              {strategy.description && (
                <p className="text-text-tertiary text-xs mb-3 mt-2">
                  {strategy.description}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLoad(strategy)}
                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Load
                </button>
                <button
                  onClick={(e) => handleDuplicate(strategy.id, e)}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors py-1.5 px-2"
                >
                  Duplicate
                </button>
                <button
                  onClick={(e) => handleDelete(strategy.id, e)}
                  className="text-xs text-bearish hover:text-red-400 transition-colors py-1.5 px-2 ml-auto"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface SaveStrategyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  defaultName?: string;
}

export function SaveStrategyModal({
  isOpen,
  onClose,
  onSave,
  defaultName = "",
}: SaveStrategyModalProps) {
  const [name, setName] = useState(defaultName);
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim(), description.trim());
      setName("");
      setDescription("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-bg-secondary border border-border rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <h3 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
          Save Strategy
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-text-secondary text-sm mb-2">
              Strategy Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Strategy"
              className="input-field w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-text-secondary text-sm mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this strategy does..."
              className="input-field w-full h-20 resize-none"
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="flex-1 btn-primary py-2 px-4 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Strategy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
