// calc.js — čistá výpočtová logika (bez DOM). Dá sa prenášať do iných projektov.
// Všetky hodnoty sú v mm.

/** Prevedie text na číslo, akceptuje čiarku aj bodku ("18,5" | "18.5"). Pri chybe vráti NaN. */
export function parseNum(value) {
  if (typeof value === 'number') return value;
  if (value == null) return NaN;
  const s = String(value).trim().replace(/\s+/g, '').replace(',', '.');
  if (s === '' || !/^[-+]?\d*\.?\d+$|^[-+]?\d+\.$/.test(s)) return NaN;
  return Number(s);
}

/** Zaokrúhli na krok (0.1 / 0.5 / 1 mm). */
export function roundTo(value, step = 0.5) {
  if (!Number.isFinite(value)) return value;
  const r = Math.round(value / step) * step;
  return Math.round(r * 1000) / 1000; // odstráni float šum
}

/** Formát pre zobrazenie v sk-SK (desatinná čiarka). fixed=true vždy ukáže 1 desatinné miesto pri kroku < 1. */
export function formatMm(value, step = 0.5, fixed = false) {
  if (!Number.isFinite(value)) return '—';
  const r = roundTo(value, step);
  const decimals = step >= 1 ? 0 : (fixed || !Number.isInteger(r) ? 1 : 0);
  return r.toLocaleString('sk-SK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false });
}

/**
 * Rovnomerné rozmiestnenie políc v korpuse.
 * @param {{height:number, mode:'outer'|'inner', thickness:number, count:number}} p
 *   height    – výška korpusu (vonkajšia alebo vnútorná podľa mode)
 *   thickness – hrúbka materiálu (dno, strop aj police rovnaké)
 *   count     – počet políc (0..)
 * @returns {{ok:boolean, error:string|null, outer:number, inner:number, thickness:number, count:number,
 *            gap:number, pitch:number, shelves:{index:number,bottom:number,top:number,axis:number}[]}}
 *   bottom/top/axis sú merané od vnútorného dna (hornej plochy dna).
 */
export function calcShelves({ height, mode = 'outer', thickness, count }) {
  const t = Number(thickness), h = Number(height), n = Number(count);
  const base = { ok: false, error: null, outer: NaN, inner: NaN, thickness: t, count: n, gap: NaN, pitch: NaN, shelves: [] };

  if (!Number.isFinite(h) || h <= 0) return { ...base, error: 'height' };
  if (!Number.isFinite(t) || t <= 0) return { ...base, error: 'thickness' };
  if (!Number.isInteger(n) || n < 0) return { ...base, error: 'count' };

  const outer = mode === 'inner' ? h + 2 * t : h;
  const inner = mode === 'inner' ? h : h - 2 * t;
  const res = { ...base, outer, inner };
  if (inner <= 0) return { ...res, error: 'inner' };

  const gap = (inner - n * t) / (n + 1);
  if (!(gap > 0)) return { ...res, gap, error: 'noFit' };

  const shelves = [];
  for (let i = 1; i <= n; i++) {
    const bottom = i * gap + (i - 1) * t;
    shelves.push({ index: i, bottom, top: bottom + t, axis: bottom + t / 2 });
  }
  return { ...res, ok: true, gap, pitch: gap + t, shelves };
}

/** Slovenské texty chýb. */
export const ERROR_TEXT = {
  height: 'Zadaj výšku korpusu (väčšiu ako 0).',
  thickness: 'Zadaj hrúbku materiálu (väčšiu ako 0).',
  count: 'Počet políc musí byť celé číslo 0 alebo viac.',
  inner: 'Vnútorná výška vychádza 0 alebo menej. Skontroluj výšku a hrúbku.',
  noFit: 'Police sa nezmestia — svetlý priestor vychádza 0 alebo menej. Zníž počet políc alebo hrúbku.',
};
