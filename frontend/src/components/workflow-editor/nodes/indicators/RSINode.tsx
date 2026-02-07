"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { RSINodeData } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const RSIIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2 12h4l3-9 6 18 3-9h4" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

interface Props {
  id: string;
  data: RSINodeData;
  selected?: boolean;
}

export const RSINode = memo(({ id, data, selected }: Props) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <BaseNode
      id={id}
      title="RSI"
      category="indicator"
      icon={<RSIIcon />}
      inputs={[{ id: "price-in", type: "target", dataType: "price", label: "Price" }]}
      outputs={[{ id: "value-out", type: "source", dataType: "indicator", label: "Value" }]}
      isSelected={selected ?? false}
      isValid={data.isValid}
    >
      <div className="space-y-2">
        <div>
          <label className="text-text-tertiary text-xs block mb-1">Name</label>
          <input
            type="text"
            value={data.outputName}
            onChange={(e) =>
              updateNodeData<RSINodeData>(id, { outputName: e.target.value })
            }
            className="input-field w-full text-xs py-1.5 px-2"
            placeholder="rsi_14"
          />
        </div>
        <div>
          <label className="text-text-tertiary text-xs block mb-1">Period</label>
          <input
            type="number"
            value={data.period}
            onChange={(e) =>
              updateNodeData<RSINodeData>(id, {
                period: parseInt(e.target.value) || 14,
              })
            }
            className="input-field w-full text-xs py-1.5 px-2 font-[family-name:var(--font-mono)]"
            min={1}
          />
        </div>
      </div>
    </BaseNode>
  );
});

RSINode.displayName = "RSINode";
