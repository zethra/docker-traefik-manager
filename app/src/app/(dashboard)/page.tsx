import { Globe, Server, Shield } from "lucide-react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const [domains, hosts, hostsEnabled, middlewares, configVersion] =
    await Promise.all([
      db.domain.count(),
      db.host.count(),
      db.host.count({ where: { enabled: true } }),
      db.middleware.count(),
      db.configVersion.findUnique({ where: { id: 1 } }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Routing summary and Traefik provider status.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Domains"
          value={domains}
          icon={<Globe className="size-5" />}
        />
        <Stat
          label="Hosts"
          value={`${hostsEnabled} / ${hosts} enabled`}
          icon={<Server className="size-5" />}
        />
        <Stat
          label="Middlewares"
          value={middlewares}
          icon={<Shield className="size-5" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Traefik HTTP provider</CardTitle>
          <CardDescription>
            Traefik is configured to poll this app for dynamic routing config.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row label="Config version">
            <Badge variant="secondary">v{configVersion?.version ?? 0}</Badge>
          </Row>
          <Row label="Last bumped">
            <span className="text-muted-foreground">
              {configVersion?.updatedAt
                ? new Date(configVersion.updatedAt).toLocaleString()
                : "never"}
            </span>
          </Row>
          <Row label="Available cert resolvers">
            <div className="flex flex-wrap gap-1.5">
              {env.certResolvers().map((r) => (
                <Badge key={r} variant="outline">
                  {r}
                </Badge>
              ))}
            </div>
          </Row>
          <Row label="Provider endpoint">
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              GET /api/traefik/config
            </code>
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span>{children}</span>
    </div>
  );
}
