import type { Edge } from "@xyflow/react";
import type {
  WorkflowNode,
  WorkflowGraph,
  SMANodeData,
  EMANodeData,
  RSINodeData,
  MACDNodeData,
  BollingerNodeData,
  CompareNodeData,
  CrossoverNodeData,
} from "../types/workflow";
import type {
  CustomStrategyParams,
  IndicatorConfig,
  TradingRule,
  RuleCondition,
  ConditionOperator,
} from "@/lib/api";

/**
 * Serialize a visual workflow graph to CustomStrategyParams for the backend
 */
export function serializeWorkflowToStrategy(
  graph: WorkflowGraph,
  orderSize: string,
  initialBalance: string
): CustomStrategyParams {
  const indicators: IndicatorConfig[] = [];
  const buyRules: TradingRule[] = [];
  const sellRules: TradingRule[] = [];

  // 1. Extract all indicator nodes
  const indicatorNodes = graph.nodes.filter((n) =>
    ["sma", "ema", "rsi", "macd", "bollinger"].includes(n.data.nodeType)
  );

  for (const node of indicatorNodes) {
    const config = nodeToIndicatorConfig(node);
    if (config) {
      indicators.push(config);
    }
  }

  // 2. Find all buy/sell signal nodes and trace back to build rules
  const buySignalNodes = graph.nodes.filter(
    (n) => n.data.nodeType === "buy-signal"
  );
  const sellSignalNodes = graph.nodes.filter(
    (n) => n.data.nodeType === "sell-signal"
  );

  for (const buyNode of buySignalNodes) {
    const rule = traceRuleFromActionNode(buyNode, graph);
    if (rule && rule.conditions.length > 0) {
      buyRules.push(rule);
    }
  }

  for (const sellNode of sellSignalNodes) {
    const rule = traceRuleFromActionNode(sellNode, graph);
    if (rule && rule.conditions.length > 0) {
      sellRules.push(rule);
    }
  }

  return {
    strategy_type: "custom",
    indicators,
    buy_rules: buyRules,
    sell_rules: sellRules,
    order_size: orderSize,
    initial_balance: initialBalance,
  };
}

function nodeToIndicatorConfig(node: WorkflowNode): IndicatorConfig | null {
  const data = node.data;

  switch (data.nodeType) {
    case "sma": {
      const smaData = data as SMANodeData;
      return {
        type: "sma",
        name: smaData.outputName,
        period: smaData.period,
      };
    }
    case "ema": {
      const emaData = data as EMANodeData;
      return {
        type: "ema",
        name: emaData.outputName,
        period: emaData.period,
      };
    }
    case "rsi": {
      const rsiData = data as RSINodeData;
      return {
        type: "rsi",
        name: rsiData.outputName,
        period: rsiData.period,
      };
    }
    case "macd": {
      const macdData = data as MACDNodeData;
      return {
        type: "macd",
        name: macdData.outputName,
        fast_period: macdData.fastPeriod,
        slow_period: macdData.slowPeriod,
        signal_period: macdData.signalPeriod,
      };
    }
    case "bollinger": {
      const bollingerData = data as BollingerNodeData;
      return {
        type: "bollinger",
        name: bollingerData.outputName,
        period: bollingerData.period,
        num_std: bollingerData.numStd,
      };
    }
    default:
      return null;
  }
}

function traceRuleFromActionNode(
  actionNode: WorkflowNode,
  graph: WorkflowGraph
): TradingRule | null {
  const conditions: RuleCondition[] = [];

  // Find edges targeting this action node
  const incomingEdges = graph.edges.filter((e) => e.target === actionNode.id);

  for (const edge of incomingEdges) {
    const sourceNode = graph.nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const extractedConditions = extractConditionsFromNode(
      sourceNode,
      graph,
      new Set()
    );
    conditions.push(...extractedConditions);
  }

  if (conditions.length === 0) return null;

  return { conditions };
}

function extractConditionsFromNode(
  node: WorkflowNode,
  graph: WorkflowGraph,
  visited: Set<string>
): RuleCondition[] {
  // Prevent infinite loops
  if (visited.has(node.id)) return [];
  visited.add(node.id);

  const data = node.data;

  if (data.nodeType === "compare") {
    const compareData = data as CompareNodeData;
    return buildCompareCondition(node, compareData, graph);
  }

  if (data.nodeType === "crossover") {
    const crossoverData = data as CrossoverNodeData;
    return buildCrossoverCondition(node, crossoverData, graph);
  }

  if (data.nodeType === "and-gate") {
    // AND gate: collect all inputs as conditions (all must be true)
    const inputEdges = graph.edges.filter((e) => e.target === node.id);
    const allConditions: RuleCondition[] = [];

    for (const edge of inputEdges) {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      if (sourceNode) {
        allConditions.push(
          ...extractConditionsFromNode(sourceNode, graph, visited)
        );
      }
    }

    return allConditions;
  }

  if (data.nodeType === "or-gate") {
    // OR gate: for simplicity, we flatten to conditions
    // (the backend handles multiple rules as OR logic)
    const inputEdges = graph.edges.filter((e) => e.target === node.id);
    const allConditions: RuleCondition[] = [];

    for (const edge of inputEdges) {
      const sourceNode = graph.nodes.find((n) => n.id === edge.source);
      if (sourceNode) {
        allConditions.push(
          ...extractConditionsFromNode(sourceNode, graph, visited)
        );
      }
    }

    return allConditions;
  }

  return [];
}

function buildCompareCondition(
  node: WorkflowNode,
  data: CompareNodeData,
  graph: WorkflowGraph
): RuleCondition[] {
  const inputEdges = graph.edges.filter((e) => e.target === node.id);

  // Find indicator connected to "left" input
  const leftEdge = inputEdges.find((e) => e.targetHandle === "left");
  const rightEdge = inputEdges.find((e) => e.targetHandle === "right");

  const leftSource = leftEdge
    ? graph.nodes.find((n) => n.id === leftEdge.source)
    : null;
  const rightSource = rightEdge
    ? graph.nodes.find((n) => n.id === rightEdge.source)
    : null;

  const indicatorName = getIndicatorName(leftSource);
  if (!indicatorName) return [];

  const condition: RuleCondition = {
    indicator: indicatorName,
    operator: data.operator as ConditionOperator,
  };

  if (rightSource) {
    const rightName = getIndicatorName(rightSource);
    if (rightName) {
      condition.compare_to_indicator = rightName;
    }
  } else if (data.compareToValue !== undefined) {
    condition.value = data.compareToValue;
  }

  return [condition];
}

function buildCrossoverCondition(
  node: WorkflowNode,
  data: CrossoverNodeData,
  graph: WorkflowGraph
): RuleCondition[] {
  const inputEdges = graph.edges.filter((e) => e.target === node.id);

  const leftEdge = inputEdges.find((e) => e.targetHandle === "left");
  const rightEdge = inputEdges.find((e) => e.targetHandle === "right");

  const leftSource = leftEdge
    ? graph.nodes.find((n) => n.id === leftEdge.source)
    : null;
  const rightSource = rightEdge
    ? graph.nodes.find((n) => n.id === rightEdge.source)
    : null;

  const leftName = getIndicatorName(leftSource);
  const rightName = getIndicatorName(rightSource);

  if (!leftName || !rightName) return [];

  return [
    {
      indicator: leftName,
      operator: data.operator as ConditionOperator,
      compare_to_indicator: rightName,
    },
  ];
}

function getIndicatorName(node: WorkflowNode | null | undefined): string | null {
  if (!node) return null;

  const data = node.data;

  if (data.nodeType === "price-data") {
    return "price";
  }

  if ("outputName" in data && typeof data.outputName === "string") {
    return data.outputName;
  }

  return null;
}

/**
 * Deserialize a CustomStrategyParams back to a workflow graph
 * (for loading saved strategies)
 */
export function deserializeStrategyToWorkflow(
  config: CustomStrategyParams
): WorkflowGraph {
  const nodes: WorkflowNode[] = [];
  const edges: Edge[] = [];
  let nodeId = 0;

  // 1. Create Price Data node (always present)
  nodes.push({
    id: `node_${nodeId++}`,
    type: "price-data",
    position: { x: 100, y: 300 },
    data: {
      nodeType: "price-data",
      label: "Price",
      isValid: true,
      validationErrors: [],
    },
  });

  // 2. Create indicator nodes
  let yPos = 100;
  for (const indicator of config.indicators) {
    const node = createIndicatorNode(indicator, nodeId++, yPos);
    if (node) {
      nodes.push(node);
      yPos += 150;
    }
  }

  // Note: Full rule deserialization would require more complex graph reconstruction
  // For now, we just create the indicators and let users rebuild the connections

  return {
    nodes,
    edges,
    metadata: {
      name: "Imported Strategy",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

function createIndicatorNode(
  config: IndicatorConfig,
  id: number,
  y: number
): WorkflowNode | null {
  const baseData = {
    label: config.name,
    isValid: true,
    validationErrors: [],
  };

  switch (config.type) {
    case "sma":
      return {
        id: `node_${id}`,
        type: "sma",
        position: { x: 300, y },
        data: {
          ...baseData,
          nodeType: "sma" as const,
          period: config.period || 20,
          outputName: config.name,
        },
      };
    case "ema":
      return {
        id: `node_${id}`,
        type: "ema",
        position: { x: 300, y },
        data: {
          ...baseData,
          nodeType: "ema" as const,
          period: config.period || 20,
          outputName: config.name,
        },
      };
    case "rsi":
      return {
        id: `node_${id}`,
        type: "rsi",
        position: { x: 300, y },
        data: {
          ...baseData,
          nodeType: "rsi" as const,
          period: config.period || 14,
          outputName: config.name,
        },
      };
    case "macd":
      return {
        id: `node_${id}`,
        type: "macd",
        position: { x: 300, y },
        data: {
          ...baseData,
          nodeType: "macd" as const,
          fastPeriod: config.fast_period || 12,
          slowPeriod: config.slow_period || 26,
          signalPeriod: config.signal_period || 9,
          outputName: config.name,
        },
      };
    case "bollinger":
      return {
        id: `node_${id}`,
        type: "bollinger",
        position: { x: 300, y },
        data: {
          ...baseData,
          nodeType: "bollinger" as const,
          period: config.period || 20,
          numStd: config.num_std || 2,
          outputName: config.name,
        },
      };
    default:
      return null;
  }
}
