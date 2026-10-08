# Rozteč políc

Jednoduchá webová appka na výpočet **svetlého priestoru medzi policami** a výšok políc v skrinke. Funguje na mobile aj PC, aj offline (PWA, „Pridať na plochu“).

**Spustenie:** https://michalmoronga-alt.github.io/roztec-polic/

## Čo počíta
- Zadáš výšku korpusu (**vnútornú** alebo **vonkajšiu**), hrúbku materiálu (predvolené 18 mm) a počet políc.
- Dno, strop a police majú rovnakú hrúbku. Medzery sú rovnaké.
- Výsledok: svetlý priestor, rozteč osí, nákres rezu s kótami a tabuľka výšok (spodná hrana, horná hrana, os). Merané od vnútorného dna, alebo od spodnej hrany korpusu.
- Zaokrúhlenie 0,5 mm (dá sa prepnúť na 0,1 alebo 1 mm). Počíta sa presne a zaokrúhľuje sa iba pri zobrazení.
- Export: tlačidlo **Uložiť PDF / tlačiť**.

## Vzorce
```
vnútro   = vonkajšia − 2·t
medzera  = (vnútro − n·t) / (n + 1)
polica i: spodná = i·medzera + (i−1)·t, horná = spodná + t, os = spodná + t/2
rozteč osí = medzera + t
```

## Štruktúra
| súbor | účel |
|---|---|
| `js/calc.js` | čistá výpočtová logika (bez DOM), dá sa prenášať do iných projektov |
| `js/draw.js` | SVG nákres rezu (vstup = výsledok `calcShelves`) |
| `js/app.js` | UI, stav, localStorage |
| `css/app.css` | štýly vrátane tlače |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA, offline |
| `tests/calc.test.mjs` | testy výpočtu (`node tests/calc.test.mjs`) |

Nemá build krok ani závislosti, sú to čisté HTML/CSS/JS súbory. Lokálne ho spusti cez ľubovoľný statický server, napr. `python3 -m http.server`. ES moduly sa nedajú otvoriť priamo cez `file://`.

Pri novej verzii zvýš číslo verzie na všetkých miestach: `VERSION` v `sw.js` a v `js/app.js`, `?v=` v `index.html` (CSS a JS) a v importoch v `js/app.js` a `js/draw.js`, plus `v…` v hlavičke a päte. Súbory s `?v=` sa cachujú natrvalo, HTML sa vždy načíta zo siete. Nová verzia sa v telefóne načíta sama, najviac s jedným automatickým obnovením stránky.

Publikovanie: po každom pushi do `main` workflow `.github/workflows/pages.yml` spustí testy a skopíruje web do vetvy `gh-pages`. Z tej vetvy beží GitHub Pages.

v1.1.1
