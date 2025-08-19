import { NextRequest, NextResponse } from "next/server";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return forward(req, params);
}

async function forward(req: NextRequest, params: { path: string[] }) {
  const target = `${API.replace(/\/+$/,'')}/${params.path.join("/")}${req.nextUrl.search}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const init: RequestInit = {
      method: req.method,
      headers: { "content-type": req.headers.get("content-type") || "application/json" },
      body: ["GET","HEAD"].includes(req.method) ? undefined : await req.text(),
      signal: controller.signal,
      cache: "no-store",
    };
    const r = await fetch(target, init);
    const body = await r.text();
    return new NextResponse(body, { status: r.status, headers: { "content-type": r.headers.get("content-type") || "application/json" } });
  } catch (e: any) {
    return NextResponse.json({ error: "proxy_error", detail: String(e?.message || e) }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
