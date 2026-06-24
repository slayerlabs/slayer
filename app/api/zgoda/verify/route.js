import { NextResponse } from "next/server";
import { readRecords, writeRecords } from "../route";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = req.nextUrl.searchParams.get("token") || "";
  const records = await readRecords();
  const record = records.find((r) => r.token === token);

  if (!token || !record) {
    return NextResponse.redirect(new URL("/zgoda?status=invalid", req.nextUrl.origin));
  }

  if (record.status !== "confirmed") {
    record.status = "confirmed";
    record.confirmedAt = new Date().toISOString();
    await writeRecords(records);
  }

  return NextResponse.redirect(new URL("/zgoda?status=confirmed", req.nextUrl.origin));
}
