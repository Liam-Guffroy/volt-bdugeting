"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { expenses, settings } from "@/db/schema";
import { FREQUENCY_KEYS } from "@/lib/budget";
import { endSession, requireUser } from "@/lib/session";

export interface FormState {
  error?: string;
  ok?: boolean;
}

// A money string from a form input. Accepts "1234,56" (nl) or "1234.56".
const amount = z
  .string()
  .trim()
  .min(1, "Vul een bedrag in.")
  .transform((s) => Number(s.replace(/\s/g, "").replace(",", ".")))
  .pipe(z.number().finite("Ongeldig bedrag.").nonnegative("Bedrag mag niet negatief zijn."));

const incomeSchema = z.object({ monthlyIncome: amount });

const expenseSchema = z.object({
  name: z.string().trim().min(1, "Vul een naam in.").max(120),
  amount: amount.pipe(z.number().positive("Bedrag moet groter zijn dan nul.")),
  frequency: z.enum(FREQUENCY_KEYS),
});

const idSchema = z.object({
  id: z.coerce.number().int().positive(),
});

function fail(parsed: z.SafeParseReturnType<unknown, unknown>): FormState {
  if (parsed.success) return {};
  return {
    error:
      "error" in parsed
        ? parsed.error.issues[0]?.message ?? "Ongeldige invoer."
        : "Ongeldige invoer.",
  };
}

export async function setIncome(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();

  const parsed = incomeSchema.safeParse({
    monthlyIncome: formData.get("monthlyIncome"),
  });
  if (!parsed.success) return fail(parsed);

  const value = parsed.data.monthlyIncome.toFixed(2);
  await db
    .insert(settings)
    .values({ userId, monthlyIncome: value })
    .onConflictDoUpdate({
      target: settings.userId,
      set: { monthlyIncome: value },
    });

  revalidatePath("/");
  return { ok: true };
}

export async function addExpense(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();

  const parsed = expenseSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
  });
  if (!parsed.success) return fail(parsed);

  // Append at the end of this user's list.
  const [{ next } = { next: 0 }] = await db
    .select({ next: sql<number>`coalesce(max(${expenses.position}), -1) + 1` })
    .from(expenses)
    .where(eq(expenses.userId, userId));

  await db.insert(expenses).values({
    userId,
    name: parsed.data.name,
    amount: parsed.data.amount.toFixed(2),
    frequency: parsed.data.frequency,
    position: next,
  });

  revalidatePath("/");
  return { ok: true };
}

export async function updateExpense(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const userId = await requireUser();

  const id = idSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return fail(id);

  const parsed = expenseSchema.safeParse({
    name: formData.get("name"),
    amount: formData.get("amount"),
    frequency: formData.get("frequency"),
  });
  if (!parsed.success) return fail(parsed);

  await db
    .update(expenses)
    .set({
      name: parsed.data.name,
      amount: parsed.data.amount.toFixed(2),
      frequency: parsed.data.frequency,
    })
    .where(and(eq(expenses.id, id.data.id), eq(expenses.userId, userId)));

  revalidatePath("/");
  return { ok: true };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  const userId = await requireUser();

  const id = idSchema.safeParse({ id: formData.get("id") });
  if (!id.success) return;

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, id.data.id), eq(expenses.userId, userId)));
  revalidatePath("/");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/login");
}
