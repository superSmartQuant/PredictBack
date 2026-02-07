"use client";

import { memo } from "react";
import { BaseNode } from "./BaseNode";
import type { PriceDataNodeData } from "../types/workflow";

const PriceIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M3 3v18h18" />
    <path d="M18 9l-5 5-4-4-3 3" />
  </svg>
);

interface Props {
  id: string;
  data: PriceDataNodeData;
  selected?: boolean;
}

export const PriceDataNode = memo(({ id, data, selected }: Props) => {
  return (
    <BaseNode
      id={id}
      title="Price Data"
      category="data-source"
      icon={<PriceIcon />}
      inputs={[]}
      outputs={[{ id: "price-out", type: "source", dataType: "price", label: "Price" }]}
      isSelected={selected ?? false}
      isValid={data.isValid}
    >
      <div className="text-text-tertiary text-xs">
        Current market price
      </div>
    </BaseNode>
  );
});

PriceDataNode.displayName = "PriceDataNode";
