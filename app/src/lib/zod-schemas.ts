import { z } from "zod";

export const middlewareTypes = [
  "IP_WHITELIST",
  "BASIC_AUTH",
  "RATE_LIMIT",
  "HEADERS",
  "STRIP_PREFIX",
  "REDIRECT_REGEX",
  "COMPRESS",
] as const;
export type MiddlewareType = (typeof middlewareTypes)[number];

export const schemes = ["HTTP", "HTTPS"] as const;
export type Scheme = (typeof schemes)[number];

// ── Domain ────────────────────────────────────────────────
export const domainInput = z.object({
  name: z
    .string()
    .min(1)
    .regex(/^[a-z0-9.-]+\.[a-z]{2,}$/i, "Must be a valid domain name"),
  certResolver: z.string().min(1),
  wildcard: z.boolean().default(true),
});
export type DomainInput = z.infer<typeof domainInput>;

// ── Host ──────────────────────────────────────────────────
export const hostInput = z.object({
  subdomain: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+(?:\.[a-z0-9-]+)*$|^@$/i, "Invalid subdomain"),
  domainId: z.string().min(1),
  enabled: z.boolean().default(true),
});
export type HostInput = z.infer<typeof hostInput>;

// ── Endpoint ──────────────────────────────────────────────
export const endpointInput = z.object({
  hostId: z.string().min(1),
  address: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  scheme: z.enum(schemes),
  isPrimary: z.boolean().default(false),
  healthCheckPath: z.string().min(1).default("/"),
});
export type EndpointInput = z.infer<typeof endpointInput>;

// ── Middleware configs (per type) ─────────────────────────
export const ipWhitelistConfig = z.object({
  sourceRange: z
    .array(z.string().min(1))
    .min(1, "At least one IP or CIDR is required"),
});

export const basicAuthConfig = z.object({
  users: z
    .array(z.string().min(3))
    .min(1, "At least one user line is required"),
});

export const rateLimitConfig = z.object({
  average: z.number().int().min(1),
  period: z.string().default("1s"),
  burst: z.number().int().min(1).optional(),
});

export const headersConfig = z.object({
  customRequestHeaders: z.record(z.string(), z.string()).optional(),
  customResponseHeaders: z.record(z.string(), z.string()).optional(),
});

export const stripPrefixConfig = z.object({
  prefixes: z.array(z.string().min(1)).min(1),
});

export const redirectRegexConfig = z.object({
  regex: z.string().min(1),
  replacement: z.string().min(1),
  permanent: z.boolean().default(true),
});

export const compressConfig = z.object({}).default({});

export const middlewareConfigByType = {
  IP_WHITELIST: ipWhitelistConfig,
  BASIC_AUTH: basicAuthConfig,
  RATE_LIMIT: rateLimitConfig,
  HEADERS: headersConfig,
  STRIP_PREFIX: stripPrefixConfig,
  REDIRECT_REGEX: redirectRegexConfig,
  COMPRESS: compressConfig,
} satisfies Record<MiddlewareType, z.ZodTypeAny>;

export const middlewareInput = z
  .object({
    name: z
      .string()
      .min(1)
      .regex(/^[a-z0-9_-]+$/i, "Letters, digits, dash and underscore only"),
    type: z.enum(middlewareTypes),
    config: z.unknown(),
  })
  .superRefine((val, ctx) => {
    const schema = middlewareConfigByType[val.type];
    const parsed = schema.safeParse(val.config);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        ctx.addIssue({ ...issue, path: ["config", ...(issue.path ?? [])] });
      }
    }
  });
export type MiddlewareInput = z.infer<typeof middlewareInput>;

// ── Host ↔ Middleware assignment ──────────────────────────
export const hostMiddlewareInput = z.object({
  hostId: z.string().min(1),
  middlewareIds: z.array(z.string().min(1)),
});

// ── Auth ──────────────────────────────────────────────────
export const loginInput = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
