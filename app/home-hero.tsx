"use client";
import { useCallback } from "react";
import { money, shortDate } from "../lib/budget";
import { piggyMood } from "../lib/piggy";
import AnimatedAmount from "./animated-amount";
import Piggy from "./piggy";

/** Top of the home: what is left to spend, with the piggy bank. Opens the explanation of the calculation. */
export default function HomeHero({
  available,
  daily,
  until,
  untilPayday,
  tone,
  hidden,
  savedCents,
  budgetKey,
  onOpen,
}: {
  available: number;
  daily: number;
  until: string;
  untilPayday: boolean;
  tone: "comfort" | "attention" | "negative" | null;
  hidden: boolean;
  savedCents: number;
  budgetKey: string;
  onOpen: () => void;
}) {
  const format = useCallback((cents: number) => (hidden ? "•••• €" : money(cents)), [hidden]);
  const label = untilPayday
    ? "Ce qu’il vous reste jusqu’à la paie"
    : `Ce qu’il vous reste jusqu’au ${shortDate(until)}`;
  const perDay = hidden ? "•••• €" : money(Math.floor(daily / 100) * 100, false);
  const state = tone === "negative" ? "négatif" : tone === "attention" ? "attention" : tone ? "tout va bien" : "";
  return (
    <button
      type="button"
      className="home-hero glass"
      data-tone={tone ?? undefined}
      onClick={onOpen}
      aria-label={`${label} : ${format(available)}, ${perDay} par jour${state ? `, ${state}` : ""}. Comprendre le calcul`}
    >
      <span className="home-hero-text">
        <span className="home-hero-label">{label}</span>
        <strong className="home-hero-amount" data-long={format(available).length >= 12}>
          <AnimatedAmount cents={available} hidden={hidden} format={format} />
        </strong>
        <span className="home-hero-pill">
          {perDay} par jour{state ? ` · ${state}` : ""}
        </span>
      </span>
      <Piggy mood={piggyMood(tone)} savedCents={savedCents} budgetKey={budgetKey} hidden={hidden} />
    </button>
  );
}
