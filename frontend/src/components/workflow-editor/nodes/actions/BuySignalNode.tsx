"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { BuySignalNodeData } from "../../types/workflow";

const BuyIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 4l8 8h-6v8h-4v-8H4l8-8z" />
  </svg>
);

interface Props {
  id: string;
  data: BuySignalNodeData;
  selected?: boolean;
}

export const BuySignalNode = memo(({ id, data, selected }: Props) => {
    return (
      <BaseNode
        id={id}
        title="Buy Signal"
        category="action"
        icon={<BuyIcon />}
        inputs={[
          { id: "trigger", type: "target", dataType: "boolean", label: "Trigger" },
        ]}
        outputs={[]}
        isSelected={selected ?? false}
        isValid={data.isValid}
      >
        <div className="text-bullish text-xs font-semibold text-center">
          Execute BUY order
        </div>
      </BaseNode>
    );
  }
);

BuySignalNode.displayName = "BuySignalNode";
