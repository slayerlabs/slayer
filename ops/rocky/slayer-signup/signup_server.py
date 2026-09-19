#!/usr/bin/env python3
"""Slayer signup API with publication evidence and data minimisation."""

import hashlib
import html
import json
import os
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

STORE = "/root/slayer-signups/signups.json"
ORIGIN = "https://slayer.fabryka.ai"
MAXLEN = {"name": 60, "contact": 120, "about": 400}
TERMS_VERSION = "1.0.0"
PRIVACY_VERSION = "1.2.0"
COOLDOWN = 20
CONTACT_RETENTION_SECONDS = 365 * 86400
PUBLIC_REVIEW_SECONDS = 730 * 86400
last_ip = {}

os.makedirs(os.path.dirname(STORE), exist_ok=True)
if not os.path.exists(STORE):
    with open(STORE, "w", encoding="utf8") as handle:
        json.dump([], handle)


def load():
    try:
        with open(STORE, encoding="utf8") as handle:
            return json.load(handle)
    except Exception:
        return []


def save(records):
    directory = os.path.dirname(STORE)
    fd, temporary = tempfile.mkstemp(dir=directory, prefix="signups-", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf8") as handle:
            json.dump(records, handle, ensure_ascii=False, indent=2)
        os.replace(temporary, STORE)
        os.chmod(STORE, 0o600)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def clean(value, maximum):
    return html.escape(str(value or "").strip())[:maximum]


def minimise(records):
    now = int(time.time())
    changed = False
    for record in records:
        if "ip" in record:
            record.pop("ip", None)
            changed = True
        if now - int(record.get("ts", now)) > CONTACT_RETENTION_SECONDS and record.get("contact"):
            record["contactHash"] = hashlib.sha256(record["contact"].encode()).hexdigest()
            record.pop("contact", None)
            changed = True
    if changed:
        save(records)
    return records


def public_people(records):
    now = int(time.time())
    return [
        {
            "name": record["name"],
            "roles": record.get("roles", []),
            "about": record.get("about", ""),
            "date": record.get("date", ""),
        }
        for record in records
        if now - int(record.get("ts", now)) <= PUBLIC_REVIEW_SECONDS
    ]


class Handler(BaseHTTPRequestHandler):
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def respond(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.cors()
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *_):
        pass

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] != "/signups":
            return self.respond(404, {"error": "not found"})
        people = public_people(minimise(load()))
        return self.respond(200, {"count": len(people), "people": people})

    def do_POST(self):
        if self.path.split("?")[0] != "/signups":
            return self.respond(404, {"error": "not found"})
        ip = self.headers.get("X-Forwarded-For", self.client_address[0]).split(",")[0].strip()
        now = time.time()
        if now - last_ip.get(ip, 0) < COOLDOWN:
            return self.respond(429, {"error": "zwolnij — spróbuj za chwilę"})
        try:
            length = int(self.headers.get("Content-Length", 0))
            if length > 4000:
                return self.respond(413, {"error": "za duże"})
            data = json.loads(self.rfile.read(length) or b"{}")
        except Exception:
            return self.respond(400, {"error": "zły JSON"})
        if clean(data.get("website"), 10):
            return self.respond(200, {"ok": True})
        if (
            data.get("publicationAccepted") is not True
            or data.get("termsVersion") != TERMS_VERSION
            or data.get("privacyVersion") != PRIVACY_VERSION
        ):
            return self.respond(400, {"error": "potwierdź zasady publikacji i prywatności"})

        name = clean(data.get("name"), MAXLEN["name"])
        contact = clean(data.get("contact"), MAXLEN["contact"])
        about = clean(data.get("about"), MAXLEN["about"])
        roles = [clean(role, 30) for role in (data.get("roles") or [])][:8]
        if not name or not contact:
            return self.respond(400, {"error": "podaj imię i kontakt"})
        records = minimise(load())
        if len(records) >= 2000:
            return self.respond(507, {"error": "limit"})
        accepted_at = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))
        records.append(
            {
                "name": name,
                "roles": roles,
                "about": about,
                "contact": contact,
                "date": time.strftime("%Y-%m-%d"),
                "ts": int(now),
                "publicationAcceptedAt": accepted_at,
                "termsVersion": TERMS_VERSION,
                "privacyVersion": PRIVACY_VERSION,
            }
        )
        save(records)
        last_ip[ip] = now
        return self.respond(201, {"ok": True, "count": len(records)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8090"))
    print(f"signup server on :{port}, store={STORE}", flush=True)
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
