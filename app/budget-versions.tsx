"use client";
import { useState } from "react";
import { History, LoaderCircle, RotateCcw } from "lucide-react";
import type { Budget } from "../lib/budget";

type Version = { revision: number; savedAt: string; transactions: number };

const when = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

async function readJson(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error ?? "Les versions sont temporairement indisponibles.");
  return data;
}

/** Earlier server versions of the budget; restoring goes through the normal confirmed save. */
export default function BudgetVersions({
  onRestore,
  onError,
}: {
  onRestore: (budget: Budget, savedAt: string) => void;
  onError: (message: string) => void;
}) {
  const [versions, setVersions] = useState<Version[] | null>(null);
  const [busy, setBusy] = useState<number | "list" | null>(null);

  async function toggle() {
    if (versions) return setVersions(null);
    setBusy("list");
    try {
      setVersions((await readJson(await fetch("/api/budget/versions", { cache: "no-store" }))).versions);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Les versions sont temporairement indisponibles.");
    } finally {
      setBusy(null);
    }
  }

  async function restore(version: Version) {
    setBusy(version.revision);
    try {
      const data = await readJson(await fetch(`/api/budget/versions/${version.revision}`, { cache: "no-store" }));
      const { budgetSchema } = await import("../lib/validation");
      const result = budgetSchema.safeParse(data.budget);
      if (!result.success) throw new Error("Cette version ne peut pas être restaurée.");
      onRestore(result.data, when.format(new Date(version.savedAt)));
      setVersions(null);
    } catch (error) {
      onError(error instanceof Error ? error.message : "Cette version est temporairement indisponible.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="budget-versions">
      <button type="button" onClick={toggle} aria-expanded={!!versions} disabled={busy === "list"}>
        {busy === "list" ? <LoaderCircle size={16} className="spin" /> : <History size={16} />}
        {versions ? "Masquer les versions précédentes" : "Versions précédentes"}
      </button>
      {versions ? (
        versions.length ? (
          <>
            <p>
              Pécule conserve vos 30 derniers enregistrements, puis le dernier de chaque jour pendant 60 jours.
              Restaurer une version la rend à nouveau actuelle ; la version remplacée reste disponible ici.
            </p>
            <ul>
              {versions.map((version) => (
                <li key={version.revision}>
                  <span>
                    <strong>{when.format(new Date(version.savedAt))}</strong>
                    <small>
                      {version.transactions} opération{version.transactions > 1 ? "s" : ""}
                    </small>
                  </span>
                  <button
                    type="button"
                    onClick={() => restore(version)}
                    disabled={busy !== null}
                    aria-label={`Restaurer la version du ${when.format(new Date(version.savedAt))}`}
                  >
                    {busy === version.revision ? <LoaderCircle size={15} className="spin" /> : <RotateCcw size={15} />}
                    Restaurer
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Aucune version précédente pour l’instant. Elles apparaîtront après vos prochains enregistrements.</p>
        )
      ) : null}
    </div>
  );
}
