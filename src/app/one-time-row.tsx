import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OneTimeExpense } from "@/lib/budget";
import { formatEUR } from "@/lib/format";
import { deleteOneTimeExpense } from "./actions";

/** One-off cost row. Server component — delete is a plain form action. */
export function OneTimeRow({ expense }: { expense: OneTimeExpense }) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <p className="min-w-0 flex-1 truncate font-medium">{expense.name}</p>

      <p className="tabular-nums font-medium">{formatEUR(expense.amount)}</p>

      <form action={deleteOneTimeExpense}>
        <input type="hidden" name="id" value={expense.id} />
        <Button type="submit" size="icon" variant="ghost" aria-label="Verwijderen">
          <Trash2 />
        </Button>
      </form>
    </li>
  );
}
