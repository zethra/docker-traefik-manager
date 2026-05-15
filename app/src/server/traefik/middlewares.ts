import {
  basicAuthConfig,
  compressConfig,
  headersConfig,
  ipWhitelistConfig,
  middlewareConfigByType,
  rateLimitConfig,
  redirectRegexConfig,
  stripPrefixConfig,
  type MiddlewareType,
} from "@/lib/zod-schemas";
import type { TraefikMiddleware } from "./types";

export function emitMiddleware(
  type: MiddlewareType,
  rawConfig: unknown,
): TraefikMiddleware {
  switch (type) {
    case "IP_WHITELIST": {
      const c = ipWhitelistConfig.parse(rawConfig);
      return { ipAllowList: { sourceRange: c.sourceRange } };
    }
    case "BASIC_AUTH": {
      const c = basicAuthConfig.parse(rawConfig);
      return { basicAuth: { users: c.users } };
    }
    case "RATE_LIMIT": {
      const c = rateLimitConfig.parse(rawConfig);
      return {
        rateLimit: {
          average: c.average,
          period: c.period,
          ...(c.burst !== undefined && { burst: c.burst }),
        },
      };
    }
    case "HEADERS": {
      const c = headersConfig.parse(rawConfig);
      return {
        headers: {
          ...(c.customRequestHeaders && {
            customRequestHeaders: c.customRequestHeaders,
          }),
          ...(c.customResponseHeaders && {
            customResponseHeaders: c.customResponseHeaders,
          }),
        },
      };
    }
    case "STRIP_PREFIX": {
      const c = stripPrefixConfig.parse(rawConfig);
      return { stripPrefix: { prefixes: c.prefixes } };
    }
    case "REDIRECT_REGEX": {
      const c = redirectRegexConfig.parse(rawConfig);
      return {
        redirectRegex: {
          regex: c.regex,
          replacement: c.replacement,
          permanent: c.permanent,
        },
      };
    }
    case "COMPRESS": {
      compressConfig.parse(rawConfig);
      return { compress: {} };
    }
  }
}

export function validateMiddlewareConfig(
  type: MiddlewareType,
  rawConfig: unknown,
) {
  return middlewareConfigByType[type].parse(rawConfig);
}
