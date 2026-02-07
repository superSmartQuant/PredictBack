"use client";

import { paletteItems } from "../nodes";
import type { NodeCategory } from "../types/workflow";

const CATEGORY_LABELS: Record<NodeCategory, string> = {
  "data-source": "Data Sources",
  indicator: "Indicators",
  condition: "Conditions",
  logic: "Logic Gates",
  action: "Actions",
};

const CATEGORY_ORDER: NodeCategory[] = [
  "data-source",
  "indicator",
  "condition",
  "logic",
  "action",
];

const CATEGORY_COLORS: Record<NodeCategory, string> = {
  "data-source": "border-bullish",
  indicator: "border-pink-500",
  condition: "border-orange-400",
  logic: "border-purple-400",
  action: "border-bullish",
};

export function NodePalette() {
  const onDragStart = (
    event: React.DragEvent,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const groupedItems = CATEGORY_ORDER.map((category) => ({
    category,
    items: paletteItems.filter((item) => item.category === category),
  }));

  return (
    <div className="p-4">
      <h2 className="font-[family-name:var(--font-display)] font-semibold text-pink-50 mb-4">
        Node Palette
      </h2>
      <p className="text-text-tertiary text-xs mb-4">
        Drag nodes onto the canvas to build your strategy
      </p>

      <div className="space-y-4">
        {groupedItems.map(({ category, items }) => (
          <div key={category}>
            <h3 className="text-text-secondary text-xs font-semibold uppercase tracking-wider mb-2">
              {CATEGORY_LABELS[category]}
            </h3>
            <div className="space-y-1.5">
              {items.map((item) => (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                  className={`
                    p-2.5 rounded-lg bg-bg-tertiary border-l-4
                    ${CATEGORY_COLORS[item.category]}
                    cursor-grab active:cursor-grabbing
                    hover:bg-bg-elevated transition-colors
                    select-none
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{item.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-text-primary">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-text-tertiary">
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
