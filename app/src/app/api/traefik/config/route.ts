import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { db } from "@/lib/db";
import { loadDynamicConfig } from "@/server/traefik/load";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CacheEntry = { version: number; body: string; lastPolledAt: Date };
let cache: CacheEntry | null = null;

function constantTimeEquals(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function GET(request: Request) {
  const expected = `Bearer ${env.traefikProviderToken()}`;
  const provided = request.headers.get("authorization") ?? "";

  if (!constantTimeEquals(expected, provided)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const row = await db.configVersion.findUnique({ where: { id: 1 } });
  const currentVersion = row?.version ?? 0;

  if (cache && cache.version === currentVersion) {
    cache.lastPolledAt = new Date();
    return new NextResponse(cache.body, {
      headers: { "content-type": "application/json" },
    });
  }

  const config = await loadDynamicConfig();
  const body = JSON.stringify(config);
  cache = { version: currentVersion, body, lastPolledAt: new Date() };

  // Best-effort: record the latest poll on a singleton row so the UI can
  // surface "Traefik last polled" without per-request DB writes.
  await db.configVersion
    .upsert({
      where: { id: 1 },
      create: { id: 1, version: currentVersion },
      update: {},
    })
    .catch(() => undefined);

  return new NextResponse(body, {
    headers: { "content-type": "application/json" },
  });
}

export function getCacheStatus() {
  return cache;
}
