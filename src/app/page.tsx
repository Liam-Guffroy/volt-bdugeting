import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { expenses as expensesTable, settings } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { summarize, type BudgetExpense } from "@/lib/budget";
import { requireUser } from "@/lib/session";
import { logout } from "./actions";
import { ExpenseForm } from "./expense-form";
import { ExpenseRow } from "./expense-row";
import { IncomeForm } from "./income-form";
import { ResultsPanel } from "./results-panel";
import { ThemeToggle } from "./theme-toggle";

export default async function PlannerPage() {
  const userId = await requireUser();

  const [rows, settingRow] = await Promise.all([
    db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.userId, userId))
      .orderBy(asc(expensesTable.position), asc(expensesTable.id)),
    db.select().from(settings).where(eq(settings.userId, userId)),
  ]);

  const income = settingRow[0] ? Number(settingRow[0].monthlyIncome) : 0;

  const parsed: BudgetExpense[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    frequency: r.frequency,
  }));

  const summary = summarize(income, parsed);
  const incomeInput = income ? String(income).replace(".", ",") : "";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-primary">Vlot</h1>
          <p className="text-sm text-muted-foreground">
            Wat houd je over, en hoeveel zet je opzij?
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Uitloggen
            </Button>
          </form>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Left: inputs */}
        <div className="space-y-8">
          <section>
            <Card className="p-6">
              <IncomeForm defaultValue={incomeInput} />
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="font-medium">Terugkerende kosten</h2>

            <Card className="p-6">
              <ExpenseForm />
            </Card>

            <Card className="overflow-hidden">
              {parsed.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Nog geen kosten toegevoegd.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {summary.all.map((e) => (
                    <ExpenseRow key={e.id} expense={e} />
                  ))}
                </ul>
              )}
            </Card>
          </section>
        </div>

        {/* Right: results */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ResultsPanel summary={summary} />
        </aside>
      </div>
    </div>
  );
}
