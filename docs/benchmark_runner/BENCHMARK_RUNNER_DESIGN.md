# Benchmark Runner — design (open-suite report)

Status: approved design, 2026-06-20. Scope of this doc: the **front**, open suite only.
Supersedes the placeholder `/runner` route built 2026-06-19.

## Purpose

A page where you point at a model and see how good it is, *comparably*: every model
run through one pinned suite, scored against a fixed base, so the numbers can actually
be put next to each other. Serves two jobs with one machinery:

- **Bake-off** — "which base model do we start from?" (Bielik vs Qwen variants). Kacper's *od czego zacząć*.
- **Candidate report** — "did last night's training beat base, what's broken?" (the `image.png` artifact).

These are the same component: a base anchor + N model columns + Δ. The bake-off is just
the candidate report with the lineage/verdict layer switched off and more columns.

The public live `/leaderboard` (autonomous Qwen queue) is a *different* thing and stays as-is.

## Core object: a run

One model/artifact evaluated through the pinned suite → absolute scores + provenance + warnings.
Everything on the site is a view over runs. For the front phase, a run is a static JSON file
dropped into the repo; the runner/API produces these later with no page change.

## The suite is a versioned spec

`Open PL Suite v1 = { declared task list, one harness, 5-shot, fixed sampling }`.

- Numbers are comparable **only within a suite version**. Add/drop a task or change the
  harness → that is `v2`, and v1↔v2 are never cross-compared.
- The suite is a named, dated, first-class object on the site (its task list + protocol is
  the methodology page).
- Decision (c) from brainstorm: the suite is the **union we stand behind**, run through **one**
  harness — not the two disjoint legacy batteries (image's KLEJ harness vs the ollama queue).
  Picking exact v1 membership + the harness is runner/backend work (deferred); the front renders
  whatever the suite spec declares.

## Two protocols, never blended

Each suite task reports two independent numbers:
- generative `exact_match`
- multiple-choice `acc`

They are not comparable to each other (per `matrix.json`'s standing rule) and are never
collapsed into one score. Two columns, two aggregates.

## Regression guards (separate from the suite)

EN tasks (`mmlu`, `arc`, `gsm8k`, `belebele_en`) are **guards**, not suite members. They answer
"did we break English?" — a pass/fail, not an average. Shown as a green/red strip, never folded
into the PL aggregate. A guard trips (red) if it drops more than ε below the base (ε = 1.0pp, suite constant).

## The board (landing)

Flat list of models, ranked, anchored to `Qwen3.5-9B` for Δ. No base-vs-candidate grouping —
everything is "a model." No "recommended base" callout; the board itself is the answer.

Per row: model · generative aggregate (+Δ vs base) · MCQ aggregate (+Δ vs base) · guard light
(green/red) · date · suite version.

- Default sort: **generative aggregate** (`matrix.json` tags generative as the product-quality
  official number). MCQ is a sortable alternate.
- The base (`Qwen3.5-9B`) is itself a row, Δ = 0.
- Δ is derived by reading the base run's file — run files store only their own absolutes.

## The run page (drill-down)

Click a row → the `image.png` report:

1. **Provenance header** — model + adapter, host (e.g. `lem (H100)`), date, suite version.
2. **Headline** — two PL aggregates + Δ vs base, then the EN guard strip.
3. **Per-task table** — every suite task, generative + MCQ columns, Δ vs base per cell.
4. **Broken-tasks callout** — `0.0 ⚠` tasks shown openly, excluded from the aggregate, with a
   visible working-task count ("9 working tasks"). Transparency is a feature.

## Run JSON shape (the contract)

One file per run, e.g. `public/results/runs/<run-id>.json`:

```json
{
  "schema": "run/v1",
  "id": "qwen3.5-9b",
  "model": { "name": "Qwen3.5-9B", "params": "9B", "org": "Alibaba", "kind": "base" },
  "artifact": { "adapter": null, "host": null },
  "suite": "open-pl-v1",
  "base": "qwen3.5-9b",
  "date": "2026-06-20",
  "tasks": [
    { "id": "psc", "label": "psc", "gen": 96.9, "mcq": 91.2, "status": "ok" },
    { "id": "polqa_closed_book", "label": "polqa (closed book)", "gen": 0.0, "mcq": null, "status": "broken" }
  ],
  "guards": [
    { "id": "mmlu", "label": "MMLU (EN)", "gen": 77.1, "status": "ok" }
  ],
  "aggregate": { "gen": 80.8, "mcq": 79.1, "working_tasks": 9 }
}
```

- `artifact.adapter`/`host` populated only for lineage'd candidate runs; null for plain base models.
- Board + run page derive Δ by reading the `base` run's file. Guard pass/fail derived vs the base
  run's guard numbers (ε = 1.0pp).
- `status: broken` cells render `0.0 ⚠` and drop out of `aggregate`.

## Scope

**Build now (front):** suite spec + manifest, board (flat ranked, Δ, guard light), run page
(provenance, headline, per-task table, broken callout), static run JSON. Keep the dummy submit
form as a placeholder. Reshape the existing `/runner` route into this.

**Deferred:** Tier A targeted/private diagnostics + verdict/"keeper" narrative; the actual
harness + GPU runner; backend/submission API; private benchmark moves + decon hardening.

## Open items (not blockers for the front)

- Exact `Open PL Suite v1` task membership + the chosen harness — runner/backend decision.
- Where real Bielik / Qwen-27B numbers come from — needs a GPU run (Phase 3, @Michał Warda).
  Until then those rows render with empty/`—` cells.
