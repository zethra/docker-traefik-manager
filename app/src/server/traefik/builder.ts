import type {
  TraefikDynamicConfig,
  TraefikRouter,
  TraefikService,
} from "./types";
import { emitMiddleware } from "./middlewares";
import type { MiddlewareType } from "@/lib/zod-schemas";

type Endpoint = {
  id: string;
  address: string;
  port: number;
  scheme: "HTTP" | "HTTPS";
  isPrimary: boolean;
  healthCheckPath: string;
};

type Middleware = {
  id: string;
  name: string;
  type: MiddlewareType;
  config: unknown;
};

type Host = {
  id: string;
  fqdn: string;
  enabled: boolean;
  endpoints: Endpoint[];
  middlewares: { middleware: Middleware; order: number }[];
  domain: { name: string; certResolver: string; wildcard: boolean };
};

type Input = {
  hosts: Host[];
  middlewares: Middleware[];
};

const REDIRECT_MIDDLEWARE = "tm-redirect-to-https";
const REDIRECT_ROUTER = "tm-http-to-https";

export function buildDynamicConfig(input: Input): TraefikDynamicConfig {
  const routers: Record<string, TraefikRouter> = {};
  const services: Record<string, TraefikService> = {};
  const middlewares: Record<string, ReturnType<typeof emitMiddleware>> = {};

  // Global HTTP → HTTPS redirect
  middlewares[REDIRECT_MIDDLEWARE] = {
    redirectScheme: { scheme: "https", permanent: true },
  };
  routers[REDIRECT_ROUTER] = {
    rule: "HostRegexp(`{any:.+}`)",
    entryPoints: ["web"],
    middlewares: [REDIRECT_MIDDLEWARE],
    service: "noop@internal",
  };

  // Emit all standalone middlewares (only those that end up attached are
  // strictly required, but emitting every defined middleware lets users
  // reuse names and keeps Traefik's view of the world in sync)
  for (const m of input.middlewares) {
    middlewares[m.name] = emitMiddleware(m.type, m.config);
  }

  for (const host of input.hosts) {
    if (!host.enabled) continue;
    if (host.endpoints.length === 0) continue;

    const serviceName = `${host.id}-svc`;
    const routerName = `${host.id}-router`;

    const primaries = host.endpoints.filter((e) => e.isPrimary);
    const secondaries = host.endpoints.filter((e) => !e.isPrimary);
    const primaryList = primaries.length > 0 ? primaries : host.endpoints;
    const fallbackList = primaries.length > 0 ? secondaries : [];

    if (fallbackList.length === 0) {
      services[serviceName] = loadBalancer(primaryList);
    } else {
      const primarySvc = `${host.id}-primary`;
      const fallbackSvc = `${host.id}-fallback`;
      services[primarySvc] = loadBalancer(primaryList);
      services[fallbackSvc] = loadBalancer(fallbackList);
      services[serviceName] = {
        failover: {
          service: primarySvc,
          fallback: fallbackSvc,
          healthCheck: {},
        },
      };
    }

    const attached = [...host.middlewares]
      .sort((a, b) => a.order - b.order)
      .map((m) => m.middleware.name);

    routers[routerName] = {
      rule: `Host(\`${host.fqdn}\`)`,
      entryPoints: ["websecure"],
      service: serviceName,
      ...(attached.length > 0 && { middlewares: attached }),
      tls: {
        certResolver: host.domain.certResolver,
        domains: host.domain.wildcard
          ? [{ main: host.domain.name, sans: [`*.${host.domain.name}`] }]
          : [{ main: host.fqdn }],
      },
    };
  }

  return { http: { routers, services, middlewares } };
}

function loadBalancer(endpoints: Endpoint[]): TraefikService {
  const first = endpoints[0];
  return {
    loadBalancer: {
      servers: endpoints.map((e) => ({
        url: `${e.scheme.toLowerCase()}://${e.address}:${e.port}`,
      })),
      healthCheck: {
        path: first?.healthCheckPath ?? "/",
        interval: "10s",
        timeout: "3s",
      },
      passHostHeader: true,
    },
  };
}
