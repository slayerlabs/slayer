import { NextResponse } from "next/server";
import { get, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import legalContent from "../../../legal/generated/legal-content.json";

export const dynamic = "force-dynamic";

const BLOB_PATH = "slayer/zgody.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "zgody.json");
const CONSENT_VERSION = legalContent.documents["/zgoda"].version;
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
  const token = process.env.CONSENT_BLOB_READ_WRITE_TOKEN;
  if (!token) return null;
  const result = await get(BLOB_PATH, {
    access: "private",
    token,
    useCache: false,
  });
  if (!result || !result.stream) return [];
  const data = await new Response(result.stream).json();
  return Array.isArray(data.records) ? data.records : [];
}

async function writeBlob(records) {
  const token = process.env.CONSENT_BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("Consent storage is not configured");
  await put(BLOB_PATH, JSON.stringify({ records }, null, 2), {
    access: "private",
    token,
    contentType: "application/json",
    allowOverwrite: true,
    cacheControlMaxAge: 60,
  });
}

export async function readRecords() {
  const blob = await readBlob();
  if (blob) return blob;
  return readLocal();
}

export async function writeRecords(records) {
  if (process.env.CONSENT_BLOB_READ_WRITE_TOKEN) return writeBlob(records);
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
  if (
    process.env.VERCEL &&
    (!process.env.RESEND_API_KEY || !process.env.CONSENT_BLOB_READ_WRITE_TOKEN)
  ) {
    return NextResponse.json(
      { error: "Formularz jest chwilowo niedostępny. Napisz na k.wikiel@gmail.com." },
      { status: 503 },
    );
  }

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
  const record = {
    id: existing?.id || crypto.randomUUID(),
    name,
    email,
    status: "pending",
    token,
    consentVersion: CONSENT_VERSION,
    createdAt: existing?.createdAt || new Date().toISOString(),
    confirmedAt: null,
  };

  const next = [record, ...records.filter((r) => r.email !== email)];
  await writeRecords(next);

  const link = `${req.nextUrl.origin}/api/zgoda/verify?token=${token}`;
  const sent = await sendVerification(email, name, link);

  return NextResponse.json({ status: "pending", emailSent: sent });
}
