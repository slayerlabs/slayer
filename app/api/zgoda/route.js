import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const BLOB_PATH = "slayer/zgody.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "zgody.json");
const CONSENT_VERSION = "wizerunek-rodo-v1";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

async function readLocal() {
  try {
    const data = JSON.parse(await fs.readFile(LOCAL_PATH, "utf8"));
    return Array.isArray(data.records) ? data.records : [];
  } catch {
    return [];
  }
}

async function writeLocal(records) {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify({ records }, null, 2), "utf8");
}

async function readBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const found = await list({ prefix: BLOB_PATH, limit: 1 });
  const blob = found.blobs.find((item) => item.pathname === BLOB_PATH);
  if (!blob) return [];
  const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.records) ? data.records : [];
}

async function writeBlob(records) {
  await put(BLOB_PATH, JSON.stringify({ records }, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

export async function readRecords() {
  const blob = await readBlob();
  if (blob) return blob;
  return readLocal();
}

export async function writeRecords(records) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return writeBlob(records);
  return writeLocal(records);
}

async function sendVerification(to, name, link) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false; // ponytail: bez klucza zapisujemy 'pending', mail dośle się gdy domena gotowa
  const from = process.env.RESEND_FROM || "Slayer Labs <zgoda@fabryka.ai>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({
      from,
      to,
      subject: "Potwierdź zgodę — Slayer Labs",
      html: `<p>Cześć${name ? " " + name : ""},</p>
<p>Aby potwierdzić zgodę na publikację Twojego wizerunku i danych osobowych w sekcji „Zespół" na stronie Slayer Labs, kliknij poniższy link:</p>
<p><a href="${link}">Potwierdzam zgodę</a></p>
<p>Jeśli to nie Ty wypełniłeś/aś formularz, zignoruj tę wiadomość — nic nie zostanie opublikowane.</p>`,
    }),
  });
  return res.ok;
}

export async function POST(req) {
  const input = await req.json().catch(() => ({}));
  if (input.website) return NextResponse.json({ ok: true }); // honeypot

  const name = clean(input.name, 120);
  const email = clean(input.email, 200).toLowerCase();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Podaj poprawny adres e-mail." }, { status: 400 });
  }
  if (!input.consent) {
    return NextResponse.json({ error: "Zaznacz zgodę, aby kontynuować." }, { status: 400 });
  }

  const records = await readRecords();
  const existing = records.find((r) => r.email === email);
  if (existing && existing.status === "confirmed") {
    return NextResponse.json({ status: "confirmed" });
  }

  const token = crypto.randomBytes(24).toString("hex");
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "";
  const record = {
    id: existing?.id || crypto.randomUUID(),
    name,
    email,
    status: "pending",
    token,
    consentVersion: CONSENT_VERSION,
    createdAt: existing?.createdAt || new Date().toISOString(),
    confirmedAt: null,
    ip,
    userAgent: clean(req.headers.get("user-agent"), 300),
  };

  const next = [record, ...records.filter((r) => r.email !== email)];
  await writeRecords(next);

  const link = `${req.nextUrl.origin}/api/zgoda/verify?token=${token}`;
  const sent = await sendVerification(email, name, link);

  return NextResponse.json({ status: "pending", emailSent: sent });
}
