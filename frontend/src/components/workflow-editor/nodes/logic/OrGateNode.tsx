"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { OrGateNodeData, NodeHandle } from "../../types/workflow";

const OrIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <text x="4" y="18" fontSize="14" fontWeight="bold">
      |
    </text>
  </svg>
);

interface Props {
  id: string;
  data: OrGateNodeData;
  selected?: boolean;
}

export const OrGateNode = memo(({ id, data, selected }: Props) => {
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
        title="OR"
        category="logic"
        icon={<OrIcon />}
        inputs={inputs}
        outputs={[
          { id: "result", type: "source", dataType: "boolean", label: "Result" },
        ]}
        isSelected={selected ?? false}
        isValid={data.isValid}
      >
        <div className="text-text-tertiary text-xs text-center">
          Any condition must be true
        </div>
      </BaseNode>
    );
  }
);

OrGateNode.displayName = "OrGateNode";
