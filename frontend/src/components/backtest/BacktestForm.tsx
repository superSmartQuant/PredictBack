"use client";

import { useState } from "react";
import Link from "next/link";
import {
  runBacktest,
  BacktestResult,
  GridStrategyParams,
  MomentumStrategyParams,
  CustomStrategyParams,
  IndicatorConfig,
  IndicatorType,
  TradingRule,
  RuleCondition,
  ConditionOperator,
} from "@/lib/api";
import { WorkflowEditor } from "@/components/workflow-editor";
import { useWorkflowStore } from "@/lib/stores/workflowStore";
import {
  useSavedStrategiesStore,
  type FormStrategyData,
  type VisualStrategyData,
} from "@/lib/stores/savedStrategiesStore";
import { SavedStrategies, SaveStrategyModal } from "./SavedStrategies";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

type StrategyType = "grid" | "momentum" | "custom";

interface GridFormData {
  grid_size: number;
  grid_spacing: string;
  order_size: string;
  initial_balance: string;
}

interface MomentumFormData {
  lookback_window: number;
  momentum_threshold: string;
  order_size: string;
  initial_balance: string;
}

interface CustomFormData {
  indicators: IndicatorConfig[];
  buy_rules: TradingRule[];
  sell_rules: TradingRule[];
  order_size: string;
  initial_balance: string;
}

// Props for the shared component
interface BacktestFormProps {
  // Mode determines what identifiers are used
  mode: "continuous" | "event-based";
  // For event-based markets
  marketId?: string;
  // For continuous markets
  topic?: string;
  // Back link configuration
  backLink: {
    href: string;
    label: string;
  };
  // Title and subtitle
  title: string;
  subtitle?: string;
}

// Default indicator configs by type
const DEFAULT_INDICATOR_CONFIGS: Record<IndicatorType, Partial<IndicatorConfig>> = {
  sma: { period: 20 },
  ema: { period: 20 },
  rsi: { period: 14 },
  macd: { fast_period: 12, slow_period: 26, signal_period: 9 },
  bollinger: { period: 20, num_std: 2 },
};

const INDICATOR_LABELS: Record<IndicatorType, string> = {
  sma: "SMA (Simple Moving Average)",
  ema: "EMA (Exponential Moving Average)",
  rsi: "RSI (Relative Strength Index)",
  macd: "MACD",
  bollinger: "Bollinger Bands",
};

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  ">": "Greater than",
  "<": "Less than",
  ">=": "Greater or equal",
  "<=": "Less or equal",
  "cross_above": "Crosses above",
  "cross_below": "Crosses below",
};

export function BacktestForm({ mode, marketId, topic, backLink, title, subtitle }: BacktestFormProps) {
  const [strategy, setStrategy] = useState<StrategyType>("grid");
  const [feeRate, setFeeRate] = useState("0.001");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [useVisualEditor, setUseVisualEditor] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // For continuous markets
  const [amountOfMarkets, setAmountOfMarkets] = useState(5);

  // Saved strategies
  const { saveStrategy } = useSavedStrategiesStore();
  const workflowStore = useWorkflowStore();

  const [gridForm, setGridForm] = useState<GridFormData>({
    grid_size: 5,
    grid_spacing: "0.02",
    order_size: "100",
    initial_balance: "10000",
  });

  const [momentumForm, setMomentumForm] = useState<MomentumFormData>({
    lookback_window: 10,
    momentum_threshold: "0.005",
    order_size: "100",
    initial_balance: "10000",
  });

  const [customForm, setCustomForm] = useState<CustomFormData>({
    indicators: [
      { type: "ema", name: "fast_ema", period: 12 },
      { type: "ema", name: "slow_ema", period: 26 },
    ],
    buy_rules: [
      {
        conditions: [
          { indicator: "fast_ema", operator: ">", compare_to_indicator: "slow_ema" },
        ],
      },
    ],
    sell_rules: [
      {
        conditions: [
          { indicator: "fast_ema", operator: "<", compare_to_indicator: "slow_ema" },
        ],
      },
    ],
    order_size: "100",
    initial_balance: "10000",
  });

  // Indicator management
  const addIndicator = () => {
    const newName = `indicator_${customForm.indicators.length + 1}`;
    setCustomForm({
      ...customForm,
      indicators: [
        ...customForm.indicators,
        { type: "sma", name: newName, ...DEFAULT_INDICATOR_CONFIGS.sma },
      ],
    });
  };

  const removeIndicator = (index: number) => {
    const newIndicators = customForm.indicators.filter((_, i) => i !== index);
    setCustomForm({ ...customForm, indicators: newIndicators });
  };

  const updateIndicator = (index: number, updates: Partial<IndicatorConfig>) => {
    const newIndicators = [...customForm.indicators];
    newIndicators[index] = { ...newIndicators[index], ...updates };

    // If type changed, apply default config for that type
    if (updates.type && updates.type !== customForm.indicators[index].type) {
      newIndicators[index] = {
        ...newIndicators[index],
        ...DEFAULT_INDICATOR_CONFIGS[updates.type],
        type: updates.type,
      };
    }

    setCustomForm({ ...customForm, indicators: newIndicators });
  };

  // Rule management
  const addRule = (ruleType: "buy" | "sell") => {
    const key = ruleType === "buy" ? "buy_rules" : "sell_rules";
    setCustomForm({
      ...customForm,
      [key]: [
        ...customForm[key],
        { conditions: [{ indicator: "price", operator: ">", value: 0 }] },
      ],
    });
  };

  const removeRule = (ruleType: "buy" | "sell", index: number) => {
    const key = ruleType === "buy" ? "buy_rules" : "sell_rules";
    const newRules = customForm[key].filter((_, i) => i !== index);
    setCustomForm({ ...customForm, [key]: newRules });
  };

  const addCondition = (ruleType: "buy" | "sell", ruleIndex: number) => {
    const key = ruleType === "buy" ? "buy_rules" : "sell_rules";
    const newRules = [...customForm[key]];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      conditions: [
        ...newRules[ruleIndex].conditions,
        { indicator: "price", operator: ">", value: 0 },
      ],
    };
    setCustomForm({ ...customForm, [key]: newRules });
  };

  const removeCondition = (ruleType: "buy" | "sell", ruleIndex: number, condIndex: number) => {
    const key = ruleType === "buy" ? "buy_rules" : "sell_rules";
    const newRules = [...customForm[key]];
    newRules[ruleIndex] = {
      ...newRules[ruleIndex],
      conditions: newRules[ruleIndex].conditions.filter((_, i) => i !== condIndex),
    };
    setCustomForm({ ...customForm, [key]: newRules });
  };

  const updateCondition = (
    ruleType: "buy" | "sell",
    ruleIndex: number,
    condIndex: number,
    updates: Partial<RuleCondition>
  ) => {
    const key = ruleType === "buy" ? "buy_rules" : "sell_rules";
    const newRules = [...customForm[key]];
    const newConditions = [...newRules[ruleIndex].conditions];
    newConditions[condIndex] = { ...newConditions[condIndex], ...updates };
    newRules[ruleIndex] = { ...newRules[ruleIndex], conditions: newConditions };
    setCustomForm({ ...customForm, [key]: newRules });
  };

  // Get available indicator names for conditions
  const getAvailableIndicators = (): string[] => {
    const names = ["price", ...customForm.indicators.map((i) => i.name)];
    // Add special indicator values
    customForm.indicators.forEach((ind) => {
      if (ind.type === "macd") {
        names.push(`${ind.name}_signal`, `${ind.name}_histogram`);
      }
      if (ind.type === "bollinger") {
        names.push(`${ind.name}_upper`, `${ind.name}_lower`, `${ind.name}_middle`);
      }
    });
    return names;
  };

  // Validate form strategy
  const validateFormStrategy = (): string[] => {
    const errors: string[] = [];
    if (customForm.indicators.length === 0) {
      errors.push("Strategy must have at least one indicator");
    }
    if (customForm.buy_rules.length === 0 && customForm.sell_rules.length === 0) {
      errors.push("Strategy must have at least one buy or sell rule");
    }
    return errors;
  };

  // Save strategy handler
  const handleSaveStrategy = (name: string, description: string) => {
    if (useVisualEditor) {
      // Validate visual editor strategy
      workflowStore.validateWorkflow();
      const state = useWorkflowStore.getState();
      if (!state.isValid) {
        setError("Cannot save: " + state.validationErrors.map(e => e.message).join(", "));
        return;
      }

      // Save visual editor strategy
      const workflow = workflowStore.exportWorkflow();
      const data: VisualStrategyData = {
        type: "visual",
        workflow,
        orderSize: workflowStore.orderSize,
        initialBalance: workflowStore.initialBalance,
      };
      saveStrategy(name, description || undefined, data);
    } else {
      // Validate form strategy
      const validationErrors = validateFormStrategy();
      if (validationErrors.length > 0) {
        setError("Cannot save: " + validationErrors.join(", "));
        return;
      }

      // Save form-based strategy
      const data: FormStrategyData = {
        type: "form",
        indicators: customForm.indicators,
        buy_rules: customForm.buy_rules,
        sell_rules: customForm.sell_rules,
        order_size: customForm.order_size,
        initial_balance: customForm.initial_balance,
      };
      saveStrategy(name, description || undefined, data);
    }
    setError(null); // Clear any previous errors on successful save
  };

  // Load form strategy handler
  const handleLoadFormStrategy = (data: FormStrategyData) => {
    setUseVisualEditor(false);
    setCustomForm({
      indicators: data.indicators,
      buy_rules: data.buy_rules,
      sell_rules: data.sell_rules,
      order_size: data.order_size,
      initial_balance: data.initial_balance,
    });
  };

  // Load visual strategy handler
  const handleLoadVisualStrategy = (data: VisualStrategyData) => {
    setUseVisualEditor(true);
    workflowStore.loadWorkflow(data.workflow);
    workflowStore.setOrderSize(data.orderSize);
    workflowStore.setInitialBalance(data.initialBalance);
  };

  // Build request based on mode
  const buildBacktestRequest = (strategyParams: GridStrategyParams | MomentumStrategyParams | CustomStrategyParams) => {
    if (mode === "continuous") {
      return {
        topic: topic!,
        amount_of_markets: amountOfMarkets,
        strategy: strategyParams,
        fee_rate: feeRate,
      };
    } else {
      return {
        clob_token_id: marketId!,
        strategy: strategyParams,
        fee_rate: feeRate,
      };
    }
  };

  const handleRunBacktest = async () => {
    setLoading(true);
    setError(null);

    try {
      let strategyParams: GridStrategyParams | MomentumStrategyParams | CustomStrategyParams;

      if (strategy === "grid") {
        strategyParams = {
          strategy_type: "grid",
          ...gridForm,
        };
      } else if (strategy === "momentum") {
        strategyParams = {
          strategy_type: "momentum",
          ...momentumForm,
        };
      } else {
        strategyParams = {
          strategy_type: "custom",
          indicators: customForm.indicators,
          buy_rules: customForm.buy_rules,
          sell_rules: customForm.sell_rules,
          order_size: customForm.order_size,
          initial_balance: customForm.initial_balance,
        };
      }

      const res = await runBacktest(buildBacktestRequest(strategyParams));
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run backtest");
    } finally {
      setLoading(false);
    }
  };

  // Handler for visual editor backtest
  const handleVisualEditorBacktest = async (config: CustomStrategyParams) => {
    setLoading(true);
    setError(null);

    try {
      const res = await runBacktest(buildBacktestRequest(config));
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run backtest");
    } finally {
      setLoading(false);
    }
  };

  // Process dataframe for charts
  const initialBalance = result ? parseFloat(result.statistics.initial_balance) : 10000;
  const chartData = result?.dataframe?.map((row, index) => {
    const equity = Number(row.equity || row.total_value || 0);
    return {
      index,
      blockTime: String(row.block_time || ''),
      equity,
      price: Number(row.price || row.mid_price || 0),
      position: Number(row.position || 0),
      pnl: equity - initialBalance,
      realizedPnl: Number(row.realized_pnl || 0),
      unrealizedPnl: Number(row.unrealized_pnl || 0),
      size: Number(row.position_size || row.size || 0),
      marketId: String(row.market_id || ''),
    };
  }) || [];

  // Render indicator config fields based on type
  const renderIndicatorConfig = (indicator: IndicatorConfig, index: number) => {
    const baseFields = (
      <>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={indicator.name}
            onChange={(e) => updateIndicator(index, { name: e.target.value })}
            placeholder="Name"
            className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
          />
        </div>
        <div className="w-32">
          <select
            value={indicator.type}
            onChange={(e) => updateIndicator(index, { type: e.target.value as IndicatorType })}
            className="input-field w-full text-sm"
          >
            {Object.entries(INDICATOR_LABELS).map(([type]) => (
              <option key={type} value={type}>{type.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </>
    );

    switch (indicator.type) {
      case "sma":
      case "ema":
      case "rsi":
        return (
          <>
            {baseFields}
            <div className="w-20">
              <input
                type="number"
                value={indicator.period || 20}
                onChange={(e) => updateIndicator(index, { period: parseInt(e.target.value) || 20 })}
                placeholder="Period"
                className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
              />
            </div>
          </>
        );
      case "macd":
        return (
          <>
            {baseFields}
            <div className="w-16">
              <input
                type="number"
                value={indicator.fast_period || 12}
                onChange={(e) => updateIndicator(index, { fast_period: parseInt(e.target.value) || 12 })}
                placeholder="Fast"
                title="Fast Period"
                className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
              />
            </div>
            <div className="w-16">
              <input
                type="number"
                value={indicator.slow_period || 26}
                onChange={(e) => updateIndicator(index, { slow_period: parseInt(e.target.value) || 26 })}
                placeholder="Slow"
                title="Slow Period"
                className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
              />
            </div>
            <div className="w-16">
              <input
                type="number"
                value={indicator.signal_period || 9}
                onChange={(e) => updateIndicator(index, { signal_period: parseInt(e.target.value) || 9 })}
                placeholder="Signal"
                title="Signal Period"
                className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
              />
            </div>
          </>
        );
      case "bollinger":
        return (
          <>
            {baseFields}
            <div className="w-20">
              <input
                type="number"
                value={indicator.period || 20}
                onChange={(e) => updateIndicator(index, { period: parseInt(e.target.value) || 20 })}
                placeholder="Period"
                className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
              />
            </div>
            <div className="w-16">
              <input
                type="number"
                step="0.5"
                value={indicator.num_std || 2}
                onChange={(e) => updateIndicator(index, { num_std: parseFloat(e.target.value) || 2 })}
                placeholder="Std"
                title="Number of Standard Deviations"
                className="input-field w-full font-[family-name:var(--font-mono)] text-sm"
              />
            </div>
          </>
        );
      default:
        return baseFields;
    }
  };

  // Render a condition row
  const renderCondition = (
    condition: RuleCondition,
    ruleType: "buy" | "sell",
    ruleIndex: number,
    condIndex: number,
    canRemove: boolean
  ) => {
    const availableIndicators = getAvailableIndicators();
    const useCompareIndicator = condition.compare_to_indicator !== undefined;

    return (
      <div key={condIndex} className="flex flex-wrap items-center gap-2 p-2 bg-bg-tertiary/50 rounded-lg">
        <select
          value={condition.indicator}
          onChange={(e) => updateCondition(ruleType, ruleIndex, condIndex, { indicator: e.target.value })}
          className="input-field text-sm flex-1 min-w-[100px]"
        >
          {availableIndicators.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select
          value={condition.operator}
          onChange={(e) => updateCondition(ruleType, ruleIndex, condIndex, { operator: e.target.value as ConditionOperator })}
          className="input-field text-sm w-24"
        >
          {Object.entries(OPERATOR_LABELS).map(([op]) => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => {
            if (useCompareIndicator) {
              updateCondition(ruleType, ruleIndex, condIndex, {
                value: 0,
                compare_to_indicator: undefined
              });
            } else {
              updateCondition(ruleType, ruleIndex, condIndex, {
                value: undefined,
                compare_to_indicator: availableIndicators[0]
              });
            }
          }}
          className="text-xs text-pink-400 hover:text-pink-300 px-2"
          title={useCompareIndicator ? "Switch to value" : "Switch to indicator"}
        >
          {useCompareIndicator ? "IND" : "VAL"}
        </button>

        {useCompareIndicator ? (
          <select
            value={condition.compare_to_indicator || ""}
            onChange={(e) => updateCondition(ruleType, ruleIndex, condIndex, { compare_to_indicator: e.target.value })}
            className="input-field text-sm flex-1 min-w-[100px]"
          >
            {availableIndicators.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        ) : (
          <input
            type="number"
            step="any"
            value={condition.value ?? 0}
            onChange={(e) => updateCondition(ruleType, ruleIndex, condIndex, { value: parseFloat(e.target.value) || 0 })}
            className="input-field text-sm w-24 font-[family-name:var(--font-mono)]"
          />
        )}

        {canRemove && (
          <button
            type="button"
            onClick={() => removeCondition(ruleType, ruleIndex, condIndex)}
            className="text-bearish hover:text-red-400 p-1"
            title="Remove condition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  };

  // Render rules section
  const renderRulesSection = (ruleType: "buy" | "sell") => {
    const rules = ruleType === "buy" ? customForm.buy_rules : customForm.sell_rules;
    const color = ruleType === "buy" ? "bullish" : "bearish";
    const label = ruleType === "buy" ? "Buy" : "Sell";

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className={`text-sm font-medium text-${color}`}>{label} Rules (OR)</h4>
          <button
            type="button"
            onClick={() => addRule(ruleType)}
            className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Rule
          </button>
        </div>

        {rules.length === 0 && (
          <p className="text-text-tertiary text-xs italic">No {ruleType} rules defined</p>
        )}

        {rules.map((rule, ruleIndex) => (
          <div key={ruleIndex} className={`border border-${color}/30 rounded-lg p-3 space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-tertiary">Rule {ruleIndex + 1} (AND conditions)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => addCondition(ruleType, ruleIndex)}
                  className="text-xs text-pink-400 hover:text-pink-300"
                >
                  + Condition
                </button>
                {rules.length > 0 && (
                  <button
                    type="button"
                    onClick={() => removeRule(ruleType, ruleIndex)}
                    className="text-xs text-bearish hover:text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {rule.conditions.map((cond, condIndex) =>
                renderCondition(cond, ruleType, ruleIndex, condIndex, rule.conditions.length > 1)
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="bg-bg-secondary border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-pink flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="font-[family-name:var(--font-chakra)] font-bold text-xl text-pink-50">
              PredictBack
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm text-text-tertiary">
            <Link href="/" className="hover:text-pink-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/topics" className="hover:text-pink-400 transition-colors">Topics</Link>
            <span>/</span>
            <span className="text-pink-400">Backtest</span>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Title Section */}
        <div className="mb-8">
          <Link
            href={backLink.href}
            className="inline-flex items-center text-text-tertiary hover:text-pink-400 text-sm mb-4 transition-colors"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {backLink.label}
          </Link>
          <h1 className="font-[family-name:var(--font-chakra)] text-2xl md:text-3xl font-bold text-pink-50 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="font-[family-name:var(--font-mono)] text-text-tertiary text-sm truncate">
              {subtitle}
            </p>
          )}
        </div>

        {/* Visual Workflow Editor - Full Width */}
        {strategy === "custom" && useVisualEditor && (
          <div className="mb-8 bg-bg-secondary rounded-xl border border-border overflow-hidden">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50">
                Visual Strategy Builder
              </h2>
              <button
                onClick={() => setUseVisualEditor(false)}
                className="text-sm text-text-tertiary hover:text-pink-400 transition-colors"
              >
                Switch to Form Mode
              </button>
            </div>
            <div className="h-[600px]">
              <WorkflowEditor onRunBacktest={handleVisualEditorBacktest} />
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Configuration */}
          <div className="lg:col-span-1 space-y-6">
            {/* Continuous Market Settings */}
            {mode === "continuous" && (
              <div className="bg-bg-secondary rounded-xl border border-border p-6">
                <h2 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                  Markets to Backtest
                </h2>
                <div>
                  <label className="block text-text-secondary text-sm mb-2">
                    Number of Markets
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={amountOfMarkets}
                    onChange={(e) => setAmountOfMarkets(parseInt(e.target.value) || 1)}
                    className="input-field w-full font-[family-name:var(--font-mono)]"
                  />
                  <p className="text-text-tertiary text-xs mt-2">
                    Most recent N markets will be used for backtesting
                  </p>
                </div>
              </div>
            )}

            {/* Strategy Selection */}
            <div className="bg-bg-secondary rounded-xl border border-border p-6">
              <h2 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                Select Strategy
              </h2>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setStrategy("grid")}
                  className={`p-4 rounded-lg border transition-all ${
                    strategy === "grid"
                      ? "bg-pink-500/10 border-pink-500 text-pink-400"
                      : "bg-bg-tertiary border-border text-text-secondary hover:border-border-pink"
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="font-medium text-sm">Grid</span>
                </button>
                <button
                  onClick={() => setStrategy("momentum")}
                  className={`p-4 rounded-lg border transition-all ${
                    strategy === "momentum"
                      ? "bg-pink-500/10 border-pink-500 text-pink-400"
                      : "bg-bg-tertiary border-border text-text-secondary hover:border-border-pink"
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="font-medium text-sm">Momentum</span>
                </button>
                <button
                  onClick={() => setStrategy("custom")}
                  className={`p-4 rounded-lg border transition-all ${
                    strategy === "custom"
                      ? "bg-pink-500/10 border-pink-500 text-pink-400"
                      : "bg-bg-tertiary border-border text-text-secondary hover:border-border-pink"
                  }`}
                >
                  <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-medium text-sm">Custom</span>
                </button>
              </div>
            </div>

            {/* Saved Strategies - Only shown when Custom is selected */}
            {strategy === "custom" && (
              <div className="bg-bg-secondary rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50">
                    Saved Strategies
                  </h2>
                  <button
                    onClick={() => setShowSaveModal(true)}
                    className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Current
                  </button>
                </div>
                <SavedStrategies
                  onLoadFormStrategy={handleLoadFormStrategy}
                  onLoadVisualStrategy={handleLoadVisualStrategy}
                />
              </div>
            )}

            {/* Parameters */}
            <div className="bg-bg-secondary rounded-xl border border-border p-6">
              <h2 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                Parameters
              </h2>

              {strategy === "grid" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Grid Size</label>
                    <input
                      type="number"
                      value={gridForm.grid_size}
                      onChange={(e) => setGridForm({ ...gridForm, grid_size: parseInt(e.target.value) || 5 })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Grid Spacing</label>
                    <input
                      type="text"
                      value={gridForm.grid_spacing}
                      onChange={(e) => setGridForm({ ...gridForm, grid_spacing: e.target.value })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Order Size</label>
                    <input
                      type="text"
                      value={gridForm.order_size}
                      onChange={(e) => setGridForm({ ...gridForm, order_size: e.target.value })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Initial Balance</label>
                    <input
                      type="text"
                      value={gridForm.initial_balance}
                      onChange={(e) => setGridForm({ ...gridForm, initial_balance: e.target.value })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                </div>
              )}

              {strategy === "momentum" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Lookback Window</label>
                    <input
                      type="number"
                      value={momentumForm.lookback_window}
                      onChange={(e) => setMomentumForm({ ...momentumForm, lookback_window: parseInt(e.target.value) || 10 })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Momentum Threshold</label>
                    <input
                      type="text"
                      value={momentumForm.momentum_threshold}
                      onChange={(e) => setMomentumForm({ ...momentumForm, momentum_threshold: e.target.value })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Order Size</label>
                    <input
                      type="text"
                      value={momentumForm.order_size}
                      onChange={(e) => setMomentumForm({ ...momentumForm, order_size: e.target.value })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                  <div>
                    <label className="block text-text-secondary text-sm mb-2">Initial Balance</label>
                    <input
                      type="text"
                      value={momentumForm.initial_balance}
                      onChange={(e) => setMomentumForm({ ...momentumForm, initial_balance: e.target.value })}
                      className="input-field w-full font-[family-name:var(--font-mono)]"
                    />
                  </div>
                </div>
              )}

              {strategy === "custom" && (
                <div className="space-y-6">
                  {/* Visual Editor Toggle */}
                  <div className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg">
                    <span className="text-text-secondary text-sm">
                      {useVisualEditor ? "Visual Editor Mode" : "Form Mode"}
                    </span>
                    <button
                      onClick={() => setUseVisualEditor(!useVisualEditor)}
                      className="text-sm text-pink-400 hover:text-pink-300 transition-colors"
                    >
                      Switch to {useVisualEditor ? "Form" : "Visual Editor"}
                    </button>
                  </div>

                  {useVisualEditor ? (
                    <div className="text-text-tertiary text-sm">
                      <p className="mb-2">Use the visual editor above to build your strategy with drag-and-drop nodes.</p>
                      <p className="text-xs">The editor includes Order Size and Initial Balance settings in its toolbar.</p>
                    </div>
                  ) : (
                  <>
                  {/* Indicators Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-text-secondary text-sm font-medium">Indicators</label>
                      <button
                        type="button"
                        onClick={addIndicator}
                        className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {customForm.indicators.map((indicator, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-bg-tertiary rounded-lg">
                          {renderIndicatorConfig(indicator, index)}
                          <button
                            type="button"
                            onClick={() => removeIndicator(index)}
                            className="text-bearish hover:text-red-400 p-1 flex-shrink-0"
                            title="Remove indicator"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      {customForm.indicators.length === 0 && (
                        <p className="text-text-tertiary text-xs italic">No indicators added</p>
                      )}
                    </div>
                  </div>

                  {/* Trading Rules */}
                  <div className="border-t border-border pt-4">
                    <label className="text-text-secondary text-sm font-medium block mb-3">Trading Rules</label>
                    <div className="space-y-4">
                      {renderRulesSection("buy")}
                      {renderRulesSection("sell")}
                    </div>
                  </div>

                  {/* Order Settings */}
                  <div className="border-t border-border pt-4 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">Order Size</label>
                      <input
                        type="text"
                        value={customForm.order_size}
                        onChange={(e) => setCustomForm({ ...customForm, order_size: e.target.value })}
                        className="input-field w-full font-[family-name:var(--font-mono)]"
                      />
                    </div>
                    <div>
                      <label className="block text-text-secondary text-sm mb-2">Initial Balance</label>
                      <input
                        type="text"
                        value={customForm.initial_balance}
                        onChange={(e) => setCustomForm({ ...customForm, initial_balance: e.target.value })}
                        className="input-field w-full font-[family-name:var(--font-mono)]"
                      />
                    </div>
                  </div>
                  </>
                  )}
                </div>
              )}

              <div className="mt-4">
                <label className="block text-text-secondary text-sm mb-2">Fee Rate</label>
                <input
                  type="text"
                  value={feeRate}
                  onChange={(e) => setFeeRate(e.target.value)}
                  className="input-field w-full font-[family-name:var(--font-mono)]"
                />
              </div>
            </div>

            {/* Run Button - Hide when visual editor is active */}
            {!(strategy === "custom" && useVisualEditor) && (
              <button
                onClick={handleRunBacktest}
                disabled={loading}
                className="btn-primary w-full text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Backtest...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Backtest
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="bg-bearish/10 border border-bearish/20 rounded-lg p-4 text-bearish text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            {!result && !loading && (
              <div className="bg-bg-secondary rounded-xl border border-border p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-bg-tertiary mx-auto mb-6 flex items-center justify-center">
                  <svg className="w-10 h-10 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-chakra)] text-xl font-semibold text-pink-50 mb-2">
                  Configure & Run
                </h3>
                <p className="text-text-tertiary max-w-md mx-auto">
                  Select a strategy, adjust parameters, and run the backtest to see detailed results and performance charts.
                </p>
              </div>
            )}

            {loading && (
              <div className="bg-bg-secondary rounded-xl border border-border p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-pink-500/10 mx-auto mb-6 flex items-center justify-center">
                  <svg className="animate-spin h-10 w-10 text-pink-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="font-[family-name:var(--font-chakra)] text-xl font-semibold text-pink-50 mb-2">
                  Running Backtest
                </h3>
                <p className="text-text-tertiary">
                  {mode === "continuous"
                    ? `Processing ${amountOfMarkets} markets...`
                    : `Analyzing historical data points...`
                  }
                </p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 animate-fade-in-up">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-bg-secondary rounded-xl border border-border p-4">
                    <div className="text-text-tertiary text-sm mb-1">Total Return</div>
                    <div className={`font-[family-name:var(--font-mono)] text-2xl font-semibold ${
                      result.statistics.total_return_pct >= 0 ? "text-bullish" : "text-bearish"
                    }`}>
                      {result.statistics.total_return_pct >= 0 ? "+" : ""}{result.statistics.total_return_pct.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded-xl border border-border p-4">
                    <div className="text-text-tertiary text-sm mb-1">Win Rate</div>
                    <div className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-pink-400">
                      {(result.statistics.win_rate * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded-xl border border-border p-4">
                    <div className="text-text-tertiary text-sm mb-1">Total Trades</div>
                    <div className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-text-primary">
                      {result.statistics.total_trades}
                    </div>
                  </div>
                  <div className="bg-bg-secondary rounded-xl border border-border p-4">
                    <div className="text-text-tertiary text-sm mb-1">Max Drawdown</div>
                    <div className="font-[family-name:var(--font-mono)] text-2xl font-semibold text-bearish">
                      -{result.statistics.max_drawdown_pct.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="bg-bg-secondary rounded-xl border border-border p-6">
                  <h3 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                    Performance Summary
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-text-tertiary text-sm">Strategy</div>
                      <div className="text-text-primary font-medium">{result.statistics.strategy_name}</div>
                    </div>
                    <div>
                      <div className="text-text-tertiary text-sm">Initial Balance</div>
                      <div className="font-[family-name:var(--font-mono)] text-text-primary">
                        ${parseFloat(result.statistics.initial_balance).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-tertiary text-sm">Final Equity</div>
                      <div className="font-[family-name:var(--font-mono)] text-text-primary">
                        ${parseFloat(result.statistics.final_equity).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-tertiary text-sm">Total PnL</div>
                      <div className={`font-[family-name:var(--font-mono)] ${
                        parseFloat(result.statistics.total_pnl) >= 0 ? "text-bullish" : "text-bearish"
                      }`}>
                        {parseFloat(result.statistics.total_pnl) >= 0 ? "+" : ""}
                        ${parseFloat(result.statistics.total_pnl).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-tertiary text-sm">Max Drawdown</div>
                      <div className="font-[family-name:var(--font-mono)] text-bearish">
                        ${parseFloat(result.statistics.max_drawdown).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <div>
                      <div className="text-text-tertiary text-sm">Data Points</div>
                      <div className="font-[family-name:var(--font-mono)] text-text-primary">
                        {result.row_count.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* PnL Chart */}
                {chartData.length > 0 && (
                  <div className="bg-bg-secondary rounded-xl border border-border p-6">
                    <h3 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                      Cumulative PnL
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="pnlGradientPositive" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#26A69A" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#26A69A" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="pnlGradientNegative" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EF5350" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#EF5350" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                          <XAxis
                            dataKey="blockTime"
                            stroke="#787B86"
                            tick={{ fill: '#787B86', fontSize: 10 }}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => value ? String(value).slice(0, 10) : ''}
                          />
                          <YAxis
                            stroke="#787B86"
                            tick={{ fill: '#787B86', fontSize: 12 }}
                            tickFormatter={(value) => `$${value.toLocaleString()}`}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#161823',
                              border: '1px solid #2A2D3A',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#787B86' }}
                            labelFormatter={(label) => `Time: ${label}`}
                            formatter={(value) => {
                              const numVal = Number(value);
                              const color = numVal >= 0 ? '#26A69A' : '#EF5350';
                              return value != null ? [<span key="pnl" style={{ color }}>{numVal >= 0 ? '+' : ''}${numVal.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>, 'PnL'] : ['', ''];
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="pnl"
                            stroke={chartData[chartData.length - 1]?.pnl >= 0 ? "#26A69A" : "#EF5350"}
                            strokeWidth={2}
                            fill={chartData[chartData.length - 1]?.pnl >= 0 ? "url(#pnlGradientPositive)" : "url(#pnlGradientNegative)"}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Price Chart */}
                {chartData.length > 0 && chartData[0].price > 0 && (
                  <div className="bg-bg-secondary rounded-xl border border-border p-6">
                    <h3 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                      Price History
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                          <XAxis
                            dataKey="blockTime"
                            stroke="#787B86"
                            tick={{ fill: '#787B86', fontSize: 10 }}
                            interval="preserveStartEnd"
                            tickFormatter={(value) => value ? String(value).slice(0, 10) : ''}
                          />
                          <YAxis
                            stroke="#787B86"
                            tick={{ fill: '#787B86', fontSize: 12 }}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#161823',
                              border: '1px solid #2A2D3A',
                              borderRadius: '8px',
                            }}
                            labelStyle={{ color: '#787B86' }}
                            labelFormatter={(label) => `Time: ${label}`}
                            itemStyle={{ color: '#26A69A' }}
                            formatter={(value) => value != null ? [Number(value).toFixed(4), 'Price'] : ['', '']}
                          />
                          <Line
                            type="monotone"
                            dataKey="price"
                            stroke="#26A69A"
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Order History */}
                {chartData.length > 0 && (() => {
                  // Filter to only show rows where position size changed
                  const orderHistory = chartData.reduce((acc, row, idx) => {
                    const prevSize = idx > 0 ? chartData[idx - 1].size : 0;
                    const delta = row.size - prevSize;
                    if (Math.abs(delta) > 0.0001) {
                      acc.push({
                        blockTime: row.blockTime,
                        delta,
                        total: row.size,
                        marketId: row.marketId,
                      });
                    }
                    return acc;
                  }, [] as { blockTime: string; delta: number; total: number; marketId: string }[]);

                  if (orderHistory.length === 0) return null;

                  return (
                    <div className="bg-bg-secondary rounded-xl border border-border p-6">
                      <h3 className="font-[family-name:var(--font-chakra)] text-lg font-semibold text-pink-50 mb-4">
                        Order History
                      </h3>
                      <div className="overflow-x-auto max-h-64 overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="sticky top-0 bg-bg-secondary">
                            <tr className="border-b border-border text-text-tertiary">
                              <th className="text-left py-2 px-3 font-medium">Block Time</th>
                              {mode === "continuous" && (
                                <th className="text-left py-2 px-3 font-medium">Market</th>
                              )}
                              <th className="text-right py-2 px-3 font-medium">Delta</th>
                              <th className="text-right py-2 px-3 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody className="font-[family-name:var(--font-mono)]">
                            {orderHistory.map((order, idx) => (
                              <tr key={idx} className="border-b border-border/50 hover:bg-bg-tertiary/50">
                                <td className="py-2 px-3 text-text-secondary">
                                  {order.blockTime}
                                </td>
                                {mode === "continuous" && (
                                  <td className="py-2 px-3 text-text-tertiary text-xs">
                                    {order.marketId ? order.marketId.slice(-20) : '-'}
                                  </td>
                                )}
                                <td className={`py-2 px-3 text-right ${order.delta > 0 ? 'text-bullish' : 'text-bearish'}`}>
                                  {order.delta > 0 ? '+' : ''}{order.delta.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-right text-text-primary">
                                  {order.total.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Strategy Modal */}
      <SaveStrategyModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveStrategy}
        defaultName={useVisualEditor ? workflowStore.workflowName : "Custom Strategy"}
      />
    </main>
  );
}
