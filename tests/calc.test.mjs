// Spustenie: node tests/calc.test.mjs
import assert from 'node:assert/strict';
import { calcShelves, parseNum, formatMm, roundTo } from '../js/calc.js';

const near = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg}: ${a} != ${b}`);

// 720 vonkajšia / 18 / 2
let r = calcShelves({ height: 720, mode: 'outer', thickness: 18, count: 2 });
assert.ok(r.ok); near(r.inner, 684, 'inner'); near(r.gap, 216, 'gap'); near(r.pitch, 234, 'pitch');
near(r.shelves[0].bottom, 216, 's1'); near(r.shelves[1].bottom, 450, 's2'); near(r.shelves[1].top, 468, 's2 top'); near(r.shelves[0].axis, 225, 's1 axis');

// 684 vnútorná / 18 / 2 -> rovnaké
r = calcShelves({ height: 684, mode: 'inner', thickness: 18, count: 2 });
assert.ok(r.ok); near(r.outer, 720, 'outer'); near(r.gap, 216, 'gap inner');

// 2000 vonkajšia / 18 / 5
r = calcShelves({ height: 2000, mode: 'outer', thickness: 18, count: 5 });
assert.ok(r.ok); near(r.inner, 1964, 'inner 2000'); near(r.gap, 1874 / 6, 'gap 2000');
assert.equal(formatMm(r.gap, 0.5, true), '312,5'); assert.equal(formatMm(r.gap, 0.1, true), '312,3');
near(r.shelves[4].top + r.gap, r.inner, 'posledná medzera končí pod stropom');

// 0 políc
r = calcShelves({ height: 720, mode: 'outer', thickness: 18, count: 0 });
assert.ok(r.ok); near(r.gap, 684, 'gap 0 polic'); assert.equal(r.shelves.length, 0);

// chyby
assert.equal(calcShelves({ height: 300, mode: 'outer', thickness: 18, count: 15 }).error, 'noFit');
assert.equal(calcShelves({ height: 30, mode: 'outer', thickness: 18, count: 0 }).error, 'inner');
assert.equal(calcShelves({ height: NaN, mode: 'outer', thickness: 18, count: 2 }).error, 'height');
assert.equal(calcShelves({ height: 720, mode: 'outer', thickness: 0, count: 2 }).error, 'thickness');
assert.equal(calcShelves({ height: 720, mode: 'outer', thickness: 18, count: 1.5 }).error, 'count');

// parsovanie a zaokrúhľovanie
assert.equal(parseNum('18,5'), 18.5); assert.equal(parseNum(' 720 '), 720); assert.ok(Number.isNaN(parseNum('abc'))); assert.ok(Number.isNaN(parseNum('')));
assert.equal(roundTo(312.33, 0.5), 312.5); assert.equal(roundTo(312.24, 0.5), 312); assert.equal(formatMm(216, 0.5), '216'); assert.equal(formatMm(216, 0.5, true), '216,0');
console.log('OK — všetky testy prešli');
