"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { endpointInput } from "@/lib/zod-schemas";
import { bumpConfigVersion } from "@/server/traefik/load";
import { actionError, actionOk, requireUser } from "./_helpers";

export async function createEndpoint(input: unknown) {
  await requireUser();
  const parsed = endpointInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  await db.$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.endpoint.updateMany({
        where: { hostId: parsed.data.hostId, isPrimary: true },
        data: { isPrimary: false },
      });
    }
    await tx.endpoint.create({ data: parsed.data });
  });

  await bumpConfigVersion();
  revalidatePath(`/hosts/${parsed.data.hostId}`);
  return actionOk(undefined);
}

export async function updateEndpoint(id: string, input: unknown) {
  await requireUser();
  const parsed = endpointInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  await db.$transaction(async (tx) => {
    if (parsed.data.isPrimary) {
      await tx.endpoint.updateMany({
        where: {
          hostId: parsed.data.hostId,
          isPrimary: true,
          NOT: { id },
        },
        data: { isPrimary: false },
      });
    }
    await tx.endpoint.update({ where: { id }, data: parsed.data });
  });

  await bumpConfigVersion();
  revalidatePath(`/hosts/${parsed.data.hostId}`);
  return actionOk(undefined);
}

export async function deleteEndpoint(id: string) {
  await requireUser();
  const ep = await db.endpoint.delete({ where: { id } });
  await bumpConfigVersion();
  revalidatePath(`/hosts/${ep.hostId}`);
  return actionOk(undefined);
}
