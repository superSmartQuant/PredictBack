"use client";

import { memo } from "react";
import { BaseNode } from "../BaseNode";
import type { SellSignalNodeData } from "../../types/workflow";

const SellIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 20l-8-8h6V4h4v8h6l-8 8z" />
  </svg>
);

interface Props {
  id: string;
  data: SellSignalNodeData;
  selected?: boolean;
}

export const SellSignalNode = memo(({ id, data, selected }: Props) => {
    return (
      <BaseNode
        id={id}
        title="Sell Signal"
        category="action"
        icon={<SellIcon />}
        inputs={[
          { id: "trigger", type: "target", dataType: "boolean", label: "Trigger" },
        ]}
        outputs={[]}
        isSelected={selected ?? false}
        isValid={data.isValid}
      >
        <div className="text-bearish text-xs font-semibold text-center">
          Execute SELL order
        </div>
      </BaseNode>
    );
  }
);

SellSignalNode.displayName = "SellSignalNode";
