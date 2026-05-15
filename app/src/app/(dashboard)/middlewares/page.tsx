import { Pencil, Plus } from "lucide-react";
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
import { MiddlewareForm } from "@/components/forms/middleware-form";
import { deleteMiddleware } from "@/server/actions/middlewares";
import type { MiddlewareType } from "@/lib/zod-schemas";

export const dynamic = "force-dynamic";

export default async function MiddlewaresPage() {
  const middlewares = await db.middleware.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { hosts: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Middlewares</h1>
          <p className="text-sm text-muted-foreground">
            Reusable Traefik middlewares. Attach them to hosts on the host page.
          </p>
        </div>
        <EntitySheet
          title="New middleware"
          trigger={
            <Button>
              <Plus className="size-4" /> New middleware
            </Button>
          }
        >
          {(close) => <MiddlewareForm onSuccess={close} />}
        </EntitySheet>
      </div>

      {middlewares.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No middlewares yet</CardTitle>
            <CardDescription>
              Create middlewares (IP allow-list, basic auth, rate limit, etc.)
              and attach them to hosts.
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
                  <TableHead className="hidden sm:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">In use</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {middlewares.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.name}
                      <div className="sm:hidden text-xs text-muted-foreground mt-1">
                        {m.type}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline">{m.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {m._count.hosts} host{m._count.hosts === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <EntitySheet
                          title="Edit middleware"
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        >
                          {(close) => (
                            <MiddlewareForm
                              middleware={{
                                id: m.id,
                                name: m.name,
                                type: m.type as MiddlewareType,
                                config: m.config,
                              }}
                              onSuccess={close}
                            />
                          )}
                        </EntitySheet>
                        <ConfirmDelete
                          title={`Delete ${m.name}?`}
                          description="It will be detached from all hosts using it."
                          onConfirm={async () => {
                            "use server";
                            return await deleteMiddleware(m.id);
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
