"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginInput } from "@/lib/zod-schemas";
import { actionError, actionOk } from "./_helpers";

export async function login(formData: FormData) {
  const parsed = loginInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return actionError(parsed.error.issues[0].message);

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    });
    return actionOk(undefined);
  } catch (e) {
    if (e instanceof AuthError) {
      return actionError("Invalid email or password");
    }
    throw e;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
