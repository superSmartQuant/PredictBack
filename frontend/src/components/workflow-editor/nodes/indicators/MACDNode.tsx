"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { MACDNodeData } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const MACDIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <rect x="2" y="14" width="3" height="8" />
    <rect x="7" y="10" width="3" height="12" />
    <rect x="12" y="6" width="3" height="16" />
    <rect x="17" y="2" width="3" height="20" />
  </svg>
);

interface Props {
  id: string;
  data: MACDNodeData;
  selected?: boolean;
}

export const MACDNode = memo(({ id, data, selected }: Props) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <BaseNode
      id={id}
      title="MACD"
      category="indicator"
      icon={<MACDIcon />}
      inputs={[{ id: "price-in", type: "target", dataType: "price", label: "Price" }]}
      outputs={[
        { id: "macd-out", type: "source", dataType: "indicator", label: "MACD" },
      ]}
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
              updateNodeData<MACDNodeData>(id, { outputName: e.target.value })
            }
            className="input-field w-full text-xs py-1.5 px-2"
            placeholder="macd"
          />
        </div>
        <div className="grid grid-cols-3 gap-1">
          <div>
            <label className="text-text-tertiary text-[10px] block mb-1">Fast</label>
            <input
              type="number"
              value={data.fastPeriod}
              onChange={(e) =>
                updateNodeData<MACDNodeData>(id, {
                  fastPeriod: parseInt(e.target.value) || 12,
                })
              }
              className="input-field w-full text-xs py-1 px-1.5 font-[family-name:var(--font-mono)]"
              min={1}
            />
          </div>
          <div>
            <label className="text-text-tertiary text-[10px] block mb-1">Slow</label>
            <input
              type="number"
              value={data.slowPeriod}
              onChange={(e) =>
                updateNodeData<MACDNodeData>(id, {
                  slowPeriod: parseInt(e.target.value) || 26,
                })
              }
              className="input-field w-full text-xs py-1 px-1.5 font-[family-name:var(--font-mono)]"
              min={1}
            />
          </div>
          <div>
            <label className="text-text-tertiary text-[10px] block mb-1">Signal</label>
            <input
              type="number"
              value={data.signalPeriod}
              onChange={(e) =>
                updateNodeData<MACDNodeData>(id, {
                  signalPeriod: parseInt(e.target.value) || 9,
                })
              }
              className="input-field w-full text-xs py-1 px-1.5 font-[family-name:var(--font-mono)]"
              min={1}
            />
          </div>
        </div>
      </div>
    </BaseNode>
  );
});

MACDNode.displayName = "MACDNode";
