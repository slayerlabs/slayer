"""Wspólne pomocniki benchów.

Celowo bez ciężkich zależności (tylko biblioteka standardowa), żeby moduł był
importowalny samodzielnie i szybko testowalny. Benche są uruchamiane jako
`python3 "$Q/bench_*.py"`, więc katalog skryptu trafia na sys.path[0] i
`import _bench_common` działa niezależnie od bieżącego katalogu roboczego.
"""


def winner_margin(results, metric):
    """Zwycięzca benchmarku i jego przewaga nad kolejnym modelem.

    Zwraca ``{"winner": ..., "margin": ...}`` albo pusty dict, gdy modeli jest
    mniej niż dwa — bez porównania nie ma zwycięzcy, a ``make_dashboard.py``
    renderuje wtedy ``'-'``.

    Przewagę liczymy względem faktycznego runner-upa (po posortowaniu), a nie
    sztywnych ``results[0]``/``results[1]``. Dzięki temu:

    * przy jednym modelu nie ma ``IndexError`` (realny stan produkcji, gdy drugi
      model nie wyprodukował wyników) — to przyczyna #40,
    * przy 3+ modelach margines jest liczony między zwycięzcą a drugim w
      kolejności, a nie między dwoma pierwszymi wpisami listy.
    """
    if len(results) < 2:
        return {}
    ranked = sorted(results, key=lambda r: r[metric], reverse=True)
    return {"winner": ranked[0]["display_name"],
            "margin": round(ranked[0][metric] - ranked[1][metric], 1)}
