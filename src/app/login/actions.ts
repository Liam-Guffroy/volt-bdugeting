"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { startSession } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

const schema = z.object({
  password: z.string().min(1, "Vul je wachtwoord in."),
});

export interface LoginState {
  error?: string;
}

export async function login(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = schema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Ongeldige invoer." };
  }

  // Password-only login: find the account whose stored hash matches. We check
  // every user (rather than stopping at the first) so timing doesn't leak how
  // many accounts exist. Passwords are unique per account (see create-user).
  const all = await db.select().from(users);
  let match: (typeof all)[number] | null = null;
  for (const user of all) {
    if (verifyPassword(parsed.data.password, user.passwordHash)) match = user;
  }

  if (!match) {
    return { error: "Verkeerd wachtwoord." };
  }

  await startSession(match.id);
  redirect("/");
}
