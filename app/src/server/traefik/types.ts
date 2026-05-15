export type TraefikServerEntry = { url: string };

export type LoadBalancerService = {
  loadBalancer: {
    servers: TraefikServerEntry[];
    healthCheck?: {
      path: string;
      interval?: string;
      timeout?: string;
    };
    passHostHeader?: boolean;
    serversTransport?: string;
  };
};

export type FailoverService = {
  failover: {
    service: string;
    fallback: string;
    healthCheck?: Record<string, never>;
  };
};

export type TraefikService = LoadBalancerService | FailoverService;

export type TraefikRouter = {
  rule: string;
  entryPoints: string[];
  service: string;
  middlewares?: string[];
  tls?: {
    certResolver?: string;
    domains?: Array<{ main: string; sans?: string[] }>;
  };
};

export type TraefikMiddleware =
  | { ipAllowList: { sourceRange: string[] } }
  | { basicAuth: { users: string[] } }
  | { rateLimit: { average: number; period?: string; burst?: number } }
  | {
      headers: {
        customRequestHeaders?: Record<string, string>;
        customResponseHeaders?: Record<string, string>;
      };
    }
  | { stripPrefix: { prefixes: string[] } }
  | {
      redirectRegex: { regex: string; replacement: string; permanent?: boolean };
    }
  | { compress: Record<string, never> }
  | {
      redirectScheme: { scheme: string; permanent?: boolean; port?: string };
    };

export type TraefikDynamicConfig = {
  http: {
    routers: Record<string, TraefikRouter>;
    services: Record<string, TraefikService>;
    middlewares: Record<string, TraefikMiddleware>;
  };
};

export type ServersTransport = {
  insecureSkipVerify?: boolean;
};
