"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { SMANodeData } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const SMAIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h2v9H3v-9zm4-6h2v15H7V7zm4-4h2v19h-2V3zm4 9h2v10h-2v-10zm4-3h2v13h-2V9z" />
  </svg>
);

interface Props {
  id: string;
  data: SMANodeData;
  selected?: boolean;
}

export const SMANode = memo(({ id, data, selected }: Props) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <BaseNode
      id={id}
      title="SMA"
      category="indicator"
      icon={<SMAIcon />}
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
              updateNodeData<SMANodeData>(id, { outputName: e.target.value })
            }
            className="input-field w-full text-xs py-1.5 px-2"
            placeholder="sma_20"
          />
        </div>
        <div>
          <label className="text-text-tertiary text-xs block mb-1">Period</label>
          <input
            type="number"
            value={data.period}
            onChange={(e) =>
              updateNodeData<SMANodeData>(id, {
                period: parseInt(e.target.value) || 20,
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

SMANode.displayName = "SMANode";
