// app.js — UI vrstva (DOM, stav, localStorage). Výpočet je v calc.js, nákres v draw.js.
import { parseNum, calcShelves, formatMm, roundTo, ERROR_TEXT } from './calc.js';
import { renderSection } from './draw.js';

const VERSION = '1.0';
const KEY = 'roztec-polic:v1';
const DEFAULTS = { mode: 'outer', h: '720', t: '18', n: '2', round: 0.5, ref: 'inner' };
const MAX_N = 50;

const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}
const S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* súkromný režim */ } };

const mm = (v, step, fixed) => `${formatMm(v, step, fixed)}<span>mm</span>`;

function render() {
  const height = parseNum(S.h), thickness = parseNum(S.t), count = parseNum(S.n);
  const R = calcShelves({ height, mode: S.mode, thickness, count });
  const step = Number(S.round), off = S.ref === 'outer' ? R.thickness : 0;

  // ovládacie prvky
  $$('#mode button').forEach(b => { const on = b.dataset.v === S.mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $$('#refSeg button').forEach(b => { const on = b.dataset.r === S.ref; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $$('#chips .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.t) === thickness));
  $('hLabel').textContent = S.mode === 'outer' ? 'Vonkajšia výška korpusu' : 'Vnútorná (svetlá) výška';
  $('hBox').classList.toggle('bad', R.error === 'height');
  $('tBox').classList.toggle('bad', R.error === 'thickness');
  $('nBox').classList.toggle('bad', R.error === 'count');
  $('hHint').innerHTML = R.outer > 0 && R.inner > 0
    ? (S.mode === 'outer' ? `Vnútorná výška: <b>${formatMm(R.inner, step)}</b> mm (− 2 × hrúbka)` : `Vonkajšia výška: <b>${formatMm(R.outer, step)}</b> mm (+ 2 × hrúbka)`)
    : '&nbsp;';
  const err = $('err');
  err.textContent = R.error ? ERROR_TEXT[R.error] : '';
  err.classList.toggle('show', !!R.error);

  // súhrn
  $('hero').classList.toggle('err', !R.ok);
  $('gapV').innerHTML = R.ok ? mm(R.gap, step, true) : '—<span>mm</span>';
  const exact = R.ok && Math.abs(roundTo(R.gap, step) - R.gap) > 0.005;
  $('exact').textContent = exact ? `presne ${R.gap.toLocaleString('sk-SK', { maximumFractionDigits: 2 })} mm` : '';
  $('innerV').innerHTML = R.inner > 0 ? mm(R.inner, step) : '—<span>mm</span>';
  $('pitchV').innerHTML = R.ok && R.count > 0 ? mm(R.pitch, step) : '—<span>mm</span>';
  $('gapsV').innerHTML = Number.isInteger(R.count) && R.count >= 0 ? `${R.count + 1}<span>×</span>` : '—';
  const pill = $('pill');
  pill.innerHTML = R.ok ? `${formatMm(R.gap, step, true)} mm` : '—';
  pill.classList.toggle('err', !R.ok);
  $('refLabel').textContent = S.ref === 'outer' ? 'od spodnej hrany korpusu' : 'od vnútorného dna';

  // tabuľka (zhora nadol ako v skrinke)
  let rows = '';
  if (R.inner > 0) rows += `<tr class="ref"><td>Strop (spodná plocha)</td><td colspan="3">${formatMm(R.inner + off, step)}</td></tr>`;
  if (R.ok) {
    const gapRow = `<tr class="gap"><td>↕ svetlý priestor</td><td colspan="3">${formatMm(R.gap, step, true)}</td></tr>`;
    rows += gapRow;
    for (const s of [...R.shelves].reverse()) {
      rows += `<tr><td><span class="dot"></span>Polica ${s.index}</td><td>${formatMm(s.bottom + off, step)}</td><td>${formatMm(s.top + off, step)}</td><td class="os">${formatMm(s.axis + off, step)}</td></tr>` + gapRow;
    }
  } else {
    rows += `<tr class="msg"><td colspan="4">${R.error === 'noFit' ? 'Police sa nezmestia' : 'Doplň zadanie'}</td></tr>`;
  }
  if (R.inner > 0) rows += `<tr class="ref"><td>Dno (horná plocha)</td><td colspan="3">${formatMm(off, step)}</td></tr>`;
  $('tbody').innerHTML = rows;
  $('print').disabled = !R.ok;

  $('svgWrap').innerHTML = renderSection(R, { step, ref: S.ref });

  // súhrn pre tlač
  $('printSummary').innerHTML = R.ok
    ? `<b>Zadanie:</b> ${S.mode === 'outer' ? 'vonkajšia' : 'vnútorná'} výška ${formatMm(height, 0.1)} mm · hrúbka ${formatMm(thickness, 0.1)} mm · ${R.count} ${R.count === 1 ? 'polica' : (R.count >= 2 && R.count <= 4 ? 'police' : 'políc')}<br>
       <b>Výsledok:</b> vnútorná výška ${formatMm(R.inner, step)} mm · svetlý priestor <b>${formatMm(R.gap, step, true)} mm</b> · rozteč osí ${R.count ? formatMm(R.pitch, step) + ' mm' : '—'} · výšky ${S.ref === 'outer' ? 'od spodnej hrany korpusu' : 'od vnútorného dna'} · zaokrúhlenie ${formatMm(step, 0.1)} mm · ${new Date().toLocaleDateString('sk-SK')}`
    : '';
  save();
}

// --- udalosti ---
function bindText(id, key) {
  const el = $(id);
  el.value = S[key];
  el.addEventListener('input', () => { S[key] = el.value; render(); });
  el.addEventListener('focus', () => setTimeout(() => el.select(), 0));
  el.addEventListener('keydown', e => {
    if (e.key !== 'Enter') return;
    const order = ['h', 't', 'n'], i = order.indexOf(id);
    if (i < order.length - 1) $(order[i + 1]).focus(); else el.blur();
  });
}
bindText('h', 'h'); bindText('t', 't'); bindText('n', 'n');

const setN = v => { S.n = String(Math.max(0, Math.min(MAX_N, v))); $('n').value = S.n; render(); };
$('minus').addEventListener('click', () => setN((parseInt(S.n, 10) || 0) - 1));
$('plus').addEventListener('click', () => setN((parseInt(S.n, 10) || 0) + 1));
$$('#mode button').forEach(b => b.addEventListener('click', () => { S.mode = b.dataset.v; render(); }));
$$('#refSeg button').forEach(b => b.addEventListener('click', () => { S.ref = b.dataset.r; render(); }));
$$('#chips .chip').forEach(c => c.addEventListener('click', () => { S.t = c.dataset.t; $('t').value = S.t; render(); }));
const roundSel = $('round');
roundSel.value = String(S.round);
roundSel.addEventListener('change', () => { S.round = Number(roundSel.value); render(); });
$('print').addEventListener('click', () => window.print());

// výsledok v hlavičke, keď veľká karta zmizne z obrazovky (mobil)
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => { $('pill').hidden = e.isIntersecting; }, { rootMargin: '-56px 0px 0px 0px' }).observe($('hero'));
}

render();

// PWA — offline
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
console.info(`Rozteč políc v${VERSION}`);
