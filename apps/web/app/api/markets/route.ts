import { NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${WORKER_URL}/markets`);
  if (!res.ok) return NextResponse.json([], { status: res.status });
  const data = await res.json();
  return NextResponse.json(data);
}
