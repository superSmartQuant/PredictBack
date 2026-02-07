import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Connection,
} from "@xyflow/react";
import type {
  WorkflowNode,
  WorkflowNodeData,
  WorkflowGraph,
  ValidationError,
} from "@/components/workflow-editor/types/workflow";

interface WorkflowState {
  // Graph state
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Metadata
  workflowName: string;
  workflowDescription: string;
  isDirty: boolean;

  // Strategy parameters
  orderSize: string;
  initialBalance: string;

  // Validation
  isValid: boolean;
  validationErrors: ValidationError[];

  // Node ID counter
  nodeIdCounter: number;

  // Actions
  onNodesChange: OnNodesChange<WorkflowNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;

  addNode: (node: WorkflowNode) => void;
  removeNode: (nodeId: string) => void;
  updateNodeData: <T extends WorkflowNodeData>(
    nodeId: string,
    data: Partial<T>
  ) => void;

  setSelectedNode: (nodeId: string | null) => void;

  setOrderSize: (size: string) => void;
  setInitialBalance: (balance: string) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;

  validateWorkflow: () => void;
  clearWorkflow: () => void;
  loadWorkflow: (graph: WorkflowGraph) => void;
  exportWorkflow: () => WorkflowGraph;

  getNextNodeId: () => string;
}

// Validation helper
function validateConnection(
  connection: Connection,
  nodes: WorkflowNode[],
  edges: Edge[]
): boolean {
  const sourceNode = nodes.find((n) => n.id === connection.source);
  const targetNode = nodes.find((n) => n.id === connection.target);

  if (!sourceNode || !targetNode) return false;

  // Prevent self-connections
  if (connection.source === connection.target) return false;

  // Prevent duplicate connections
  const existingEdge = edges.find(
    (e) =>
      e.source === connection.source &&
      e.target === connection.target &&
      e.sourceHandle === connection.sourceHandle &&
      e.targetHandle === connection.targetHandle
  );
  if (existingEdge) return false;

  return true;
}

// Workflow validation
function validateWorkflowGraph(
  nodes: WorkflowNode[],
  edges: Edge[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Must have at least one indicator
  const indicatorNodes = nodes.filter((n) =>
    ["sma", "ema", "rsi", "macd", "bollinger"].includes(n.data.nodeType)
  );
  if (indicatorNodes.length === 0) {
    errors.push({
      type: "error",
      message: "Strategy must have at least one indicator",
    });
  }

  // Must have at least one buy or sell signal
  const hasSignals = nodes.some((n) =>
    ["buy-signal", "sell-signal"].includes(n.data.nodeType)
  );
  if (!hasSignals) {
    errors.push({
      type: "error",
      message: "Strategy must have at least one Buy or Sell signal",
    });
  }

  // All signals must be connected
  const signalNodes = nodes.filter((n) =>
    ["buy-signal", "sell-signal"].includes(n.data.nodeType)
  );
  for (const signal of signalNodes) {
    const hasInput = edges.some((e) => e.target === signal.id);
    if (!hasInput) {
      errors.push({
        nodeId: signal.id,
        type: "error",
        message: `${signal.data.label} is not connected to any conditions`,
      });
    }
  }

  // Unique indicator names
  const names = indicatorNodes.map(
    (n) => (n.data as { outputName?: string }).outputName
  );
  const seen = new Set<string>();
  for (const name of names) {
    if (name && seen.has(name)) {
      errors.push({
        type: "error",
        message: `Duplicate indicator name: "${name}"`,
      });
    }
    if (name) seen.add(name);
  }

  // Condition nodes must have inputs connected
  const conditionNodes = nodes.filter((n) =>
    ["compare", "crossover"].includes(n.data.nodeType)
  );
  for (const cond of conditionNodes) {
    const inputEdges = edges.filter((e) => e.target === cond.id);
    if (inputEdges.length < 1) {
      errors.push({
        nodeId: cond.id,
        type: "error",
        message: `${cond.data.label} needs at least one input`,
      });
    }
  }

  return errors;
}

export const useWorkflowStore = create<WorkflowState>()(
  persist(
    (set, get) => ({
      nodes: [],
      edges: [],
      selectedNodeId: null,

      workflowName: "Untitled Strategy",
      workflowDescription: "",
      isDirty: false,

      orderSize: "100",
      initialBalance: "10000",

      isValid: false,
      validationErrors: [],

      nodeIdCounter: 0,

      onNodesChange: (changes) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
          isDirty: true,
        });
      },

      onEdgesChange: (changes) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
          isDirty: true,
        });
      },

      onConnect: (connection) => {
        if (validateConnection(connection, get().nodes, get().edges)) {
          set({
            edges: addEdge(
              {
                ...connection,
                type: "smoothstep",
                animated: true,
                style: { stroke: "var(--pink-400)", strokeWidth: 2 },
              },
              get().edges
            ),
            isDirty: true,
          });
        }
      },

      addNode: (node) => {
        set({
          nodes: [...get().nodes, node],
          isDirty: true,
        });
      },

      removeNode: (nodeId) => {
        set({
          nodes: get().nodes.filter((n) => n.id !== nodeId),
          edges: get().edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
          selectedNodeId:
            get().selectedNodeId === nodeId ? null : get().selectedNodeId,
          isDirty: true,
        });
      },

      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } }
              : node
          ),
          isDirty: true,
        });
      },

      setSelectedNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
      },

      setOrderSize: (size) => {
        set({ orderSize: size, isDirty: true });
      },

      setInitialBalance: (balance) => {
        set({ initialBalance: balance, isDirty: true });
      },

      setWorkflowName: (name) => {
        set({ workflowName: name, isDirty: true });
      },

      setWorkflowDescription: (description) => {
        set({ workflowDescription: description, isDirty: true });
      },

      validateWorkflow: () => {
        const { nodes, edges } = get();
        const errors = validateWorkflowGraph(nodes, edges);
        set({
          isValid: errors.length === 0,
          validationErrors: errors,
        });
      },

      clearWorkflow: () => {
        set({
          nodes: [],
          edges: [],
          selectedNodeId: null,
          workflowName: "Untitled Strategy",
          workflowDescription: "",
          isDirty: false,
          isValid: false,
          validationErrors: [],
          nodeIdCounter: 0,
        });
      },

      loadWorkflow: (graph) => {
        const maxId = graph.nodes.reduce((max, node) => {
          const match = node.id.match(/node_(\d+)/);
          return match ? Math.max(max, parseInt(match[1])) : max;
        }, 0);

        set({
          nodes: graph.nodes,
          edges: graph.edges,
          workflowName: graph.metadata.name,
          workflowDescription: graph.metadata.description || "",
          isDirty: false,
          nodeIdCounter: maxId + 1,
        });
        get().validateWorkflow();
      },

      exportWorkflow: () => ({
        nodes: get().nodes,
        edges: get().edges,
        metadata: {
          name: get().workflowName,
          description: get().workflowDescription,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      }),

      getNextNodeId: () => {
        const id = `node_${get().nodeIdCounter}`;
        set({ nodeIdCounter: get().nodeIdCounter + 1 });
        return id;
      },
    }),
    {
      name: "workflow-storage",
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
        workflowName: state.workflowName,
        workflowDescription: state.workflowDescription,
        orderSize: state.orderSize,
        initialBalance: state.initialBalance,
        nodeIdCounter: state.nodeIdCounter,
      }),
    }
  )
);
