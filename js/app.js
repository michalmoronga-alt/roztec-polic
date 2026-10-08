// app.js — UI vrstva (DOM, stav, localStorage). Výpočet je v calc.js, nákres v draw.js.
import { parseNum, calcShelves, formatMm, roundTo, ERROR_TEXT } from './calc.js';
import { renderSection } from './draw.js';

const VERSION = '1.1';
const KEY = 'roztec-polic:v1';
const DEFAULTS = { mode: 'outer', h: '720', t: '18', n: '2', round: 0.5, ref: 'inner', more: false };
const MAX_N = 50;

const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return { ...DEFAULTS }; }
}
const S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* súkromný režim */ } };

let last = null, printing = false;
function drawNow() {
  if (!last) return;
  const wrap = $('svgWrap');
  const size = printing ? { width: 420, height: 520 } : { width: wrap.clientWidth || 394, height: wrap.clientHeight || 492 };
  wrap.innerHTML = renderSection(last.R, { step: last.step, ref: S.ref, ...size });
}

const mm = (v, step, fixed) => `${formatMm(v, step, fixed)}<span>mm</span>`;

function render() {
  const height = parseNum(S.h), thickness = parseNum(S.t), count = parseNum(S.n);
  const R = calcShelves({ height, mode: S.mode, thickness, count });
  const step = Number(S.round), off = S.ref === 'outer' ? R.thickness : 0;

  // ovládacie prvky
  $$('#mode button').forEach(b => { const on = b.dataset.v === S.mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $$('#refSeg button').forEach(b => { const on = b.dataset.r === S.ref; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $$('#chips .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.t) === thickness));
  $$('#roundSeg button').forEach(b => { const on = Number(b.dataset.s) === step; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
  $('morePanel').classList.toggle('open', !!S.more);
  $('moreBtn').setAttribute('aria-expanded', !!S.more);
  $('hLabel').textContent = S.mode === 'outer' ? 'Vonkajšia výška' : 'Vnútorná (svetlá) výška';
  $('hBox').classList.toggle('bad', R.error === 'height');
  $('tBox').classList.toggle('bad', R.error === 'thickness');
  $('nBox').classList.toggle('bad', R.error === 'count');
  const err = $('err');
  err.textContent = R.error ? ERROR_TEXT[R.error] : '';
  err.classList.toggle('show', !!R.error);

  // súhrn
  $('hero').classList.toggle('err', !R.ok);
  $('gapV').innerHTML = R.ok ? mm(R.gap, step, true) : '—<span>mm</span>';
  const exact = R.ok && Math.abs(roundTo(R.gap, step) - R.gap) > 0.005;
  $('exact').textContent = exact ? `· presne ${R.gap.toLocaleString('sk-SK', { maximumFractionDigits: 2 })}` : '';
  $('innerV').textContent = R.inner > 0 ? formatMm(R.inner, step) : '—';
  $('pitchV').textContent = R.ok && R.count > 0 ? formatMm(R.pitch, step) : '—';
  $('gapsV').textContent = Number.isInteger(R.count) && R.count >= 0 ? `${R.count + 1}×` : '—';
  const refTxt = S.ref === 'outer' ? 'od spodnej hrany korpusu' : 'od vnútorného dna';
  $('refLabel').textContent = refTxt;
  $('refLabel2').textContent = 'výšky ' + refTxt;

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

  last = { R, step };
  drawNow();

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
$$('#roundSeg button').forEach(b => b.addEventListener('click', () => { S.round = Number(b.dataset.s); render(); }));
$('moreBtn').addEventListener('click', () => { S.more = !S.more; render(); });
$('print').addEventListener('click', () => window.print());

// nákres sa prekreslí pri zmene veľkosti plochy (otočenie, klávesnica, okno)
if ('ResizeObserver' in window) {
  let raf = 0;
  new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(drawNow); }).observe($('svgWrap'));
}
window.addEventListener('beforeprint', () => { printing = true; drawNow(); });
window.addEventListener('afterprint', () => { printing = false; drawNow(); });

render();

// PWA — offline
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
console.info(`Rozteč políc v${VERSION}`);
