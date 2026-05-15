"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { middlewareInput } from "@/lib/zod-schemas";
import { bumpConfigVersion } from "@/server/traefik/load";
import { actionError, actionOk, requireUser } from "./_helpers";
import type { Prisma } from "@/generated/prisma/client";

export async function createMiddleware(input: unknown) {
  await requireUser();
  const parsed = middlewareInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  try {
    const created = await db.middleware.create({
      data: {
        name: parsed.data.name,
        type: parsed.data.type,
        config: parsed.data.config as Prisma.InputJsonValue,
      },
    });
    await bumpConfigVersion();
    revalidatePath("/middlewares");
    return actionOk(created);
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e !== null &&
      "code" in e &&
      (e as { code: string }).code === "P2002"
    ) {
      return actionError("A middleware with this name already exists");
    }
    throw e;
  }
}

export async function updateMiddleware(id: string, input: unknown) {
  await requireUser();
  const parsed = middlewareInput.safeParse(input);
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  const updated = await db.middleware.update({
    where: { id },
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      config: parsed.data.config as Prisma.InputJsonValue,
    },
  });
  await bumpConfigVersion();
  revalidatePath("/middlewares");
  return actionOk(updated);
}

export async function deleteMiddleware(id: string) {
  await requireUser();
  await db.middleware.delete({ where: { id } });
  await bumpConfigVersion();
  revalidatePath("/middlewares");
  return actionOk(undefined);
}
