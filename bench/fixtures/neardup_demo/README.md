# Fixture: near-dup poza warstwą verbatim

Mały przykład pokazujący, co `decon_neardup.py` łapie, a czego nie widzi
dosłowny `decon_audit.py`.

- `eval.jsonl`: dwa itemy "ewaluacyjne" z polskimi znakami.
- `gen.jsonl`: trzy rekordy "wygenerowane":
  - `g1`: kopia itemu evalu bez diakrytyków (zażółć -> zazolc),
  - `g2`: ta sama treść bez diakrytyków, z jednym słowem zmienionym,
  - `g3`: niezwiązany, czysty tekst (kontrola na false-positive).

## Uruchomienie

```bash
python3 bench/decon_neardup.py bench/fixtures/neardup_demo/gen.jsonl \
  --tests bench/fixtures/neardup_demo/eval.jsonl --no-llmzszl
```

## Wynik

```
gen.jsonl: 3 rekordy -> near-dup 1 (poza verbatim: 1, diacrytyki: 1)
  linia 1 [diacritics] score=1.0
```

`verbatim_raw_hits = 0`: dosłowny n-gram (czyli to, co liczy `decon_audit`)
nie łapie żadnego z tych rekordów, bo różnią się diakrytykami albo jednym słowem.
Warstwa diakrytyków łapie `g1` (zwinięcie diakrytyków); `g2` i `g3` zostają
(near-dup przeredagowany = domena MinHasha w #36).

`--strip` wycina tylko verbatim; tier diakrytyków wymaga jawnego `--strip-diacritics`.
