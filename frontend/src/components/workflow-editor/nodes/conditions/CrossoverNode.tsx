"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { CrossoverNodeData, CrossoverOperator } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const CrossoverIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 20L20 4" />
    <path d="M4 4L20 20" />
  </svg>
);

const OPERATORS: { value: CrossoverOperator; label: string }[] = [
  { value: "cross_above", label: "Cross Above" },
  { value: "cross_below", label: "Cross Below" },
];

interface Props {
  id: string;
  data: CrossoverNodeData;
  selected?: boolean;
}

export const CrossoverNode = memo(({ id, data, selected }: Props) => {
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

    return (
      <BaseNode
        id={id}
        title="Crossover"
        category="condition"
        icon={<CrossoverIcon />}
        inputs={[
          { id: "left", type: "target", dataType: "indicator", label: "Line A" },
          { id: "right", type: "target", dataType: "indicator", label: "Line B" },
        ]}
        outputs={[
          { id: "result", type: "source", dataType: "boolean", label: "Result" },
        ]}
        isSelected={selected ?? false}
        isValid={data.isValid}
      >
        <div>
          <label className="text-text-tertiary text-xs block mb-1">Type</label>
          <select
            value={data.operator}
            onChange={(e) =>
              updateNodeData<CrossoverNodeData>(id, {
                operator: e.target.value as CrossoverOperator,
              })
            }
            className="input-field w-full text-xs py-1.5 px-2"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <p className="text-text-tertiary text-[10px] mt-1">
            A {data.operator === "cross_above" ? "crosses above" : "crosses below"} B
          </p>
        </div>
      </BaseNode>
    );
  }
);

CrossoverNode.displayName = "CrossoverNode";
