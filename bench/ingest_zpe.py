#!/usr/bin/env python3
"""Konektor ZPE (zpe.gov.pl) — rządowe e-materiały szkolne jako korpus wiedzy PL.

Pipeline: /api/v1/search?query=... -> /api/v1/project/<id>/pl/manifest ->
paczki dokumentów (zip) -> tekst z <D>_main.html -> akapity do korpusu.
To dokładnie materiał egzaminów (ósmoklasista/matura), czyli domena LLMzSzŁ,
ale TREŚCI ŹRÓDŁOWE, nie itemy testowe. Guard: akapity kolidujące z atomami
testowymi (runs/test_atoms.txt) wypadają na wejściu.

Out: slayer-data/knowledge/sources/zpe.jsonl  {"text","title","url","project","doc","subject","source":"zpe"}
Idempotentny: pomija projekty już pobrane. Rate-limit ~3 req/s.

Usage:
  python3 bench/ingest_zpe.py                       # domyślna lista zapytań egzaminacyjnych
  python3 bench/ingest_zpe.py --queries "powstanie styczniowe,fotosynteza" --pages 2
"""
import argparse
import html as html_mod
import io
import json
import os
import re
import time
import urllib.parse
import urllib.request
import zipfile

API = "https://zpe.gov.pl/api/v1"
OUT = "slayer-data/knowledge/sources/zpe.jsonl"
ATOMS_F = "runs/test_atoms.txt"
UA = {"User-Agent": "SlayerLab-research/1.0 (korpus edukacyjny; kontakt: slayer.fabryka.ai)",
      "Accept": "application/json"}

# zapytania pokrywające domeny egzaminów (ósmoklasista, matura, zawodowe)
DEFAULT_QUERIES = [
    # historia PL
    "powstanie styczniowe", "powstanie listopadowe", "Mieszko I", "unia lubelska",
    "konstytucja 3 maja", "rozbiory Polski", "II Rzeczpospolita", "Solidarność",
    "II wojna światowa Polska", "Piastowie", "Jagiellonowie", "PRL",
    # język polski / lektury
    "Pan Tadeusz", "Lalka Prus", "Wesele Wyspiański", "Dziady Mickiewicz",
    "pozytywizm", "romantyzm", "Młoda Polska", "środki stylistyczne",
    # geografia PL
    "województwa Polski", "Wisła rzeka", "Tatry", "klimat Polski", "demografia Polski",
    "przemysł w Polsce", "rolnictwo w Polsce",
    # WOS / prawo / gospodarka
    "konstytucja RP", "sejm i senat", "samorząd terytorialny", "Unia Europejska Polska",
    "prawa człowieka", "system podatkowy",
    # nauki ścisłe i przyrodnicze (egzaminy)
    "fotosynteza", "układ krwionośny", "genetyka", "ewolucja",
    "kwasy i zasady", "reakcje chemiczne", "elektryczność", "mechanika ruch",
    "funkcje kwadratowe", "geometria trójkąta", "procenty zadania",
]

WORD = re.compile(r"\w+", re.UNICODE)


def get(url, binary=False, tries=3):
    req = urllib.request.Request(url, headers=UA)
    for a in range(tries):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                data = r.read()
                return data if binary else json.loads(data)
        except Exception as e:
            if a == tries - 1:
                print(f"    err {url[:80]}: {str(e)[:60]}")
                return None
            time.sleep(2 * (a + 1))


def text_of_html(raw):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", " ", raw, flags=re.S | re.I)
    t = re.sub(r"<(h[1-6]|p|li|div|tr|br)[^>]*>", "\n", t, flags=re.I)
    t = re.sub(r"<[^>]+>", " ", t)
    t = html_mod.unescape(t)
    return [re.sub(r"\s+", " ", p).strip() for p in t.split("\n")]


BOILER = re.compile(r"(Etap edukacyjny|Czas trwania zajęć|Uzasadnienie (wyboru|zastosowania)|"
                    r"podstawy programowej|Cele operacyjne|Metody.{0,20}pracy|Środki dydaktyczne|"
                    r"Formy (pracy|zajęć)|Przebieg (lekcji|zajęć)|Słowa kluczowe|Bibliografia|"
                    r"\bTIK\b|epodrecznik|e-podręcznik|scenariusz (lekcji|zajęć)|kryteria sukcesu|"
                    r"Nauczysz się|kartę pracy|nauczyciel|uczniowie|uczeń|grupach|burza mózgów|"
                    r"prezentacj[ai] multimedialn|tablic[aey] (interaktywn|multimedialn))", re.I)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--queries", default="")
    ap.add_argument("--pages", type=int, default=3, help="strony wyników na zapytanie (20/strona)")
    ap.add_argument("--max-projects", type=int, default=0)
    a = ap.parse_args()
    queries = [q.strip() for q in a.queries.split(",") if q.strip()] or DEFAULT_QUERIES

    atoms = [t.strip() for t in open(ATOMS_F, encoding="utf-8")] if os.path.exists(ATOMS_F) else []
    atoms = [t for t in atoms if len(t) >= 20]  # BEZ górnego capu
    norm = lambda s: " ".join(s.lower().split())

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    seen_projects = set()
    if os.path.exists(OUT):
        for ln in open(OUT, encoding="utf-8"):
            try:
                seen_projects.add(json.loads(ln)["project"])
            except Exception:
                pass
    print(f"[zpe] start: {len(queries)} zapytań, znanych projektów {len(seen_projects)}, atomów {len(atoms)}")

    n_par, n_contam, n_proj = 0, 0, 0
    with open(OUT, "a", encoding="utf-8") as f:
        for q in queries:
            ids = []
            for page in range(1, a.pages + 1):
                d = get(f"{API}/search?query={urllib.parse.quote(q)}&page={page}")
                if not d or not d.get("data"):
                    break
                ids += [(it["id"], it.get("title", ""), it.get("subject", [])) for it in d["data"]]
                time.sleep(0.3)
            fresh = [(i, t, s) for i, t, s in ids if i not in seen_projects]
            print(f"[zpe] '{q}': {len(ids)} wyników, nowych {len(fresh)}")
            for pid, title, subject in fresh:
                seen_projects.add(pid)
                if a.max_projects and n_proj >= a.max_projects:
                    break
                man = get(f"{API}/project/{pid}/pl/manifest")
                if not man:
                    continue
                n_proj += 1
                for doc in (man.get("tableOfContents") or []):
                    dl = doc.get("downloadUrl")
                    if not dl:
                        continue
                    blob = get(dl, binary=True)
                    if not blob:
                        continue
                    try:
                        zf = zipfile.ZipFile(io.BytesIO(blob))
                        main_name = next((n for n in zf.namelist() if n.endswith("_main.html")), None)
                        if not main_name:
                            continue
                        paras = text_of_html(zf.read(main_name).decode("utf-8", "ignore"))
                    except Exception:
                        continue
                    for p in paras:
                        if not (300 <= len(p) <= 2000) or BOILER.search(p):
                            continue
                        np_ = norm(p)
                        if any(at in np_ for at in atoms):
                            n_contam += 1
                            continue
                        f.write(json.dumps({"text": p, "title": man.get("title") or title,
                                            "url": doc.get("url", ""), "project": pid,
                                            "doc": doc.get("code", ""), "subject": subject,
                                            "source": "zpe"}, ensure_ascii=False) + "\n")
                        n_par += 1
                    time.sleep(0.3)
                f.flush()
    print(f"[zpe] DONE: projektów {n_proj}, akapitów {n_par}, kontaminacja odrzucona {n_contam} -> {OUT}")


if __name__ == "__main__":
    main()
