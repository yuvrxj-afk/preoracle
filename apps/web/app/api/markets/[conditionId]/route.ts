import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const WORKER_API_URL = process.env.WORKER_API_URL ?? "http://localhost:4000";

type RouteParams = {
  params: Promise<{ conditionId: string }>;
};

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { conditionId } = await params;

  if (!conditionId) {
    return NextResponse.json(
      { error: "Missing conditionId in path" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(
      `${WORKER_API_URL}/markets/${encodeURIComponent(conditionId)}`,
      { next: { revalidate: 0 } }
    );
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.error ?? "Backend error" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Error proxying to worker:", err);
    return NextResponse.json(
      { error: "Failed to reach backend" },
      { status: 502 }
    );
  }
}
