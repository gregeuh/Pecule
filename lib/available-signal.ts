export const DAILY_COMFORT_CENTS = 1000;
export type AvailableTone = "negative" | "attention" | "comfort";

const signals = {
  negative: {
    tone: "negative",
    label: "Négatif",
    description: "Le disponible est inférieur à zéro après les charges prévues et les réserves.",
  },
  attention: {
    tone: "attention",
    label: "Attention",
    description: "Moins de 10 € disponibles par jour sur cette période.",
  },
  comfort: {
    tone: "comfort",
    label: "Confort",
    description: "Au moins 10 € disponibles par jour sur cette période.",
  },
} as const;

export function getAvailableSignal(availableCents: number, remainingDays: number) {
  // Compare cents before rounding the daily display: 9.999 €/day is still attention.
  const minimumForComfort = DAILY_COMFORT_CENTS * Math.max(1, remainingDays);
  const tone: AvailableTone = availableCents < 0 ? "negative" : availableCents < minimumForComfort ? "attention" : "comfort";
  return signals[tone];
}
