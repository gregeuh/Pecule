"use client";
import type { NameProposal } from "../lib/readable-names";

export type NameChoice = { on: boolean; name: string };

export const defaultNameChoices = (proposals: NameProposal[]) =>
  new Map(proposals.map((p) => [p.raw, { on: true, name: p.name }]));

/** The names kept: bank label → name, for the rows still ticked with a name. */
export const chosenNames = (choices: Map<string, NameChoice>) =>
  new Map([...choices].filter(([, c]) => c.on && c.name.trim()).map(([raw, c]) => [raw, c.name.trim()]));

/** Proposed readable names: untick one to keep the bank label, or type another name. */
export default function ReadableNamesList({
  proposals,
  choices,
  onChange,
  disabled = false,
}: {
  proposals: NameProposal[];
  choices: Map<string, NameChoice>;
  onChange: (next: Map<string, NameChoice>) => void;
  disabled?: boolean;
}) {
  const set = (raw: string, patch: Partial<NameChoice>) => {
    const next = new Map(choices);
    const current = next.get(raw) ?? { on: true, name: proposals.find((p) => p.raw === raw)?.name ?? raw };
    next.set(raw, { ...current, ...patch });
    onChange(next);
  };
  return (
    <ul className="readable-names">
      {proposals.map((p) => {
        const choice = choices.get(p.raw) ?? { on: true, name: p.name };
        return (
          <li key={p.raw} data-off={!choice.on || undefined}>
            <input
              type="checkbox"
              checked={choice.on}
              disabled={disabled}
              aria-label={`Renommer « ${p.raw} »`}
              onChange={(e) => set(p.raw, { on: e.target.checked })}
            />
            <span className="readable-names-text">
              {choice.on ? (
                <input
                  className="readable-names-name"
                  value={choice.name}
                  maxLength={120}
                  disabled={disabled}
                  aria-label={`Nom pour « ${p.raw} »`}
                  onChange={(e) => set(p.raw, { name: e.target.value })}
                />
              ) : (
                <strong>{p.raw}</strong>
              )}
              <small>{p.raw}</small>
            </span>
            {p.count > 1 && <span className="readable-names-count">× {p.count}</span>}
          </li>
        );
      })}
    </ul>
  );
}
