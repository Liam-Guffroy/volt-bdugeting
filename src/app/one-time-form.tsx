"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MonthKey } from "@/lib/month";
import { addOneTimeExpense, type FormState } from "./actions";

const initial: FormState = {};

// The everyday one-offs. Unlike the recurring presets these carry no frequency
// (a one-off belongs to one month), so a click just fills the name and drops
// you in the amount field — the same shop gets logged several times a month.
const PRESETS = [
  "Boodschappen",
  "Drank",
  "Tanken",
  "Uit eten",
  "Kleding",
  "Cadeau",
  "Apotheek",
  "Herstelling",
];

/** Adds a one-off cost to the month currently being viewed. */
export function OneTimeForm({ month }: { month: MonthKey }) {
  const [state, formAction, pending] = useActionState(addOneTimeExpense, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  function applyPreset(name: string) {
    if (nameRef.current) nameRef.current.value = name;
    amountRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Snel toevoegen</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset}
            </Button>
          ))}
        </div>
      </div>

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
            ref={nameRef}
            id="one-time-name"
            name="name"
            placeholder="bv. Boodschappen"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="one-time-amount">Bedrag</Label>
          <Input
            ref={amountRef}
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
    </div>
  );
}
