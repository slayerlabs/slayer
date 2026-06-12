# Prywatny held-out — świeże arkusze (anty-benchmaxxing)

Cel: wykrywać benchmaxxing. Jeśli **publiczny bench rośnie, a held-out płaski/spada → flaga**.

## Co to jest
Najnowsze roczniki **CKE/OKE** (matura, ósmoklasista, **egzaminy zawodowe/kwalifikacje**)
oraz **PES** — roczniki **spoza** publicznych datasetów (LLMzSzŁ, speakleash/PES),
czyli świeższe niż ich cutoff. Kilkaset pozycji na typ egzaminu wystarcza na sygnał.

## Gdzie leży (prywatność)
`slayer-data/heldout/<egzamin>_<rocznik>.jsonl`

`slayer-data/` jest w `.gitignore` → treść **nigdy** nie trafia do publicznego repo
`slayerlabs/slayer`. Datasety = repo prywatne (legal). Master kopii: prywatne
`slayerlabs/datasets`.

## Workflow przyjęcia
1. Wrzuć plik do `slayer-data/heldout/`.
2. `python3 bench/heldout_check.py` — audyt overlapu vs miks treningowy:
   - `0.0%` → held-out świeży, można mierzyć;
   - `>0%` → pozycje już w treningu; `--strip` albo weź nowszy rocznik.
3. Po akceptacji **dopisz ścieżkę do `EVAL_SOURCES` w `bench/decon_audit.py`** —
   wtedy standardowa bramka pilnuje, że PRZYSZŁY trening nie wciągnie held-outu.

## Dwie bramki, dwa kierunki
| skrypt | indeks | kandydat | pyta |
|---|---|---|---|
| `decon_audit.py` | zbiory ewaluacyjne | pliki treningowe | czy trening zawiera verbatim z evala? |
| `heldout_check.py` | miks treningowy | pliki held-out | czy świeży held-out nie przeciekł do treningu? |

## Kadencja
Odpalać held-out na **każdym checkpoincie**; trzymać krzywą obok krzywych publicznych
benchmarków. Rozjazd = sygnał skażenia/benchmaxxingu.
