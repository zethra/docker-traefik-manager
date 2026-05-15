import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EntitySheet } from "@/components/entity-sheet";
import { HostForm } from "@/components/forms/host-form";

export const dynamic = "force-dynamic";

export default async function HostsPage() {
  const [hosts, domains] = await Promise.all([
    db.host.findMany({
      orderBy: [{ domain: { name: "asc" } }, { subdomain: "asc" }],
      include: {
        domain: true,
        _count: { select: { endpoints: true, middlewares: true } },
      },
    }),
    db.domain.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Hosts</h1>
          <p className="text-sm text-muted-foreground">
            Subdomains routed through Traefik. Open a host to configure
            endpoints and middlewares.
          </p>
        </div>
        {domains.length > 0 && (
          <EntitySheet
            title="New host"
            description="Subdomain attached to one of your domains."
            trigger={
              <Button>
                <Plus className="size-4" /> New host
              </Button>
            }
          >
            {(close) => <HostForm domains={domains} onSuccess={close} />}
          </EntitySheet>
        )}
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Add a domain first</CardTitle>
            <CardDescription>
              Hosts must be attached to a domain. Create one on the{" "}
              <Link href="/domains" className="underline">
                Domains
              </Link>{" "}
              page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : hosts.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No hosts yet</CardTitle>
            <CardDescription>
              Create your first host to start routing traffic.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>FQDN</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Endpoints</TableHead>
                  <TableHead className="hidden md:table-cell">Middlewares</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {hosts.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/hosts/${h.id}`}
                        className="hover:underline underline-offset-2"
                      >
                        {h.fqdn}
                      </Link>
                      <div className="sm:hidden text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        {h.enabled ? (
                          <Badge variant="secondary">enabled</Badge>
                        ) : (
                          <Badge variant="outline">disabled</Badge>
                        )}
                        <span>
                          {h._count.endpoints} endpoint
                          {h._count.endpoints === 1 ? "" : "s"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {h.enabled ? (
                        <Badge variant="secondary">enabled</Badge>
                      ) : (
                        <Badge variant="outline">disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {h._count.endpoints}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {h._count.middlewares}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/hosts/${h.id}`}>
                          <ChevronRight className="size-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
