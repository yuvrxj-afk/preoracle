import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:4000";

export async function GET(req: NextRequest) {
  const limit = req.nextUrl.searchParams.get("limit") ?? "50";
  const res = await fetch(`${WORKER_URL}/signals?limit=${limit}`);
  if (!res.ok) return NextResponse.json([], { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
