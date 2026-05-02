"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  Download,
  Edit3,
  FileUp,
  Plus,
  RotateCcw,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
} from "lucide-react";

type CategoryId = "income" | "refunds" | "cogs" | "logistics" | "marketing" | "fixed";
type VatTypeId = "input" | "output_cz" | "output_sk" | "reverse_charge" | "none";
type AmountMode = "net" | "gross";

type MonthItem = {
  id: string;
  name: string;
  category: CategoryId;
  vatType: VatTypeId;
  vatRate: number;
  amountMode: AmountMode;
};

type Template = {
  items: MonthItem[];
};

type MonthlyValues = Record<string, number>;

type MonthRecord = {
  values: MonthlyValues;
  ordersCZ: number;
  ordersSK: number;
  note: string;
  budgetRevenue: number;
  budgetMarketing: number;
  budgetCash: number;
};

type MonthlyData = Record<number, MonthRecord>;

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
  reverseChargeBase: number;
  grossIn: number;
  netIn: number;
  vatFromGrossAdjust: number;
  trzbaNetto: number;
  varCosts: number;
  kp: number;
  kpMarze: number;
  provozHV: number;
  outputDPH: number;
  netDPH: number;
  cash: number;
  orders: number;
  aov: number;
  cogsPerOrder: number;
  logisticsPerOrder: number;
  marketingPerOrder: number;
  kpPerOrder: number;
  cashPerOrder: number;
  marketingShare: number;
  mer: number;
  breakEvenRevenue: number;
  breakEvenOrders: number;
};

type YearTotals = Totals & { count: number };

type BackupPayload = {
  version: string;
  exportedAt: string;
  template: Template;
  dataByYear: Record<string, MonthlyData>;
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
  { id: "income", label: "Příjmy", accent: "#22D3EE", desc: "Tržby a další příjmy" },
  { id: "refunds", label: "Vratky", accent: "#F472B6", desc: "Vratky zákazníkům, dobropisy" },
  { id: "cogs", label: "COGS", accent: "#3B82F6", desc: "Variabilní náklady na produkt" },
  { id: "logistics", label: "Logistika", accent: "#60A5FA", desc: "Doprava, fulfillment, skladování" },
  { id: "marketing", label: "Marketing", accent: "#A78BFA", desc: "Reklama, agentury, kreativa" },
  { id: "fixed", label: "Fixní náklady", accent: "#818CF8", desc: "Mzdy, nájem, SaaS, služby" },
];

const VAT_TYPES: VatType[] = [
  { id: "input", label: "Vstup", short: "↓", color: "#22D3EE" },
  { id: "output_cz", label: "Výstup ČR", short: "↑", color: "#F59E0B" },
  { id: "output_sk", label: "Výstup SK / OSS", short: "↑", color: "#F472B6" },
  { id: "reverse_charge", label: "Reverse charge", short: "RC", color: "#94A3B8" },
  { id: "none", label: "Bez DPH", short: "—", color: "#64748B" },
];

const DEFAULT_TEMPLATE: Template = {
  items: [
    { id: "i1", name: "Tržba ČR (potraviny)", category: "income", vatType: "output_cz", vatRate: 12, amountMode: "net" },
    { id: "i2", name: "Tržba SK / OSS", category: "income", vatType: "output_sk", vatRate: 19, amountMode: "net" },
    { id: "r1", name: "Vratky ČR", category: "refunds", vatType: "output_cz", vatRate: 12, amountMode: "net" },
    { id: "c1", name: "Ořechy", category: "cogs", vatType: "input", vatRate: 12, amountMode: "net" },
    { id: "c2", name: "Čokoláda", category: "cogs", vatType: "input", vatRate: 12, amountMode: "net" },
    { id: "c3", name: "Sklenice", category: "cogs", vatType: "input", vatRate: 21, amountMode: "net" },
    { id: "c4", name: "Etikety & packaging", category: "cogs", vatType: "input", vatRate: 21, amountMode: "net" },
    { id: "l1", name: "Doprava", category: "logistics", vatType: "input", vatRate: 21, amountMode: "net" },
    { id: "l2", name: "Fulfillment", category: "logistics", vatType: "input", vatRate: 21, amountMode: "net" },
    { id: "m1", name: "Meta Ads", category: "marketing", vatType: "reverse_charge", vatRate: 0, amountMode: "net" },
    { id: "m2", name: "Google Ads", category: "marketing", vatType: "reverse_charge", vatRate: 0, amountMode: "net" },
    { id: "m3", name: "Sklik (Seznam.cz)", category: "marketing", vatType: "input", vatRate: 21, amountMode: "net" },
    { id: "m4", name: "TikTok Ads", category: "marketing", vatType: "reverse_charge", vatRate: 0, amountMode: "net" },
    { id: "f1", name: "Mzdy & odvody", category: "fixed", vatType: "none", vatRate: 0, amountMode: "net" },
    { id: "f2", name: "Nájem", category: "fixed", vatType: "input", vatRate: 21, amountMode: "net" },
    { id: "f3", name: "Služby & SaaS", category: "fixed", vatType: "input", vatRate: 21, amountMode: "net" },
  ],
};

const TEMPLATE_KEY = "fitmar-v21:template";
const LEGACY_TEMPLATE_KEY = "fitmar-v2:template";
const dataKey = (year: number) => `fitmar-v21:data:${year}`;
const legacyDataKey = (year: number) => `fitmar-v2:data:${year}`;
const YEARS = [2024, 2025, 2026, 2027, 2028];

const FONT_DISPLAY = "'Chakra Petch', 'Space Grotesk', sans-serif";
const FONT_MONO = "'JetBrains Mono', ui-monospace, monospace";
const FONT_UI = "'Inter', system-ui, sans-serif";

const fmt = (n: number | undefined | null) => {
  if (n === 0 || Number.isNaN(n) || n === undefined || n === null) return "0";
  return Math.round(n).toLocaleString("cs-CZ").replace(/[\u00A0\u202F]/g, " ");
};
const fmtKc = (n: number | undefined | null) => `${fmt(n)} Kč`;
const fmtPct = (n: number | undefined | null) => {
  if (Number.isNaN(n) || n === undefined || n === null) return "0,0 %";
  return `${(n * 100).toFixed(1).replace(".", ",")} %`;
};
const fmtX = (n: number | undefined | null) => {
  if (!n || !Number.isFinite(n)) return "0,0×";
  return `${n.toFixed(1).replace(".", ",")}×`;
};
const newId = () => `x${Math.random().toString(36).slice(2, 10)}`;

const emptyMonth = (): MonthRecord => ({ values: {}, ordersCZ: 0, ordersSK: 0, note: "", budgetRevenue: 0, budgetMarketing: 0, budgetCash: 0 });

function normalizeMonthRecord(raw: unknown): MonthRecord {
  if (!raw || typeof raw !== "object") return emptyMonth();
  const obj = raw as Partial<MonthRecord> & Record<string, unknown>;

  if (obj.values && typeof obj.values === "object") {
    return {
      values: Object.fromEntries(Object.entries(obj.values as Record<string, unknown>).map(([k, v]) => [k, Number(v) || 0])),
      ordersCZ: Number(obj.ordersCZ) || 0,
      ordersSK: Number(obj.ordersSK) || 0,
      note: String(obj.note || ""),
      budgetRevenue: Number(obj.budgetRevenue) || 0,
      budgetMarketing: Number(obj.budgetMarketing) || 0,
      budgetCash: Number(obj.budgetCash) || 0,
    };
  }

  return {
    ...emptyMonth(),
    values: Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, Number(v) || 0])),
  };
}

function normalizeMonthlyData(raw: unknown): MonthlyData {
  const out: MonthlyData = {};
  if (!raw || typeof raw !== "object") return out;
  Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
    const month = Number(k);
    if (month >= 1 && month <= 12) out[month] = normalizeMonthRecord(v);
  });
  return out;
}

function normalizeTemplate(raw: unknown): Template {
  if (!raw || typeof raw !== "object" || !("items" in raw) || !Array.isArray((raw as Template).items)) return DEFAULT_TEMPLATE;
  const items = (raw as Partial<Template>).items || [];
  return {
    items: items.map((item: Partial<MonthItem>) => ({
      id: String(item.id || newId()),
      name: String(item.name || "Položka"),
      category: CATEGORIES.some((c) => c.id === item.category) ? (item.category as CategoryId) : "fixed",
      vatType: VAT_TYPES.some((v) => v.id === item.vatType) ? (item.vatType as VatTypeId) : "none",
      vatRate: Number(item.vatRate) || 0,
      amountMode: item.amountMode === "gross" ? "gross" : "net",
    })),
  };
}

function splitAmount(amount: number, item: MonthItem) {
  const rate = Number(item.vatRate || 0) / 100;
  const hasVat = item.vatType !== "none" && item.vatType !== "reverse_charge" && rate > 0;
  if (item.amountMode === "gross" && hasVat) {
    const net = amount / (1 + rate);
    const vat = amount - net;
    return { net, vat, gross: amount, vatFromGrossAdjust: vat };
  }
  return { net: amount, vat: hasVat ? amount * rate : 0, gross: hasVat ? amount * (1 + rate) : amount, vatFromGrossAdjust: 0 };
}

function calculate(items: MonthItem[], recordOrValues: MonthRecord | MonthlyValues): Totals {
  const record = "values" in recordOrValues ? recordOrValues : { ...emptyMonth(), values: recordOrValues };
  const totals: Totals = {
    income: 0, refunds: 0, cogs: 0, logistics: 0, marketing: 0, fixed: 0,
    outputDPHCZ: 0, outputDPHSK: 0, inputDPH: 0, reverseChargeBase: 0, grossIn: 0, netIn: 0, vatFromGrossAdjust: 0,
    trzbaNetto: 0, varCosts: 0, kp: 0, kpMarze: 0, provozHV: 0, outputDPH: 0, netDPH: 0, cash: 0,
    orders: Number(record.ordersCZ || 0) + Number(record.ordersSK || 0),
    aov: 0, cogsPerOrder: 0, logisticsPerOrder: 0, marketingPerOrder: 0, kpPerOrder: 0, cashPerOrder: 0,
    marketingShare: 0, mer: 0, breakEvenRevenue: 0, breakEvenOrders: 0,
  };

  items.forEach((item) => {
    const amount = Number(record.values[item.id] || 0);
    if (!amount) return;
    const split = splitAmount(amount, item);
    totals.grossIn += split.gross;
    totals.netIn += split.net;
    totals.vatFromGrossAdjust += split.vatFromGrossAdjust;
    totals[item.category] += split.net;

    if (item.vatType === "input") totals.inputDPH += split.vat;
    if (item.vatType === "reverse_charge") totals.reverseChargeBase += split.net;
    if (item.vatType === "output_cz") {
      if (item.category === "refunds") totals.outputDPHCZ -= split.vat;
      else totals.outputDPHCZ += split.vat;
    }
    if (item.vatType === "output_sk") {
      if (item.category === "refunds") totals.outputDPHSK -= split.vat;
      else totals.outputDPHSK += split.vat;
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
  totals.aov = totals.orders > 0 ? totals.trzbaNetto / totals.orders : 0;
  totals.cogsPerOrder = totals.orders > 0 ? totals.cogs / totals.orders : 0;
  totals.logisticsPerOrder = totals.orders > 0 ? totals.logistics / totals.orders : 0;
  totals.marketingPerOrder = totals.orders > 0 ? totals.marketing / totals.orders : 0;
  totals.kpPerOrder = totals.orders > 0 ? totals.kp / totals.orders : 0;
  totals.cashPerOrder = totals.orders > 0 ? totals.cash / totals.orders : 0;
  totals.marketingShare = totals.trzbaNetto > 0 ? totals.marketing / totals.trzbaNetto : 0;
  totals.mer = totals.marketing > 0 ? totals.trzbaNetto / totals.marketing : 0;
  totals.breakEvenRevenue = totals.kpMarze > 0 ? totals.fixed / totals.kpMarze : 0;
  totals.breakEvenOrders = totals.aov > 0 ? totals.breakEvenRevenue / totals.aov : 0;
  return totals;
}

function downloadFile(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Array<string | number>>) {
  return rows.map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
}

export default function FitMarCalc() {
  const [template, setTemplate] = useState<Template>(DEFAULT_TEMPLATE);
  const [monthlyData, setMonthlyData] = useState<MonthlyData>({});
  const [year, setYear] = useState(2026);
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setSelectedMonth(new Date().getMonth() + 1), []);

  useEffect(() => {
    setLoading(true);
    try {
      const savedTemplate = window.localStorage.getItem(TEMPLATE_KEY) || window.localStorage.getItem(LEGACY_TEMPLATE_KEY);
      setTemplate(savedTemplate ? normalizeTemplate(JSON.parse(savedTemplate)) : DEFAULT_TEMPLATE);
    } catch {
      setTemplate(DEFAULT_TEMPLATE);
    }
    try {
      const savedData = window.localStorage.getItem(dataKey(year)) || window.localStorage.getItem(legacyDataKey(year));
      setMonthlyData(savedData ? normalizeMonthlyData(JSON.parse(savedData)) : {});
    } catch {
      setMonthlyData({});
    }
    setLoading(false);
  }, [year]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(template)); } catch {}
    }, 300);
    return () => window.clearTimeout(timer);
  }, [template, loading]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      try { window.localStorage.setItem(dataKey(year), JSON.stringify(monthlyData)); } catch {}
    }, 300);
    return () => window.clearTimeout(timer);
  }, [monthlyData, year, loading]);

  const monthRecord = monthlyData[selectedMonth] || emptyMonth();

  const setValue = (itemId: string, value: string) => {
    const num = value === "" || value === "-" ? 0 : Number.parseFloat(String(value).replace(",", ".")) || 0;
    setMonthlyData((prev) => ({
      ...prev,
      [selectedMonth]: { ...emptyMonth(), ...(prev[selectedMonth] || {}), values: { ...((prev[selectedMonth] || emptyMonth()).values), [itemId]: num } },
    }));
  };

  const updateMonthMeta = (updates: Partial<MonthRecord>) => {
    setMonthlyData((prev) => ({ ...prev, [selectedMonth]: { ...emptyMonth(), ...(prev[selectedMonth] || {}), ...updates } }));
  };

  const addItem = (category: CategoryId) => {
    setTemplate((prev) => ({
      ...prev,
      items: [...prev.items, {
        id: newId(), name: "Nová položka", category,
        vatType: category === "income" || category === "refunds" ? "output_cz" : "input",
        vatRate: category === "income" || category === "refunds" ? 12 : 21,
        amountMode: "net",
      }],
    }));
  };

  const updateItem = (id: string, updates: Partial<MonthItem>) => setTemplate((prev) => ({ ...prev, items: prev.items.map((item) => item.id === id ? { ...item, ...updates } : item) }));

  const deleteItem = (id: string) => {
    setTemplate((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== id) }));
    setMonthlyData((prev) => {
      const next: MonthlyData = { ...prev };
      Object.keys(next).forEach((k) => {
        const m = Number(k);
        const copy = { ...next[m], values: { ...(next[m]?.values || {}) } };
        delete copy.values[id];
        next[m] = copy;
      });
      return next;
    });
  };

  const resetMonth = () => {
    const label = MONTHS[selectedMonth - 1]?.label || "vybraný měsíc";
    if (window.confirm(`Vymazat vstupy pro ${label} ${year}?`)) {
      setMonthlyData((prev) => { const next = { ...prev }; delete next[selectedMonth]; return next; });
    }
  };

  const resetTemplate = () => { setTemplate(DEFAULT_TEMPLATE); setShowResetConfirm(false); };

  const result = useMemo(() => calculate(template.items, monthRecord), [template, monthRecord]);
  const previousResult = useMemo(() => selectedMonth > 1 ? calculate(template.items, monthlyData[selectedMonth - 1] || emptyMonth()) : null, [template, monthlyData, selectedMonth]);

  const yearTotals = useMemo<YearTotals>(() => {
    const aggregate: YearTotals = { ...calculate(template.items, emptyMonth()), count: 0 };
    for (let m = 1; m <= 12; m += 1) {
      const record = monthlyData[m];
      if (!record || (!Object.values(record.values || {}).some((v) => Number(v) !== 0) && !record.ordersCZ && !record.ordersSK)) continue;
      const c = calculate(template.items, record);
      aggregate.count += 1;
      (Object.keys(c) as Array<keyof Totals>).forEach((key) => { aggregate[key] += c[key]; });
    }
    aggregate.kpMarze = aggregate.trzbaNetto > 0 ? aggregate.kp / aggregate.trzbaNetto : 0;
    aggregate.aov = aggregate.orders > 0 ? aggregate.trzbaNetto / aggregate.orders : 0;
    aggregate.cogsPerOrder = aggregate.orders > 0 ? aggregate.cogs / aggregate.orders : 0;
    aggregate.logisticsPerOrder = aggregate.orders > 0 ? aggregate.logistics / aggregate.orders : 0;
    aggregate.marketingPerOrder = aggregate.orders > 0 ? aggregate.marketing / aggregate.orders : 0;
    aggregate.kpPerOrder = aggregate.orders > 0 ? aggregate.kp / aggregate.orders : 0;
    aggregate.cashPerOrder = aggregate.orders > 0 ? aggregate.cash / aggregate.orders : 0;
    aggregate.marketingShare = aggregate.trzbaNetto > 0 ? aggregate.marketing / aggregate.trzbaNetto : 0;
    aggregate.mer = aggregate.marketing > 0 ? aggregate.trzbaNetto / aggregate.marketing : 0;
    aggregate.breakEvenRevenue = aggregate.kpMarze > 0 ? aggregate.fixed / aggregate.kpMarze : 0;
    aggregate.breakEvenOrders = aggregate.aov > 0 ? aggregate.breakEvenRevenue / aggregate.aov : 0;
    return aggregate;
  }, [template, monthlyData]);

  const isMonthFilled = (month: number) => {
    const record = monthlyData[month];
    return Boolean(record && (Object.values(record.values || {}).some((value) => Number(value) !== 0) || record.ordersCZ || record.ordersSK));
  };

  const itemsByCategory = useMemo<Record<CategoryId, MonthItem[]>>(() => {
    const map: Record<CategoryId, MonthItem[]> = { income: [], refunds: [], cogs: [], logistics: [], marketing: [], fixed: [] };
    template.items.forEach((item) => map[item.category].push(item));
    return map;
  }, [template]);

  const exportBackup = () => {
    const dataByYear: Record<string, MonthlyData> = {};
    YEARS.forEach((y) => {
      const raw = window.localStorage.getItem(dataKey(y)) || (y === year ? JSON.stringify(monthlyData) : null);
      if (raw) dataByYear[String(y)] = normalizeMonthlyData(JSON.parse(raw));
    });
    const payload: BackupPayload = { version: "fitmar-v21", exportedAt: new Date().toISOString(), template, dataByYear };
    downloadFile(`fitmar-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2), "application/json");
  };

  const exportCsv = () => {
    const rows: Array<Array<string | number>> = [["month", "revenue_net", "kp", "kp_margin", "operating_profit", "net_vat", "cash", "orders", "aov", "mer", "marketing_share", "note"]];
    MONTHS.forEach((m) => {
      const record = monthlyData[m.idx] || emptyMonth();
      const c = calculate(template.items, record);
      rows.push([m.label, Math.round(c.trzbaNetto), Math.round(c.kp), c.kpMarze.toFixed(4), Math.round(c.provozHV), Math.round(c.netDPH), Math.round(c.cash), c.orders, Math.round(c.aov), c.mer.toFixed(2), c.marketingShare.toFixed(4), record.note || ""]);
    });
    downloadFile(`fitmar-report-${year}.csv`, toCsv(rows), "text/csv;charset=utf-8");
  };

  const importBackup = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as BackupPayload;
    if (parsed.template) {
      const normalizedTemplate = normalizeTemplate(parsed.template);
      setTemplate(normalizedTemplate);
      window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(normalizedTemplate));
    }
    if (parsed.dataByYear) {
      Object.entries(parsed.dataByYear).forEach(([y, d]) => window.localStorage.setItem(dataKey(Number(y)), JSON.stringify(normalizeMonthlyData(d))));
      setMonthlyData(normalizeMonthlyData(parsed.dataByYear[String(year)] || {}));
    }
  };

  const currentMonthLabel = MONTHS[selectedMonth - 1]?.label || "";

  return (
    <div className="min-h-screen w-full relative overflow-x-hidden" style={{ background: "#020617", color: "#E2E8F0", fontFamily: FONT_UI }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        .glow-cyan { box-shadow: 0 0 0 1px rgba(34,211,238,.3), 0 0 20px rgba(34,211,238,.15), inset 0 0 20px rgba(34,211,238,.05); }
        .text-glow-cyan { text-shadow: 0 0 20px rgba(34,211,238,.5), 0 0 40px rgba(34,211,238,.3); }
        .text-glow-rose { text-shadow: 0 0 20px rgba(244,114,182,.5), 0 0 40px rgba(244,114,182,.3); }
        .panel { background: rgba(15,23,42,.6); backdrop-filter: blur(12px); border: 1px solid rgba(56,189,248,.15); }
        .panel:hover { border-color: rgba(56,189,248,.3); }
        .corner-bracket { position:absolute; width:12px; height:12px; border-color:rgba(34,211,238,.6); }
        .corner-bracket.tl { top:-1px; left:-1px; border-top:1.5px solid; border-left:1.5px solid; }
        .corner-bracket.tr { top:-1px; right:-1px; border-top:1.5px solid; border-right:1.5px solid; }
        .corner-bracket.bl { bottom:-1px; left:-1px; border-bottom:1.5px solid; border-left:1.5px solid; }
        .corner-bracket.br { bottom:-1px; right:-1px; border-bottom:1.5px solid; border-right:1.5px solid; }
        .hex-grid { background-image: linear-gradient(rgba(56,189,248,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(56,189,248,.04) 1px, transparent 1px); background-size:48px 48px; }
        .month-tab { transition: all .2s; }
        .month-tab:hover:not(.active) { background: rgba(34,211,238,.08); border-color: rgba(34,211,238,.3); }
        .month-tab.active { background: linear-gradient(135deg, rgba(34,211,238,.15), rgba(56,189,248,.05)); border-color: rgba(34,211,238,.5); color:#22D3EE; }
        .month-tab.filled .filled-dot { opacity:1; }
        .num-input { background: rgba(2,6,23,.6); border:1px solid rgba(56,189,248,.2); }
        .num-input:focus { outline:none; border-color:rgba(34,211,238,.6); box-shadow:0 0 0 3px rgba(34,211,238,.15); background:rgba(2,6,23,.9); }
        .btn-primary { background:linear-gradient(135deg,#06B6D4,#0891B2); color:#020617; font-weight:600; transition:all .2s; }
        .btn-primary:hover { background:linear-gradient(135deg,#22D3EE,#06B6D4); box-shadow:0 0 30px rgba(34,211,238,.4); }
        .btn-ghost { background:rgba(15,23,42,.4); border:1px solid rgba(56,189,248,.2); transition:all .2s; }
        .btn-ghost:hover { background:rgba(15,23,42,.8); border-color:rgba(56,189,248,.5); color:#22D3EE; }
        .vat-badge { display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:3px; font-size:10px; font-weight:600; letter-spacing:.05em; text-transform:uppercase; font-family:${FONT_MONO}; }
        .row-hover:hover { background:rgba(34,211,238,.04); }
        @keyframes pulse-glow { 0%,100%{opacity:.4;} 50%{opacity:1;} }
        .pulse-dot { animation:pulse-glow 2s ease-in-out infinite; }
        select, textarea { background:rgba(2,6,23,.8); border:1px solid rgba(56,189,248,.3); color:#E2E8F0; border-radius:3px; font-family:${FONT_MONO}; }
        select:focus, textarea:focus { outline:none; border-color:rgba(34,211,238,.6); }
      `}</style>

      <div className="absolute inset-0 hex-grid pointer-events-none opacity-40" />
      <div className="absolute pointer-events-none" style={{ top: "-20%", left: "-10%", width: "60%", height: "60%", background: "radial-gradient(circle, rgba(34,211,238,.12) 0%, transparent 60%)", filter: "blur(60px)" }} />
      <div className="relative max-w-7xl mx-auto px-6 py-8">
        <header className="mb-8">
          <div className="flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-cyan-500/20">
            <div>
              <div className="flex items-center gap-3 mb-2"><span className="pulse-dot inline-block w-2 h-2 rounded-full bg-cyan-400" /><p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/80" style={{ fontFamily: FONT_MONO }}>// FITMAR · CASH FLOW UNIT · v2.1</p></div>
              <h1 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "2.75rem", lineHeight: 1, letterSpacing: "-.02em" }} className="text-glow-cyan"><span className="text-cyan-300">CASH</span><span className="text-slate-100"> FLOW </span><span className="text-slate-400">CALC</span></h1>
              <p className="text-sm text-slate-400 mt-3 max-w-2xl">P&L, DPH, unit economics, MoM srovnání, budget, poznámky a export/import záloh.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select value={year} onChange={(e) => setYear(Number.parseInt(e.target.value, 10))} className="text-sm" style={{ fontFamily: FONT_MONO, fontSize: 13, padding: "8px 12px" }}>{YEARS.map((y) => <option key={y} value={y} style={{ background: "#020617" }}>{y}</option>)}</select>
              <button onClick={() => setEditMode((p) => !p)} className={`btn-ghost px-4 py-2 flex items-center gap-2 text-sm ${editMode ? "glow-cyan" : ""}`} style={{ fontFamily: FONT_MONO, fontSize: 12 }} type="button">{editMode ? <><Check size={14} /> HOTOVO</> : <><Edit3 size={14} /> EDITOVAT</>}</button>
              <button onClick={exportBackup} className="btn-ghost px-3 py-2 flex items-center gap-2 text-xs" style={{ fontFamily: FONT_MONO }} type="button"><Download size={13} /> BACKUP</button>
              <button onClick={exportCsv} className="btn-ghost px-3 py-2 flex items-center gap-2 text-xs" style={{ fontFamily: FONT_MONO }} type="button"><Download size={13} /> CSV</button>
              <button onClick={() => fileInputRef.current?.click()} className="btn-ghost px-3 py-2 flex items-center gap-2 text-xs" style={{ fontFamily: FONT_MONO }} type="button"><FileUp size={13} /> IMPORT</button>
              <input ref={fileInputRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importBackup(f).catch(() => window.alert("Import se nepovedl.")); e.target.value = ""; }} />
            </div>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-6 md:grid-cols-12 gap-1.5 panel p-2 relative"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" />{MONTHS.map((m) => <button key={m.idx} onClick={() => setSelectedMonth(m.idx)} className={`month-tab relative py-2.5 px-1 text-xs uppercase tracking-wider border border-transparent rounded-sm ${selectedMonth === m.idx ? "active" : "text-slate-400"} ${isMonthFilled(m.idx) ? "filled" : ""}`} style={{ fontFamily: FONT_MONO, fontWeight: 500 }} type="button">{m.short}<span className="filled-dot absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400 opacity-0 transition-opacity" style={{ boxShadow: "0 0 6px rgba(52,211,153,.6)" }} /></button>)}</div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3"><h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "1.5rem" }}><span className="text-cyan-300">▸</span> {currentMonthLabel} <span className="text-slate-500">{year}</span></h2>{editMode && <span className="text-[10px] uppercase tracking-wider px-2 py-1 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 rounded-sm" style={{ fontFamily: FONT_MONO }}>⚡ EDIT MODE</span>}</div>
          <div className="flex items-center gap-2">{editMode && <button onClick={() => setShowResetConfirm(true)} className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400" style={{ fontFamily: FONT_MONO }} type="button"><RotateCcw size={11} /> RESET STRUKTURY</button>}<button onClick={resetMonth} className="btn-ghost px-3 py-1.5 flex items-center gap-1.5 text-xs text-slate-400" style={{ fontFamily: FONT_MONO }} type="button"><Trash2 size={11} /> VYMAZAT MĚSÍC</button></div>
        </div>

        <MonthMetaPanel record={monthRecord} result={result} onChange={updateMonthMeta} previous={previousResult} />

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-10">
          <div className="xl:col-span-3 space-y-4">{CATEGORIES.map((category) => {
            const items = itemsByCategory[category.id] || [];
            const categoryTotal = items.reduce((sum, item) => sum + splitAmount(Number(monthRecord.values[item.id] || 0), item).net, 0);
            const categoryVat = items.reduce((sum, item) => sum + splitAmount(Number(monthRecord.values[item.id] || 0), item).vat, 0);
            return <CategoryPanel key={category.id} category={category} items={items} values={monthRecord.values} total={categoryTotal} vatTotal={categoryVat} editMode={editMode} onValueChange={setValue} onAddItem={() => addItem(category.id)} onUpdateItem={updateItem} onDeleteItem={deleteItem} />;
          })}</div>
          <div className="xl:col-span-2 space-y-4"><ResultsPanel result={result} previous={previousResult} record={monthRecord} /></div>
        </div>

        <YearOverview template={template} monthlyData={monthlyData} year={year} selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} isMonthFilled={isMonthFilled} yearTotals={yearTotals} />
        <Charts template={template} monthlyData={monthlyData} />

        <footer className="mt-12 pt-6 border-t border-cyan-500/10 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-slate-500" style={{ fontFamily: FONT_MONO }}><span className="flex items-center gap-2"><Activity size={11} className="text-cyan-400" />AUTO-SYNC · {template.items.length} POLOŽEK</span><span>{yearTotals.count || 0} / 12 MĚSÍCŮ AKTIVNÍCH</span></footer>
      </div>

      {showResetConfirm && <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)}><div className="panel p-6 max-w-md w-full glow-cyan relative" onClick={(e) => e.stopPropagation()}><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" /><div className="flex items-start gap-3 mb-4"><AlertTriangle className="text-amber-400 shrink-0 mt-1" size={20} /><div><h3 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "1.1rem" }} className="text-slate-100">Reset struktury položek</h3><p className="text-sm text-slate-400 mt-2">Obnoví výchozí seznam položek. Hodnoty v měsících zůstanou v záloze, ale položky se vrátí na výchozí strukturu.</p></div></div><div className="flex justify-end gap-2 mt-6"><button onClick={() => setShowResetConfirm(false)} className="btn-ghost px-4 py-2 text-xs" style={{ fontFamily: FONT_MONO }} type="button">ZRUŠIT</button><button onClick={resetTemplate} className="btn-primary px-4 py-2 text-xs" style={{ fontFamily: FONT_MONO }} type="button">RESETOVAT</button></div></div></div>}
    </div>
  );
}

function MonthMetaPanel({ record, result, previous, onChange }: { record: MonthRecord; result: Totals; previous: Totals | null; onChange: (updates: Partial<MonthRecord>) => void }) {
  const mom = previous && previous.trzbaNetto ? (result.trzbaNetto - previous.trzbaNetto) / Math.abs(previous.trzbaNetto) : null;
  return <div className="panel relative mb-6 p-4 grid grid-cols-1 lg:grid-cols-5 gap-3"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" />
    <MetaInput label="OBJ ČR" value={record.ordersCZ} onChange={(v) => onChange({ ordersCZ: v })} />
    <MetaInput label="OBJ SK" value={record.ordersSK} onChange={(v) => onChange({ ordersSK: v })} />
    <MetaInput label="BUDGET TRŽBA" value={record.budgetRevenue} onChange={(v) => onChange({ budgetRevenue: v })} />
    <MetaInput label="BUDGET MKT" value={record.budgetMarketing} onChange={(v) => onChange({ budgetMarketing: v })} />
    <div className="text-xs text-slate-400" style={{ fontFamily: FONT_MONO }}><div>MoM tržba: <span className={mom !== null && mom >= 0 ? "text-cyan-300" : "text-rose-400"}>{mom === null ? "—" : fmtPct(mom)}</span></div><div>AOV: <span className="text-cyan-300">{fmtKc(result.aov)}</span></div><div>MER: <span className="text-cyan-300">{fmtX(result.mer)}</span></div></div>
    <textarea value={record.note} onChange={(e) => onChange({ note: e.target.value })} placeholder="Poznámka k měsíci: kampaň, sklad, sezóna…" className="lg:col-span-5 w-full min-h-16 p-3 text-xs text-slate-300" />
  </div>;
}

function MetaInput({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return <label className="block"><span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: FONT_MONO }}>{label}</span><input type="number" value={value || ""} onChange={(e) => onChange(Number.parseFloat(e.target.value) || 0)} className="num-input w-full px-3 py-2 text-right rounded-sm" style={{ fontFamily: FONT_MONO }} placeholder="0" /></label>;
}

function CategoryPanel({ category, items, values, total, vatTotal, editMode, onValueChange, onAddItem, onUpdateItem, onDeleteItem }: { category: Category; items: MonthItem[]; values: MonthlyValues; total: number; vatTotal: number; editMode: boolean; onValueChange: (itemId: string, value: string) => void; onAddItem: () => void; onUpdateItem: (id: string, updates: Partial<MonthItem>) => void; onDeleteItem: (id: string) => void; }) {
  return <section className="panel relative"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" /><header className="flex items-center justify-between px-5 py-3 border-b border-cyan-500/15"><div className="flex items-center gap-3"><span className="w-1 h-5 rounded-full" style={{ background: category.accent, boxShadow: `0 0 12px ${category.accent}` }} /><div><h3 className="text-sm font-semibold uppercase tracking-[0.15em]" style={{ color: category.accent, fontFamily: FONT_DISPLAY }}>{category.label}</h3><p className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: FONT_MONO }}>{category.desc}</p></div></div><div className="text-right"><div className="text-base tabular-nums" style={{ fontFamily: FONT_MONO, color: category.accent }}>{fmtKc(total)}</div>{vatTotal !== 0 && <div className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: FONT_MONO }}>DPH: {fmtKc(vatTotal)}</div>}</div></header><div className="divide-y divide-slate-800/40">{items.length === 0 && <div className="px-5 py-6 text-center text-xs text-slate-500" style={{ fontFamily: FONT_MONO }}>// ŽÁDNÉ POLOŽKY</div>}{items.map((item) => <ItemRow key={item.id} item={item} value={values[item.id] || 0} editMode={editMode} onValueChange={(value) => onValueChange(item.id, value)} onUpdate={(updates) => onUpdateItem(item.id, updates)} onDelete={() => onDeleteItem(item.id)} />)}</div>{editMode && <button onClick={onAddItem} className="w-full px-5 py-2.5 border-t border-cyan-500/15 text-xs uppercase tracking-wider text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/5 transition flex items-center justify-center gap-2" style={{ fontFamily: FONT_MONO }} type="button"><Plus size={12} /> PŘIDAT POLOŽKU</button>}</section>;
}

function ItemRow({ item, value, editMode, onValueChange, onUpdate, onDelete }: { item: MonthItem; value: number; editMode: boolean; onValueChange: (value: string) => void; onUpdate: (updates: Partial<MonthItem>) => void; onDelete: () => void; }) {
  const [nameValue, setNameValue] = useState(item.name);
  useEffect(() => setNameValue(item.name), [item.name]);
  const vatType = VAT_TYPES.find((v) => v.id === item.vatType) || VAT_TYPES[0];
  const showRate = item.vatType !== "reverse_charge" && item.vatType !== "none";
  return <div className="row-hover flex items-center gap-3 px-5 py-2.5">{editMode ? <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)} onBlur={() => { const t = nameValue.trim(); if (t && t !== item.name) onUpdate({ name: t }); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }} className="num-input flex-1 px-2 py-1.5 text-sm rounded-sm" style={{ fontFamily: FONT_UI }} /> : <span className="flex-1 text-sm text-slate-200">{item.name}</span>}{editMode ? <div className="flex items-center gap-1"><select value={item.vatType} onChange={(e) => { const nextType = e.target.value as VatTypeId; onUpdate({ vatType: nextType, vatRate: nextType === "reverse_charge" || nextType === "none" ? 0 : item.vatRate || 21 }); }}><option value="input">↓ Vstup</option><option value="output_cz">↑ Výstup ČR</option><option value="output_sk">↑ Výstup SK</option><option value="reverse_charge">RC Reverse</option><option value="none">— Bez DPH</option></select>{showRate && <input type="number" step="0.5" value={item.vatRate} onChange={(e) => onUpdate({ vatRate: Number.parseFloat(e.target.value) || 0 })} className="num-input w-14 px-1.5 py-1 text-right rounded-sm" style={{ fontFamily: FONT_MONO, fontSize: 11 }} />}<select value={item.amountMode} onChange={(e) => onUpdate({ amountMode: e.target.value as AmountMode })}><option value="net">bez DPH</option><option value="gross">s DPH</option></select></div> : <span className="vat-badge" style={{ background: `${vatType.color}15`, color: vatType.color, border: `1px solid ${vatType.color}30` }}><span>{vatType.short}</span>{showRate && <span>{item.vatRate} %</span>}<span>{item.amountMode === "gross" ? "s DPH" : "bez DPH"}</span></span>}<div className="flex items-center num-input rounded-sm w-40"><input type="number" inputMode="decimal" value={value || ""} onChange={(e) => onValueChange(e.target.value)} placeholder="0" className="flex-1 px-2 py-1.5 text-right bg-transparent outline-none min-w-0" style={{ fontFamily: FONT_MONO, fontSize: 13, fontWeight: 500, color: "#22D3EE" }} /><span className="pr-2.5 text-slate-500 text-xs">Kč</span></div>{editMode && <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-rose-400 transition" title="Smazat" type="button"><X size={14} /></button>}</div>;
}

function ResultsPanel({ result, previous, record }: { result: Totals; previous: Totals | null; record: MonthRecord }) {
  const cashPositive = result.cash >= 0;
  const budgetRevenueDiff = record.budgetRevenue ? result.trzbaNetto - record.budgetRevenue : null;
  const budgetMarketingDiff = record.budgetMarketing ? result.marketing - record.budgetMarketing : null;
  return <div className="space-y-4 sticky top-4"><div className="panel relative p-6 overflow-hidden"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" /><div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: cashPositive ? "radial-gradient(ellipse at top right, rgba(34,211,238,.3), transparent 70%)" : "radial-gradient(ellipse at top right, rgba(244,114,182,.3), transparent 70%)" }} /><div className="relative"><div className="flex items-center gap-2 mb-3"><Zap size={11} className={cashPositive ? "text-cyan-400" : "text-rose-400"} /><p className="text-[10px] uppercase tracking-[0.2em] text-slate-400" style={{ fontFamily: FONT_MONO }}>CASH PROVOZNÍ VÝSLEDEK</p></div><p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "2.5rem", lineHeight: 1, letterSpacing: "-.02em" }} className={`${cashPositive ? "text-cyan-300 text-glow-cyan" : "text-rose-400 text-glow-rose"} tabular-nums`}>{cashPositive && "+"}{fmtKc(result.cash)}</p><div className="flex items-center gap-1.5 mt-3 text-[11px] text-slate-400" style={{ fontFamily: FONT_MONO }}>{cashPositive ? <TrendingUp size={12} className="text-cyan-400" /> : <TrendingDown size={12} className="text-rose-400" />}<span>HV {fmtKc(result.provozHV)} {result.netDPH >= 0 ? "+" : ""}{fmtKc(result.netDPH)} DPH</span></div></div></div><Panel title="UNIT ECONOMICS"><ResultRow label="Objednávky" value={String(result.orders)} /><ResultRow label="AOV" value={fmtKc(result.aov)} /><ResultRow label="COGS / obj." value={fmtKc(result.cogsPerOrder)} muted /><ResultRow label="Logistika / obj." value={fmtKc(result.logisticsPerOrder)} muted /><ResultRow label="Marketing / obj." value={fmtKc(result.marketingPerOrder)} muted /><ResultRow label="KP / obj." value={fmtKc(result.kpPerOrder)} bold accent={result.kpPerOrder >= 0 ? "cyan" : "rose"} /><ResultRow label="Cash / obj." value={fmtKc(result.cashPerOrder)} bold accent={result.cashPerOrder >= 0 ? "cyan" : "rose"} /></Panel><Panel title="EFEKTIVITA"><ResultRow label="MER" value={fmtX(result.mer)} bold accent="cyan" /><ResultRow label="Marketing / tržba" value={fmtPct(result.marketingShare)} /><ResultRow label="Break-even tržba" value={fmtKc(result.breakEvenRevenue)} /><ResultRow label="Break-even objednávky" value={fmt(result.breakEvenOrders)} />{previous && <ResultRow label="MoM cash" value={`${result.cash - previous.cash >= 0 ? "+" : ""}${fmtKc(result.cash - previous.cash)}`} accent={result.cash - previous.cash >= 0 ? "cyan" : "rose"} />}</Panel><Panel title="BUDGET"><ResultRow label="Tržba vs budget" value={budgetRevenueDiff === null ? "—" : `${budgetRevenueDiff >= 0 ? "+" : ""}${fmtKc(budgetRevenueDiff)}`} accent={budgetRevenueDiff !== null && budgetRevenueDiff >= 0 ? "cyan" : "rose"} /><ResultRow label="Marketing vs budget" value={budgetMarketingDiff === null ? "—" : `${budgetMarketingDiff >= 0 ? "+" : ""}${fmtKc(budgetMarketingDiff)}`} accent={budgetMarketingDiff !== null && budgetMarketingDiff <= 0 ? "cyan" : "rose"} /></Panel><Panel title="P&L NETTO"><ResultRow label="Tržba netto" value={fmtKc(result.trzbaNetto)} bold /><ResultRow label="− COGS" value={fmtKc(-result.cogs)} muted /><ResultRow label="− Logistika" value={fmtKc(-result.logistics)} muted /><ResultRow label="− Marketing" value={fmtKc(-result.marketing)} muted /><ResultRow label="Krycí příspěvek" value={fmtKc(result.kp)} bold accent={result.kp >= 0 ? "cyan" : "rose"} /><ResultRow label="KP marže" value={fmtPct(result.kpMarze)} muted small /><ResultRow label="− Fixní náklady" value={fmtKc(-result.fixed)} muted /><ResultRow label="Provozní HV" value={fmtKc(result.provozHV)} bold accent={result.provozHV >= 0 ? "cyan" : "rose"} /></Panel><Panel title="DPH CASH FLOW"><ResultRow label="DPH výstup ČR" value={fmtKc(result.outputDPHCZ)} muted icon={<ArrowUpFromLine size={11} className="text-amber-400" />} /><ResultRow label="DPH výstup SK / OSS" value={fmtKc(result.outputDPHSK)} muted icon={<ArrowUpFromLine size={11} className="text-rose-400" />} /><ResultRow label="DPH vstup" value={fmtKc(result.inputDPH)} muted icon={<ArrowDownToLine size={11} className="text-cyan-400" />} /><ResultRow label="Reverse charge základ" value={fmtKc(result.reverseChargeBase)} muted /><ResultRow label={result.netDPH >= 0 ? "Vrácení od FÚ" : "Odvod na FÚ"} value={`${result.netDPH >= 0 ? "+" : ""}${fmtKc(result.netDPH)}`} bold accent={result.netDPH >= 0 ? "cyan" : "rose"} /></Panel></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) { return <div className="panel relative"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" /><header className="px-5 py-3 border-b border-cyan-500/15"><h3 className="text-xs uppercase tracking-[0.15em] text-cyan-300" style={{ fontFamily: FONT_DISPLAY, fontWeight: 600 }}>{title}</h3></header><dl className="divide-y divide-slate-800/40 px-1" style={{ fontFamily: FONT_MONO, fontSize: 12 }}>{children}</dl></div>; }
function ResultRow({ label, value, bold = false, muted = false, small = false, accent, icon }: { label: string; value: string; bold?: boolean; muted?: boolean; small?: boolean; accent?: "cyan" | "rose"; icon?: React.ReactNode }) { const color = accent === "cyan" ? "#22D3EE" : accent === "rose" ? "#F472B6" : undefined; return <div className={`flex items-center justify-between px-4 ${small ? "py-1.5" : "py-2.5"} ${bold ? "bg-cyan-500/[0.03]" : ""}`}><span className={`flex items-center gap-1.5 ${muted ? "text-slate-400" : ""} ${bold ? "text-slate-100 font-semibold" : ""} ${small ? "text-[11px]" : ""}`}>{icon}{label}</span><span className={`tabular-nums ${bold ? "font-semibold" : ""} ${small ? "text-[11px]" : ""}`} style={color ? { color } : undefined}>{value}</span></div>; }

function YearOverview({ template, monthlyData, year, selectedMonth, onSelectMonth, isMonthFilled, yearTotals }: { template: Template; monthlyData: MonthlyData; year: number; selectedMonth: number; onSelectMonth: (m: number) => void; isMonthFilled: (m: number) => boolean; yearTotals: YearTotals }) {
  return <section className="mb-8"><header className="mb-4 flex items-end justify-between"><h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: "1.5rem" }} className="text-slate-200"><span className="text-cyan-300">▸</span> ROČNÍ PŘEHLED <span className="text-slate-500">{year}</span></h2></header><div className="panel relative overflow-x-auto"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" /><table className="w-full text-sm" style={{ fontFamily: FONT_MONO }}><thead className="border-b border-cyan-500/15"><tr className="text-[10px] uppercase tracking-wider text-cyan-400/80"><th className="text-left px-4 py-3 font-semibold">Měsíc</th><th className="text-right px-4 py-3 font-semibold">Tržba</th><th className="text-right px-4 py-3 font-semibold">KP</th><th className="text-right px-4 py-3 font-semibold">KP %</th><th className="text-right px-4 py-3 font-semibold">HV</th><th className="text-right px-4 py-3 font-semibold">Net DPH</th><th className="text-right px-4 py-3 font-semibold">Obj.</th><th className="text-right px-4 py-3 font-semibold">MER</th><th className="text-right px-4 py-3 font-semibold">Cash</th></tr></thead><tbody className="divide-y divide-slate-800/40">{MONTHS.map((m) => { const record = monthlyData[m.idx] || emptyMonth(); const c = calculate(template.items, record); const filled = isMonthFilled(m.idx); return <tr key={m.idx} onClick={() => onSelectMonth(m.idx)} className={`cursor-pointer transition row-hover ${selectedMonth === m.idx ? "bg-cyan-500/[0.06]" : ""} ${!filled ? "text-slate-600" : "text-slate-300"}`}><td className="px-4 py-2.5 font-medium" style={{ fontFamily: FONT_UI }}><span className="flex items-center gap-2"><span className={`w-1.5 h-1.5 rounded-full ${filled ? "bg-emerald-400" : "bg-slate-700"}`} />{m.label}{selectedMonth === m.idx && <span className="text-[9px] uppercase text-cyan-400 ml-1">◂ AKT</span>}</span></td><td className="px-4 py-2.5 text-right tabular-nums">{filled ? fmtKc(c.trzbaNetto) : "—"}</td><td className={`px-4 py-2.5 text-right tabular-nums ${filled && c.kp < 0 ? "text-rose-400" : filled && c.kp > 0 ? "text-cyan-300" : ""}`}>{filled ? fmtKc(c.kp) : "—"}</td><td className="px-4 py-2.5 text-right tabular-nums">{filled ? fmtPct(c.kpMarze) : "—"}</td><td className="px-4 py-2.5 text-right tabular-nums">{filled ? fmtKc(c.provozHV) : "—"}</td><td className="px-4 py-2.5 text-right tabular-nums">{filled ? `${c.netDPH >= 0 ? "+" : ""}${fmtKc(c.netDPH)}` : "—"}</td><td className="px-4 py-2.5 text-right tabular-nums">{filled ? c.orders : "—"}</td><td className="px-4 py-2.5 text-right tabular-nums">{filled ? fmtX(c.mer) : "—"}</td><td className={`px-4 py-2.5 text-right tabular-nums font-bold ${filled && c.cash < 0 ? "text-rose-400" : filled && c.cash > 0 ? "text-cyan-300" : ""}`}>{filled ? fmtKc(c.cash) : "—"}</td></tr>; })}</tbody>{yearTotals.count > 0 && <tfoot className="border-t border-cyan-500/30" style={{ background: "linear-gradient(135deg, rgba(34,211,238,.08), rgba(15,23,42,.6))" }}><tr><td className="px-4 py-3.5 text-xs uppercase tracking-[0.15em] text-cyan-300 font-bold" style={{ fontFamily: FONT_DISPLAY }}>Σ KUMULATIVNĚ</td><td className="px-4 py-3.5 text-right font-semibold">{fmtKc(yearTotals.trzbaNetto)}</td><td className="px-4 py-3.5 text-right font-semibold text-cyan-300">{fmtKc(yearTotals.kp)}</td><td className="px-4 py-3.5 text-right font-semibold">{fmtPct(yearTotals.kpMarze)}</td><td className="px-4 py-3.5 text-right font-semibold">{fmtKc(yearTotals.provozHV)}</td><td className="px-4 py-3.5 text-right font-semibold">{`${yearTotals.netDPH >= 0 ? "+" : ""}${fmtKc(yearTotals.netDPH)}`}</td><td className="px-4 py-3.5 text-right font-semibold">{yearTotals.orders}</td><td className="px-4 py-3.5 text-right font-semibold">{fmtX(yearTotals.mer)}</td><td className={`px-4 py-3.5 text-right font-bold text-base ${yearTotals.cash < 0 ? "text-rose-400" : "text-cyan-300"}`}>{fmtKc(yearTotals.cash)}</td></tr></tfoot>}</table></div></section>;
}

function Charts({ template, monthlyData }: { template: Template; monthlyData: MonthlyData }) {
  const data = MONTHS.map((m) => ({ month: m.short, ...calculate(template.items, monthlyData[m.idx] || emptyMonth()) }));
  const maxRevenue = Math.max(1, ...data.map((d) => Math.abs(d.trzbaNetto)));
  const maxCash = Math.max(1, ...data.map((d) => Math.abs(d.cash)));
  return <section className="grid grid-cols-1 lg:grid-cols-2 gap-6"><MiniChart title="TRŽBA NETTO" data={data.map((d) => ({ label: d.month, value: d.trzbaNetto }))} max={maxRevenue} /><MiniChart title="CASH VÝSLEDEK" data={data.map((d) => ({ label: d.month, value: d.cash }))} max={maxCash} signed /></section>;
}
function MiniChart({ title, data, max, signed = false }: { title: string; data: Array<{ label: string; value: number }>; max: number; signed?: boolean }) { return <div className="panel relative p-5"><span className="corner-bracket tl" /><span className="corner-bracket tr" /><span className="corner-bracket bl" /><span className="corner-bracket br" /><h3 className="text-xs uppercase tracking-[0.15em] text-cyan-300 mb-4" style={{ fontFamily: FONT_DISPLAY }}>{title}</h3><div className="flex items-end gap-2 h-40">{data.map((d) => <div key={d.label} className="flex-1 flex flex-col items-center gap-2"><div className="w-full flex items-end justify-center h-32"><div className={d.value < 0 ? "bg-rose-400" : "bg-cyan-400"} style={{ width: "70%", height: `${Math.max(2, Math.abs(d.value) / max * 100)}%`, boxShadow: d.value < 0 ? "0 0 10px rgba(244,114,182,.4)" : "0 0 10px rgba(34,211,238,.4)" }} title={fmtKc(d.value)} /></div><span className="text-[10px] text-slate-500" style={{ fontFamily: FONT_MONO }}>{d.label}</span></div>)}</div></div>; }
