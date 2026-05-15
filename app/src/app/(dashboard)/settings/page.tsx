import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { env } from "@/lib/env";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Read-only view of environment-driven configuration.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificate resolvers</CardTitle>
          <CardDescription>
            Edit <code>TRAEFIK_CERT_RESOLVERS</code> and{" "}
            <code>traefik/traefik.yml</code> together, then restart Traefik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 text-sm">
            {env.certResolvers().map((r) => (
              <li key={r}>
                <code>{r}</code>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traefik provider endpoint</CardTitle>
          <CardDescription>
            Traefik must send the shared token in the{" "}
            <code>Authorization</code> header.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded-md bg-muted p-4 text-xs">
            {`# traefik.yml
providers:
  http:
    endpoint: http://app:3000/api/traefik/config
    pollInterval: 10s
    headers:
      Authorization: "Bearer \${TRAEFIK_PROVIDER_TOKEN}"`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
