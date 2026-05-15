import { db } from "@/lib/db";
import { buildDynamicConfig } from "./builder";
import type { MiddlewareType } from "@/lib/zod-schemas";

export async function loadDynamicConfig() {
  const [hosts, middlewares] = await Promise.all([
    db.host.findMany({
      where: { enabled: true },
      include: {
        domain: true,
        endpoints: true,
        middlewares: { include: { middleware: true } },
      },
    }),
    db.middleware.findMany(),
  ]);

  return buildDynamicConfig({
    hosts: hosts.map((h) => ({
      id: h.id,
      fqdn: h.fqdn,
      enabled: h.enabled,
      endpoints: h.endpoints.map((e) => ({
        id: e.id,
        address: e.address,
        port: e.port,
        scheme: e.scheme,
        isPrimary: e.isPrimary,
        healthCheckPath: e.healthCheckPath,
      })),
      middlewares: h.middlewares.map((m) => ({
        order: m.order,
        middleware: {
          id: m.middleware.id,
          name: m.middleware.name,
          type: m.middleware.type as MiddlewareType,
          config: m.middleware.config,
        },
      })),
      domain: {
        name: h.domain.name,
        certResolver: h.domain.certResolver,
        wildcard: h.domain.wildcard,
      },
    })),
    middlewares: middlewares.map((m) => ({
      id: m.id,
      name: m.name,
      type: m.type as MiddlewareType,
      config: m.config,
    })),
  });
}

export async function bumpConfigVersion() {
  await db.configVersion.upsert({
    where: { id: 1 },
    create: { id: 1, version: 1 },
    update: { version: { increment: 1 } },
  });
}

export async function getConfigVersion(): Promise<number> {
  const row = await db.configVersion.findUnique({ where: { id: 1 } });
  return row?.version ?? 0;
}
