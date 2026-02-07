"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { CompareNodeData, ComparisonOperator } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const CompareIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 5l7 7-7 7V5z" />
  </svg>
);

const OPERATORS: { value: ComparisonOperator; label: string }[] = [
  { value: ">", label: ">" },
  { value: "<", label: "<" },
  { value: ">=", label: ">=" },
  { value: "<=", label: "<=" },
];

interface Props {
  id: string;
  data: CompareNodeData;
  selected?: boolean;
}

export const CompareNode = memo(({ id, data, selected }: Props) => {
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

    return (
      <BaseNode
        id={id}
        title="Compare"
        category="condition"
        icon={<CompareIcon />}
        inputs={[
          { id: "left", type: "target", dataType: "indicator", label: "Left" },
          { id: "right", type: "target", dataType: "indicator", label: "Right" },
        ]}
        outputs={[
          { id: "result", type: "source", dataType: "boolean", label: "Result" },
        ]}
        isSelected={selected ?? false}
        isValid={data.isValid}
      >
        <div className="space-y-2">
          <div>
            <label className="text-text-tertiary text-xs block mb-1">Operator</label>
            <select
              value={data.operator}
              onChange={(e) =>
                updateNodeData<CompareNodeData>(id, {
                  operator: e.target.value as ComparisonOperator,
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
          </div>
          <div>
            <label className="text-text-tertiary text-xs block mb-1">
              Value (if no right input)
            </label>
            <input
              type="number"
              value={data.compareToValue ?? ""}
              onChange={(e) =>
                updateNodeData<CompareNodeData>(id, {
                  compareToValue: e.target.value
                    ? parseFloat(e.target.value)
                    : undefined,
                })
              }
              className="input-field w-full text-xs py-1.5 px-2 font-[family-name:var(--font-mono)]"
              placeholder="e.g. 30"
              step="any"
            />
          </div>
        </div>
      </BaseNode>
    );
  }
);

CompareNode.displayName = "CompareNode";
