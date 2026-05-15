import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
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
import { DomainForm } from "@/components/forms/domain-form";
import { deleteDomain } from "@/server/actions/domains";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const domains = await db.domain.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { hosts: true } } },
  });
  const resolvers = env.certResolvers();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Domains</h1>
          <p className="text-sm text-muted-foreground">
            Apex domains. Wildcard cert support enabled per domain.
          </p>
        </div>
        <EntitySheet
          title="New domain"
          description="Create a new apex domain."
          trigger={
            <Button>
              <Plus className="size-4" /> New domain
            </Button>
          }
        >
          {(close) => (
            <DomainForm certResolvers={resolvers} onSuccess={close} />
          )}
        </EntitySheet>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No domains yet</CardTitle>
            <CardDescription>
              Add a domain to start routing hostnames through Traefik.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden sm:table-cell">Resolver</TableHead>
                  <TableHead className="hidden sm:table-cell">Wildcard</TableHead>
                  <TableHead className="hidden md:table-cell">Hosts</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">
                      {d.name}
                      <div className="sm:hidden text-xs text-muted-foreground mt-1">
                        {d.certResolver} {d.wildcard && "• wildcard"}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{d.certResolver}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {d.wildcard ? (
                        <Badge variant="secondary">enabled</Badge>
                      ) : (
                        <Badge variant="outline">no</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {d._count.hosts}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EntitySheet
                          title="Edit domain"
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <DomainForm
                              certResolvers={resolvers}
                              domain={d}
                              onSuccess={close}
                            />
                          )}
                        </EntitySheet>
                        <ConfirmDelete
                          title={`Delete ${d.name}?`}
                          description="This domain must have no hosts attached."
                          onConfirm={async () => {
                            "use server";
                            return await deleteDomain(d.id);
                          }}
                        />
                      </div>
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
