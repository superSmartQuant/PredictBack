import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { IndicatorConfig, TradingRule } from "@/lib/api";
import type { WorkflowGraph } from "@/components/workflow-editor/types/workflow";

// Form-based strategy data (non-visual editor)
export interface FormStrategyData {
  type: "form";
  indicators: IndicatorConfig[];
  buy_rules: TradingRule[];
  sell_rules: TradingRule[];
  order_size: string;
  initial_balance: string;
}

// Visual editor strategy data
export interface VisualStrategyData {
  type: "visual";
  workflow: WorkflowGraph;
  orderSize: string;
  initialBalance: string;
}

export type StrategyData = FormStrategyData | VisualStrategyData;

export interface SavedStrategy {
  id: string;
  name: string;
  description?: string;
  data: StrategyData;
  createdAt: string;
  updatedAt: string;
}

interface SavedStrategiesState {
  strategies: SavedStrategy[];

  // Actions
  saveStrategy: (name: string, description: string | undefined, data: StrategyData) => string;
  updateStrategy: (id: string, updates: Partial<Pick<SavedStrategy, "name" | "description" | "data">>) => void;
  deleteStrategy: (id: string) => void;
  getStrategy: (id: string) => SavedStrategy | undefined;
  duplicateStrategy: (id: string) => string | null;
}

function generateId(): string {
  return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const useSavedStrategiesStore = create<SavedStrategiesState>()(
  persist(
    (set, get) => ({
      strategies: [],

      saveStrategy: (name, description, data) => {
        const id = generateId();
        const now = new Date().toISOString();
        const newStrategy: SavedStrategy = {
          id,
          name,
          description,
          data,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          strategies: [newStrategy, ...state.strategies],
        }));

        return id;
      },

      updateStrategy: (id, updates) => {
        set((state) => ({
          strategies: state.strategies.map((s) =>
            s.id === id
              ? { ...s, ...updates, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      deleteStrategy: (id) => {
        set((state) => ({
          strategies: state.strategies.filter((s) => s.id !== id),
        }));
      },

      getStrategy: (id) => {
        return get().strategies.find((s) => s.id === id);
      },

      duplicateStrategy: (id) => {
        const original = get().getStrategy(id);
        if (!original) return null;

        const newId = generateId();
        const now = new Date().toISOString();
        const duplicate: SavedStrategy = {
          ...original,
          id: newId,
          name: `${original.name} (Copy)`,
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          strategies: [duplicate, ...state.strategies],
        }));

        return newId;
      },
    }),
    {
      name: "saved-strategies-storage",
    }
  )
);
