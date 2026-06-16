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
  --tests bench/fixtures/neardup_demo/eval.jsonl --no-llmzszl \
  --minhash --shingle 3 --minhash-threshold 0.5
```

## Wynik

```
gen.jsonl: 3 rekordy -> near-dup 2 (poza verbatim: 2, diakrytyki: 1, minhash: 2)
  linia 1 [diacritics] score=1.0
  linia 2 [minhash]    score=0.5312
```

`verbatim_raw_hits = 0`: dosłowny n-gram (czyli to, co liczy `decon_audit`)
nie łapie żadnego z tych rekordów, bo różnią się diakrytykami albo jednym słowem.
Warstwa near-dup łapie `g1` (zwinięcie diakrytyków) i `g2` (Jaccard 0.53), a `g3`
zostawia jako czysty.
