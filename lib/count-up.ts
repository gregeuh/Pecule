/** Rolling amounts (Liquid Glass): pure timing so the component stays small and testable. */
export const COUNT_UP_MS = 700;

export function countUpValue(from: number, to: number, progress: number): number {
  const t = Math.min(1, Math.max(0, progress));
  const eased = 1 - (1 - t) ** 3;
  return Math.round(from + (to - from) * eased);
}
