import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const BLOB_PATH = "slayer/sota-comments.json";
const LOCAL_PATH = path.join(process.cwd(), ".data", "sota-comments.json");
const MAX_COMMENTS = 500;
const TYPES = new Set(["faza-0", "benchmark", "dane", "trening", "rlvr", "produkt", "ryzyko", "inne"]);

function cleanText(value, max) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanBody(value) {
  return String(value || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, 2200);
}

async function readLocal() {
  try {
    const raw = await fs.readFile(LOCAL_PATH, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data.comments) ? data.comments : [];
  } catch {
    return [];
  }
}

async function writeLocal(comments) {
  await fs.mkdir(path.dirname(LOCAL_PATH), { recursive: true });
  await fs.writeFile(LOCAL_PATH, JSON.stringify({ comments }, null, 2), "utf8");
}

async function readBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  const found = await list({ prefix: BLOB_PATH, limit: 1 });
  const blob = found.blobs.find((item) => item.pathname === BLOB_PATH);
  if (!blob) return [];
  const res = await fetch(`${blob.url}?t=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.comments) ? data.comments : [];
}

async function writeBlob(comments) {
  await put(BLOB_PATH, JSON.stringify({ comments }, null, 2), {
    access: "public",
    contentType: "application/json",
    allowOverwrite: true,
  });
}

async function readComments() {
  const blobComments = await readBlob();
  if (blobComments) return blobComments;
  return readLocal();
}

async function writeComments(comments) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return writeBlob(comments);
  return writeLocal(comments);
}

export async function GET() {
  const comments = await readComments();
  return NextResponse.json({ comments: comments.slice(0, MAX_COMMENTS) });
}

export async function POST(req) {
  const input = await req.json().catch(() => ({}));
  if (input.website) {
    return NextResponse.json({ ok: true });
  }

  const author = cleanText(input.author, 80) || "anon";
  const typeInput = cleanText(input.type, 40);
  const type = TYPES.has(typeInput) ? typeInput : "inne";
  const body = cleanBody(input.body);

  if (body.length < 8) {
    return NextResponse.json({ error: "Komentarz jest za krótki." }, { status: 400 });
  }

  const comment = {
    id: crypto.randomUUID(),
    author,
    type,
    body,
    createdAt: new Date().toISOString(),
  };

  const comments = [comment, ...(await readComments())].slice(0, MAX_COMMENTS);
  await writeComments(comments);

  return NextResponse.json({ comment });
}
