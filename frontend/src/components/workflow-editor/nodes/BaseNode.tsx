"use client";

import { Handle, Position } from "@xyflow/react";
import { useWorkflowStore } from "@/lib/stores/workflowStore";
import type { NodeHandle, NodeCategory, DATA_TYPE_COLORS } from "../types/workflow";

interface BaseNodeProps {
  id: string;
  title: string;
  category: NodeCategory;
  icon: React.ReactNode;
  inputs: NodeHandle[];
  outputs: NodeHandle[];
  isSelected: boolean;
  isValid: boolean;
  children: React.ReactNode;
}

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CATEGORY_BORDER_COLORS: Record<NodeCategory, string> = {
  "data-source": "border-bullish",
  indicator: "border-pink-500",
  condition: "border-orange-400",
  logic: "border-purple-400",
  action: "border-bullish",
};

const CATEGORY_BG_COLORS: Record<NodeCategory, string> = {
  "data-source": "bg-bullish/10",
  indicator: "bg-pink-500/10",
  condition: "bg-orange-400/10",
  logic: "bg-purple-400/10",
  action: "bg-bullish/10",
};

const DATA_TYPE_HEX: Record<string, string> = {
  price: "#26A69A",
  indicator: "#FF4785",
  boolean: "#FFA726",
  signal: "#AB47BC",
};

export function BaseNode({
  id,
  title,
  category,
  icon,
  inputs,
  outputs,
  isSelected,
  isValid,
  children,
}: BaseNodeProps) {
  const removeNode = useWorkflowStore((s) => s.removeNode);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  return (
    <div
      className={`
        min-w-[180px] rounded-lg border-2 overflow-hidden
        bg-bg-secondary shadow-lg
        transition-all duration-200
        ${CATEGORY_BORDER_COLORS[category]}
        ${isSelected ? "ring-2 ring-pink-400 ring-offset-2 ring-offset-bg-primary" : ""}
        ${!isValid ? "border-bearish" : ""}
      `}
    >
      {/* Header */}
      <div
        className={`px-3 py-2 flex items-center gap-2 ${CATEGORY_BG_COLORS[category]}`}
      >
        <span className="text-text-primary">{icon}</span>
        <span className="font-[family-name:var(--font-display)] font-semibold text-sm text-pink-50 flex-1">
          {title}
        </span>
        <button
          onClick={handleDelete}
          className="text-text-tertiary hover:text-bearish transition-colors p-0.5 rounded hover:bg-bg-primary/30"
          title="Delete node"
        >
          <TrashIcon />
        </button>
      </div>

      {/* Body */}
      <div className="p-3 text-sm">{children}</div>

      {/* Input Handles */}
      {inputs.map((input, index) => (
        <Handle
          key={input.id}
          type="target"
          position={Position.Left}
          id={input.id}
          style={{
            top: `${((index + 1) / (inputs.length + 1)) * 100}%`,
            background: DATA_TYPE_HEX[input.dataType],
            width: 12,
            height: 12,
            border: "2px solid var(--bg-primary)",
          }}
          title={input.label || input.dataType}
        />
      ))}

      {/* Output Handles */}
      {outputs.map((output, index) => (
        <Handle
          key={output.id}
          type="source"
          position={Position.Right}
          id={output.id}
          style={{
            top: `${((index + 1) / (outputs.length + 1)) * 100}%`,
            background: DATA_TYPE_HEX[output.dataType],
            width: 12,
            height: 12,
            border: "2px solid var(--bg-primary)",
          }}
          title={output.label || output.dataType}
        />
      ))}
    </div>
  );
}
