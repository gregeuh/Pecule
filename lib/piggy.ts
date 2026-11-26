/** The home piggy bank: its mood follows the "disponible" signal; it celebrates savings, not budget switches. */
export type PiggyMood = "calm" | "worried";

export function piggyMood(tone: "comfort" | "attention" | "negative" | null): PiggyMood {
  return tone === "attention" || tone === "negative" ? "worried" : "calm";
}

export function shouldCelebrate(
  previousSaved: number | null,
  saved: number,
  budgetKey: string,
  previousKey: string | null,
): boolean {
  return previousSaved !== null && previousKey === budgetKey && saved > previousSaved;
}
