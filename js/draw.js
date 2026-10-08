// draw.js — SVG nákres rezu korpusu. Vstup = výsledok calcShelves(). Bez DOM, vracia SVG string.
// width/height = veľkosť plochy v px (1 jednotka SVG = 1 px), nákres sa prispôsobí.
import { formatMm } from './calc.js?v=1.1.1';

export function renderSection(R, { step = 0.5, ref = 'inner', width = 394, height = 492 } = {}) {
  const Wv = Math.max(260, Math.round(width)), Hv = Math.max(200, Math.round(height));
  const FS = 12.5;                                  // veľkosť písma kót
  const L = 88, RZ = 112;                           // miesto vľavo (výšky) a vpravo (kóty)
  const W = Math.max(70, Math.min(190, Wv - L - RZ - 6));
  const x0 = Math.round((Wv - (L + W + RZ)) / 2 + L);
  const y0 = 12, H = Hv - y0 - 26;
  const ink = '#1b1b1f', gapC = '#c2410c', faint = '#8b8b96', accent = '#5e6ad2';
  const wrap = body => `<svg viewBox="0 0 ${Wv} ${Hv}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Nákres rezu skrinky" font-family="Inter, -apple-system, 'Segoe UI', Roboto, sans-serif" style="font-variant-numeric:tabular-nums">${body}</svg>`;

  if (!(R.outer > 0) || !(R.inner > 0)) {
    return wrap(`<rect x="${x0}" y="${y0}" width="${W}" height="${H}" rx="4" fill="#fafafb" stroke="#e6e6ea" stroke-dasharray="4 4"/>
      <text x="${x0 + W / 2}" y="${y0 + H / 2}" text-anchor="middle" font-size="13" fill="${faint}">Zadaj rozmery</text>`);
  }

  const t = R.thickness, n = R.count;
  const s = H / R.outer;
  const tp = Math.max(t * s, 3);
  const y = mm => y0 + H - mm * s;                  // mm od vonkajšej spodnej hrany -> y
  const off = ref === 'outer' ? t : 0;
  const tick = (x, yy, c) => `<line x1="${x - 4.5}" y1="${yy + 4.5}" x2="${x + 4.5}" y2="${yy - 4.5}" stroke="${c}" stroke-width="1.5"/>`;
  const ext = (x1, x2, yy) => `<line x1="${x1}" y1="${yy}" x2="${x2}" y2="${yy}" stroke="${faint}" stroke-width=".6"/>`;
  let g = `<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="#d8cdb9" stroke-width="2"/></pattern></defs>`;

  const panel = (x, yy, w, h) => `<rect x="${x}" y="${yy}" width="${w}" height="${h}" fill="#efe8dc" stroke="#8a7f6e" stroke-width="1"/><rect x="${x}" y="${yy}" width="${w}" height="${h}" fill="url(#hatch)" opacity=".7"/>`;
  g += panel(x0, y0, tp, H) + panel(x0 + W - tp, y0, tp, H);
  g += panel(x0 + tp, y0, W - 2 * tp, tp) + panel(x0 + tp, y0 + H - tp, W - 2 * tp, tp);
  g += `<rect x="${x0 + tp}" y="${y0 + tp}" width="${W - 2 * tp}" height="${H - 2 * tp}" fill="#fcfcfd"/>`;

  if (!R.ok) {
    g += `<rect x="${x0 + W / 2 - 66}" y="${y0 + H / 2 - 17}" width="132" height="30" rx="6" fill="#fdeeee" stroke="#f3c4c4"/>
      <text x="${x0 + W / 2}" y="${y0 + H / 2 + 3}" text-anchor="middle" font-size="12.5" fill="#d24b4b" font-weight="600">Police sa nezmestia</text>`;
    return wrap(g);
  }

  const gap = R.gap, gapTxt = formatMm(gap, step, true);
  // svetlé priestory
  for (let k = 0; k <= n; k++) {
    const lo = t + k * (gap + t);
    g += `<rect x="${x0 + tp}" y="${y(lo + gap)}" width="${W - 2 * tp}" height="${gap * s}" fill="#fff7f2"/>`;
  }
  // police + osi
  for (const sh of R.shelves) {
    const yb = y(sh.bottom + t), yt = y(sh.top + t), h = Math.max(yb - yt, 2.5);
    g += `<rect x="${x0 + tp}" y="${yt}" width="${W - 2 * tp}" height="${h}" fill="#eef0fc" stroke="${accent}" stroke-width="1.2"/>`;
    if (h >= 10) g += `<text x="${x0 + W / 2}" y="${(yt + yb) / 2 + 3.5}" text-anchor="middle" font-size="10" fill="${accent}" font-weight="600">P${sh.index}</text>`;
    if (h >= 6) { const ya = y(sh.axis + t); g += `<line x1="${x0 - 6}" y1="${ya}" x2="${x0 + W + 6}" y2="${ya}" stroke="${accent}" stroke-width=".6" stroke-dasharray="6 3 1 3" opacity=".7"/>`; }
  }

  // VPRAVO: reťazová kóta svetlých priestorov
  const xr = x0 + W + 24;
  for (let k = 0; k <= n; k++) {
    const lo = t + k * (gap + t), ya = y(lo), yb = y(lo + gap);
    g += ext(x0 + W + 2, xr + 6, ya) + ext(x0 + W + 2, xr + 6, yb);
    g += `<line x1="${xr}" y1="${ya}" x2="${xr}" y2="${yb}" stroke="${gapC}" stroke-width="1.1"/>` + tick(xr, ya, gapC) + tick(xr, yb, gapC);
    if (ya - yb >= 38) g += `<text transform="translate(${xr - 6} ${(ya + yb) / 2}) rotate(-90)" text-anchor="middle" font-size="${FS}" font-weight="600" fill="${gapC}">${gapTxt}</text>`;
  }
  // VPRAVO: celková vonkajšia a vnútorná výška
  const xo = xr + 40, xi = xo + 38;
  g += ext(x0 + W + 2, xo + 6, y(0)) + ext(x0 + W + 2, xo + 6, y(R.outer));
  g += `<line x1="${xo}" y1="${y(0)}" x2="${xo}" y2="${y(R.outer)}" stroke="${ink}" stroke-width="1"/>` + tick(xo, y(0), ink) + tick(xo, y(R.outer), ink);
  g += `<text transform="translate(${xo - 6} ${y(R.outer / 2)}) rotate(-90)" text-anchor="middle" font-size="${FS}" fill="${ink}">${formatMm(R.outer, step)} vonk.</text>`;
  g += ext(xr + 6, xi + 6, y(t)) + ext(xr + 6, xi + 6, y(R.outer - t));
  g += `<line x1="${xi}" y1="${y(t)}" x2="${xi}" y2="${y(R.outer - t)}" stroke="${faint}" stroke-width="1"/>` + tick(xi, y(t), faint) + tick(xi, y(R.outer - t), faint);
  g += `<text transform="translate(${xi - 6} ${y(R.outer / 2)}) rotate(-90)" text-anchor="middle" font-size="${FS}" fill="${faint}">${formatMm(R.inner, step)} vnút.</text>`;

  // VĽAVO: súradnicové kóty k spodným hranám políc
  const xb = x0 - 34, base = off ? 0 : t, top = R.outer - t;
  g += `<line x1="${xb}" y1="${y(base)}" x2="${xb}" y2="${y(top)}" stroke="${ink}" stroke-width="1"/>`;
  const MIN = 15;
  const pts = [{ mm: base, label: '0' }, ...R.shelves.map(sh => ({ mm: sh.bottom + t, label: formatMm(sh.bottom + off, step), bold: true })), { mm: top, label: formatMm(R.inner + off, step) }];
  let lastY = Infinity; const topY = y(top);
  pts.forEach((p, idx) => {
    const yy = y(p.mm), isEnd = idx === 0 || idx === pts.length - 1;
    g += `<line x1="${xb - 4}" y1="${yy}" x2="${x0 - 2}" y2="${yy}" stroke="${ink}" stroke-width=".6"/><circle cx="${xb}" cy="${yy}" r="2.3" fill="${ink}"/>`;
    const fits = isEnd || (lastY - yy >= MIN && yy - topY >= MIN);
    if (fits) { g += `<text x="${xb - 6}" y="${yy + 4.5}" text-anchor="end" font-size="${FS}" ${p.bold ? 'font-weight="600"' : ''} fill="${ink}">${p.label}</text>`; lastY = yy; }
  });
  g += `<text x="${Math.max(4, xb - 50)}" y="${y(base) + 20}" text-anchor="start" font-size="10.5" fill="${faint}">${off ? 'od spodnej hrany' : 'od vnút. dna'}</text>`;
  return wrap(g);
}
