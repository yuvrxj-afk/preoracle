import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:4000";

export async function GET() {
  const res = await fetch(`${WORKER_URL}/settings`);
  if (!res.ok) return NextResponse.json({}, { status: res.status });
  return NextResponse.json(await res.json());
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${WORKER_URL}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
