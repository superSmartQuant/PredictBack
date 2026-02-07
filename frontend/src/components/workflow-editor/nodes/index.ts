import type { NodePaletteItem, WorkflowNodeType, WorkflowNodeData } from "../types/workflow";
import type { ComponentType } from "react";

// Node components
import { PriceDataNode } from "./PriceDataNode";
import { SMANode } from "./indicators/SMANode";
import { EMANode } from "./indicators/EMANode";
import { RSINode } from "./indicators/RSINode";
import { MACDNode } from "./indicators/MACDNode";
import { BollingerNode } from "./indicators/BollingerNode";
import { CompareNode } from "./conditions/CompareNode";
import { CrossoverNode } from "./conditions/CrossoverNode";
import { AndGateNode } from "./logic/AndGateNode";
import { OrGateNode } from "./logic/OrGateNode";
import { BuySignalNode } from "./actions/BuySignalNode";
import { SellSignalNode } from "./actions/SellSignalNode";

// Node type registry for React Flow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const nodeTypes: Record<string, ComponentType<any>> = {
  "price-data": PriceDataNode,
  sma: SMANode,
  ema: EMANode,
  rsi: RSINode,
  macd: MACDNode,
  bollinger: BollingerNode,
  compare: CompareNode,
  crossover: CrossoverNode,
  "and-gate": AndGateNode,
  "or-gate": OrGateNode,
  "buy-signal": BuySignalNode,
  "sell-signal": SellSignalNode,
};

// Palette items for drag-and-drop
export const paletteItems: NodePaletteItem[] = [
  // Data Sources
  {
    type: "price-data",
    label: "Price Data",
    category: "data-source",
    description: "Current market price",
    icon: "📊",
  },
  // Indicators
  {
    type: "sma",
    label: "SMA",
    category: "indicator",
    description: "Simple Moving Average",
    icon: "📈",
  },
  {
    type: "ema",
    label: "EMA",
    category: "indicator",
    description: "Exponential Moving Average",
    icon: "📈",
  },
  {
    type: "rsi",
    label: "RSI",
    category: "indicator",
    description: "Relative Strength Index",
    icon: "📉",
  },
  {
    type: "macd",
    label: "MACD",
    category: "indicator",
    description: "Moving Average Convergence Divergence",
    icon: "📊",
  },
  {
    type: "bollinger",
    label: "Bollinger",
    category: "indicator",
    description: "Bollinger Bands",
    icon: "📈",
  },
  // Conditions
  {
    type: "compare",
    label: "Compare",
    category: "condition",
    description: "Compare values (>, <, >=, <=)",
    icon: "⚖️",
  },
  {
    type: "crossover",
    label: "Crossover",
    category: "condition",
    description: "Detect line crossovers",
    icon: "✕",
  },
  // Logic
  {
    type: "and-gate",
    label: "AND",
    category: "logic",
    description: "All conditions must be true",
    icon: "&",
  },
  {
    type: "or-gate",
    label: "OR",
    category: "logic",
    description: "Any condition must be true",
    icon: "|",
  },
  // Actions
  {
    type: "buy-signal",
    label: "Buy Signal",
    category: "action",
    description: "Trigger a buy order",
    icon: "🟢",
  },
  {
    type: "sell-signal",
    label: "Sell Signal",
    category: "action",
    description: "Trigger a sell order",
    icon: "🔴",
  },
];

// Default node data factory
export function createDefaultNodeData(type: WorkflowNodeType): WorkflowNodeData {
  const baseData = {
    label: type,
    isValid: true,
    validationErrors: [],
  };

  switch (type) {
    case "price-data":
      return { ...baseData, nodeType: "price-data", label: "Price" };

    case "sma":
      return {
        ...baseData,
        nodeType: "sma",
        label: "SMA",
        period: 20,
        outputName: "sma_20",
      };

    case "ema":
      return {
        ...baseData,
        nodeType: "ema",
        label: "EMA",
        period: 20,
        outputName: "ema_20",
      };

    case "rsi":
      return {
        ...baseData,
        nodeType: "rsi",
        label: "RSI",
        period: 14,
        outputName: "rsi_14",
      };

    case "macd":
      return {
        ...baseData,
        nodeType: "macd",
        label: "MACD",
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        outputName: "macd",
      };

    case "bollinger":
      return {
        ...baseData,
        nodeType: "bollinger",
        label: "Bollinger",
        period: 20,
        numStd: 2,
        outputName: "bb",
      };

    case "compare":
      return {
        ...baseData,
        nodeType: "compare",
        label: "Compare",
        operator: ">",
        compareToValue: undefined,
      };

    case "crossover":
      return {
        ...baseData,
        nodeType: "crossover",
        label: "Crossover",
        operator: "cross_above",
      };

    case "and-gate":
      return {
        ...baseData,
        nodeType: "and-gate",
        label: "AND",
        inputCount: 2,
      };

    case "or-gate":
      return {
        ...baseData,
        nodeType: "or-gate",
        label: "OR",
        inputCount: 2,
      };

    case "buy-signal":
      return {
        ...baseData,
        nodeType: "buy-signal",
        label: "Buy Signal",
        ruleDescription: "",
      };

    case "sell-signal":
      return {
        ...baseData,
        nodeType: "sell-signal",
        label: "Sell Signal",
        ruleDescription: "",
      };

    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}
