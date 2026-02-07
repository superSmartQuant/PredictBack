"use client";

import { useCallback, useRef, useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useWorkflowStore } from "@/lib/stores/workflowStore";
import { nodeTypes, createDefaultNodeData } from "./nodes";
import { NodePalette } from "./panels/NodePalette";
import { serializeWorkflowToStrategy } from "./utils/serialization";
import type { CustomStrategyParams } from "@/lib/api";
import type { WorkflowNodeType, WorkflowNode } from "./types/workflow";

interface WorkflowEditorProps {
  onRunBacktest?: (strategyConfig: CustomStrategyParams) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReactFlowInstanceType = { screenToFlowPosition: (pos: { x: number; y: number }) => { x: number; y: number } };

function WorkflowEditorInner({ onRunBacktest }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstanceType | null>(null);

  const {
    nodes,
    edges,
    orderSize,
    initialBalance,
    isValid,
    validationErrors,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNode,
    validateWorkflow,
    clearWorkflow,
    exportWorkflow,
    getNextNodeId,
    setOrderSize,
    setInitialBalance,
  } = useWorkflowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const nodeType = event.dataTransfer.getData(
        "application/reactflow/type"
      ) as WorkflowNodeType;
      if (!nodeType) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds || !reactFlowInstance.current) return;

      const position = reactFlowInstance.current.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: WorkflowNode = {
        id: getNextNodeId(),
        type: nodeType,
        position,
        data: createDefaultNodeData(nodeType),
      };

      addNode(newNode);
    },
    [addNode, getNextNodeId]
  );

  const handleValidate = useCallback(() => {
    validateWorkflow();
  }, [validateWorkflow]);

  const handleRunBacktest = useCallback(() => {
    validateWorkflow();

    // Get fresh state after validation
    const state = useWorkflowStore.getState();
    if (!state.isValid) {
      return;
    }

    const graph = exportWorkflow();
    const strategyConfig = serializeWorkflowToStrategy(
      graph,
      orderSize,
      initialBalance
    );
    onRunBacktest?.(strategyConfig);
  }, [validateWorkflow, exportWorkflow, orderSize, initialBalance, onRunBacktest]);

  const handleClear = useCallback(() => {
    if (confirm("Clear the entire workflow? This cannot be undone.")) {
      clearWorkflow();
    }
  }, [clearWorkflow]);

  // Memoize minimap node color function
  const minimapNodeColor = useMemo(() => {
    return (node: WorkflowNode) => {
      const type = node.data?.nodeType;
      if (!type) return "#787B86";

      if (type === "price-data") return "#26A69A";
      if (["sma", "ema", "rsi", "macd", "bollinger"].includes(type))
        return "#FF4785";
      if (["compare", "crossover"].includes(type)) return "#FFA726";
      if (["and-gate", "or-gate"].includes(type)) return "#AB47BC";
      if (["buy-signal", "sell-signal"].includes(type)) return "#26A69A";
      return "#787B86";
    };
  }, []);

  return (
    <div className="h-full flex">
      {/* Left Panel - Node Palette */}
      <div className="w-64 border-r border-border bg-bg-secondary overflow-y-auto flex-shrink-0">
        <NodePalette />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNode(node.id)}
          onPaneClick={() => setSelectedNode(null)}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onInit={(instance) => {
            reactFlowInstance.current = instance as unknown as ReactFlowInstanceType;
          }}
          nodeTypes={nodeTypes}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          className="bg-bg-primary"
          defaultEdgeOptions={{
            type: "smoothstep",
            animated: true,
            style: { stroke: "var(--pink-400)", strokeWidth: 2 },
          }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            color="var(--border)"
          />
          <Controls
            className="!bg-bg-secondary !border-border [&>button]:!bg-bg-tertiary [&>button]:!border-border [&>button]:!text-text-primary [&>button:hover]:!bg-bg-elevated"
          />
          <MiniMap
            className="!bg-bg-secondary !border-border"
            nodeColor={minimapNodeColor}
            maskColor="rgba(13, 14, 18, 0.8)"
          />

          {/* Top Toolbar */}
          <Panel position="top-center">
            <div className="flex items-center gap-3 bg-bg-secondary border border-border rounded-lg px-4 py-2 shadow-lg">
              <div className="flex items-center gap-2">
                <label className="text-text-tertiary text-xs">Order Size</label>
                <input
                  type="text"
                  value={orderSize}
                  onChange={(e) => setOrderSize(e.target.value)}
                  className="input-field w-20 text-xs py-1 px-2 font-[family-name:var(--font-mono)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-text-tertiary text-xs">Balance</label>
                <input
                  type="text"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="input-field w-24 text-xs py-1 px-2 font-[family-name:var(--font-mono)]"
                />
              </div>
              <div className="w-px h-6 bg-border" />
              <button
                onClick={handleValidate}
                className="text-xs text-text-secondary hover:text-text-primary transition-colors px-2 py-1"
              >
                Validate
              </button>
              <button
                onClick={handleClear}
                className="text-xs text-text-secondary hover:text-bearish transition-colors px-2 py-1"
              >
                Clear
              </button>
              {onRunBacktest && (
                <button
                  onClick={handleRunBacktest}
                  disabled={!isValid && validationErrors.length > 0}
                  className="btn-primary text-xs py-1.5 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Run Backtest
                </button>
              )}
            </div>
          </Panel>

          {/* Validation Errors Panel */}
          {validationErrors.length > 0 && (
            <Panel position="bottom-center">
              <div className="bg-bg-secondary border border-bearish/50 rounded-lg px-4 py-2 max-w-md">
                <div className="text-bearish text-xs font-semibold mb-1">
                  Validation Errors
                </div>
                <ul className="text-text-secondary text-xs space-y-0.5">
                  {validationErrors.map((error, i) => (
                    <li key={i}>• {error.message}</li>
                  ))}
                </ul>
              </div>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}

export function WorkflowEditor(props: WorkflowEditorProps) {
  return (
    <ReactFlowProvider>
      <WorkflowEditorInner {...props} />
    </ReactFlowProvider>
  );
}
