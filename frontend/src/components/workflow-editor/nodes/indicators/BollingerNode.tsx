"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { BollingerNodeData } from "../../types/workflow";
import { useWorkflowStore } from "@/lib/stores/workflowStore";

const BollingerIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 6c4 0 8 4 10 6s6 6 10 6" />
    <path d="M2 12c4 0 8 2 10 3s6 3 10 3" />
    <path d="M2 18c4 0 8-4 10-6s6-6 10-6" />
  </svg>
);

interface Props {
  id: string;
  data: BollingerNodeData;
  selected?: boolean;
}

export const BollingerNode = memo(({ id, data, selected }: Props) => {
    const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

    return (
      <BaseNode
        id={id}
        title="Bollinger"
        category="indicator"
        icon={<BollingerIcon />}
        inputs={[{ id: "price-in", type: "target", dataType: "price", label: "Price" }]}
        outputs={[
          { id: "upper-out", type: "source", dataType: "indicator", label: "Upper" },
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
                updateNodeData<BollingerNodeData>(id, { outputName: e.target.value })
              }
              className="input-field w-full text-xs py-1.5 px-2"
              placeholder="bb"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-text-tertiary text-xs block mb-1">Period</label>
              <input
                type="number"
                value={data.period}
                onChange={(e) =>
                  updateNodeData<BollingerNodeData>(id, {
                    period: parseInt(e.target.value) || 20,
                  })
                }
                className="input-field w-full text-xs py-1.5 px-2 font-[family-name:var(--font-mono)]"
                min={1}
              />
            </div>
            <div>
              <label className="text-text-tertiary text-xs block mb-1">Std Dev</label>
              <input
                type="number"
                value={data.numStd}
                onChange={(e) =>
                  updateNodeData<BollingerNodeData>(id, {
                    numStd: parseFloat(e.target.value) || 2,
                  })
                }
                className="input-field w-full text-xs py-1.5 px-2 font-[family-name:var(--font-mono)]"
                min={0.1}
                step={0.1}
              />
            </div>
          </div>
        </div>
      </BaseNode>
    );
  }
);

BollingerNode.displayName = "BollingerNode";
