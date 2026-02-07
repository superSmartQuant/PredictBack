"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { EMANodeData } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const EMAIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 17h2v5H3v-5zm4-7h2v12H7V10zm4-4h2v16h-2V6zm4 8h2v8h-2v-8zm4-5h2v13h-2V9z" />
  </svg>
);

interface Props {
  id: string;
  data: EMANodeData;
  selected?: boolean;
}

export const EMANode = memo(({ id, data, selected }: Props) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <BaseNode
      id={id}
      title="EMA"
      category="indicator"
      icon={<EMAIcon />}
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
              updateNodeData<EMANodeData>(id, { outputName: e.target.value })
            }
            className="input-field w-full text-xs py-1.5 px-2"
            placeholder="ema_20"
          />
        </div>
        <div>
          <label className="text-text-tertiary text-xs block mb-1">Period</label>
          <input
            type="number"
            value={data.period}
            onChange={(e) =>
              updateNodeData<EMANodeData>(id, {
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

EMANode.displayName = "EMANode";
