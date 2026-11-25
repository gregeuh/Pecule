"use client";
import type { CSSProperties } from "react";
import { Info, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { shortDate, type Budget } from "../lib/budget";
import { walletColor } from "../lib/wallet-presentation";
import { goalProgress } from "../lib/budget-presentation";
import type { Modal } from "./budget-modal";
import { GoalIllustration } from "./signature-interactions";

export type GoalsPageProps = {
  budget: Budget;
  hidden: boolean;
  /** Amount formatter that honours the privacy mode. */
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  open: (modal: Modal) => void;
  onRemoveGoal: (goalId: string) => void;
};

/** Mon épargne: savings goals, progress and monthly reserves. */
export default function GoalsPage({ budget: b, hidden, m, open, onRemoveGoal }: GoalsPageProps) {
  return (
    <>
      <div className="goal-intro">
        <div>
          <h2>
            {m(
              b.goals.reduce((s, g) => s + g.saved, 0),
              false,
            )}{" "}
            <span>déjà consacrés à vos projets.</span>
          </h2>
          <p>Le suivi de vos objectifs est indépendant du solde de vos livrets.</p>
        </div>
        <div className="goal-intro-icon">
          <Sparkles size={32} strokeWidth={1.2} />
        </div>
      </div>
      <div className="goal-grid">
        {b.goals.map((g) => {
          const { share: progress, percent } = goalProgress(g.saved, g.target);
          return (
            <article className="card goal-card" key={g.id}>
              <div className="goal-card-top">
                <span className="goal-icon" style={{ "--item-color": walletColor(g.color) } as CSSProperties}>
                  <GoalIllustration icon={g.icon} progress={hidden ? 0 : progress} />
                </span>
                <div className="card-actions">
                  <button
                    type="button"
                    className="secondary compact record-edit"
                    aria-label={`Modifier ${g.name}`}
                    onClick={() => open({ type: "goal", item: g })}
                  >
                    <Pencil size={15} />
                    Modifier
                  </button>
                </div>
              </div>
              <h3>{g.name}</h3>
              <p>
                {g.deadline
                  ? `À votre rythme, jusqu’au ${shortDate(g.deadline)} ${g.deadline.slice(0, 4)}`
                  : "Un projet qui avance à votre rythme"}
              </p>
              <div className="goal-amount">
                <strong>{m(g.saved, false)}</strong>
                <span>sur {m(g.target, false)}</span>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`Progression de ${g.name}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={hidden ? undefined : percent}
                aria-valuetext={hidden ? "Progression masquée" : undefined}
              >
                <span
                  style={
                    {
                      width: hidden ? "0%" : progress + "%",
                      "--item-color": walletColor(g.color),
                    } as CSSProperties
                  }
                />
              </div>
              <p className="goal-remaining">
                {!hidden && g.saved >= g.target ? (
                  "Objectif atteint"
                ) : (
                  <>
                    <strong>{m(Math.max(0, g.target - g.saved), false)}</strong> restent à mettre de côté
                  </>
                )}
              </p>
              <div className="goal-progress-label">
                <span>{hidden ? "Progression masquée" : `${percent} % du chemin`}</span>
                <strong>{m(g.monthly, false)} / mois réservés</strong>
              </div>
              <button
                type="button"
                className="secondary full-width"
                onClick={() => open({ type: "contribution", goal: g })}
              >
                <Plus size={15} />
                Enregistrer un versement
              </button>
              <div className="record-danger">
                <button
                  type="button"
                  className="destructive-action"
                  aria-label={`Supprimer ${g.name}`}
                  onClick={() => onRemoveGoal(g.id)}
                >
                  <Trash2 size={15} />
                  Supprimer cet objectif
                </button>
              </div>
            </article>
          );
        })}
        <button className="add-tile" type="button" onClick={() => open({ type: "goal" })}>
          <span>
            <Plus size={23} />
          </span>
          <strong>Et votre prochain projet ?</strong>
          <small>
            Une envie, un voyage ou
            <br />
            simplement l’esprit tranquille.
          </small>
        </button>
      </div>
      <div className="info-callout subtle">
        <Info size={19} />
        <div>
          <strong>Votre épargne reste un choix.</strong>
          <p>
            Choisissez votre objectif et votre réserve mensuelle. Cette réserve réduit le disponible sans déplacer
            d’argent. Un versement enregistré entre un compte courant et un compte d’épargne réduit la réserve restante
            du mois.
          </p>
        </div>
      </div>
    </>
  );
}
