"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { domainInput } from "@/lib/zod-schemas";
import { bumpConfigVersion } from "@/server/traefik/load";
import { actionError, actionOk, requireUser } from "./_helpers";

export async function createDomain(input: unknown) {
  await requireUser();
  const parsed = domainInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  try {
    const created = await db.domain.create({ data: parsed.data });
    await bumpConfigVersion();
    revalidatePath("/domains");
    return actionOk(created);
  } catch (e: unknown) {
    if (isUniqueViolation(e)) return actionError("Domain already exists");
    throw e;
  }
}

export async function updateDomain(id: string, input: unknown) {
  await requireUser();
  const parsed = domainInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const updated = await db.domain.update({ where: { id }, data: parsed.data });
  // Domain change may affect hostnames; recompute fqdn for all hosts under it.
  const hosts = await db.host.findMany({ where: { domainId: id } });
  for (const h of hosts) {
    const fqdn =
      h.subdomain === "@" ? parsed.data.name : `${h.subdomain}.${parsed.data.name}`;
    await db.host.update({ where: { id: h.id }, data: { fqdn } });
  }
  await bumpConfigVersion();
  revalidatePath("/domains");
  revalidatePath("/hosts");
  return actionOk(updated);
}

export async function deleteDomain(id: string) {
  await requireUser();
  const hostCount = await db.host.count({ where: { domainId: id } });
  if (hostCount > 0) {
    return actionError(
      `Cannot delete: ${hostCount} host(s) still linked to this domain`,
    );
  }
  await db.domain.delete({ where: { id } });
  await bumpConfigVersion();
  revalidatePath("/domains");
  return actionOk(undefined);
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}
