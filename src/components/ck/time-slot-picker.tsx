import { cn } from "#/lib/utils";

/**
 * Zeitfenster als Chips (native Radios), gruppiert nach Vormittag und
 * Nachmittag. Nicht buchbare Zeiten sind deaktiviert statt ausgeblendet,
 * damit der Tagesablauf lesbar bleibt.
 */
export function TimeSlotPicker({
  name,
  slots,
  available,
  value,
  onChange,
  formatLabel,
  groupLabels,
  describedBy,
}: {
  name: string;
  slots: string[];
  available: ReadonlySet<string>;
  value: string | null;
  onChange: (slot: string) => void;
  formatLabel: (slot: string) => string;
  groupLabels: { morning: string; afternoon: string };
  describedBy?: string;
}) {
  const groups = [
    { label: groupLabels.morning, slots: slots.filter((slot) => slot < "12:00") },
    { label: groupLabels.afternoon, slots: slots.filter((slot) => slot >= "12:00") },
  ];
  return (
    <div className="flex flex-col gap-4">
      {groups.map(
        (group) =>
          group.slots.length > 0 && (
            <div key={group.label}>
              <div className="mb-2 ck-eyebrow text-ink-subtle">{group.label}</div>
              <div className="flex flex-wrap gap-2">
                {group.slots.map((slot) => {
                  const disabled = !available.has(slot);
                  return (
                    <label
                      key={slot}
                      className={cn(
                        "relative inline-flex h-11 min-w-[4.75rem] cursor-pointer items-center justify-center rounded-sm border border-hairline bg-surface px-3 tabular-nums transition-[border-color,background-color,color] duration-(--dur-fast) ease-out ck-body-sm hover:border-hairline-accent has-checked:border-primary has-checked:bg-primary has-checked:text-primary-contrast has-focus-visible:shadow-(--focus-ring)",
                        disabled && "pointer-events-none text-ink-subtle opacity-45",
                      )}
                    >
                      <input
                        type="radio"
                        name={name}
                        value={slot}
                        className="sr-only"
                        disabled={disabled}
                        checked={value === slot}
                        onChange={() => onChange(slot)}
                        aria-describedby={describedBy}
                      />
                      {formatLabel(slot)}
                    </label>
                  );
                })}
              </div>
            </div>
          ),
      )}
    </div>
  );
}
