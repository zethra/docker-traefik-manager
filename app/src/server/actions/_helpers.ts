import { auth } from "@/lib/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export function actionError(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function actionOk<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}
