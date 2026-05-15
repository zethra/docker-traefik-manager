import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Pencil, Plus } from "lucide-react";
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
import { ConfirmDelete } from "@/components/confirm-delete";
import { HostForm } from "@/components/forms/host-form";
import { EndpointForm } from "@/components/forms/endpoint-form";
import { HostMiddlewaresForm } from "@/components/forms/host-middlewares-form";
import { deleteHost } from "@/server/actions/hosts";
import { deleteEndpoint } from "@/server/actions/endpoints";

export const dynamic = "force-dynamic";

export default async function HostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [host, domains, middlewares] = await Promise.all([
    db.host.findUnique({
      where: { id },
      include: {
        domain: true,
        endpoints: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        middlewares: {
          orderBy: { order: "asc" },
          include: { middleware: true },
        },
      },
    }),
    db.domain.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    db.middleware.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!host) notFound();

  const selectedMiddlewareIds = host.middlewares.map((m) => m.middlewareId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/hosts">
            <ChevronLeft className="size-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{host.fqdn}</h1>
          <p className="text-sm text-muted-foreground">
            {host.enabled ? "Enabled" : "Disabled"} • cert resolver{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {host.domain.certResolver}
            </code>
          </p>
        </div>
        <EntitySheet
          title="Edit host"
          trigger={
            <Button variant="outline">
              <Pencil className="size-4" /> Edit
            </Button>
          }
        >
          {(close) => (
            <HostForm
              domains={domains}
              host={{
                id: host.id,
                subdomain: host.subdomain,
                domainId: host.domainId,
                enabled: host.enabled,
              }}
              onSuccess={close}
            />
          )}
        </EntitySheet>
        <ConfirmDelete
          title={`Delete ${host.fqdn}?`}
          description="Endpoints and middleware bindings will be removed too."
          onConfirm={async () => {
            "use server";
            return await deleteHost(host.id);
          }}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Endpoints</CardTitle>
            <CardDescription>
              The first primary takes traffic; others act as failover.
            </CardDescription>
          </div>
          <EntitySheet
            title="Add endpoint"
            trigger={
              <Button>
                <Plus className="size-4" /> Add
              </Button>
            }
          >
            {(close) => <EndpointForm hostId={host.id} onSuccess={close} />}
          </EntitySheet>
        </CardHeader>
        <CardContent className="p-0">
          {host.endpoints.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              No endpoints yet. Add one to start serving this host.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead className="hidden sm:table-cell">Scheme</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Health check
                  </TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {host.endpoints.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-mono text-xs">
                      {e.address}:{e.port}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{e.scheme}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">
                      {e.healthCheckPath}
                    </TableCell>
                    <TableCell>
                      {e.isPrimary ? (
                        <Badge variant="default">primary</Badge>
                      ) : (
                        <Badge variant="secondary">failover</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EntitySheet
                          title="Edit endpoint"
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <EndpointForm
                              hostId={host.id}
                              endpoint={{
                                id: e.id,
                                address: e.address,
                                port: e.port,
                                scheme: e.scheme,
                                isPrimary: e.isPrimary,
                                healthCheckPath: e.healthCheckPath,
                              }}
                              onSuccess={close}
                            />
                          )}
                        </EntitySheet>
                        <ConfirmDelete
                          title="Remove endpoint?"
                          description={`Stop sending traffic to ${e.address}:${e.port}.`}
                          onConfirm={async () => {
                            "use server";
                            return await deleteEndpoint(e.id);
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Middlewares</CardTitle>
          <CardDescription>
            Pick which middlewares run on this host and in what order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {middlewares.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No middlewares defined. Create some on the{" "}
              <Link href="/middlewares" className="underline">
                Middlewares
              </Link>{" "}
              page first.
            </p>
          ) : (
            <HostMiddlewaresForm
              hostId={host.id}
              allMiddlewares={middlewares.map((m) => ({
                id: m.id,
                name: m.name,
                type: m.type,
              }))}
              selectedIds={selectedMiddlewareIds}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
