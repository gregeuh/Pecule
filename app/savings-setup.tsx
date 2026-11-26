"use client";
import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import { accountBalance, type Budget } from "../lib/budget";
import { looseGoals, moveGoalsToSavings } from "../lib/savings";

/**
 * « Ranger dans le livret »: loose goals become envelopes of a savings account. Their monthly reserves can become
 * one planned monthly transfer to the livret. Nothing changes until the person confirms.
 */
export default function SavingsSetup({
  budget: b,
  accountId,
  today,
  saving,
  m,
  makeId,
  save,
  onDone,
}: {
  budget: Budget;
  accountId: string;
  today: string;
  saving: boolean;
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  makeId: () => string;
  save: (next: Budget, message?: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const account = b.accounts.find((a) => a.id === accountId);
  const goals = looseGoals(b);
  const everyday = b.accounts.filter((a) => a.type !== "savings");
  const [picked, setPicked] = useState(() => new Set(goals.map((g) => g.id)));
  const [replace, setReplace] = useState(true);
  const [from, setFrom] = useState(everyday[0]?.id ?? "");
  const [day, setDay] = useState(5);
  const [error, setError] = useState("");
  if (!account) return null;
  const chosen = goals.filter((g) => picked.has(g.id));
  const monthly = chosen.reduce((s, g) => s + g.monthly, 0);
  const total = chosen.reduce((s, g) => s + g.saved, 0);
  const balance = accountBalance(b, account.id, today);
  return (
    <div className="savings-setup">
      <p className="form-intro">
        Vos objectifs deviennent des enveloppes de {account.name} : ce que vous aviez noté comme mis de côté devient le
        montant de l’enveloppe, le montant visé est conservé. Aucun argent ne bouge.
      </p>
      <fieldset className="savings-setup-goals">
        <legend>Objectifs à ranger</legend>
        {goals.map((g) => (
          <label key={g.id} className="bank-import-confirm">
            <input
              type="checkbox"
              checked={picked.has(g.id)}
              disabled={saving}
              onChange={(e) => {
                const next = new Set(picked);
                if (e.target.checked) next.add(g.id);
                else next.delete(g.id);
                setPicked(next);
              }}
            />
            <span>
              <strong>{g.name}</strong> · {m(g.saved, false)} dans l’enveloppe
              {g.monthly > 0 ? ` · ${m(g.monthly, false)} réservés par mois` : ""}
            </span>
          </label>
        ))}
      </fieldset>
      {total > balance && (
        <p className="savings-warning" role="status">
          Ces enveloppes ({m(total, false)}) dépassent le solde du livret ({m(balance, false)}). Vous pourrez les
          ajuster ensuite.
        </p>
      )}
      {monthly > 0 && everyday.length > 0 && (
        <div className="savings-setup-transfer">
          <label className="bank-import-confirm">
            <input type="checkbox" checked={replace} disabled={saving} onChange={(e) => setReplace(e.target.checked)} />
            <span>
              Remplacer les réserves ({m(monthly, false)} par mois) par un <strong>virement mensuel</strong> de{" "}
              {m(monthly, false)} vers {account.name}. Il sera retiré de ce qu’il vous reste, comme une charge, à sa
              date.
            </span>
          </label>
          {replace && (
            <div className="form-grid">
              <label className="field">
                <span>Depuis</span>
                <select value={from} disabled={saving} onChange={(e) => setFrom(e.target.value)}>
                  {everyday.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Chaque mois, le</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={day}
                  disabled={saving}
                  onChange={(e) => setDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                />
              </label>
            </div>
          )}
        </div>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="primary"
          disabled={saving || !chosen.length}
          onClick={async () => {
            setError("");
            try {
              const next = moveGoalsToSavings(b, account.id, {
                goalIds: chosen.map((g) => g.id),
                ...(replace && monthly > 0 && from
                  ? { transfer: { fromAccountId: from, day, id: makeId(), today } }
                  : {}),
              });
              const n = chosen.length;
              if (await save(next, `${n} enveloppe${n > 1 ? "s" : ""} rangée${n > 1 ? "s" : ""} dans ${account.name}.`))
                onDone();
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Impossible de ranger ces objectifs.");
            }
          }}
        >
          {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
          Ranger dans {account.name}
        </button>
        <button type="button" className="text-button" disabled={saving} onClick={onDone}>
          Plus tard
        </button>
      </div>
    </div>
  );
}
