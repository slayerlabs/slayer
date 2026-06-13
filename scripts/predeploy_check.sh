#!/usr/bin/env bash
# Strażnik deployu: łapie dryf lokalne-vs-git, który wywala build na Vercelu.
# Vercel builduje CZYSTY checkout, więc plik nietrackowany w katalogach strony
# = lokalnie działa, na produkcji 404/Module not found.
#
# Użycie: ./scripts/predeploy_check.sh   (przed pushem na slayerlabs/main)
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

fail=0

# 1) nietrackowane pliki w katalogach, które widzi Vercel
untracked=$(git ls-files --others --exclude-standard app components public lib 2>/dev/null | grep -v '\.tmp$' || true)
if [ -n "$untracked" ]; then
  echo "BŁĄD: nietrackowane pliki w katalogach strony (Vercel ich nie zobaczy):"
  echo "$untracked" | sed 's/^/  - /'
  fail=1
fi

# 2) niezacommitowane zmiany w katalogach strony (deploy weźmie starszą wersję)
dirty=$(git status --porcelain app components public lib next.config.mjs package.json 2>/dev/null | grep -v '^??' || true)
if [ -n "$dirty" ]; then
  echo "UWAGA: niezacommitowane zmiany w plikach strony:"
  echo "$dirty" | sed 's/^/  /'
fi

if [ "$fail" -eq 1 ]; then
  echo
  echo "Dodaj brakujące pliki (git add ...) albo usuń, jeśli zbędne. Deploy wstrzymany."
  exit 1
fi
echo "OK: drzewo strony spójne z gitem."
