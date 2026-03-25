import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:3001";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ conditionId: string }> }
) {
  const { conditionId } = await params;
  const res = await fetch(`${WORKER_URL}/markets/${conditionId}/verdict`);
  if (!res.ok) {
    return NextResponse.json({ error: "Not found" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ conditionId: string }> }
) {
  const { conditionId } = await params;
  const res = await fetch(`${WORKER_URL}/markets/${conditionId}/verdict`, { method: "POST" });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to generate verdict" }, { status: res.status });
  }
  const data = await res.json();
  return NextResponse.json(data);
}
