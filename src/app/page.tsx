"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Plus,
  X,
  Edit3,
  Check,
  RotateCcw,
  ArrowDownToLine,
  ArrowUpFromLine,
  Zap,
  Activity,
  Trash2,
  AlertTriangle,
} from "lucide-react";

type CategoryId =
  | "income"
  | "refunds"
  | "cogs"
  | "logistics"
  | "marketing"
  | "fixed";

type VatTypeId =
  | "input"
  | "output_cz"
  | "output_sk"
  | "reverse_charge"
  | "none";

type MonthItem = {
  id: string;
  name: string;
  category: CategoryId;
  vatType: VatTypeId;
  vatRate: number;
};

type Template = {
  items: MonthItem[];
};

type MonthlyValues = Record<string, number>;
type MonthlyData = Record<number, MonthlyValues>;

type Category = {
  id: CategoryId;
  label: string;
  accent: string;
  desc: string;
};

type VatType = {
  id: VatTypeId;
  label: string;
  short: string;
  desc: string;
  color: string;
};

type Totals = {
  income: number;
  refunds: number;
  cogs: number;
  logistics: number;
  marketing: number;
  fixed: number;
  outputDPHCZ: number;
  outputDPHSK: number;
  inputDPH: number;
  trzbaNetto: number;
  varCosts: number;
  kp: number;
  kpMarze: number;
  provozHV: number;
  outputDPH: number;
  netDPH: number;
  cash: number;
};

type YearTotals = Totals & {
  count: number;
};

type CategoryPanelProps = {
  category: Category;
  items: MonthItem[];
  values: MonthlyValues;
  total: number;
  vatTotal: number;
  editMode: boolean;
  onValueChange: (itemId: string, value: string) => void;
  onAddItem: () => void;
  onUpdateItem: (id: string, updates: Partial<MonthItem>) => void;
  onDeleteItem: (id: string) => void;
};

type ItemRowProps = {
  item: MonthItem;
  value: number;
  editMode: boolean;
  onValueChange: (value: string) => void;
  onUpdate: (updates: Partial<MonthItem>) => void;
  onDelete: () => void;
};

type ResultsPanelProps = {
  result: Totals;
};

type ResultRowProps = {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  small?: boolean;
  accent?: "cyan" | "rose";
  icon?: React.ReactNode;
};

type YearOverviewProps = {
  template: Template;
  monthlyData: MonthlyData;
  year: number;
  selectedMonth: number;
  onSelectMonth: (month: number) => void;
  isMonthFilled: (month: number) => boolean;
  yearTotals: YearTotals;
};

const MONTHS = [
  { idx: 1, label: "Leden", short: "Led" },
  { idx: 2, label: "Únor", short: "Úno" },
  { idx: 3, label: "Březen", short: "Bře" },
  { idx: 4, label: "Duben", short: "Dub" },
  { idx: 5, label: "Květen", short: "Kvě" },
  { idx: 6, label: "Červen", short: "Čvn" },
  { idx: 7, label: "Červenec", short: "Čvc" },
  { idx: 8, label: "Srpen", short: "Srp" },
  { idx: 9, label: "Září", short: "Zář" },
  { idx: 10, label: "Říjen", short: "Říj" },
  { idx: 11, label: "Listopad", short: "Lis" },
  { idx: 12, label: "Prosinec", short: "Pro" },
];

const CATEGORIES: Category[] = [
  {
    id: "income",
    label: "Příjmy",
    accent: "#22D3EE",
    desc: "Tržby a další příjmy",
  },
  {
    id: "refunds",
    label: "Vratky",
    accent: "#F472B6",
    desc: "Vratky zákazníkům, dobropisy",
  },
  {
    id: "cogs",
    label: "COGS",
    accent: "#3B82F6",
    desc: "Variabilní náklady na produkt",
  },
  {
    id: "logistics",
    label: "Logistika",
    accent: "#60A5FA",
    desc: "Doprava, fulfillment, skladování",
  },
  {
    id: "marketing",
    label: "Marketing",
    accent: "#A78BFA",
    desc: "Reklama, agentury, kreativa",
  },
  {
    id: "fixed",
    label: "Fixní náklady",
    accent: "#818CF8",
    desc: "Mzdy, nájem, SaaS, služby",
  },
];

const VAT_TYPES: VatType[] = [
  {
    id: "input",
    label: "Vstup",
    short: "↓",
    desc: "Vstupní DPH",
    color: "#22D3EE",
  },
  {
    id: "output_cz",
    label: "Výstup ČR",
    short: "↑",
    desc: "Výstupní DPH ČR",
    color: "#F59E0B",
  },
  {
    id: "output_sk",
    label: "Výstup SK / OSS",
    short: "↑",
    desc: "Výstupní DPH SK přes OSS",
    color: "#F472B6",
  },
  {
    id: "reverse_charge",
    label: "Reverse charge",
    short: "RC",
    desc: "DPH-neutrální",
    color: "#94A3B8",
  },
  {
    id: "none",
    label: "Bez DPH",
    short: "—",
    desc: "Mimo DPH systém",
    color: "#64748B",
  },
];

const DEFAULT_TEMPLATE: Template = {
  items: [
    {
      id: "i1",
      name: "Tržba ČR (potraviny)",
      category: "income",
      vatType: "output_cz",
      vatRate: 12,
    },
    {
      id: "i2",
      name: "Tržba SK / OSS",
      category: "income",
      vatType: "output_sk",
      vatRate: 19,
    },
    {
      id: "r1",
      name: "Vratky ČR",
      category: "refunds",
      vatType: "output_cz",
      vatRate: 12,
    },
    {
      id: "c1",
      name: "Ořechy",
      category: "cogs",
      vatType: "input",
      vatRate: 12,
    },
    {
      id: "c2",
      name: "Čokoláda",
      category: "cogs",
      vatType: "input",
      vatRate: 12,
    },
    {
      id: "c3",
      name: "Sklenice",
      category: "cogs",
      vatType: "input",
      vatRate: 21,
    },
    {
      id: "c4",
      name: "Etikety & packaging",
      category: "cogs",
      vatType: "input",
      vatRate: 21,
    },
    {
      id: "l1",
      name: "Doprava",
      category: "logistics",
      vatType: "input",
      vatRate: 21,
    },
    {
      id: "l2",
      name: "Fulfillment",
      category: "logistics",
      vatType: "input",
      vatRate: 21,
    },
    {
      id: "m1",
      name: "Meta Ads",
      category: "marketing",
      vatType: "reverse_charge",
      vatRate: 0,
    },
    {
      id: "m2",
      name: "Google Ads",
      category: "marketing",
      vatType: "reverse_charge",
      vatRate: 0,
    },
    {
      id: "m3",
      name: "Sklik (Seznam.cz)",
      category: "marketing",
      vatType: "input",
      vatRate: 21,
    },
    {
      id: "m4",
      name: "TikTok Ads",
      category: "marketing",
      vatType: "reverse_charge",
      vatRate: 0,
    },
    {
      id: "f1",
      name: "Mzdy & odvody",
      category: "fixed",
      vatType: "none",
      vatRate: 0,
    },
    {
      id: "f2",
      name: "Nájem",
      category: "fixed",
      vatType: "input",
      vatRate: 21,
    },
    {
      id: "f3",
      name: "Služby & SaaS",
      category: "fixed",
      vatType: "input",
      vatRate: 21,
    },
  ],
};

const TEMPLATE_KEY = "fitmar-v2:template";
const dataKey = (year: number) => `fitmar-v2:data:${year}`;

const FONT_DISPLAY = "'Chakra Petch', 'Space Grotesk', sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT_UI = "'Inter', system-ui, sans-serif";

const fmt = (n: number | undefined | null) => {
  if (n === 0 || Number.isNaN(n) || n === undefined || n === null) return "0";
  const value = Math.round(n);
  return value.toLocaleString("cs-CZ").replace(/[\u00A0\u202F]/g, " ");
};

const fmtKc = (n: number | undefined | null) => `${fmt(n)} Kč`;

const fmtPct = (n: number | undefined | null) => {
  if (Number.isNaN(n) || n === undefined || n === null) return "0,0 %";
  return (n * 100).toFixed(1).replace(".", ",") + " %";
};

const newId = () => `x${Math.random().toString(36).slice(2, 10)}`;

function calculate(items: MonthItem[], values: MonthlyValues): Totals {
  const totals: Totals = {
    income: 0,
    refunds: 0,
    cogs: 0,
    logistics: 0,
    marketing: 0,
    fixed: 0,
    outputDPHCZ: 0,
    outputDPHSK: 0,
    inputDPH: 0,
    trzbaNetto: 0,
    varCosts: 0,
    kp: 0,
    kpMarze: 0,
    provozHV: 0,
    outputDPH: 0,
    netDPH: 0,
    cash: 0,
  };

  items.forEach((item) => {
    const amount = Number(values[item.id] || 0);
    if (amount === 0) return;

    totals[item.category] += amount;

    const vat = amount * ((item.vatRate || 0) / 100);

    if (item.vatType === "input") {
      totals.inputDPH += vat;
    }

    if (item.vatType === "output_cz") {
      if (item.category === "refunds") {
        totals.outputDPHCZ -= vat;
      } else {
        totals.outputDPHCZ += vat;
      }
    }

    if (item.vatType === "output_sk") {
      if (item.category === "refunds") {
        totals.outputDPHSK -= vat;
      } else {
        totals.outputDPHSK += vat;
      }
    }
  });

  totals.trzbaNetto = totals.income - totals.refunds;
  totals.varCosts = totals.cogs + totals.logistics + totals.marketing;
  totals.kp = totals.trzbaNetto - totals.varCosts;
  totals.kpMarze = totals.trzbaNetto > 0 ? totals.kp / totals.trzbaNetto : 0;
  totals.provozHV = totals.kp - totals.fixed;
  totals.outputDPH = totals.outputDPHCZ + totals.outputDPHSK;
  totals.netDPH = totals.inputDPH - totals.outputDPH;
  totals.cash = totals.provozHV + totals.netDPH;

  return totals;
}

function normalizeTemplate(value: unknown): Template {
  if (
    !value ||
    typeof value !== "object" ||
    !("items" in value) ||
    !Array.isArray((value as Template).items)
  ) {
    return DEFAULT_TEMPLATE;
  }

  const parsed = value as Template;

  const items = parsed.items
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: String(item.id || newId()),
      name: String(item.name || "Položka"),
      category: CATEGORIES.some((cat) => cat.id === item.category)
        ? item.category
        : "fixed",
      vatType: VAT_TYPES.some((vat) => vat.id === item.vatType)
        ? item.vatType
        : "none",
      vatRate: Number(item.vatRate) || 0,
    }));

  return { items };
}

export default function FitMarCalc() {
  const [template, setTemplate] = useState<Template>(DEFAULT_TEMPLATE);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [year, setYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  useEffect(() => {
    setSelectedMonth(new Date().getMonth() + 1);
  }, []);

  useEffect(() => {
    setLoading(true);

    try {
      const savedTemplate = window.localStorage.getItem(TEMPLATE_KEY);
      if (savedTemplate) {
        setTemplate(normalizeTemplate(JSON.parse(savedTemplate)));
      } else {
        setTemplate(DEFAULT_TEMPLATE);
      }
    } catch {
      setTemplate(DEFAULT_TEMPLATE);
    }

    try {
      const savedData = window.localStorage.getItem(dataKey(year));
      setMonthlyData(savedData ? JSON.parse(savedData) : {});
    } catch {
      setMonthlyData({});
    }

    setLoading(false);
  }, [year]);

  useEffect(() => {
    if (loading) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(template));
      } catch {}
    }, 300);

    return () => window.clearTimeout(timer);
  }, [template, loading]);

  useEffect(() => {
    if (loading) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(dataKey(year), JSON.stringify(monthlyData));
      } catch {}
    }, 300);

    return () => window.clearTimeout(timer);
  }, [monthlyData, year, loading]);

  const monthValues: MonthlyValues = monthlyData[selectedMonth] || {};

  const setValue = (itemId: string, value: string) => {
    const num =
      value === "" || value === "-"
        ? 0
        : Number.parseFloat(String(value).replace(",", ".")) || 0;

    setMonthlyData((prev) => ({
      ...prev,
      [selectedMonth]: {
        ...(prev[selectedMonth] || {}),
        [itemId]: num,
      },
    }));
  };

  const addItem = (category: CategoryId) => {
    setTemplate((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: newId(),
          name: "Nová položka",
          category,
          vatType:
            category === "income" || category === "refunds"
              ? "output_cz"
              : "input",
          vatRate: category === "income" || category === "refunds" ? 12 : 21,
        },
      ],
    }));
  };

  const updateItem = (id: string, updates: Partial<MonthItem>) => {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const deleteItem = (id: string) => {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));

    setMonthlyData((prev) => {
      const next: MonthlyData = { ...prev };

      Object.keys(next).forEach((monthKey) => {
        const numericMonth = Number(monthKey);
        const month = next[numericMonth];

        if (month && month[id] !== undefined) {
          const copy = { ...month };
          delete copy[id];
          next[numericMonth] = copy;
        }
      });

      return next;
    });
  };

  const resetMonth = () => {
    const monthLabel = MONTHS[selectedMonth - 1]?.label || "vybraný měsíc";

    if (window.confirm(`Vymazat vstupy pro ${monthLabel} ${year}?`)) {
      setMonthlyData((prev) => {
        const next = { ...prev };
        delete next[selectedMonth];
        return next;
      });
    }
  };

  const resetTemplate = () => {
    setTemplate(DEFAULT_TEMPLATE);
    setShowResetConfirm(false);
  };

  const result = useMemo(
    () => calculate(template.items, monthValues),
    [template, monthValues]
  );

  const yearTotals = useMemo<YearTotals>(() => {
    const aggregate: YearTotals = {
      income: 0,
      refunds: 0,
      cogs: 0,
      logistics: 0,
      marketing: 0,
      fixed: 0,
      outputDPHCZ: 0,
      outputDPHSK: 0,
      inputDPH: 0,
      trzbaNetto: 0,
      varCosts: 0,
      kp: 0,
      kpMarze: 0,
      provozHV: 0,
      outputDPH: 0,
      netDPH: 0,
      cash: 0,
      count: 0,
    };

    for (let month = 1; month <= 12; month += 1) {
      const values = monthlyData[month];

      if (!values || !Object.values(values).some((value) => Number(value) !== 0)) {
        continue;
      }

      const calculated = calculate(template.items, values);

      aggregate.count += 1;
      aggregate.income += calculated.income;
      aggregate.refunds += calculated.refunds;
      aggregate.cogs += calculated.cogs;
      aggregate.logistics += calculated.logistics;
      aggregate.marketing += calculated.marketing;
      aggregate.fixed += calculated.fixed;
      aggregate.outputDPHCZ += calculated.outputDPHCZ;
      aggregate.outputDPHSK += calculated.outputDPHSK;
      aggregate.inputDPH += calculated.inputDPH;
      aggregate.trzbaNetto += calculated.trzbaNetto;
      aggregate.varCosts += calculated.varCosts;
      aggregate.kp += calculated.kp;
      aggregate.provozHV += calculated.provozHV;
      aggregate.outputDPH += calculated.outputDPH;
      aggregate.netDPH += calculated.netDPH;
      aggregate.cash += calculated.cash;
    }

    aggregate.kpMarze =
      aggregate.trzbaNetto > 0 ? aggregate.kp / aggregate.trzbaNetto : 0;

    return aggregate;
  }, [template, monthlyData]);

  const isMonthFilled = (month: number) => {
    const values = monthlyData[month];
    return Boolean(
      values && Object.values(values).some((value) => Number(value) !== 0)
    );
  };

  const itemsByCategory = useMemo<Record<CategoryId, MonthItem[]>>(() => {
    const map: Record<CategoryId, MonthItem[]> = {
      income: [],
      refunds: [],
      cogs: [],
      logistics: [],
      marketing: [],
      fixed: [],
    };

    template.items.forEach((item) => {
      map[item.category].push(item);
    });

    return map;
  }, [template]);

  const currentMonthLabel = MONTHS[selectedMonth - 1]?.label || "";

  return (
    <div
      className="min-h-screen w-full relative overflow-x-hidden"
      style={{
        background: "#020617",
        color: "#E2E8F0",
        fontFamily: FONT_UI,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');

        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }

        .glow-cyan { box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.3), 0 0 20px rgba(34, 211, 238, 0.15), inset 0 0 20px rgba(34, 211, 238, 0.05); }
        .text-glow-cyan { text-shadow: 0 0 20px rgba(34, 211, 238, 0.5), 0 0 40px rgba(34, 211, 238, 0.3); }
        .text-glow-rose { text-shadow: 0 0 20px rgba(244, 114, 182, 0.5), 0 0 40px rgba(244, 114, 182, 0.3); }

        .panel { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.15); }
        .panel:hover { border-color: rgba(56, 189, 248, 0.3); }

        .corner-bracket { position: absolute; width: 12px; height: 12px; border-color: rgba(34, 211, 238, 0.6); }
        .corner-bracket.tl { top: -1px; left: -1px; border-top: 1.5px solid; border-left: 1.5px solid; }
        .corner-bracket.tr { top: -1px; right: -1px; border-top: 1.5px solid; border-right: 1.5px solid; }
        .corner-bracket.bl { bottom: -1px; left: -1px; border-bottom: 1.5px solid; border-left: 1.5px solid; }
        .corner-bracket.br { bottom: -1px; right: -1px; border-bottom: 1.5px solid; border-right: 1.5px solid; }

        .hex-grid {
          background-image:
            linear-gradient(rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(56, 189, 248, 0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }

        .month-tab { transition: all 0.2s; }
        .month-tab:hover:not(.active) { background: rgba(34, 211, 238, 0.08); border-color: rgba(34, 211, 238, 0.3); }
        .month-tab.active { background: linear-gradient(135deg, rgba(34, 211, 238, 0.15), rgba(56, 189, 248, 0.05)); border-color: rgba(34, 211, 238, 0.5); color: #22D3EE; }
        .month-tab.filled .filled-dot { opacity: 1; }
        .month-tab.active.filled .filled-dot { background: #22D3EE; }

        .num-input { background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(56, 189, 248, 0.2); }
        .num-input:focus { outline: none; border-color: rgba(34, 211, 238, 0.6); box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.15); background: rgba(2, 6, 23, 0.9); }
        .num-input:hover { border-color: rgba(56, 189, 248, 0.4); }

        .btn-primary { background: linear-gradient(135deg, #06B6D4, #0891B2); color: #020617; font-weight: 600; transition: all 0.2s; }
        .btn-primary:hover { background: linear-gradient(135deg, #22D3EE, #06B6D4); box-shadow: 0 0 30px rgba(34, 211, 238, 0.4); }

        .btn-ghost { background: rgba(15, 23, 42, 0.4); border: 1px solid rgba(56, 189, 248, 0.2); transition: all 0.2s; }
        .btn-ghost:hover { background: rgba(15, 23, 42, 0.8); border-color: rgba(56, 189, 248, 0.5); color: #22D3EE; }

        .vat-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-family: ${FONT_MONO};
        }

        .row-hover:hover { background: rgba(34, 211, 238, 0.04); }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }

        .pulse-dot { animation: pulse-glow 2s ease-in-out infinite; }

        select {
          background: rgba(2, 6, 23, 0.8);
          border: 1px solid rgba(56, 189, 248, 0.3);
          color: #E2E8F0;
          padding: 4px 8px;
          border-radius: 3px;
          font-family: ${FONT_MONO};
          font-size: 11px;
        }

        select:focus {
          outline: none;
          border-color: rgba(34, 211, 238, 0.6);
        }
      `}</style>

      <div className="absolute inset-0 hex-grid pointer-events-none opacity-40" />

      <div
        className="absolute pointer-events-none"
        style={{
          top: "-20%",
          left: "-10%",
          width: "60%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.12) 0%, transparent 60%)",
          filter: "blur(60px)",
        }}
      />

      <div
        className="absolute pointer-events-none"
        style={{
          top: "20%",
          right: "-10%",
          width: "50%",
          height: "60%",
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%)",
          filter: "blur(80px)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-cyan-500/20">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-cyan-400" />
                <p
                  className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/80"
                  style={{ fontFamily: FONT_MONO }}
                >
                  // FITMAR · CASH FLOW UNIT · v2.0
                </p>
              </div>

              <h1
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontWeight: 600,
                  fontSize: "2.75rem",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
                className="text-glow-cyan"
              >
                <span className="text-cyan-300">CASH</span>
                <span className="text-slate-100"> FLOW </span>
                <span className="text-slate-400">CALC</span>
              </h1>

              <p className="text-sm text-slate-400 mt-3 max-w-2xl">
                Modulární P&amp;L kalkulačka s plně konfigurovatelnými
                položkami a sazbami DPH.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={year}
                onChange={(event) =>
                  setYear(Number.parseInt(event.target.value, 10))
                }
                className="text-sm"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "13px",
                  padding: "8px 12px",
                }}
              >
                {[2024, 2025, 2026, 2027, 2028].map((yearOption) => (
                  <option
                    key={yearOption}
                    value={yearOption}
                    style={{ background: "#020617" }}
                  >
                    {yearOption}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setEditMode((prev) => !prev)}
                className={`btn-ghost px-4 py-2 flex items-center gap-2 text-sm ${
                  editMode ? "glow-cyan" : ""
                }`}
                style={{ fontFamily: FONT_MONO, fontSize: "12px" }}
                type="button"
              >
                {editMode ? (
                  <>
                    <Check size={14} /> HOTOVO
                  </>
                ) : (
                  <>
                    <Edit3 size={14} /> EDITOVAT
                  </>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-6 md:grid-cols-12 gap-1.5 panel p-2 relative">
          <span className="corner-bracket tl" />
          <span className="corner-bracket tr" />
          <span className="corner-bracket bl" />
          <span className="corner-bracket br" />

          {MONTHS.map((month) => (
            <button
              key={month.idx}
              onClick={() => setSelectedMonth(month.idx)}
              className={`month-tab relative py-2.5 px-1 text-xs uppercase tracking-wider border border-transparent rounded-sm ${
                selectedMonth === month.idx ? "active" : "text-slate-400"
              } ${isMonthFilled(month.idx) ? "filled" : ""}`}
              style={{ fontFamily: FONT_MONO, fontWeight: 500 }}
              type="button"
            >
              {month.short}
              <span
                className="filled-dot absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 opacity-0 transition-opacity"
                style={{
                  boxShadow: "0 0 6px rgba(52, 211, 153, 0.6)",
                }}
              />
            </button>
          ))}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2
              style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 600,
                fontSize: "1.5rem",
              }}
            >
              <span className="text-cyan-300">▸</span> {currentMonthLabel}{" "}
              <span className="text-slate-500">{year}</span>
            </h2>

            {editMode && (
              <span
                className="text-[10px] uppercase tracking-wider px-2 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-sm"
                style={{ fontFamily: FONT_MONO }}
              >
                ⚡ EDIT MODE
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {editMode && (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400"
                style={{ fontFamily: FONT_MONO }}
                type="button"
              >
                <RotateCcw size={11} /> RESET STRUKTURY
              </button>
            )}

            <button
              onClick={resetMonth}
              className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs text-slate-400"
              style={{ fontFamily: FONT_MONO }}
              type="button"
            >
              <Trash2 size={11} /> VYMAZAT MĚSÍC
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-10">
          <div className="xl:col-span-3 space-y-4">
            {CATEGORIES.map((category) => {
              const items = itemsByCategory[category.id] || [];
              const categoryTotal = items.reduce(
                (sum, item) => sum + Number(monthValues[item.id] || 0),
                0
              );
              const categoryVat = items.reduce(
                (sum, item) =>
                  sum +
                  Number(monthValues[item.id] || 0) *
                    ((item.vatRate || 0) / 100),
                0
              );

              return (
                <CategoryPanel
                  key={category.id}
                  category={category}
                  items={items}
                  values={monthValues}
                  total={categoryTotal}
                  vatTotal={categoryVat}
                  editMode={editMode}
                  onValueChange={setValue}
                  onAddItem={() => addItem(category.id)}
                  onUpdateItem={updateItem}
                  onDeleteItem={deleteItem}
                />
              );
            })}
          </div>

          <div className="xl:col-span-2 space-y-4">
            <ResultsPanel result={result} />
          </div>
        </div>

        <YearOverview
          template={template}
          monthlyData={monthlyData}
          year={year}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
          isMonthFilled={isMonthFilled}
          yearTotals={yearTotals}
        />

        <footer
          className="mt-12 pt-6 border-t border-cyan-500/10 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500"
          style={{ fontFamily: FONT_MONO }}
        >
          <span className="flex items-center gap-2">
            <Activity size={11} className="text-cyan-400" />
            AUTO-SYNC · {template.items.length} POLOŽEK
          </span>
          <span>{yearTotals.count || 0} / 12 MĚSÍCŮ AKTIVNÍCH</span>
        </footer>
      </div>

      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="panel p-6 max-w-md w-full glow-cyan relative"
            onClick={(event) => event.stopPropagation()}
          >
            <span className="corner-bracket tl" />
            <span className="corner-bracket tr" />
            <span className="corner-bracket bl" />
            <span className="corner-bracket br" />

            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle
                className="text-amber-400 shrink-0 mt-1"
                size={20}
              />

              <div>
                <h3
                  style={{
                    fontFamily: FONT_DISPLAY,
                    fontWeight: 600,
                    fontSize: "1.1rem",
                  }}
                  className="text-slate-100"
                >
                  Reset struktury položek
                </h3>

                <p className="text-sm text-slate-400 mt-2">
                  Tohle obnoví výchozí seznam položek. Hodnoty v měsících
                  zůstanou uložené, ale položky se po resetu vrátí na výchozí
                  strukturu.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="btn-ghost px-4 py-2 text-xs"
                style={{ fontFamily: FONT_MONO }}
                type="button"
              >
                ZRUŠIT
              </button>

              <button
                onClick={resetTemplate}
                className="btn-primary px-4 py-2 text-xs"
                style={{ fontFamily: FONT_MONO }}
                type="button"
              >
                RESETOVAT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryPanel({
  category,
  items,
  values,
  total,
  vatTotal,
  editMode,
  onValueChange,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
}: CategoryPanelProps) {
  return (
    <section className="panel relative">
      <span className="corner-bracket tl" />
      <span className="corner-bracket tr" />
      <span className="corner-bracket bl" />
      <span className="corner-bracket br" />

      <header className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/15">
        <div className="flex items-center gap-3">
          <span
            className="w-1 h-5 rounded-full"
            style={{
              background: category.accent,
              boxShadow: `0 0 12px ${category.accent}`,
            }}
          />

          <div>
            <h3
              className="text-sm font-semibold uppercase tracking-[0.15em]"
              style={{
                color: category.accent,
                fontFamily: FONT_DISPLAY,
              }}
            >
              {category.label}
            </h3>

            <p
              className="text-[10px] text-slate-500 mt-0.5"
              style={{ fontFamily: FONT_MONO }}
            >
              {category.desc}
            </p>
          </div>
        </div>

        <div className="text-right">
          <div
            className="text-base tabular-nums"
            style={{
              fontFamily: FONT_MONO,
              color: category.accent,
            }}
          >
            {fmtKc(total)}
          </div>

          {vatTotal !== 0 && (
            <div
              className="text-[10px] text-slate-500 mt-0.5"
              style={{ fontFamily: FONT_MONO }}
            >
              DPH: {fmtKc(vatTotal)}
            </div>
          )}
        </div>
      </header>

      <div className="divide-y divide-slate-800/40">
        {items.length === 0 && (
          <div
            className="px-5 py-6 text-center text-xs text-slate-500"
            style={{ fontFamily: FONT_MONO }}
          >
            // ŽÁDNÉ POLOŽKY
          </div>
        )}

        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            value={values[item.id] || 0}
            editMode={editMode}
            onValueChange={(value) => onValueChange(item.id, value)}
            onUpdate={(updates) => onUpdateItem(item.id, updates)}
            onDelete={() => onDeleteItem(item.id)}
          />
        ))}
      </div>

      {editMode && (
        <button
          onClick={onAddItem}
          className="w-full px-5 py-2.5 border-t border-cyan-500/15 text-xs uppercase tracking-wider text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/5 transition flex items-center justify-center gap-2"
          style={{ fontFamily: FONT_MONO }}
          type="button"
        >
          <Plus size={12} /> PŘIDAT POLOŽKU
        </button>
      )}
    </section>
  );
}

function ItemRow({
  item,
  value,
  editMode,
  onValueChange,
  onUpdate,
  onDelete,
}: ItemRowProps) {
  const [nameValue, setNameValue] = useState<string>(item.name);

  useEffect(() => {
    setNameValue(item.name);
  }, [item.name]);

  const vatType =
    VAT_TYPES.find((vat) => vat.id === item.vatType) || VAT_TYPES[0];

  const showRate =
    item.vatType !== "reverse_charge" && item.vatType !== "none";

  return (
    <div className="row-hover flex items-center gap-3 px-5 py-2.5">
      {editMode ? (
        <input
          type="text"
          value={nameValue}
          onChange={(event) => setNameValue(event.target.value)}
          onBlur={() => {
            const trimmed = nameValue.trim();
            if (trimmed && trimmed !== item.name) {
              onUpdate({ name: trimmed });
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="num-input flex-1 px-2 py-1.5 text-sm rounded-sm"
          style={{ fontFamily: FONT_UI }}
        />
      ) : (
        <span className="flex-1 text-sm text-slate-200">{item.name}</span>
      )}

      {editMode ? (
        <div className="flex items-center gap-1">
          <select
            value={item.vatType}
            onChange={(event) => {
              const nextType = event.target.value as VatTypeId;
              const nextRate =
                nextType === "reverse_charge" || nextType === "none"
                  ? 0
                  : item.vatRate || 21;

              onUpdate({
                vatType: nextType,
                vatRate: nextRate,
              });
            }}
            style={{
              fontFamily: FONT_MONO,
              fontSize: "11px",
            }}
          >
            {VAT_TYPES.map((vat) => (
              <option
                key={vat.id}
                value={vat.id}
                style={{ background: "#020617" }}
              >
                {vat.short} {vat.label}
              </option>
            ))}
          </select>

          {showRate && (
            <div className="flex items-center bg-slate-950/60 border border-cyan-500/20 rounded-sm">
              <input
                type="number"
                step="0.5"
                value={item.vatRate}
                onChange={(event) =>
                  onUpdate({
                    vatRate: Number.parseFloat(event.target.value) || 0,
                  })
                }
                className="w-12 px-1.5 py-1 bg-transparent text-right outline-none"
                style={{
                  fontFamily: FONT_MONO,
                  fontSize: "11px",
                }}
              />

              <span className="pr-1.5 text-slate-500 text-[10px]">%</span>
            </div>
          )}
        </div>
      ) : (
        <span
          className="vat-badge"
          style={{
            background: `${vatType.color}15`,
            color: vatType.color,
            border: `1px solid ${vatType.color}30`,
          }}
        >
          <span>{vatType.short}</span>
          {showRate && <span>{item.vatRate} %</span>}
          {!showRate && <span>{vatType.label}</span>}
        </span>
      )}

      <div className="flex items-center num-input rounded-sm w-40">
        <input
          type="number"
          inputMode="decimal"
          value={value || ""}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="0"
          className="flex-1 px-2 py-1.5 text-right bg-transparent outline-none min-w-0"
          style={{
            fontFamily: FONT_MONO,
            fontSize: "13px",
            fontWeight: 500,
            color: "#22D3EE",
          }}
        />

        <span className="pr-2.5 text-slate-500 text-xs">Kč</span>
      </div>

      {editMode && (
        <button
          onClick={onDelete}
          className="p-1.5 text-slate-500 hover:text-rose-400 transition"
          title="Smazat"
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

function ResultsPanel({ result }: ResultsPanelProps) {
  const cashPositive = result.cash >= 0;
  const kpPositive = result.kp >= 0;
  const hvPositive = result.provozHV >= 0;

  return (
    <div className="space-y-4 sticky top-4">
      <div className="panel relative p-6 overflow-hidden">
        <span className="corner-bracket tl" />
        <span className="corner-bracket tr" />
        <span className="corner-bracket bl" />
        <span className="corner-bracket br" />

        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            background: cashPositive
              ? "radial-gradient(ellipse at top right, rgba(34, 211, 238, 0.3), transparent 70%)"
              : "radial-gradient(ellipse at top right, rgba(244, 114, 182, 0.3), transparent 70%)",
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Zap
              size={11}
              className={cashPositive ? "text-cyan-400" : "text-rose-400"}
            />
            <p
              className="text-[10px] uppercase tracking-[0.2em] text-slate-400"
              style={{ fontFamily: FONT_MONO }}
            >
              CASH PROVOZNÍ VÝSLEDEK
            </p>
          </div>

          <p
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
              fontSize: "2.5rem",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
            className={`${
              cashPositive
                ? "text-cyan-300 text-glow-cyan"
                : "text-rose-400 text-glow-rose"
            } tabular-nums`}
          >
            {cashPositive && "+"}
            {fmtKc(result.cash)}
          </p>

          <div
            className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400"
            style={{ fontFamily: FONT_MONO }}
          >
            {cashPositive ? (
              <TrendingUp size={12} className="text-cyan-400" />
            ) : (
              <TrendingDown size={12} className="text-rose-400" />
            )}

            <span>
              HV {fmtKc(result.provozHV)}{" "}
              {result.netDPH >= 0 ? "+" : ""}
              {fmtKc(result.netDPH)} DPH
            </span>
          </div>
        </div>
      </div>

      <div className="panel relative">
        <span className="corner-bracket tl" />
        <span className="corner-bracket tr" />
        <span className="corner-bracket bl" />
        <span className="corner-bracket br" />

        <header className="px-5 py-3 border-b border-cyan-500/15">
          <h3
            className="text-xs uppercase tracking-[0.15em] text-cyan-300"
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
            }}
          >
            P&amp;L NETTO
          </h3>
        </header>

        <dl
          className="divide-y divide-slate-800/40 px-1"
          style={{
            fontFamily: FONT_MONO,
            fontSize: "12px",
          }}
        >
          <ResultRow label="Tržba income" value={fmtKc(result.income)} muted />
          {result.refunds > 0 && (
            <ResultRow label="− Vratky" value={fmtKc(-result.refunds)} muted />
          )}
          <ResultRow label="Tržba netto" value={fmtKc(result.trzbaNetto)} bold />
          <ResultRow label="− COGS" value={fmtKc(-result.cogs)} muted />
          <ResultRow
            label="− Logistika"
            value={fmtKc(-result.logistics)}
            muted
          />
          <ResultRow
            label="− Marketing"
            value={fmtKc(-result.marketing)}
            muted
          />
          <ResultRow
            label="Krycí příspěvek"
            value={fmtKc(result.kp)}
            bold
            accent={kpPositive ? "cyan" : "rose"}
          />
          <ResultRow
            label="↳ KP marže"
            value={fmtPct(result.kpMarze)}
            muted
            small
          />
          <ResultRow
            label="− Fixní náklady"
            value={fmtKc(-result.fixed)}
            muted
          />
          <ResultRow
            label="Provozní HV"
            value={fmtKc(result.provozHV)}
            bold
            accent={hvPositive ? "cyan" : "rose"}
          />
        </dl>
      </div>

      <div className="panel relative">
        <span className="corner-bracket tl" />
        <span className="corner-bracket tr" />
        <span className="corner-bracket bl" />
        <span className="corner-bracket br" />

        <header className="px-5 py-3 border-b border-cyan-500/15">
          <h3
            className="text-xs uppercase tracking-[0.15em] text-cyan-300"
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 600,
            }}
          >
            DPH CASH FLOW
          </h3>
        </header>

        <dl
          className="divide-y divide-slate-800/40 px-1"
          style={{
            fontFamily: FONT_MONO,
            fontSize: "12px",
          }}
        >
          {result.outputDPHCZ !== 0 && (
            <ResultRow
              label="DPH výstup ČR"
              value={fmtKc(result.outputDPHCZ)}
              muted
              icon={<ArrowUpFromLine size={11} className="text-amber-400" />}
            />
          )}

          {result.outputDPHSK !== 0 && (
            <ResultRow
              label="DPH výstup SK / OSS"
              value={fmtKc(result.outputDPHSK)}
              muted
              icon={<ArrowUpFromLine size={11} className="text-rose-400" />}
            />
          )}

          <ResultRow label="Σ Output DPH" value={fmtKc(result.outputDPH)} muted />

          <ResultRow
            label="DPH vstup vratitelné"
            value={fmtKc(result.inputDPH)}
            muted
            icon={<ArrowDownToLine size={11} className="text-cyan-400" />}
          />

          <ResultRow
            label={result.netDPH >= 0 ? "Vrácení od FÚ" : "Odvod na FÚ"}
            value={`${result.netDPH >= 0 ? "+" : ""}${fmtKc(result.netDPH)}`}
            bold
            accent={result.netDPH >= 0 ? "cyan" : "rose"}
          />
        </dl>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  bold = false,
  muted = false,
  small = false,
  accent,
  icon,
}: ResultRowProps) {
  const accentColor =
    accent === "cyan" ? "#22D3EE" : accent === "rose" ? "#F472B6" : undefined;

  return (
    <div
      className={`flex items-center justify-between px-4 ${
        small ? "py-1.5" : "py-2.5"
      } ${bold ? "bg-cyan-500/[0.03]" : ""}`}
    >
      <span
        className={`flex items-center gap-1.5 ${
          muted ? "text-slate-400" : ""
        } ${bold ? "text-slate-100 font-semibold" : ""} ${
          small ? "text-[11px]" : ""
        }`}
      >
        {icon}
        {label}
      </span>

      <span
        className={`tabular-nums ${bold ? "font-semibold" : ""} ${
          small ? "text-[11px]" : ""
        }`}
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

function YearOverview({
  template,
  monthlyData,
  year,
  selectedMonth,
  onSelectMonth,
  isMonthFilled,
  yearTotals,
}: YearOverviewProps) {
  return (
    <section className="mb-8">
      <header className="mb-4 flex items-end justify-between">
        <h2
          style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 600,
            fontSize: "1.5rem",
          }}
          className="text-slate-200"
        >
          <span className="text-cyan-300">▸</span> ROČNÍ PŘEHLED{" "}
          <span className="text-slate-500">{year}</span>
        </h2>
      </header>

      <div className="panel relative overflow-x-auto">
        <span className="corner-bracket tl" />
        <span className="corner-bracket tr" />
        <span className="corner-bracket bl" />
        <span className="corner-bracket br" />

        <table className="w-full text-sm" style={{ fontFamily: FONT_MONO }}>
          <thead className="border-b border-cyan-500/15">
            <tr className="text-[10px] uppercase tracking-wider text-cyan-400/80">
              <th className="text-left px-4 py-3 font-semibold">Měsíc</th>
              <th className="text-right px-4 py-3 font-semibold">
                Tržba netto
              </th>
              <th className="text-right px-4 py-3 font-semibold">KP</th>
              <th className="text-right px-4 py-3 font-semibold">KP %</th>
              <th className="text-right px-4 py-3 font-semibold">
                Provozní HV
              </th>
              <th className="text-right px-4 py-3 font-semibold">Net DPH</th>
              <th className="text-right px-4 py-3 font-semibold">CASH</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/40">
            {MONTHS.map((month) => {
              const values = monthlyData[month.idx] || {};
              const calculated = calculate(template.items, values);
              const filled = isMonthFilled(month.idx);

              return (
                <tr
                  key={month.idx}
                  onClick={() => onSelectMonth(month.idx)}
                  className={`cursor-pointer transition row-hover ${
                    selectedMonth === month.idx ? "bg-cyan-500/[0.06]" : ""
                  } ${!filled ? "text-slate-600" : "text-slate-300"}`}
                >
                  <td
                    className="px-4 py-2.5 font-medium"
                    style={{ fontFamily: FONT_UI }}
                  >
                    <span className="flex items-center gap-2">
                      {filled ? (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400"
                          style={{
                            boxShadow: "0 0 6px rgba(52, 211, 153, 0.6)",
                          }}
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      )}

                      {month.label}

                      {selectedMonth === month.idx && (
                        <span className="text-[9px] uppercase text-cyan-400 ml-1">
                          ◂ AKT
                        </span>
                      )}
                    </span>
                  </td>

                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {filled ? fmtKc(calculated.trzbaNetto) : "—"}
                  </td>

                  <td
                    className={`px-4 py-2.5 text-right tabular-nums ${
                      filled && calculated.kp < 0
                        ? "text-rose-400"
                        : filled && calculated.kp > 0
                        ? "text-cyan-300"
                        : ""
                    }`}
                  >
                    {filled ? fmtKc(calculated.kp) : "—"}
                  </td>

                  <td
                    className={`px-4 py-2.5 text-right tabular-nums ${
                      filled && calculated.kpMarze < 0 ? "text-rose-400" : ""
                    }`}
                  >
                    {filled ? fmtPct(calculated.kpMarze) : "—"}
                  </td>

                  <td
                    className={`px-4 py-2.5 text-right tabular-nums ${
                      filled && calculated.provozHV < 0
                        ? "text-rose-400"
                        : filled && calculated.provozHV > 0
                        ? "text-cyan-300"
                        : ""
                    }`}
                  >
                    {filled ? fmtKc(calculated.provozHV) : "—"}
                  </td>

                  <td
                    className={`px-4 py-2.5 text-right tabular-nums ${
                      filled && calculated.netDPH > 0
                        ? "text-cyan-300"
                        : filled && calculated.netDPH < 0
                        ? "text-amber-400"
                        : ""
                    }`}
                  >
                    {filled
                      ? `${calculated.netDPH >= 0 ? "+" : ""}${fmtKc(
                          calculated.netDPH
                        )}`
                      : "—"}
                  </td>

                  <td
                    className={`px-4 py-2.5 text-right tabular-nums font-bold ${
                      filled && calculated.cash < 0
                        ? "text-rose-400"
                        : filled && calculated.cash > 0
                        ? "text-cyan-300"
                        : ""
                    }`}
                    style={
                      filled && calculated.cash > 0
                        ? {
                            textShadow:
                              "0 0 12px rgba(34, 211, 238, 0.4)",
                          }
                        : filled && calculated.cash < 0
                        ? {
                            textShadow:
                              "0 0 12px rgba(244, 114, 182, 0.3)",
                          }
                        : undefined
                    }
                  >
                    {filled ? fmtKc(calculated.cash) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>

          {yearTotals.count > 0 && (
            <tfoot
              className="border-t border-cyan-500/30"
              style={{
                background:
                  "linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(15, 23, 42, 0.6))",
              }}
            >
              <tr>
                <td
                  className="px-4 py-3.5 text-xs uppercase tracking-[0.15em] text-cyan-300 font-bold"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  Σ KUMULATIVNĚ
                </td>

                <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-100">
                  {fmtKc(yearTotals.trzbaNetto)}
                </td>

                <td
                  className={`px-4 py-3.5 text-right tabular-nums font-semibold ${
                    yearTotals.kp < 0 ? "text-rose-400" : "text-cyan-300"
                  }`}
                >
                  {fmtKc(yearTotals.kp)}
                </td>

                <td
                  className={`px-4 py-3.5 text-right tabular-nums font-semibold ${
                    yearTotals.kpMarze < 0 ? "text-rose-400" : "text-cyan-300"
                  }`}
                >
                  {fmtPct(yearTotals.kpMarze)}
                </td>

                <td
                  className={`px-4 py-3.5 text-right tabular-nums font-semibold ${
                    yearTotals.provozHV < 0
                      ? "text-rose-400"
                      : "text-cyan-300"
                  }`}
                >
                  {fmtKc(yearTotals.provozHV)}
                </td>

                <td
                  className={`px-4 py-3.5 text-right tabular-nums font-semibold ${
                    yearTotals.netDPH < 0 ? "text-amber-400" : "text-cyan-300"
                  }`}
                >
                  {`${yearTotals.netDPH >= 0 ? "+" : ""}${fmtKc(
                    yearTotals.netDPH
                  )}`}
                </td>

                <td
                  className={`px-4 py-3.5 text-right tabular-nums font-bold text-base ${
                    yearTotals.cash < 0 ? "text-rose-400" : "text-cyan-300"
                  }`}
                  style={
                    yearTotals.cash > 0
                      ? {
                          textShadow:
                            "0 0 16px rgba(34, 211, 238, 0.5)",
                        }
                      : yearTotals.cash < 0
                      ? {
                          textShadow:
                            "0 0 16px rgba(244, 114, 182, 0.4)",
                        }
                      : undefined
                  }
                >
                  {fmtKc(yearTotals.cash)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </section>
  );
}
