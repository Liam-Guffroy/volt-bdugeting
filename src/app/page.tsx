import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  expenses as expensesTable,
  oneTimeExpenses,
  settings,
} from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { summarize, type BudgetExpense, type OneTimeExpense } from "@/lib/budget";
import { formatEUR } from "@/lib/format";
import { formatMonth, toMonth } from "@/lib/month";
import { requireUser } from "@/lib/session";
import { logout } from "./actions";
import { ExpenseForm } from "./expense-form";
import { ExpenseRow } from "./expense-row";
import { IncomeForm } from "./income-form";
import { MonthNav } from "./month-nav";
import { OneTimeForm } from "./one-time-form";
import { OneTimeRow } from "./one-time-row";
import { ResultsPanel } from "./results-panel";
import { ThemeToggle } from "./theme-toggle";

export default async function PlannerPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const userId = await requireUser();
  const month = toMonth((await searchParams).month);
  const monthLabel = formatMonth(month);

  const [rows, settingRow, oneTimeRows] = await Promise.all([
    db
      .select()
      .from(expensesTable)
      .where(eq(expensesTable.userId, userId))
      .orderBy(asc(expensesTable.position), asc(expensesTable.id)),
    db.select().from(settings).where(eq(settings.userId, userId)),
    db
      .select()
      .from(oneTimeExpenses)
      .where(
        and(
          eq(oneTimeExpenses.userId, userId),
          eq(oneTimeExpenses.month, month),
        ),
      )
      .orderBy(asc(oneTimeExpenses.id)),
  ]);

  const income = settingRow[0] ? Number(settingRow[0].monthlyIncome) : 0;

  const parsed: BudgetExpense[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
    frequency: r.frequency,
  }));

  const oneTime: OneTimeExpense[] = oneTimeRows.map((r) => ({
    id: r.id,
    name: r.name,
    amount: Number(r.amount),
  }));

  const summary = summarize(income, parsed, oneTime);
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

      <div className="mb-8 flex justify-center sm:justify-start">
        <MonthNav month={month} />
      </div>

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
                  {summary.all.map((e, i) => (
                    <ExpenseRow
                      key={e.id}
                      expense={e}
                      isFirst={i === 0}
                      isLast={i === summary.all.length - 1}
                    />
                  ))}
                </ul>
              )}
            </Card>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="font-medium">Eenmalige kosten</h2>
              <p className="text-sm text-muted-foreground">
                Alleen voor {monthLabel} — telt niet mee in andere maanden.
              </p>
            </div>

            <Card className="p-6">
              <OneTimeForm month={month} />
            </Card>

            <Card className="overflow-hidden">
              {oneTime.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Geen eenmalige kosten in {monthLabel}.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {oneTime.map((e) => (
                    <OneTimeRow key={e.id} expense={e} />
                  ))}
                  <li className="flex items-center justify-between bg-muted px-4 py-3">
                    <p className="font-medium">Totaal eenmalig</p>
                    <p className="tabular-nums font-semibold">
                      {formatEUR(summary.oneTimeTotal)}
                    </p>
                  </li>
                </ul>
              )}
            </Card>
          </section>
        </div>

        {/* Right: results */}
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <ResultsPanel summary={summary} monthLabel={monthLabel} />
        </aside>
      </div>
    </div>
  );
}
