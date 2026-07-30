"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MonthKey } from "@/lib/month";
import { addOneTimeExpense, type FormState } from "./actions";

const initial: FormState = {};

/** Adds a one-off cost to the month currently being viewed. */
export function OneTimeForm({ month }: { month: MonthKey }) {
  const [state, formAction, pending] = useActionState(addOneTimeExpense, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end"
    >
      {/* The viewed month travels with the submission, so an expense always
          lands in the month you were looking at. */}
      <input type="hidden" name="month" value={month} />

      <div className="space-y-2">
        <Label htmlFor="one-time-name">Naam</Label>
        <Input
          id="one-time-name"
          name="name"
          placeholder="bv. Nieuwe wasmachine"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="one-time-amount">Bedrag</Label>
        <Input
          id="one-time-amount"
          name="amount"
          inputMode="decimal"
          placeholder="0,00"
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Bezig…" : "Toevoegen"}
      </Button>

      {state.error ? (
        <p className="sm:col-span-3 text-sm text-[var(--color-negative)]">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
