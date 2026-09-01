export type IntervalUnit = "seconds" | "minutes";

const MS_PER_UNIT: Record<IntervalUnit, number> = {
  seconds: 1000,
  minutes: 60000,
};

// Storage/transport stays milliseconds throughout — these only convert at the
// UI boundary (form <-> display).
export function msToIntervalInput(ms: number): { value: number; unit: IntervalUnit } {
  if (ms >= 60000 && ms % 60000 === 0) {
    return { value: ms / 60000, unit: "minutes" };
  }
  return { value: Math.round(ms / 1000), unit: "seconds" };
}

export function intervalInputToMs(value: number, unit: IntervalUnit): number {
  return Math.round(value * MS_PER_UNIT[unit]);
}

export function formatInterval(ms: number): string {
  const { value, unit } = msToIntervalInput(ms);
  return unit === "minutes" ? `${value} min` : `${value}s`;
}
