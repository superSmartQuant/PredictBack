import type { Node, Edge } from "@xyflow/react";

// Data types that can flow between nodes
export type DataType = "price" | "indicator" | "boolean" | "signal";

// Handle definition for node inputs/outputs
export interface NodeHandle {
  id: string;
  type: "source" | "target";
  dataType: DataType;
  label?: string;
}

// Base interface for all node data
export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  description?: string;
  isValid: boolean;
  validationErrors: string[];
}

// ============ DATA SOURCE NODES ============

export interface PriceDataNodeData extends BaseNodeData {
  nodeType: "price-data";
}

// ============ INDICATOR NODES ============

export interface SMANodeData extends BaseNodeData {
  nodeType: "sma";
  period: number;
  outputName: string;
}

export interface EMANodeData extends BaseNodeData {
  nodeType: "ema";
  period: number;
  outputName: string;
}

export interface RSINodeData extends BaseNodeData {
  nodeType: "rsi";
  period: number;
  outputName: string;
}

export interface MACDNodeData extends BaseNodeData {
  nodeType: "macd";
  fastPeriod: number;
  slowPeriod: number;
  signalPeriod: number;
  outputName: string;
}

export interface BollingerNodeData extends BaseNodeData {
  nodeType: "bollinger";
  period: number;
  numStd: number;
  outputName: string;
}

// ============ CONDITION NODES ============

export type ComparisonOperator = ">" | "<" | ">=" | "<=";
export type CrossoverOperator = "cross_above" | "cross_below";

export interface CompareNodeData extends BaseNodeData {
  nodeType: "compare";
  operator: ComparisonOperator;
  compareToValue?: number;
}

export interface CrossoverNodeData extends BaseNodeData {
  nodeType: "crossover";
  operator: CrossoverOperator;
}

// ============ LOGIC GATE NODES ============

export interface AndGateNodeData extends BaseNodeData {
  nodeType: "and-gate";
  inputCount: number;
}

export interface OrGateNodeData extends BaseNodeData {
  nodeType: "or-gate";
  inputCount: number;
}

// ============ ACTION NODES ============

export interface BuySignalNodeData extends BaseNodeData {
  nodeType: "buy-signal";
  ruleDescription?: string;
}

export interface SellSignalNodeData extends BaseNodeData {
  nodeType: "sell-signal";
  ruleDescription?: string;
}

// Union type for all node data
export type WorkflowNodeData =
  | PriceDataNodeData
  | SMANodeData
  | EMANodeData
  | RSINodeData
  | MACDNodeData
  | BollingerNodeData
  | CompareNodeData
  | CrossoverNodeData
  | AndGateNodeData
  | OrGateNodeData
  | BuySignalNodeData
  | SellSignalNodeData;

// Node type string union
export type WorkflowNodeType = WorkflowNodeData["nodeType"];

// Typed workflow node
export type WorkflowNode = Node<WorkflowNodeData>;

// Workflow graph structure
export interface WorkflowGraph {
  nodes: WorkflowNode[];
  edges: Edge[];
  metadata: {
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
  };
}

// Node category for styling
export type NodeCategory =
  | "data-source"
  | "indicator"
  | "condition"
  | "logic"
  | "action";

// Node palette item for drag-and-drop
export interface NodePaletteItem {
  type: WorkflowNodeType;
  label: string;
  category: NodeCategory;
  description: string;
  icon: string;
}

// Validation error structure
export interface ValidationError {
  nodeId?: string;
  type: "error" | "warning";
  message: string;
}

// Color mapping for data types (for edge styling)
export const DATA_TYPE_COLORS: Record<DataType, string> = {
  price: "#26A69A",
  indicator: "#FF4785",
  boolean: "#FFA726",
  signal: "#AB47BC",
};

// Category colors for node styling
export const CATEGORY_STYLES: Record<
  NodeCategory,
  { borderColor: string; bgColor: string }
> = {
  "data-source": {
    borderColor: "var(--bullish-green)",
    bgColor: "rgba(38, 166, 154, 0.1)",
  },
  indicator: {
    borderColor: "var(--pink-500)",
    bgColor: "rgba(255, 71, 133, 0.1)",
  },
  condition: {
    borderColor: "#FFA726",
    bgColor: "rgba(255, 167, 38, 0.1)",
  },
  logic: {
    borderColor: "#AB47BC",
    bgColor: "rgba(171, 71, 188, 0.1)",
  },
  action: {
    borderColor: "var(--bullish-green)",
    bgColor: "rgba(38, 166, 154, 0.1)",
  },
};
