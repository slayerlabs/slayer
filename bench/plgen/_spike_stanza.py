"""PARKED/experimental — not in the shipped bench; kept for `anno_cli --audit-la` (Layer-A sensitivity work). See plgen-notes.

SPIKE: Stanza-pl morphological-agreement checker for PL-GEN Layer A recall.

Throwaway. ~10 heuristic checks over Stanza UD feats (Case/Gender/Number/Aspect)
+ deprel for the agreement/government classes LanguageTool misses. NOT a grammar
engine; every check has a documented ceiling. Deterministic (Stanza = argmax).

Usage:
  _spike_stanza.py probes      # recall on 21 probes + FP sense on clean sents
  _spike_stanza.py real        # per-model error density on the ~197 real answers
"""
import sys, os, json, re

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

_NLP = None
def nlp():
    global _NLP
    if _NLP is None:
        import stanza
        _NLP = stanza.Pipeline('pl', processors='tokenize,pos,lemma,depparse',
                               verbose=False, download_method=None)
    return _NLP

# --- lexicons (deliberately small; these are the documented ceilings) ---
# Verbs governing genitive on their object (subset; rekcja).
GEN_VERBS = {"szukać", "używać", "potrzebować", "udzielać", "udzielić",
             "wymagać", "dostarczać", "dostarczyć", "zabraniać", "zakazać",
             "życzyć", "doświadczać", "słuchać", "bronić", "pilnować",
             "dotyczyć", "spodziewać", "oczekiwać"}
# Pluralia-tantum / tricky toponyms: lemma/surface -> only valid as that case form.
# We flag a small closed set by SURFACE after a prep, since the parser "fixes" case.
TOPONYM_PLURALE = {"tychy", "kielce", "katowice", "gliwice", "suwałki",
                   "bielsko-biała", "ateny", "helsinki"}
GENDERED_NUMERAL = {"dwa", "trzy", "cztery"}  # surface "dwa"/"trzy"/"cztery" w/ fem/neut noun

def feat(w, k):
    if not w.feats:
        return None
    for part in w.feats.split("|"):
        if part.startswith(k + "="):
            return part.split("=", 1)[1]
    return None

def head_of(words, w):
    return words[w.head - 1] if w.head and w.head > 0 else None

def children(words, w):
    return [c for c in words if c.head == w.id]

def check_sentence(sent):
    """Return list of (class, span_text) findings for one Stanza sentence."""
    words = sent.words
    out = []
    by_id = {w.id: w for w in words}

    for w in words:
        # 1+2+4. genitive-government verbs: obj/iobj in Acc under a GEN_VERB
        if w.deprel in ("obj", "iobj") and w.upos in ("NOUN", "PRON", "PROPN"):
            h = head_of(words, w)
            if h and h.upos == "VERB" and h.lemma in GEN_VERBS:
                if feat(w, "Case") == "Acc":
                    out.append(("rekcja-gen-verb", f"{h.text}…{w.text}"))

        # 3. negation -> genitive: obj of a verb that has a Polarity=Neg child, in Acc
        if w.deprel == "obj" and w.upos in ("NOUN", "PRON", "PROPN") and feat(w, "Case") == "Acc":
            h = head_of(words, w)
            if h and h.upos == "VERB":
                if any(feat(c, "Polarity") == "Neg" or c.deprel == "advmod:neg"
                       for c in children(words, h)):
                    out.append(("negacja-gen", f"nie {h.text}…{w.text}"))

        # 5+6+7. det/adj <-> noun gender (or number) agreement
        if w.deprel in ("det", "amod") and w.upos in ("DET", "ADJ"):
            h = head_of(words, w)
            if h and h.upos == "NOUN":
                wg, hg = feat(w, "Gender"), feat(h, "Gender")
                wn, hn = feat(w, "Number"), feat(h, "Number")
                wc, hc = feat(w, "Case"), feat(h, "Case")
                # only flag when both have the feature and they disagree
                if wg and hg and wg != hg and (wc is None or hc is None or wc == hc):
                    out.append(("zgoda-przym-rzecz-rodzaj", f"{w.text} {h.text}"))
                elif wn and hn and wn != hn and wg == hg:
                    out.append(("zgoda-przym-rzecz-liczba", f"{w.text} {h.text}"))

        # 8. dwa/dwie: surface "dwa" with a Fem noun (head OR child via nummod)
        if w.upos == "NUM" and w.text.lower() == "dwa":
            cand = [head_of(words, w)] + children(words, w)
            for c in cand:
                if c and c.upos == "NOUN" and feat(c, "Gender") == "Fem":
                    out.append(("liczebnik-dwa-dwie", f"{w.text} {c.text}"))
                    break

        # 11. collective numeral (NumType=Sets) with singular noun
        if w.upos == "NUM" and feat(w, "NumType") == "Sets":
            h = head_of(words, w)
            tgt = h if (h and h.upos == "NOUN") else None
            if tgt is None:
                kids = [c for c in children(words, w) if c.upos == "NOUN"]
                tgt = kids[0] if kids else None
            if tgt and feat(tgt, "Number") == "Sing":
                out.append(("liczebnik-zbiorowy", f"{w.text} {tgt.text}"))

        # 10+17. subject <-> finite past verb gender/number agreement
        if w.deprel in ("nsubj", "nsubj:pass") and w.upos in ("NOUN", "PRON", "PROPN"):
            h = head_of(words, w)
            if h and h.upos == "VERB" and feat(h, "Tense") == "Past":
                # numeral-governed subject (has a nummod:gov NUM child) requires
                # the verb to be Neut Sing; flag anything else.
                num_gov = any(c.upos == "NUM" and c.deprel == "nummod:gov"
                              for c in children(words, w))
                if num_gov:
                    if not (feat(h, "Gender") == "Neut" and feat(h, "Number") == "Sing"):
                        out.append(("zgoda-podmiot-orzeczenie", f"{w.text}…{h.text}"))
                else:
                    sg, vg = feat(w, "Gender"), feat(h, "Gender")
                    if sg and vg and sg != vg:
                        out.append(("zgoda-podmiot-orzeczenie", f"{w.text}…{h.text}"))

        # 16. aspect/tense: past finite verb coordinated (conj) with a bare infinitive
        if w.deprel == "conj" and w.upos == "VERB" and feat(w, "VerbForm") == "Inf":
            h = head_of(words, w)
            if h and h.upos == "VERB" and feat(h, "VerbForm") == "Fin" and feat(h, "Tense") == "Past":
                # no modal/aux licensing the infinitive
                if not any(c.deprel in ("aux", "xcomp") for c in children(words, w)):
                    out.append(("aspekt-czas-przeszly", f"{h.text}…{w.text}"))

        # 21. swój vs jego: 3rd-person possessive (on/ona/oni) as nmod/det of an
        #     object, when the clause subject is 3rd person -> should be reflexive "swój"
        if w.upos == "PRON" and w.lemma == "on" and feat(w, "Poss") is None \
                and w.deprel in ("nmod", "det:poss") and feat(w, "Case") == "Gen":
            h = head_of(words, w)
            if h and h.upos in ("NOUN",) and h.deprel in ("obj", "iobj"):
                vb = head_of(words, h)
                if vb and vb.upos == "VERB":
                    subj = [c for c in children(words, vb) if c.deprel == "nsubj"]
                    if subj and feat(subj[0], "Person") in (None, "3"):
                        out.append(("swoj-vs-jego", f"{w.text} {h.text}"))

    return out

def check_toponyms(text):
    """13+14. Pluralia-tantum toponym after prep in wrong surface form. Surface
    regex because the parser silently normalizes the case. Ceiling: tiny lexicon."""
    out = []
    for m in re.finditer(r"\b(w|we|do|z|ze|od|na)\s+([A-ZŁŚŻŹĆ][\wąćęłńóśżź-]+)", text):
        prep, name = m.group(1).lower(), m.group(2).lower()
        if name in TOPONYM_PLURALE:
            # correct forms: w Tychach / do Tych / w Kielcach / do Kielc — i.e. NOT bare nominative
            out.append(("toponim", f"{m.group(1)} {m.group(2)}"))
    return out

def check_text(text):
    findings = []
    doc = nlp()(text)
    for sent in doc.sentences:
        findings.extend(check_sentence(sent))
    findings.extend(check_toponyms(text))
    return findings

# ---------------- probe / FP harness ----------------
def run_probes():
    path = os.path.join(REPO, "bench/plgen/testdata/recall_probes.jsonl")
    probes = [json.loads(l) for l in open(path) if l.strip()]
    caught_ids, lt_ids = [], []
    print("PROBE RECALL (Stanza checker)\n" + "=" * 60)
    for p in probes:
        f = check_text(p["tekst"])
        hit = len(f) > 0
        if hit:
            caught_ids.append(p["id"])
        if p.get("lt_catches"):
            lt_ids.append(p["id"])
        mark = "CATCH" if hit else "  -  "
        cls = ",".join(sorted({c for c, _ in f})) if f else ""
        print(f"{p['id']:2} [{mark}] {p['klasa']:24} {cls}")
    print("=" * 60)
    print(f"Stanza recall: {len(caught_ids)}/{len(probes)}  ids={sorted(caught_ids)}")
    print(f"LT recall:     {len(lt_ids)}/{len(probes)}  ids={sorted(lt_ids)}")
    newly = sorted(set(caught_ids) - set(lt_ids))
    print(f"Newly caught (Stanza, not LT): {newly}")

    # False-positive sense: known-correct sentences
    clean = [
        "Codziennie korzystam z tego programu do pracy.",
        "Na spotkaniu były dwie kobiety i jeden mężczyzna.",
        "Wczoraj napisałem list i wysłałem go na poczcie.",
        "Ona poszła do sklepu po chleb.",
        "Mieszkam w Tychach od urodzenia.",
        "Jan zabrał swój płaszcz i wyszedł.",
        "Potrzebuję nowego samochodu, bo stary się zepsuł.",
        "Mam ten nowy samochód od miesiąca.",
        "Pięć osób przyszło na zebranie.",
        "To jest bardzo ładna dziewczyna.",
        "Nie widzę problemu w tym rozwiązaniu.",
        "W schronisku było pięcioro dzieci.",
    ]
    print("\nFALSE-POSITIVE SENSE (known-correct)\n" + "=" * 60)
    fp = 0
    for s in clean:
        f = check_text(s)
        if f:
            fp += 1
            print(f"  FP: {s}\n      -> {f}")
    print(f"False positives: {fp}/{len(clean)} clean sentences")

# ---------------- real-answer harness ----------------
def run_real():
    runs_dir = os.path.join(REPO, "slayer-data/plgen/runs")
    models = ["bielik", "gemma4", "qwen35_instruct", "qwen36"]
    gold_path = os.path.join(REPO, "slayer-data/plgen/gold_v1.jsonl")
    gold = {}
    for l in open(gold_path):
        if l.strip():
            g = json.loads(l)
            gold[(g["id"], g["model"])] = g

    per_model = {}
    doc_scores = {}  # (id,model) -> errs/100tok
    for m in models:
        fp = os.path.join(runs_dir, f"gen_{m}_s42.jsonl")
        docs = [json.loads(l) for l in open(fp) if l.strip()]
        tot_err, tot_tok, ndoc = 0, 0, 0
        cls_counts = {}
        for d in docs:
            text = d.get("ans") or ""
            if not text.strip():
                continue
            f = check_text(text)
            ntok = len(text.split())
            tot_err += len(f); tot_tok += ntok; ndoc += 1
            for c, _ in f:
                cls_counts[c] = cls_counts.get(c, 0) + 1
            if ntok:
                doc_scores[(d["id"], m)] = len(f) / ntok * 100
        per_model[m] = dict(docs=ndoc, errs=tot_err, toks=tot_tok,
                            density=tot_err / tot_tok * 100 if tot_tok else 0,
                            classes=cls_counts)

    print("PER-MODEL ERROR DENSITY (Stanza checker)\n" + "=" * 70)
    print(f"{'model':18} {'docs':>5} {'errs':>5} {'toks':>7} {'err/100tok':>11}")
    for m in models:
        s = per_model[m]
        print(f"{m:18} {s['docs']:>5} {s['errs']:>5} {s['toks']:>7} {s['density']:>11.3f}")
    print("\nClass breakdown per model:")
    for m in models:
        print(f"  {m}: {per_model[m]['classes']}")

    # correlation with human gold
    print("\nHUMAN-GOLD CHECK (20 verdicts)\n" + "=" * 70)
    rank = {"pass": 0, "mixed": 1, "fail": 2}
    rows = []
    for (gid, gm), g in gold.items():
        sc = doc_scores.get((gid, gm))
        if sc is not None:
            rows.append((g["werdykt"], g["naturalnosc"], sc, gid, gm))
    rows.sort(key=lambda r: rank.get(r[0], 9))
    by_verdict = {}
    for v, nat, sc, gid, gm in rows:
        by_verdict.setdefault(v, []).append(sc)
    for v in ("pass", "mixed", "fail"):
        xs = by_verdict.get(v, [])
        if xs:
            print(f"  {v:6}: n={len(xs)} mean err/100tok={sum(xs)/len(xs):.3f}  vals={[round(x,2) for x in xs]}")
    # spearman-ish: naturalnosc (1..5) vs density
    import statistics
    if len(rows) > 2:
        nats = [r[1] for r in rows]; scs = [r[2] for r in rows]
        def pearson(a, b):
            ma, mb = sum(a)/len(a), sum(b)/len(b)
            num = sum((x-ma)*(y-mb) for x, y in zip(a, b))
            da = (sum((x-ma)**2 for x in a))**.5; db = (sum((y-mb)**2 for y in b))**.5
            return num/(da*db) if da and db else 0
        print(f"  pearson(naturalnosc, err-density) = {pearson(nats, scs):.3f} (n={len(rows)})")

if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "probes"
    if mode == "probes":
        run_probes()
    elif mode == "real":
        run_real()
