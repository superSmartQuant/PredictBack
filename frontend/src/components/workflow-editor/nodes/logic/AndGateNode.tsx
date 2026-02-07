"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { AndGateNodeData, NodeHandle } from "../../types/workflow";

const AndIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <text x="4" y="18" fontSize="14" fontWeight="bold">
      &amp;
    </text>
  </svg>
);

interface Props {
  id: string;
  data: AndGateNodeData;
  selected?: boolean;
}

export const AndGateNode = memo(({ id, data, selected }: Props) => {
    // Create dynamic inputs based on inputCount
    const inputs: NodeHandle[] = Array.from({ length: data.inputCount }, (_, i) => ({
      id: `input-${i}`,
      type: "target" as const,
      dataType: "boolean" as const,
      label: `Input ${i + 1}`,
    }));

    return (
      <BaseNode
        id={id}
        title="AND"
        category="logic"
        icon={<AndIcon />}
        inputs={inputs}
        outputs={[
          { id: "result", type: "source", dataType: "boolean", label: "Result" },
        ]}
        isSelected={selected ?? false}
        isValid={data.isValid}
      >
        <div className="text-text-tertiary text-xs text-center">
          All conditions must be true
        </div>
      </BaseNode>
    );
  }
);

AndGateNode.displayName = "AndGateNode";
