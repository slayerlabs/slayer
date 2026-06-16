"""Dodaj root repo do sys.path, by 'from bench.plgen import common' działało
niezależnie od katalogu uruchomienia pytest (repo trzyma benche jako skrypty,
więc nie ma globalnego instalowalnego pakietu)."""
import os
import sys

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if REPO not in sys.path:
    sys.path.insert(0, REPO)
