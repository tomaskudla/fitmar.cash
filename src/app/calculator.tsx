'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, RotateCcw, Info, Settings, ArrowDownToLine, ArrowUpFromLine, LogOut, Cloud, CloudOff } from 'lucide-react';

const MONTHS = [
  { idx: 1, label: 'Leden', short: 'Led' },
  { idx: 2, label: 'Únor', short: 'Úno' },
  { idx: 3, label: 'Březen', short: 'Bře' },
  { idx: 4, label: 'Duben', short: 'Dub' },
  { idx: 5, label: 'Květen', short: 'Kvě' },
  { idx: 6, label: 'Červen', short: 'Čvn' },
  { idx: 7, label: 'Červenec', short: 'Čvc' },
  { idx: 8, label: 'Srpen', short: 'Srp' },
  { idx: 9, label: 'Září', short: 'Zář' },
  { idx: 10, label: 'Říjen', short: 'Říj' },
  { idx: 11, label: 'Listopad', short: 'Lis' },
  { idx: 12, label: 'Prosinec', short: 'Pro' },
];

const EMPTY = {
  trzbaCZ: 0, trzbaSK: 0, vratky: 0,
  cogs: 0, logistika: 0,
  metaAds: 0, googleAds: 0, sklik: 0, tiktokAds: 0,
  sluzby: 0, fixni: 0,
};

const DEFAULT_RATES = { dphCZ: 12, dphSK: 19, dphVstup: 21 };

const DISPLAY = "'Fraunces', Georgia, serif";
const MONO = "'JetBrains Mono', ui-monospace, monospace";
const UI = "'Inter', system-ui, sans-serif";

// --- KV Storage helpers ---
async function kvGet(key: string) {
  const pw = sessionStorage.getItem('fitmar-pw') || '';
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
    headers: { 'x-app-password': pw },
  });
  if (!res.ok) throw new Error('fetch failed');
  const data = await res.json();
  return data.value;
}

async function kvSet(key: string, value: any) {
  const pw = sessionStorage.getItem('fitmar-pw') || '';
  const res = await fetch(`/api/storage/${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-password': pw },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error('save failed');
}

export default function FitMarCalc() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [data, setData] = useState<any>({});
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const result = await kvGet(`fitmar:${year}`);
        if (!cancelled) setData(result || {});
      } catch (e) { if (!cancelled) setData({}); }
      try {
        const r = await kvGet('fitmar:rates');
        if (!cancelled && r) setRates(r);
      } catch (e) {}
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [year]);

  useEffect(() => {
    if (loading) return;
    setSyncStatus('syncing');
    const t = setTimeout(() => {
      kvSet(`fitmar:${year}`, data)
        .then(() => setSyncStatus('synced'))
        .catch(() => setSyncStatus('error'));
    }, 500);
    return () => clearTimeout(t);
  }, [data, year, loading]);

  useEffect(() => {
    if (loading) return;
    kvSet('fitmar:rates', rates).catch(() => {});
  }, [rates, loading]);

  const getMonth = (m: number) => data[m] || { ...EMPTY };

  const updateValue = (field: string, raw: string) => {
    const num = raw === '' || raw === '-' ? 0 : parseFloat(raw.replace(',', '.')) || 0;
    setData((prev: any) => ({ ...prev, [selectedMonth]: { ...getMonth(selectedMonth), [field]: num } }));
  };

  const resetMonth = () => {
    if (confirm(`Vymazat data pro ${MONTHS[selectedMonth-1].label} ${year}?`)) {
      setData((prev: any) => { const n = { ...prev }; delete n[selectedMonth]; return n; });
    }
  };

  const logout = () => {
    sessionStorage.removeItem('fitmar-pw');
    window.location.reload();
  };

  const calc = (m: any) => {
    const trzbaNetto = (m.trzbaCZ || 0) + (m.trzbaSK || 0) - (m.vratky || 0);
    const marketing = (m.metaAds || 0) + (m.googleAds || 0) + (m.sklik || 0) + (m.tiktokAds || 0);
    const kp = trzbaNetto - (m.cogs || 0) - (m.logistika || 0) - marketing;
    const kpMarze = trzbaNetto > 0 ? kp / trzbaNetto : 0;
    const provozHV = kp - (m.sluzby || 0) - (m.fixni || 0);
    const outDPH = (m.trzbaCZ || 0) * rates.dphCZ/100 + (m.trzbaSK || 0) * rates.dphSK/100 - (m.vratky || 0) * rates.dphCZ/100;
    const inDPH = ((m.cogs || 0) + (m.logistika || 0) + (m.sklik || 0) + (m.sluzby || 0) + (m.fixni || 0)) * rates.dphVstup/100;
    const netDPH = inDPH - outDPH;
    const cash = provozHV + netDPH;
    return { trzbaNetto, marketing, kp, kpMarze, provozHV, outDPH, inDPH, netDPH, cash };
  };

  const month = getMonth(selectedMonth);
  const r = calc(month);

  const yearTotals = useMemo(() => {
    const filled = Object.keys(data).filter(k => {
      const m = data[k];
      return m && Object.values(m).some((v: any) => v !== 0);
    });
    const agg: any = filled.reduce((acc: any, k) => {
      const c = calc(data[k]);
      Object.keys(c).forEach(key => acc[key] = (acc[key] || 0) + (c as any)[key]);
      return acc;
    }, {});
    if (agg.trzbaNetto > 0) agg.kpMarze = agg.kp / agg.trzbaNetto;
    agg.count = filled.length;
    return agg;
  }, [data, rates]);

  const fmt = (n: number) => {
    if (n === 0 || isNaN(n) || n === undefined) return '0';
    return Math.round(n).toLocaleString('cs-CZ').replace(/[\u00A0\u202F]/g, ' ');
  };
  const fmtKc = (n: number) => fmt(n) + ' Kč';
  const fmtPct = (n: number) => {
    if (isNaN(n) || n === undefined) return '0,0 %';
    return ((n * 100).toFixed(1)).replace('.', ',') + ' %';
  };

  const isMonthFilled = (m: number) => {
    const d = data[m];
    return d && Object.values(d).some((v: any) => v !== 0);
  };

  const inputs = [
    { section: 'Příjmy', tone: 'emerald', items: [
      { field: 'trzbaCZ', label: 'Tržba ČR', tax: `DPH ${rates.dphCZ} %`, taxTone: 'zinc' },
      { field: 'trzbaSK', label: 'Tržba SK / OSS', tax: `DPH ${rates.dphSK} %`, taxTone: 'zinc' },
      { field: 'vratky', label: 'Vratky', tax: `DPH ${rates.dphCZ} %`, taxTone: 'zinc', neg: true },
    ]},
    { section: 'Variabilní náklady', tone: 'orange', items: [
      { field: 'cogs', label: 'COGS (sklenice, ořechy, packaging)', tax: `DPH ${rates.dphVstup} %`, taxTone: 'zinc' },
      { field: 'logistika', label: 'Logistika (přeprava, fulfillment)', tax: `DPH ${rates.dphVstup} %`, taxTone: 'zinc' },
    ]},
    { section: 'Marketing', tone: 'amber', items: [
      { field: 'metaAds', label: 'Meta Ads', tax: 'reverse charge', taxTone: 'sky' },
      { field: 'googleAds', label: 'Google Ads', tax: 'reverse charge', taxTone: 'sky' },
      { field: 'sklik', label: 'Sklik (Seznam.cz)', tax: `DPH ${rates.dphVstup} %`, taxTone: 'zinc' },
      { field: 'tiktokAds', label: 'TikTok Ads', tax: 'reverse charge', taxTone: 'sky' },
    ]},
    { section: 'Fixní náklady', tone: 'rose', items: [
      { field: 'sluzby', label: 'Služby & SaaS', tax: `DPH ${rates.dphVstup} %`, taxTone: 'zinc' },
      { field: 'fixni', label: 'Fixní náklady (nájem, mzdy…)', tax: `DPH ${rates.dphVstup} %`, taxTone: 'zinc' },
    ]},
  ];

  const toneClasses: any = {
    emerald: 'text-emerald-700 border-emerald-200',
    orange: 'text-orange-700 border-orange-200',
    amber: 'text-amber-700 border-amber-200',
    rose: 'text-rose-700 border-rose-200',
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: '#FAF7F2', fontFamily: UI, color: '#0A0E1A' }}>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-stone-300">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-stone-500 mb-2">FitMar · Peanut Company s.r.o.</p>
            <h1 style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: '2.5rem', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
              Cash Flow Kalkulačka
            </h1>
            <p className="text-sm text-stone-600 mt-2 max-w-2xl">
              Měsíční P&L se zohledněním DPH asymetrie (12 % výstup ČR, 19 % SK, 21 % vstup).
              Reverse charge u Meta/Google/TikTok je DPH-neutrální.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs flex items-center gap-1 px-2 py-1 ${syncStatus === 'synced' ? 'text-emerald-600' : syncStatus === 'syncing' ? 'text-stone-500' : 'text-rose-600'}`}>
              {syncStatus === 'error' ? <CloudOff size={12} /> : <Cloud size={12} />}
              {syncStatus === 'synced' ? 'Uloženo' : syncStatus === 'syncing' ? 'Ukládám…' : 'Chyba'}
            </span>
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="px-3 py-2 text-sm bg-white border border-stone-300 hover:border-stone-500 transition"
              style={{ fontFamily: MONO }}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 bg-white border border-stone-300 hover:border-stone-500 transition"
              title="DPH sazby"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={logout}
              className="p-2 bg-white border border-stone-300 hover:border-stone-500 transition"
              title="Odhlásit"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        {showSettings && (
          <div className="mb-6 p-5 bg-white border border-stone-300">
            <div className="flex items-center gap-2 mb-3">
              <Settings size={14} />
              <h3 className="text-sm font-semibold uppercase tracking-wider">DPH sazby</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: 'dphCZ', label: 'Výstup ČR (potraviny)' },
                { key: 'dphSK', label: 'Výstup SK / OSS' },
                { key: 'dphVstup', label: 'Vstup (sklenice, služby, log.)' },
              ].map(({ key, label }) => (
                <label key={key} className="block">
                  <span className="text-xs text-stone-600 block mb-1">{label}</span>
                  <div className="flex items-center bg-stone-50 border border-stone-300">
                    <input
                      type="number"
                      step="0.5"
                      value={(rates as any)[key]}
                      onChange={e => setRates({ ...rates, [key]: parseFloat(e.target.value) || 0 })}
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

        <div className="mb-8 grid grid-cols-12 gap-1 bg-white border border-stone-300 p-1">
          {MONTHS.map(m => (
            <button
              key={m.idx}
              onClick={() => setSelectedMonth(m.idx)}
              className={`month-pill relative py-3 text-xs uppercase tracking-wider transition ${selectedMonth === m.idx ? 'active' : ''} ${isMonthFilled(m.idx) ? 'filled' : ''}`}
              style={{ fontFamily: MONO, fontWeight: 500 }}
            >
              {m.short}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-10">
          <div className="lg:col-span-3 space-y-5">
            <div className="flex items-center justify-between">
              <h2 style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: '1.5rem' }}>
                {MONTHS[selectedMonth-1].label} {year}
              </h2>
              <button
                onClick={resetMonth}
                className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition"
              >
                <RotateCcw size={12} />
                Vymazat měsíc
              </button>
            </div>

            {inputs.map(group => (
              <section key={group.section} className={`bg-white border-l-2 ${toneClasses[group.tone]} border-y border-r border-stone-200`}>
                <header className={`px-5 pt-4 pb-2 ${toneClasses[group.tone]}`}>
                  <h3 className="text-xs uppercase tracking-[0.15em] font-semibold">{group.section}</h3>
                </header>
                <div className="divide-y divide-stone-100">
                  {group.items.map(item => (
                    <div key={item.field} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="flex-1 text-sm">{item.label}</span>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded ${item.taxTone === 'sky' ? 'bg-sky-50 text-sky-700' : 'bg-stone-100 text-stone-500'}`}>
                        {item.tax}
                      </span>
                      <div className="flex items-center bg-stone-50 border border-stone-200 hover:border-stone-400 focus-within:border-stone-900 transition w-44">
                        {item.neg && <span className="pl-2 text-stone-400 text-sm">−</span>}
                        <input
                          type="number"
                          inputMode="decimal"
                          value={month[item.field] || ''}
                          onChange={e => updateValue(item.field, e.target.value)}
                          placeholder="0"
                          className="num-input flex-1 px-2 py-2 text-right bg-transparent"
                          style={{ fontFamily: MONO, fontSize: '13px', fontWeight: 500 }}
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
              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Cash provozní výsledek</p>
              <p style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: '2.5rem', lineHeight: 1, letterSpacing: '-0.02em' }} className={r.cash >= 0 ? 'text-emerald-300' : 'text-rose-300'}>
                {r.cash >= 0 ? '+' : ''}{fmtKc(r.cash)}
              </p>
              <div className="flex items-center gap-2 mt-3 text-xs text-stone-400">
                {r.cash >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                <span>Provozní HV {fmtKc(r.provozHV)} {r.netDPH >= 0 ? '+' : ''} DPH benefit {fmtKc(r.netDPH)}</span>
              </div>
            </div>

            <div className="bg-white border border-stone-200">
              <header className="px-5 py-3 border-b border-stone-200">
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-stone-600">P&L (netto)</h3>
              </header>
              <dl className="divide-y divide-stone-100" style={{ fontFamily: MONO, fontSize: '13px' }}>
                <Row label="Tržba netto" value={fmtKc(r.trzbaNetto)} bold />
                <Row label="− COGS" value={fmtKc(-(month.cogs||0))} muted />
                <Row label="− Logistika" value={fmtKc(-(month.logistika||0))} muted />
                <Row label="− Marketing" value={fmtKc(-r.marketing)} muted />
                <Row label="Krycí příspěvek" value={fmtKc(r.kp)} bold accent={r.kp >= 0 ? 'emerald' : 'rose'} />
                <Row label="KP marže" value={fmtPct(r.kpMarze)} muted small />
                <Row label="− Služby & SaaS" value={fmtKc(-(month.sluzby||0))} muted />
                <Row label="− Fixní náklady" value={fmtKc(-(month.fixni||0))} muted />
                <Row label="Provozní HV" value={fmtKc(r.provozHV)} bold accent={r.provozHV >= 0 ? 'emerald' : 'rose'} />
              </dl>
            </div>

            <div className="bg-white border border-stone-200">
              <header className="px-5 py-3 border-b border-stone-200 flex items-center gap-2">
                <h3 className="text-xs uppercase tracking-[0.15em] font-semibold text-stone-600">DPH cash flow</h3>
                <Info size={11} className="text-stone-400" />
              </header>
              <dl className="divide-y divide-stone-100" style={{ fontFamily: MONO, fontSize: '13px' }}>
                <Row label="DPH na výstupu" value={fmtKc(r.outDPH)} muted icon={<ArrowUpFromLine size={11} className="text-rose-500" />} />
                <Row label="DPH na vstupu" value={fmtKc(r.inDPH)} muted icon={<ArrowDownToLine size={11} className="text-emerald-500" />} />
                <Row
                  label={r.netDPH >= 0 ? 'Vrácení od FÚ' : 'Odvod na FÚ'}
                  value={(r.netDPH >= 0 ? '+' : '')+fmtKc(r.netDPH)}
                  bold
                  accent={r.netDPH >= 0 ? 'emerald' : 'rose'}
                />
              </dl>
              <div className="px-5 py-3 bg-stone-50 text-[11px] text-stone-600 border-t border-stone-100 leading-relaxed">
                Asymetrie 21 % vstup vs. 12/19 % výstup ti dává nadměrný odpočet. Reverse charge (Meta, Google, TikTok) je neutrální.
              </div>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <header className="mb-4 flex items-end justify-between">
            <h2 style={{ fontFamily: DISPLAY, fontWeight: 500, fontSize: '1.5rem' }}>
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
                  <th className="text-right px-4 py-3 font-semibold">Tržba netto</th>
                  <th className="text-right px-4 py-3 font-semibold">KP</th>
                  <th className="text-right px-4 py-3 font-semibold">KP %</th>
                  <th className="text-right px-4 py-3 font-semibold">Provozní HV</th>
                  <th className="text-right px-4 py-3 font-semibold">Net DPH</th>
                  <th className="text-right px-4 py-3 font-semibold">Cash výsledek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {MONTHS.map(m => {
                  const monthData = data[m.idx] || EMPTY;
                  const c = calc(monthData);
                  const filled = isMonthFilled(m.idx);
                  return (
                    <tr
                      key={m.idx}
                      onClick={() => setSelectedMonth(m.idx)}
                      className={`cursor-pointer transition ${selectedMonth === m.idx ? 'bg-stone-50' : 'hover:bg-stone-50/50'} ${!filled ? 'text-stone-300' : ''}`}
                    >
                      <td className="px-4 py-2.5 font-medium" style={{ fontFamily: UI }}>
                        {m.label}
                        {selectedMonth === m.idx && <span className="ml-2 text-[10px] uppercase text-stone-400">aktuální</span>}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{filled ? fmtKc(c.trzbaNetto) : '—'}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${filled && c.kp < 0 ? 'text-rose-600' : ''}`}>{filled ? fmtKc(c.kp) : '—'}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${filled && c.kpMarze < 0 ? 'text-rose-600' : ''}`}>{filled ? fmtPct(c.kpMarze) : '—'}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${filled && c.provozHV < 0 ? 'text-rose-600' : ''}`}>{filled ? fmtKc(c.provozHV) : '—'}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums ${filled && c.netDPH > 0 ? 'text-emerald-600' : filled && c.netDPH < 0 ? 'text-rose-600' : ''}`}>{filled ? (c.netDPH >= 0 ? '+' : '')+fmtKc(c.netDPH) : '—'}</td>
                      <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${filled && c.cash < 0 ? 'text-rose-600' : filled && c.cash > 0 ? 'text-emerald-700' : ''}`}>{filled ? fmtKc(c.cash) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
              {yearTotals.count > 0 && (
                <tfoot className="bg-stone-900 text-stone-50">
                  <tr>
                    <td className="px-4 py-3 text-xs uppercase tracking-wider" style={{ fontFamily: UI, fontWeight: 600 }}>Σ Kumulativně</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">{fmtKc(yearTotals.trzbaNetto)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${yearTotals.kp < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{fmtKc(yearTotals.kp)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${yearTotals.kpMarze < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{fmtPct(yearTotals.kpMarze || 0)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${yearTotals.provozHV < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{fmtKc(yearTotals.provozHV)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-semibold ${yearTotals.netDPH < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{(yearTotals.netDPH >= 0 ? '+' : '')+fmtKc(yearTotals.netDPH)}</td>
                    <td className={`px-4 py-3 text-right tabular-nums font-bold text-base ${yearTotals.cash < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>{fmtKc(yearTotals.cash)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        <footer className="text-[11px] text-stone-400 text-center py-6 border-t border-stone-200">
          <p style={{ fontFamily: MONO }}>
            Data se ukládají do cloudu · vyplněné měsíce mají zelenou tečku · klikni na řádek pro úpravu
          </p>
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted, small, accent, icon }: any) {
  const accentColor = accent === 'emerald' ? 'text-emerald-700' : accent === 'rose' ? 'text-rose-600' : '';
  return (
    <div className={`flex items-center justify-between px-5 ${small ? 'py-1.5' : 'py-2.5'} ${bold ? 'bg-stone-50/50' : ''}`}>
      <span className={`flex items-center gap-2 ${muted ? 'text-stone-500' : ''} ${bold ? 'font-semibold text-stone-900' : ''} ${small ? 'text-xs' : ''}`} style={{ fontFamily: UI }}>
        {icon}{label}
      </span>
      <span className={`tabular-nums ${bold ? 'font-semibold' : ''} ${accentColor} ${small ? 'text-xs' : ''}`}>
        {value}
      </span>
    </div>
  );
}
