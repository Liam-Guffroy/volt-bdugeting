"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Frequency } from "@/lib/budget";
import { addExpense, type FormState } from "./actions";
import { FrequencySelect } from "./frequency-select";

const initial: FormState = {};

// Common household bills. Clicking one fills the name and picks a sensible
// default frequency — the user still sets the amount and can change the
// frequency in the dropdown before adding.
const PRESETS: { name: string; frequency: Frequency }[] = [
  { name: "Huur / Lening", frequency: "monthly" },
  { name: "Elektriciteit", frequency: "monthly" },
  { name: "Water", frequency: "quarterly" },
  { name: "Gas / Verwarming", frequency: "monthly" },
  { name: "Internet / TV", frequency: "monthly" },
  { name: "Telefoon", frequency: "monthly" },
  { name: "Verzekering", frequency: "yearly" },
  { name: "Boodschappen", frequency: "weekly" },
];

export function ExpenseForm() {
  const [state, formAction, pending] = useActionState(addExpense, initial);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    if (nameRef.current) nameRef.current.value = preset.name;
    const select = formRef.current?.elements.namedItem("frequency");
    if (select instanceof HTMLSelectElement) select.value = preset.frequency;
    amountRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">Snel toevoegen</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <Button
              key={preset.name}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_8rem_10rem_auto] sm:items-end"
      >
        <div className="space-y-2">
          <Label htmlFor="name">Naam</Label>
          <Input ref={nameRef} id="name" name="name" placeholder="bv. Huur" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Bedrag</Label>
          <Input
            ref={amountRef}
            id="amount"
            name="amount"
            inputMode="decimal"
            placeholder="0,00"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequentie</Label>
          <FrequencySelect id="frequency" name="frequency" />
        </div>

        <Button type="submit" disabled={pending}>
          {pending ? "Bezig…" : "Toevoegen"}
        </Button>

        {state.error ? (
          <p className="sm:col-span-4 text-sm text-[var(--color-negative)]">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
