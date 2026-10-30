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

export function getAvailableSignal(availableCents: number, remainingDays: number, dailyComfortCents = DAILY_COMFORT_CENTS) {
  // Compare cents before rounding the daily display: 9.999 €/day is still attention.
  const threshold=Number.isSafeInteger(dailyComfortCents)&&dailyComfortCents>0?dailyComfortCents:DAILY_COMFORT_CENTS;
  const minimumForComfort = threshold * Math.max(1, remainingDays);
  const tone: AvailableTone = availableCents < 0 ? "negative" : availableCents < minimumForComfort ? "attention" : "comfort";
  const amount=new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR",maximumFractionDigits:2}).format(threshold/100);
  return tone==="negative"?signals[tone]:{...signals[tone],description:tone==="attention"?`Moins de ${amount} disponibles par jour sur cette période.`:`Au moins ${amount} disponibles par jour sur cette période.`};
}
