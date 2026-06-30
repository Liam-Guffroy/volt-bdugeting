import { cn } from "@/lib/utils";
import { FREQUENCIES, FREQUENCY_KEYS, type Frequency } from "@/lib/budget";

/** Native select sharing the Input look. Server-safe (no client hooks). */
export function FrequencySelect({
  name,
  defaultValue = "monthly",
  id,
  className,
}: {
  name: string;
  defaultValue?: Frequency;
  id?: string;
  className?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className={cn(
        "h-10 w-full rounded-lg border border-border bg-card px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {FREQUENCY_KEYS.map((key) => (
        <option key={key} value={key}>
          {FREQUENCIES[key].label}
        </option>
      ))}
    </select>
  );
}
