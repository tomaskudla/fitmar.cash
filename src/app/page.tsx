"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Info,
  Settings,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

type MonthData = {
  trzbaCZ: number;
  trzbaSK: number;
  vratky: number;
  cogs: number;
  logistika: number;
  metaAds: number;
  googleAds: number;
  sklik: number;
  tiktokAds: number;
  sluzby: number;
  fixni: number;
};

type Rates = {
  dphCZ: number;
  dphSK: number;
  dphVstup: number;
};

type CalcResult = {
  trzbaNetto: number;
  marketing: number;
  kp: number;
  kpMarze: number;
  provozHV: number;
  outDPH: number;
  inDPH: number;
  netDPH: number;
  cash: number;
};

type YearTotals = CalcResult & {
  count: number;
};

type InputField = {
  field: keyof MonthData;
  label: string;
  tax: string;
  taxTone: "zinc" | "sky";
  neg?: boolean;
};

type InputGroup = {
  section: string;
  tone: "emerald" | "orange" | "amber" | "rose";
  items: InputField[];
};

type RowProps = {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  small?: boolean;
  accent?: "emerald" | "rose";
  icon?: React.ReactNode;
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

const EMPTY: MonthData = {
  trzbaCZ: 0,
  trzbaSK: 0,
  vratky: 0,
  cogs: 0,
  logistika: 0,
  metaAds: 0,
  googleAds: 0,
  sklik: 0,
  tiktokAds: 0,
  sluzby: 0,
  fixni: 0,
};

const DEFAULT_RATES: Rates = {
  dphCZ: 12,
  dphSK: 19,
  dphVstup: 21,
};

const DISPLAY = "'Fraunces', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const UI = "'Inter', system-ui, sans-serif";

export default function FitMarCalc() {
  const [year, setYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [data, setData] = useState<Record<number, MonthData>>({});
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setSelectedMonth(new Date().getMonth() + 1);
  }, []);

  useEffect(() => {
    try {
      const savedData = window.localStorage.getItem(`fitmar:${year}`);
      setData(savedData ? JSON.parse(savedData) : {});
    } catch {
      setData({});
    }

    try {
      const savedRates = window.localStorage.getItem("fitmar:rates");
      if (savedRates) {
        const parsedRates = JSON.parse(savedRates);
        setRates({
          dphCZ: Number(parsedRates.dphCZ) || DEFAULT_RATES.dphCZ,
          dphSK: Number(parsedRates.dphSK) || DEFAULT_RATES.dphSK,
          dphVstup: Number(parsedRates.dphVstup) || DEFAULT_RATES.dphVstup,
        });
      }
    } catch {}

    setLoading(false);
  }, [year]);

  useEffect(() => {
    if (loading) return;

    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(`fitmar:${year}`, JSON.stringify(data));
      } catch {}
    }, 300);

    return () => window.clearTimeout(timer);
  }, [data, year, loading]);

  useEffect(() => {
    if (loading) return;

    try {
      window.localStorage.setItem("fitmar:rates", JSON.stringify(rates));
    } catch {}
  }, [rates, loading]);

  const getMonth = (monthNumber: number): MonthData => {
    return data[monthNumber] || { ...EMPTY };
  };

  const updateValue = (field: keyof MonthData, raw: string) => {
    const num =
      raw === "" || raw === "-"
        ? 0
        : Number.parseFloat(String(raw).replace(",", ".")) || 0;

    setData((prev) => ({
      ...prev,
      [selectedMonth]: {
        ...getMonth(selectedMonth),
        [field]: num,
      },
    }));
  };

  const resetMonth = () => {
    const currentMonth = MONTHS[selectedMonth - 1];

    if (!currentMonth) return;

    if (window.confirm(`Vymazat data pro ${currentMonth.label} ${year}?`)) {
      setData((prev) => {
        const next = { ...prev };
        delete next[selectedMonth];
        return next;
      });
    }
  };

  const calc = (m: MonthData = EMPTY): CalcResult => {
    const trzbaCZ = m.trzbaCZ || 0;
    const trzbaSK = m.trzbaSK || 0;
    const vratky = m.vratky || 0;
    const cogs = m.cogs || 0;
    const logistika = m.logistika || 0;
    const metaAds = m.metaAds || 0;
    const googleAds = m.googleAds || 0;
    const sklik = m.sklik || 0;
    const tiktokAds = m.tiktokAds || 0;
    const sluzby = m.sluzby || 0;
    const fixni = m.fixni || 0;

    const trzbaNetto = trzbaCZ + trzbaSK - vratky;
    const marketing = metaAds + googleAds + sklik + tiktokAds;
    const kp = trzbaNetto - cogs - logistika - marketing;
    const kpMarze = trzbaNetto > 0 ? kp / trzbaNetto : 0;
    const provozHV = kp - sluzby - fixni;

    const outDPH =
      trzbaCZ * (rates.dphCZ / 100) +
      trzbaSK * (rates.dphSK / 100) -
      vratky * (rates.dphCZ / 100);

    const inDPH =
      (cogs + logistika + sklik + sluzby + fixni) *
      (rates.dphVstup / 100);

    const netDPH = inDPH - outDPH;
    const cash = provozHV + netDPH;

    return {
      trzbaNetto,
      marketing,
      kp,
      kpMarze,
      provozHV,
      outDPH,
      inDPH,
      netDPH,
      cash,
    };
  };

  const month = getMonth(selectedMonth);
  const r = calc(month);

  const yearTotals = useMemo<YearTotals>(() => {
    const filledMonths = Object.keys(data)
      .map(Number)
      .filter((monthKey) => {
        const monthData = data[monthKey];
        return (
          monthData &&
          Object.values(monthData).some((value) => Number(value) !== 0)
        );
      });

    const totals: YearTotals = {
      trzbaNetto: 0,
      marketing: 0,
      kp: 0,
      kpMarze: 0,
      provozHV: 0,
      outDPH: 0,
      inDPH: 0,
      netDPH: 0,
      cash: 0,
      count: filledMonths.length,
    };

    filledMonths.forEach((monthKey) => {
      const c = calc(data[monthKey]);

      totals.trzbaNetto += c.trzbaNetto;
      totals.marketing += c.marketing;
      totals.kp += c.kp;
      totals.provozHV += c.provozHV;
      totals.outDPH += c.outDPH;
      totals.inDPH += c.inDPH;
      totals.netDPH += c.netDPH;
      totals.cash += c.cash;
    });

    totals.kpMarze =
      totals.trzbaNetto > 0 ? totals.kp / totals.trzbaNetto : 0;

    return totals;
  }, [data, rates]);

  const fmt = (n: number | undefined | null): string => {
    if (n === 0 || Number.isNaN(n) || n === undefined || n === null) {
      return "0";
    }

    const value = Math.round(n);
    return value.toLocaleString("cs-CZ").replace(/[\u00A0\u202F]/g, " ");
  };

  const fmtKc = (n: number | undefined | null): string => `${fmt(n)} Kč`;

  const fmtPct = (n: number | undefined | null): string => {
    if (Number.isNaN(n) || n === undefined || n === null) {
      return "0,0 %";
    }

    return (n * 100).toFixed(1).replace(".", ",") + " %";
  };

  const isMonthFilled = (monthNumber: number): boolean => {
    const monthData = data[monthNumber];

    return Boolean(
      monthData &&
        Object.values(monthData).some((value) => Number(value) !== 0)
    );
  };

  const inputs: InputGroup[] = [
    {
      section: "Příjmy",
      tone: "emerald",
      items: [
        {
          field: "trzbaCZ",
          label: "Tržba ČR",
          tax: `DPH ${rates.dphCZ} %`,
          taxTone: "zinc",
        },
        {
          field: "trzbaSK",
          label: "Tržba SK / OSS",
          tax: `DPH ${rates.dphSK} %`,
          taxTone: "zinc",
        },
        {
          field: "vratky",
          label: "Vratky",
          tax: `DPH ${rates.dphCZ} %`,
          taxTone: "zinc",
          neg: true,
        },
      ],
    },
    {
      section: "Variabilní náklady",
      tone: "orange",
      items: [
        {
          field: "cogs",
          label: "COGS (sklenice, ořechy, packaging)",
          tax: `DPH ${rates.dphVstup} %`,
          taxTone: "zinc",
        },
        {
          field: "logistika",
          label: "Logistika (přeprava, fulfillment)",
          tax: `DPH ${rates.dphVstup} %`,
          taxTone: "zinc",
        },
      ],
    },
    {
      section: "Marketing",
      tone: "amber",
      items: [
        {
          field: "metaAds",
          label: "Meta Ads",
          tax: "reverse charge",
          taxTone: "sky",
        },
        {
          field: "googleAds",
          label: "Google Ads",
          tax: "reverse charge",
          taxTone: "sky",
        },
        {
          field: "sklik",
          label: "Sklik (Seznam.cz)",
          tax: `DPH ${rates.dphVstup} %`,
          taxTone: "zinc",
        },
        {
          field: "tiktokAds",
          label: "TikTok Ads",
          tax: "reverse charge",
          taxTone: "sky",
        },
      ],
    },
    {
      section: "Fixní náklady",
      tone: "rose",
      items: [
        {
          field: "sluzby",
          label: "Služby & SaaS",
          tax: `DPH ${rates.dphVstup} %`,
          taxTone: "zinc",
        },
        {
          field: "fixni",
          label: "Fixní náklady (nájem, mzdy…)",
          tax: `DPH ${rates.dphVstup} %`,
          taxTone: "zinc",
        },
      ],
    },
  ];

  const toneClasses: Record<InputGroup["tone"], string> = {
    emerald: "text-emerald-700 border-emerald-200",
    orange: "text-orange-700 border-orange-200",
    amber: "text-amber-700 border-amber-200",
    rose: "text-rose-700 border-rose-200",
  };

  const currentMonthLabel = MONTHS[selectedMonth - 1]?.label || "";

  return (
    <div
      className="min-h-screen w-full"
      style={{
        backgroundColor: "#FAF7F2",
        fontFamily: UI,
        color: "#0A0E1A",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap');
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        .num-input:focus {
          outline: 2px solid #0A0E1A;
          outline-offset: -2px;
          background: #fff;
        }
        .month-pill:hover {
          background: rgba(10,14,26,0.04);
        }
        .month-pill.active {
          background: #0A0E1A;
          color: #FAF7F2;
        }
        .month-pill.filled::after {
          content: '';
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #059669;
        }
        .month-pill.active.filled::after {
          background: #6EE7B7;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-stone-300">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">
              FitMar · Peanut Company s.r.o.
            </p>

            <h1
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                fontSize: "2.5rem",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Cash Flow Kalkulačka
            </h1>

            <p className="text-sm text-stone-600 mt-2 max-w-2xl">
              Měsíční P&amp;L se zohledněním DPH asymetrie. Reverse charge u
              Meta/Google/TikTok je DPH-neutrální.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={year}
              onChange={(event) => setYear(Number.parseInt(event.target.value, 10))}
              className="px-3 py-2 text-sm bg-white border border-stone-300 hover:border-stone-500 transition"
              style={{ fontFamily: MONO }}
            >
              {[2024, 2025, 2026, 2027].map((yearOption) => (
                <option key={yearOption} value={yearOption}>
                  {yearOption}
                </option>
              ))}
            </select>

            <button
              onClick={() => setShowSettings((prev) => !prev)}
              className="p-2 bg-white border border-stone-300 hover:border-stone-500 transition"
              title="DPH sazby"
              type="button"
            >
              <Settings size={16} />
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="mb-6 p-5 bg-white border border-stone-300">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">
                DPH sazby
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { key: "dphCZ" as keyof Rates, label: "Výstup ČR" },
                { key: "dphSK" as keyof Rates, label: "Výstup SK / OSS" },
                { key: "dphVstup" as keyof Rates, label: "Vstup" },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-xs text-stone-600 block mb-1">
                    {label}
                  </span>

                  <div className="flex items-center bg-stone-50 border border-stone-300">
                    <input
                      type="number"
                      step="0.5"
                      value={rates[key]}
                      onChange={(event) =>
                        setRates((prev) => ({
                          ...prev,
                          [key]: Number.parseFloat(event.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 bg-transparent num-input text-right"
                      style={{ fontFamily: MONO }}
                    />

                    <span className="px-3 text-stone-500 text-sm">%</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1 bg-white border border-stone-300 p-1">
          {MONTHS.map((monthItem) => (
            <button
              key={monthItem.idx}
              onClick={() => setSelectedMonth(monthItem.idx)}
              className={`month-pill relative py-3 text-xs uppercase tracking-wider transition ${
                selectedMonth === monthItem.idx ? "active" : ""
              } ${isMonthFilled(monthItem.idx) ? "filled" : ""}`}
              style={{ fontFamily: MONO, fontWeight: 500 }}
              type="button"
            >
              {monthItem.short}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <h2
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  fontSize: "1.5rem",
                }}
              >
                {currentMonthLabel} {year}
              </h2>

              <button
                onClick={resetMonth}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition"
                type="button"
              >
                <RotateCcw size={12} />
                Vymazat měsíc
              </button>
            </div>

            {inputs.map((group) => (
              <section
                key={group.section}
                className={`bg-white border-l-2 ${toneClasses[group.tone]} border-y border-r border-stone-200`}
              >
                <header className={`px-5 pt-4 pb-2 ${toneClasses[group.tone]}`}>
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold">
                    {group.section}
                  </h3>
                </header>

                <div className="divide-y divide-stone-100">
                  {group.items.map((item) => (
                    <div
                      key={item.field}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-2.5"
                    >
                      <span className="flex-1 text-sm">{item.label}</span>

                      <span
                        className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded w-fit ${
                          item.taxTone === "sky"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {item.tax}
                      </span>

                      <div className="flex items-center bg-stone-50 border border-stone-200 hover:border-stone-400 focus-within:border-stone-900 transition w-full sm:w-44">
                        {item.neg && (
                          <span className="pl-2 text-stone-400 text-sm">−</span>
                        )}

                        <input
                          type="number"
                          inputMode="decimal"
                          value={month[item.field] || ""}
                          onChange={(event) =>
                            updateValue(item.field, event.target.value)
                          }
                          placeholder="0"
                          className="num-input flex-1 px-2 py-2 text-right bg-transparent min-w-0"
                          style={{
                            fontFamily: MONO,
                            fontSize: "13px",
                            fontWeight: 500,
                          }}
                        />

                        <span className="pr-3 text-stone-500 text-xs">Kč</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-stone-900 text-stone-50 p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">
                Cash provozní výsledek
              </p>

              <p
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  fontSize: "2.5rem",
                  lineHeight: 1,
                  letterSpacing: "-0.02em",
                }}
                className={r.cash >= 0 ? "text-emerald-300" : "text-rose-300"}
              >
                {r.cash >= 0 ? "+" : ""}
                {fmtKc(r.cash)}
              </p>

              <div className="flex items-center gap-2 mt-3 text-xs text-stone-400">
                {r.cash >= 0 ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}

                <span>
                  Provozní HV {fmtKc(r.provozHV)} · Net DPH{" "}
                  {r.netDPH >= 0 ? "+" : ""}
                  {fmtKc(r.netDPH)}
                </span>
              </div>
            </div>

            <div className="bg-white border border-stone-200">
              <header className="px-5 py-3 border-b border-stone-200">
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-stone-600">
                  P&amp;L netto
                </h3>
              </header>

              <dl
                className="divide-y divide-stone-100"
                style={{ fontFamily: MONO, fontSize: "13px" }}
              >
                <Row label="Tržba netto" value={fmtKc(r.trzbaNetto)} bold />
                <Row label="− COGS" value={fmtKc(-(month.cogs || 0))} muted />
                <Row
                  label="− Logistika"
                  value={fmtKc(-(month.logistika || 0))}
                  muted
                />
                <Row label="− Marketing" value={fmtKc(-r.marketing)} muted />
                <Row
                  label="Krycí příspěvek"
                  value={fmtKc(r.kp)}
                  bold
                  accent={r.kp >= 0 ? "emerald" : "rose"}
                />
                <Row label="KP marže" value={fmtPct(r.kpMarze)} muted small />
                <Row
                  label="− Služby & SaaS"
                  value={fmtKc(-(month.sluzby || 0))}
                  muted
                />
                <Row
                  label="− Fixní náklady"
                  value={fmtKc(-(month.fixni || 0))}
                  muted
                />
                <Row
                  label="Provozní HV"
                  value={fmtKc(r.provozHV)}
                  bold
                  accent={r.provozHV >= 0 ? "emerald" : "rose"}
                />
              </dl>
            </div>

            <div className="bg-white border border-stone-200">
              <header className="px-5 py-3 border-b border-stone-200 flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-stone-600">
                  DPH cash flow
                </h3>
                <Info size={11} className="text-stone-400" />
              </header>

              <dl
                className="divide-y divide-stone-100"
                style={{ fontFamily: MONO, fontSize: "13px" }}
              >
                <Row
                  label="DPH na výstupu"
                  value={fmtKc(r.outDPH)}
                  muted
                  icon={<ArrowUpFromLine size={11} className="text-rose-500" />}
                />
                <Row
                  label="DPH na vstupu"
                  value={fmtKc(r.inDPH)}
                  muted
                  icon={
                    <ArrowDownToLine size={11} className="text-emerald-500" />
                  }
                />
                <Row
                  label={r.netDPH >= 0 ? "Vrácení od FÚ" : "Odvod na FÚ"}
                  value={`${r.netDPH >= 0 ? "+" : ""}${fmtKc(r.netDPH)}`}
                  bold
                  accent={r.netDPH >= 0 ? "emerald" : "rose"}
                />
              </dl>

              <div className="px-5 py-3 bg-stone-50 text-[11px] text-stone-600 border-t border-stone-100 leading-relaxed">
                Asymetrie vstupního a výstupního DPH se propisuje do cash flow.
                Reverse charge je v této kalkulačce vedený jako DPH-neutrální.
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <header className="mb-4 flex items-end justify-between">
            <h2
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                fontSize: "1.5rem",
              }}
            >
              Roční přehled {year}
            </h2>

            <p className="text-xs text-stone-500" style={{ fontFamily: MONO }}>
              {yearTotals.count || 0} / 12 měsíců vyplněno
            </p>
          </header>

          <div className="bg-white border border-stone-200 overflow-x-auto">
            <table className="w-full text-sm" style={{ fontFamily: MONO }}>
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr className="text-[10px] uppercase tracking-wider text-stone-600">
                  <th className="text-left px-4 py-3 font-semibold">Měsíc</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Tržba netto
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">KP</th>
                  <th className="text-right px-4 py-3 font-semibold">KP %</th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Provozní HV
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Net DPH
                  </th>
                  <th className="text-right px-4 py-3 font-semibold">
                    Cash výsledek
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-100">
                {MONTHS.map((monthItem) => {
                  const monthData = data[monthItem.idx] || EMPTY;
                  const c = calc(monthData);
                  const filled = isMonthFilled(monthItem.idx);

                  return (
                    <tr
                      key={monthItem.idx}
                      onClick={() => setSelectedMonth(monthItem.idx)}
                      className={`cursor-pointer transition ${
                        selectedMonth === monthItem.idx
                          ? "bg-stone-50"
                          : "hover:bg-stone-50/50"
                      } ${!filled ? "text-stone-300" : ""}`}
                    >
                      <td
                        className="px-4 py-2.5 font-medium"
                        style={{ fontFamily: UI }}
                      >
                        {monthItem.label}

                        {selectedMonth === monthItem.idx && (
                          <span className="ml-2 text-[10px] uppercase text-stone-400">
                            aktuální
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {filled ? fmtKc(c.trzbaNetto) : "—"}
                      </td>

                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          filled && c.kp < 0 ? "text-rose-600" : ""
                        }`}
                      >
                        {filled ? fmtKc(c.kp) : "—"}
                      </td>

                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          filled && c.kpMarze < 0 ? "text-rose-600" : ""
                        }`}
                      >
                        {filled ? fmtPct(c.kpMarze) : "—"}
                      </td>

                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          filled && c.provozHV < 0 ? "text-rose-600" : ""
                        }`}
                      >
                        {filled ? fmtKc(c.provozHV) : "—"}
                      </td>

                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          filled && c.netDPH > 0
                            ? "text-emerald-600"
                            : filled && c.netDPH < 0
                            ? "text-rose-600"
                            : ""
                        }`}
                      >
                        {filled
                          ? `${c.netDPH >= 0 ? "+" : ""}${fmtKc(c.netDPH)}`
                          : "—"}
                      </td>

                      <td
                        className={`px-4 py-2.5 text-right tabular-nums font-semibold ${
                          filled && c.cash < 0
                            ? "text-rose-600"
                            : filled && c.cash > 0
                            ? "text-emerald-700"
                            : ""
                        }`}
                      >
                        {filled ? fmtKc(c.cash) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {yearTotals.count > 0 && (
                <tfoot className="bg-stone-900 text-stone-50">
                  <tr>
                    <td
                      className="px-4 py-3 text-xs uppercase tracking-wider"
                      style={{ fontFamily: UI, fontWeight: 600 }}
                    >
                      Σ Kumulativně
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {fmtKc(yearTotals.trzbaNetto)}
                    </td>

                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        yearTotals.kp < 0
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {fmtKc(yearTotals.kp)}
                    </td>

                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        yearTotals.kpMarze < 0
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {fmtPct(yearTotals.kpMarze || 0)}
                    </td>

                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        yearTotals.provozHV < 0
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {fmtKc(yearTotals.provozHV)}
                    </td>

                    <td
                      className={`px-4 py-3 text-right tabular-nums font-semibold ${
                        yearTotals.netDPH < 0
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {`${yearTotals.netDPH >= 0 ? "+" : ""}${fmtKc(
                        yearTotals.netDPH
                      )}`}
                    </td>

                    <td
                      className={`px-4 py-3 text-right tabular-nums font-bold text-base ${
                        yearTotals.cash < 0
                          ? "text-rose-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {fmtKc(yearTotals.cash)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <footer className="text-[11px] text-stone-400 text-center py-6 border-t border-stone-200">
          <p style={{ fontFamily: MONO }}>
            Data se ukládají automaticky v prohlížeči · vyplněné měsíce mají
            zelenou tečku · klikni na řádek pro úpravu
          </p>
        </footer>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
  muted = false,
  small = false,
  accent,
  icon,
}: RowProps) {
  const accentColor =
    accent === "emerald"
      ? "text-emerald-700"
      : accent === "rose"
      ? "text-rose-600"
      : "";

  return (
    <div
      className={`flex items-center justify-between px-5 ${
        small ? "py-1.5" : "py-2.5"
      } ${bold ? "bg-stone-50/50" : ""}`}
    >
      <span
        className={`flex items-center gap-2 ${muted ? "text-stone-500" : ""} ${
          bold ? "font-semibold text-stone-900" : ""
        } ${small ? "text-xs" : ""}`}
        style={{ fontFamily: UI }}
      >
        {icon}
        {label}
      </span>

      <span
        className={`tabular-nums ${bold ? "font-semibold" : ""} ${accentColor} ${
          small ? "text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
