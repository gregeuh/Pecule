"use client";
import { useMemo, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { Budget } from "../lib/budget";
import { applyNames, nameProposals } from "../lib/readable-names";
import ReadableNamesList, { chosenNames, defaultNameChoices } from "./readable-names-list";

/** Réglages › Noms des opérations: gives readable names to the bank labels already in the budget. */
export default function ReadableNamesSheet({
  budget,
  saving,
  save,
  onDone,
}: {
  budget: Budget;
  saving: boolean;
  save: (next: Budget, message?: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const proposals = useMemo(() => nameProposals(budget), [budget]);
  const [choices, setChoices] = useState(() => defaultNameChoices(proposals));
  const names = chosenNames(choices);
  const count = proposals.filter((p) => names.has(p.raw)).length;
  if (!proposals.length)
    return <p className="form-intro">Tous vos libellés sont déjà lisibles. Rien à renommer pour le moment.</p>;
  return (
    <div className="readable-names-sheet">
      <p className="form-intro">
        Pécule propose un nom pour {proposals.length} libellé{proposals.length > 1 ? "s" : ""} de votre banque. Décochez
        ceux que vous préférez garder tels quels, ou touchez un nom pour le changer. Le libellé d’origine reste visible
        sur chaque opération.
      </p>
      <ReadableNamesList proposals={proposals} choices={choices} onChange={setChoices} disabled={saving} />
      <div className="form-actions">
        <button
          type="button"
          className="primary"
          disabled={saving || !count}
          onClick={async () => {
            if (
              await save(
                applyNames(budget, names),
                `${count} libellé${count > 1 ? "s" : ""} renommé${count > 1 ? "s" : ""}.`,
              )
            )
              onDone();
          }}
        >
          {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
          Renommer {count} libellé{count > 1 ? "s" : ""}
        </button>
        <button type="button" className="text-button" disabled={saving} onClick={onDone}>
          Garder les libellés de la banque
        </button>
      </div>
    </div>
  );
}
