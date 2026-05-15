function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  databaseUrl: () => required("DATABASE_URL"),
  authSecret: () => required("AUTH_SECRET"),
  traefikProviderToken: () => required("TRAEFIK_PROVIDER_TOKEN"),
  certResolvers: () =>
    optional("TRAEFIK_CERT_RESOLVERS", "technitium")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
};
