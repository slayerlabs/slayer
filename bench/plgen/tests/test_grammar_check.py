"""Layer A (grammar_check) testy integracyjne — wymagają żywego LanguageTool.

Docker UP; jeśli LT/docker nieosiągalny -> skip (ale w tym środowisku MUSZĄ przejść).
Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/test_grammar_check.py -q

Zdania z planowanymi błędami dobrane pod REALNY recall LT 6.5/pl-PL (sondowane):
PREP_CASUS i DISAGREEMENT_VERB_PPRON to stabilne triggery morfoskładni; część
„podręcznikowych" błędów zgody (np. „Widzę ten książkę") LT nie łapie — to ok,
metryka jest dolną granicą.
"""
import shutil

import pytest

from bench.plgen import grammar_check as gc


@pytest.fixture(scope="module")
def base_url():
    if shutil.which("docker") is None:
        pytest.skip("docker niedostępny")
    try:
        return gc.ensure_lt()
    except Exception as e:
        pytest.skip(f"LanguageTool nieosiągalny: {e}")


# --- bucketing czystej logiki (bez sieci) ---
def test_bucket_for_categories():
    def mk(rule_id, cat_id):
        return {"rule": {"id": rule_id, "category": {"id": cat_id}}}
    assert gc.bucket_for(mk("PREP_CASUS", "SYNTAX")) == "morphosyntax"
    assert gc.bucket_for(mk("MORFOLOGIK_RULE_PL_PL", "TYPOS")) == "spelling"
    assert gc.bucket_for(mk("PL_SIMPLE_REPLACE", "PRAWDOPODOBNE_LITEROWKI")) == "spelling"
    assert gc.bucket_for(mk("DZIEN_DZISIEJSZY", "REDUNDANCY")) == "style"
    assert gc.bucket_for(mk("WORD_REPEAT_RULE", "MISC")) == "other"
    # fallback po rule.id gdy kategoria nieznana
    assert gc.bucket_for(mk("SOME_AGREEMENT_X", "UNKNOWN_CAT")) == "morphosyntax"
    assert gc.bucket_for(mk("MORFOLOGIK_FOO", "UNKNOWN_CAT")) == "spelling"
    # realne rule.id zaobserwowane na 200 odpowiedziach -> morfoskładnia
    assert gc.bucket_for(mk("SUBST_ADJ_UNIFY", "SYNTAX")) == "morphosyntax"
    assert gc.bucket_for(mk("PCON_VERB", "SYNTAX")) == "morphosyntax"
    assert gc.bucket_for(mk("ZAIMKI_DLUZSZE", "SYNTAX")) == "morphosyntax"
    # szum: interpunkcja/semantyka/liczby bez heurystyki rule.id -> 'other'
    assert gc.bucket_for(mk("JEDNOSTKA_LICZBA", "NUMBERS")) == "other"
    assert gc.bucket_for(mk("WYDAWAC_SIE_BYC", "SEMANTICS")) == "other"


def test_disabled_noise_config_sent():
    # szum typograficzny ma być wyłączany na poziomie API (disabledCategories/Rules),
    # żeby nie wpadał do żadnego bucketa i nie zawyżał 'other'.
    assert "TYPOGRAPHY" in gc.DISABLED_CATEGORIES
    assert "CASING" in gc.DISABLED_CATEGORIES
    assert "PL_UNPAIRED_BRACKETS" in gc.DISABLED_RULES


def test_check_passes_disabled_params(monkeypatch):
    captured = {}

    class _Resp:
        def read(self_inner):
            return b'{"matches": []}'

    def fake_urlopen(req, timeout=60):
        captured["data"] = req.data.decode()
        return _Resp()

    monkeypatch.setattr(gc.urllib.request, "urlopen", fake_urlopen)
    gc.check("jakiś tekst", "http://stub")
    assert "disabledCategories=TYPOGRAPHY" in captured["data"]
    assert "PL_UNPAIRED_BRACKETS" in captured["data"]


# --- planted morfoskładnia: każde >=1 match w buckecie morphosyntax ---
@pytest.mark.parametrize("text", [
    "Idę z mamą do sklep każdego dnia.",          # PREP_CASUS (do + D)
    "Ona poszedł wczoraj rano do swojego domu.",   # DISAGREEMENT_VERB_PPRON
    "On pisze długi list do brat swojego.",        # PREP_CASUS
])
def test_planted_morphosyntax(base_url, text):
    matches = gc.check(text, base_url)
    buckets = [gc.bucket_for(m) for m in matches]
    assert "morphosyntax" in buckets, f"brak morphosyntax w {buckets} dla: {text}"


# --- czysty, poprawny akapit: ~0 błędów morfoskładni ---
def test_clean_paragraph_no_morphosyntax(base_url):
    text = ("Wczoraj poszedłem z mamą do sklepu, żeby kupić warzywa na obiad. "
            "Pogoda była piękna, więc wróciliśmy pieszo przez park. "
            "W domu ugotowaliśmy zupę i razem obejrzeliśmy ciekawy film. "
            "Był to naprawdę spokojny i udany wieczór dla całej naszej rodziny.")
    res = gc.score_doc(text, base_url)
    assert res["counts"]["morphosyntax"] == 0, res["counts"]


# --- literówki -> bucket spelling ---
def test_spelling_typo_bucket(base_url):
    text = "Wczoraj napewno chciałem to zrobić, ale wogóle mi się nie chciało."
    matches = gc.check(text, base_url)
    buckets = [gc.bucket_for(m) for m in matches]
    assert "spelling" in buckets, f"oczekiwano spelling, jest {buckets}"


# --- guard min. długości: stub ~5 tokenów -> too_short ---
def test_too_short_guard(base_url):
    res = gc.score_doc("To jest krótki tekst.", base_url)
    assert res["too_short"] is True
    assert res["n_tokens"] < gc.MIN_TOKENS


def test_long_enough_not_too_short(base_url):
    text = " ".join(["wyraz"] * (gc.MIN_TOKENS + 5))
    res = gc.score_doc(text, base_url)
    assert res["too_short"] is False


# --- normalizacja errors_per_100tok poprawna względem znanych liczb ---
def test_errors_per_100tok_normalization(base_url):
    # PREP_CASUS x1 w tekście; sprawdzamy że per100 = 100*count/n_tokens
    text = "Idę z mamą do sklep " + " ".join(["słowo"] * 45)
    res = gc.score_doc(text, base_url)
    n = res["n_tokens"]
    for b in gc.BUCKETS:
        expected = 100.0 * res["counts"][b] / n
        assert abs(res["errors_per_100tok"][b] - expected) < 1e-9
    assert res["counts"]["morphosyntax"] >= 1
    assert res["too_short"] is False


# --- agregacja: too_short pomijane, liczone w n_too_short ---
def test_score_docs_aggregate_skips_short(base_url):
    long_clean = ("Dzisiaj rano obudziłem się wcześnie i z radością przygotowałem "
                  "śniadanie dla całej rodziny, bo był to wyjątkowo piękny poranek "
                  "pełen słońca i dobrego nastroju w naszym spokojnym domu nad rzeką. "
                  "Po posiłku poszliśmy razem na długi spacer brzegiem wody, "
                  "rozmawiając o planach na nadchodzące letnie wakacje i remont kuchni.")
    short = "Krótki tekst tutaj."
    agg = gc.score_docs([long_clean, short], base_url)
    assert agg["n_docs"] == 2
    assert agg["n_too_short"] == 1
    assert agg["n_scored"] == 1
    for b in gc.BUCKETS:
        assert b in agg["mean_errors_per_100tok"]


# ============================================================================
# UNIT (bez LT/dockera): monkeypatch gc.check -> kanoniczne matches, sprawdź
# math agregacji score_doc/score_docs (bucketing, /100tok, too_short, średnia).
# ============================================================================
def _match(rule_id, cat_id):
    return {"rule": {"id": rule_id, "category": {"id": cat_id}}}


def test_score_doc_math_unit(monkeypatch):
    # 2x morphosyntax (SYNTAX), 1x spelling (TYPOS); reszta 0
    matches = [_match("PREP_CASUS", "SYNTAX"),
               _match("DISAGREEMENT_VERB_PPRON", "SYNTAX"),
               _match("MORFOLOGIK_RULE_PL_PL", "TYPOS")]
    monkeypatch.setattr(gc, "check", lambda text, base_url: matches)
    # 50 tokenów -> nad progiem MIN_TOKENS (40); znana liczba dla normalizacji
    text = " ".join(["wyraz"] * 50)
    res = gc.score_doc(text, base_url="http://stub")
    assert res["n_tokens"] == 50
    assert res["too_short"] is False
    assert res["counts"] == {"morphosyntax": 2, "spelling": 1, "style": 0, "other": 0}
    assert res["n_matches"] == 3
    # errors_per_100tok = 100 * count / n_tokens
    assert res["errors_per_100tok"]["morphosyntax"] == pytest.approx(100.0 * 2 / 50)
    assert res["errors_per_100tok"]["spelling"] == pytest.approx(100.0 * 1 / 50)
    assert res["errors_per_100tok"]["style"] == pytest.approx(0.0)


def test_score_docs_aggregation_math_unit(monkeypatch):
    # doc A: 70 tok, 1x morphosyntax; doc B: 30 tok (< MIN_TOKENS) -> too_short, dropowany
    long_matches = [_match("PREP_CASUS", "SYNTAX")]
    long_text = " ".join(["w"] * 70)
    short_text = " ".join(["w"] * 30)

    def fake_check(text, base_url):
        return long_matches if text == long_text else []

    monkeypatch.setattr(gc, "check", fake_check)
    agg = gc.score_docs([long_text, short_text], base_url="http://stub")
    assert agg["n_docs"] == 2
    assert agg["n_too_short"] == 1          # krótki dropowany
    assert agg["n_scored"] == 1
    assert agg["total_tokens"] == 70        # tylko z policzonego doc
    assert agg["total_counts"]["morphosyntax"] == 1
    # mean po policzonych = errors_per_100tok policzonego doca = 100*1/70
    assert agg["mean_errors_per_100tok"]["morphosyntax"] == pytest.approx(100.0 / 70)
    assert agg["mean_errors_per_100tok"]["spelling"] == pytest.approx(0.0)


def test_score_docs_mean_across_two_scored_unit(monkeypatch):
    # dwa doc-i nad progiem, różne gęstości -> mean to średnia ich per100tok
    t1 = "a " + " ".join(["w"] * 49)   # 50 tok, 1x morpho -> 2.0/100tok
    t2 = " ".join(["w"] * 50)          # 50 tok, 0 błędów -> 0.0/100tok

    def fake_check(text, base_url):
        return [_match("PREP_CASUS", "SYNTAX")] if text == t1 else []

    monkeypatch.setattr(gc, "check", fake_check)
    agg = gc.score_docs([t1, t2], base_url="http://stub")
    assert agg["n_scored"] == 2
    # (2.0 + 0.0) / 2 = 1.0
    assert agg["mean_errors_per_100tok"]["morphosyntax"] == pytest.approx(1.0)
