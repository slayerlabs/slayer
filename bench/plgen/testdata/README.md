# testdata/ — JEDNORAZOWE fixtury deweloperskie

`dev_prompts.jsonl` to ~10 **wyrzucalnych** promptów do okablowania i testów
infrastruktury (A0–A6). **To NIE jest prawdziwy, held-outowy zbiór PL-GEN.**

- Prawdziwe, zamrożone prompty: `slayer-data/plgen/prompts_v1.jsonl` (prywatne,
  gitignored; master w repo `datasets/`).
- Te fixtury celowo są banalne i jawne — nie wymagają dekontaminacji, nie wchodzą
  do żadnego runu produkcyjnego. Można je w każdej chwili usunąć/nadpisać.

## Dla A1 (Layer A) — self-hosted LanguageTool przez Docker (zweryfikowane w A0)

Obraz przypięty i potwierdzony (pull OK, /v2/check działa, flaguje błąd PL):

    docker pull erikvl87/languagetool:6.5
    docker run -d --name lt -p 8010:8010 erikvl87/languagetool:6.5

Endpoint (POST form-encoded): `http://127.0.0.1:8010/v2/check`
  pola: `language=pl-PL`, `text=<tekst>`  (odpowiedź JSON, lista `matches[]`,
  każdy z `rule.id`, `rule.category`, `offset`, `length`, `message`).
Smoke: "Idę z mamą do sklep" -> 1 match, rule `PREP_CASUS`. Gotowość ~3 s.
(Domyślny port obrazu to 8010. Java/host nie są potrzebne — wszystko w kontenerze.)
