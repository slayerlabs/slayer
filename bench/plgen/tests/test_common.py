"""Smoke testy A0 dla bench/plgen/common.py — BEZ wywołań sieciowych.

Uruchom z katalogu repo:  uv run pytest bench/plgen/tests/ -q
"""
import os

from bench.plgen import common

HERE = os.path.dirname(__file__)
DEV = os.path.join(HERE, "..", "testdata", "dev_prompts.jsonl")


def test_import():
    # podstawowe symbole istnieją
    assert callable(common.http_json)
    assert callable(common.ask)
    assert callable(common.load_prompts)
    assert callable(common.count_tokens)


def test_models_four_triples():
    # base-vs-instruct zarzucone (brak źródła qwen3.5-27b base) -> 4 dostępne podmioty
    assert len(common.MODELS) == 4, "uruchamiamy 4 dostępne podmioty"
    assert "qwen35_base" not in common.MODELS, "qwen35_base usunięty (brak źródła)"
    for name, val in common.MODELS.items():
        assert isinstance(val, tuple) and len(val) == 3, f"{name}: oczekiwano 3-tuple"
        backend, tag, temp = val
        assert backend in ("ollama", "openrouter"), f"{name}: zły backend {backend}"
        assert isinstance(tag, str) and tag, f"{name}: pusty tag"
        assert isinstance(temp, (int, float)), f"{name}: temp musi być liczbą"


def test_load_prompts_dev_fixture():
    items = common.load_prompts(DEV)
    assert len(items) >= 10
    for it in items:
        for k in common.PROMPT_KEYS:
            assert k in it, f"{it.get('id')}: brak klucza {k}"
        assert isinstance(it["phenomena"], list)
        assert isinstance(it["len_target"], int)
    # pokrycie kilku domen
    domains = {it["domena"] for it in items}
    assert {"rekcja", "liczebniki", "kalki", "rejestr"} <= domains


def test_count_tokens():
    assert common.count_tokens("Idę z mamą do sklepu") == 5
    assert common.count_tokens("") == 0
    assert common.count_tokens("   ") == 0
    assert common.count_tokens("jeden,dwa  trzy") == 3


def test_strip_think():
    assert common.strip_think("<think>cogito</think>Witaj") == "Witaj"
    assert common.strip_think("bez tagów") == "bez tagów"


# ============================================================================
# gemini backend (DIAGNOSTYCZNY sędzia) — bez sieci, spy na http_json
# ============================================================================
def _spy_http_json(monkeypatch, reply="OK"):
    seen = {}

    def spy(url, body, headers, timeout=180, tries=3):
        seen["url"] = url
        seen["body"] = body
        seen["headers"] = headers
        return {"choices": [{"message": {"content": reply}}]}

    monkeypatch.setattr(common, "http_json", spy)
    return seen


def test_ask_gemini_builds_request(monkeypatch):
    # klucz z env -> nagłówek Bearer, endpoint OpenAI-compat, system w messages, temp 0
    monkeypatch.setenv("GEMINI_API_KEY", "env-key-123")
    seen = _spy_http_json(monkeypatch, reply="Warszawa")
    ans = common.ask("gemini", "gemini-3.1-pro-preview", 0.0,
                     "stolica?", num_predict=300, system="Jesteś sędzią.")
    assert ans == "Warszawa"
    assert seen["url"] == (
        "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions")
    assert seen["headers"]["Authorization"] == "Bearer env-key-123"
    b = seen["body"]
    assert b["model"] == "gemini-3.1-pro-preview"
    assert b["temperature"] == 0.0
    # model myślący: budżet podbity do >=2048 nawet gdy poproszono o 300
    assert b["max_tokens"] >= 2048
    # system= dociera jako pierwsza wiadomość (sędzia OCENIA, nie odpowiada)
    assert b["messages"][0] == {"role": "system", "content": "Jesteś sędzią."}
    assert b["messages"][1]["content"] == "stolica?"
    # NIE wysyłamy openrouterowego pola reasoning (inny dostawca)
    assert "reasoning" not in b


def test_ask_gemini_falls_back_to_keyfile(monkeypatch, tmp_path):
    # brak env -> klucz z ~/.gemini_key
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    keyfile = tmp_path / ".gemini_key"
    keyfile.write_text("file-key-xyz\n")
    monkeypatch.setattr(os.path, "expanduser",
                        lambda p: str(keyfile) if p == "~/.gemini_key" else p)
    seen = _spy_http_json(monkeypatch)
    common.ask("gemini", "gemini-3.1-pro-preview", 0.0, "q", system="S")
    assert seen["headers"]["Authorization"] == "Bearer file-key-xyz"


def test_gemini_not_in_default_panel():
    # Gemini to model ZAMKNIĘTY -> diagnostyka tylko, NIGDY w domyślnym panelu
    from bench.plgen import judge_panel as jp
    for name, backend, tag in jp.PANEL:
        assert backend != "gemini", f"Gemini nie może być w domyślnym PANEL: {name}"
        assert "gemini" not in (name + tag).lower()


def test_paths_are_relative_strings():
    # ścieżki to konwencja repo (slayer-data/ gitignored); tylko sanity
    assert common.DATA.endswith("prompts_v1.jsonl")
    assert common.GOLD.endswith("gold_v1.jsonl")
    assert common.RUNS.endswith("runs")
    assert common.OUT.endswith("plgen_v1.json")


def test_ask_system_reaches_request_body(monkeypatch):
    """REGRESJA (dwukrotna!): system= MUSI trafić do body W KAŻDYM backendzie.

    Testy panelu mockują common.ask, więc NIE łapią, gdy gałąź common.ask gubi
    system= — tak dwukrotnie regresował JUDGE_SYS dla openrouter (sędzia dostawał
    generyczny SYS i odpowiadał na zadanie / oceniał miękko). Tu wołamy REALNE
    ask() z zamockowanym http_json i sprawdzamy wiadomość systemową w body."""
    monkeypatch.setenv("OPENROUTER_API_KEY", "test")
    monkeypatch.setenv("GEMINI_API_KEY", "test")
    cap = {}

    def fake_http_json(url, body, headers, timeout=180, tries=3):
        cap["body"] = body
        if "/api/chat" in url:            # ollama
            return {"message": {"content": "ok"}}
        return {"choices": [{"message": {"content": "ok"}}]}  # openai-compat

    monkeypatch.setattr(common, "http_json", fake_http_json)

    SENT = "SYSTEM-SENTINEL-123"
    for backend, tag in [("ollama", "m"), ("openrouter", "m"),
                         ("gemini", "gemini-3.1-pro-preview")]:
        cap.clear()
        common.ask(backend, tag, 0.0, "hej", system=SENT)
        msgs = cap["body"]["messages"]
        assert msgs[0]["role"] == "system"
        assert msgs[0]["content"] == SENT, f"{backend}: system= nie dotarł do body"

    # system=None -> generyczny SYS (ścieżka generacji), nie puste
    cap.clear()
    common.ask("openrouter", "m", 0.0, "hej")
    assert cap["body"]["messages"][0]["content"] == common.SYS
