# docker-traefik-manager

Self-hosted reverse-proxy stack: Traefik for routing and TLS, plus a small
Next.js admin app that serves Traefik's dynamic configuration over its
[HTTP provider](https://doc.traefik.io/traefik/providers/http/).

Manage domains, hosts, upstream endpoints, and middlewares from a
mobile-friendly UI built with shadcn/ui — no hand-edited YAML.

## Features

- **Domains** with per-domain wildcard certs (DNS-01 via the resolver of
  your choice; Technitium / RFC2136 ships configured).
- **Hosts** (subdomains) routed to one or more upstream **endpoints**.
- **Primary + failover** upstreams using Traefik's `failover` service
  kind with health checks.
- **Curated middleware forms** for IP allow-list, basic auth, rate
  limit, custom headers, strip prefix, redirect regex, and compression.
- HTTPS-only with automatic HTTP → HTTPS redirect.
- NextAuth credentials login.

## Quick start

1. Copy `.env.example` to `.env` and fill it in.
2. Make sure `MANAGER_HOST` resolves to the Traefik host's public IP
   (e.g. via your DNS — Technitium works) and that the DNS challenge
   credentials match.
3. `docker compose up -d --build`
4. Visit `https://${MANAGER_HOST}` and sign in with `ADMIN_EMAIL` /
   `ADMIN_PASSWORD`.

The app container runs `prisma migrate deploy` and seeds the admin user
on every start; both operations are idempotent.

## Adding another DNS provider

Cert resolvers must live in Traefik's static config, which is a
single-restart change:

1. Add a new `TRAEFIK_CERTIFICATESRESOLVERS_<NAME>_ACME_...` env block
   in `docker-compose.yml` plus any provider-specific credentials
   (`CF_DNS_API_TOKEN`, etc.).
2. Append `<NAME>` to `TRAEFIK_CERT_RESOLVERS` in `.env`.
3. `docker compose up -d` — Traefik restarts; the Domain form now lists
   the new resolver.

## Development

```bash
cd app
pnpm install
docker compose up -d db
DATABASE_URL=postgresql://traefik:change-me-postgres@localhost:5432/traefik_manager \
  pnpm exec prisma migrate dev
pnpm dev
```

App at `http://localhost:3000`. Traefik is not required for the UI to
run; you can poke `GET /api/traefik/config` with the bearer token to see
what would be emitted.

## Verifying the HTTP provider output

```bash
TOKEN=$(grep TRAEFIK_PROVIDER_TOKEN .env | cut -d= -f2)
docker compose exec traefik wget -qO- \
  --header "Authorization: Bearer $TOKEN" \
  http://app:3000/api/traefik/config | jq .
```

## Architecture

```
┌─────────┐   :80/:443    ┌────────┐
│ browser │ ────────────▶ │traefik │
└─────────┘               └────┬───┘
                  HTTP provider │ poll
                               ▼
                       ┌──────────────┐    ┌──────────┐
                       │   Next app   │───▶│ postgres │
                       │  (shadcn UI) │    └──────────┘
                       └──────────────┘
```

Out of scope for v1: TCP/UDP routers, raw-JSON middleware editor,
multi-tenant, audit log.
