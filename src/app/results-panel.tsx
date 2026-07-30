import { Card } from "@/components/ui/card";
import { frequencyLabel, type BudgetSummary } from "@/lib/budget";
import { formatEUR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ResultsPanel({
  summary,
  monthLabel,
}: {
  summary: BudgetSummary;
  monthLabel: string;
}) {
  const negative = summary.remaining < 0;
  const hasOneTime = summary.oneTimeTotal > 0;

  return (
    <div className="space-y-4">
      {/* Headline: what's left in the month being viewed */}
      <Card className="p-6">
        <p className="text-sm text-muted-foreground">Over in {monthLabel}</p>
        <p
          className={cn(
            "mt-1 text-4xl font-semibold tabular-nums",
            negative ? "text-[var(--color-negative)]" : "text-primary",
          )}
        >
          {formatEUR(summary.remaining)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          inkomen − vaste kosten − reservering
          {hasOneTime ? " − eenmalig" : ""}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Vaste kosten / maand" value={formatEUR(summary.regularTotal)} />
        <Stat label="Reserveren / maand" value={formatEUR(summary.reserveTotal)} />
        {hasOneTime ? (
          <Stat
            className="col-span-2"
            label={`Eenmalig in ${monthLabel}`}
            value={formatEUR(summary.oneTimeTotal)}
          />
        ) : null}
      </div>

      {/* Reserve breakdown — what to set aside, per irregular bill */}
      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-medium">Reservering per post</h2>
          <p className="text-sm text-muted-foreground">
            Maandelijks opzij te zetten voor niet-maandelijkse rekeningen
          </p>
        </div>

        {summary.reserve.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">
            Nog geen niet-maandelijkse kosten. Voeg bv. een jaarlijkse verzekering toe.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {summary.reserve.map((e) => (
              <li key={e.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{e.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatEUR(e.amount)} · {frequencyLabel(e.frequency)}
                  </p>
                </div>
                <p className="tabular-nums font-medium">
                  {formatEUR(e.monthly)}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    /mnd
                  </span>
                </p>
              </li>
            ))}
            <li className="flex items-center justify-between bg-muted px-4 py-3">
              <p className="font-medium">Totaal reservering</p>
              <p className="tabular-nums font-semibold">
                {formatEUR(summary.reserveTotal)}
              </p>
            </li>
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
    </Card>
  );
}
