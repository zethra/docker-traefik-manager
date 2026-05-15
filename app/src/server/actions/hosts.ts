"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hostInput } from "@/lib/zod-schemas";
import { bumpConfigVersion } from "@/server/traefik/load";
import { actionError, actionOk, requireUser } from "./_helpers";

function computeFqdn(subdomain: string, domainName: string) {
  return subdomain === "@" ? domainName : `${subdomain}.${domainName}`;
}

export async function createHost(input: unknown) {
  await requireUser();
  const parsed = hostInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const domain = await db.domain.findUnique({
    where: { id: parsed.data.domainId },
  });
  if (!domain) return actionError("Domain not found");

  const fqdn = computeFqdn(parsed.data.subdomain, domain.name);

  try {
    const created = await db.host.create({
      data: { ...parsed.data, fqdn },
    });
    await bumpConfigVersion();
    revalidatePath("/hosts");
    return actionOk(created);
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return actionError("Host already exists for this domain");
    }
    throw e;
  }
}

export async function updateHost(id: string, input: unknown) {
  await requireUser();
  const parsed = hostInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const domain = await db.domain.findUnique({
    where: { id: parsed.data.domainId },
  });
  if (!domain) return actionError("Domain not found");

  const fqdn = computeFqdn(parsed.data.subdomain, domain.name);
  const updated = await db.host.update({
    where: { id },
    data: { ...parsed.data, fqdn },
  });
  await bumpConfigVersion();
  revalidatePath("/hosts");
  revalidatePath(`/hosts/${id}`);
  return actionOk(updated);
}

export async function deleteHost(id: string) {
  await requireUser();
  await db.host.delete({ where: { id } });
  await bumpConfigVersion();
  revalidatePath("/hosts");
  return actionOk(undefined);
}

export async function toggleHost(id: string, enabled: boolean) {
  await requireUser();
  await db.host.update({ where: { id }, data: { enabled } });
  await bumpConfigVersion();
  revalidatePath("/hosts");
  return actionOk(undefined);
}

export async function setHostMiddlewares(hostId: string, middlewareIds: string[]) {
  await requireUser();
  await db.$transaction(async (tx) => {
    await tx.hostMiddleware.deleteMany({ where: { hostId } });
    if (middlewareIds.length > 0) {
      await tx.hostMiddleware.createMany({
        data: middlewareIds.map((middlewareId, order) => ({
          hostId,
          middlewareId,
          order,
        })),
      });
    }
  });
  await bumpConfigVersion();
  revalidatePath(`/hosts/${hostId}`);
  return actionOk(undefined);
}
