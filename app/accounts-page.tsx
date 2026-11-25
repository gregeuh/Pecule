"use client";
import InfoNote from "./info-note";
import type { CSSProperties } from "react";
import { ArrowLeftRight, LockKeyhole, Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { accountBalance, type Budget } from "../lib/budget";
import { accountKind, walletColor } from "../lib/wallet-presentation";
import AccountActivity from "./account-activity";
import AccountVerification from "./account-verification";
import type { Modal } from "./budget-modal";

export type AccountsPageProps = {
  budget: Budget;
  /** Totals from overview(): current accounts and savings. */
  o: { total: number; saved: number };
  today: string;
  hidden: boolean;
  busy: boolean;
  /** Amount formatter that honours the privacy mode. */
  m: (n: number, decimals?: boolean, signed?: boolean) => string;
  open: (modal: Modal) => void;
  setToast: (message: string) => void;
  /** Opens Opérations filtered on this account for the current month. */
  onShowOperations: (accountId: string) => void;
  onRemoveAccount: (accountId: string) => void;
};

/** Mes comptes: balances, account cards, activity, verification and editing. */
export default function AccountsPage({
  budget: b,
  o,
  today,
  hidden,
  busy,
  m,
  open,
  setToast,
  onShowOperations,
  onRemoveAccount,
}: AccountsPageProps) {
  return (
    <>
      <section className="metric-strip">
        <div>
          <span>Votre argent au total</span>
          <strong>{m(o.total + o.saved)}</strong>
        </div>
        <div>
          <span>Disponible sur comptes courants</span>
          <strong>{m(o.total)}</strong>
        </div>
        <div>
          <span>À l’abri sur l’épargne</span>
          <strong>{m(o.saved)}</strong>
        </div>
      </section>
      <div className="section-heading">
        <h2>Vos comptes, simplement</h2>
        <button
          type="button"
          className="secondary compact"
          onClick={() =>
            b.accounts.length >= 2
              ? open({ type: "transfer" })
              : setToast("Ajoutez un deuxième compte pour enregistrer un virement.")
          }
        >
          <ArrowLeftRight size={15} />
          Virement entre comptes
        </button>
      </div>
      <div className="account-grid">
        {b.accounts.map((a) => (
          <article className="card account-card" key={a.id}>
            <div className="account-card-top">
              <span className="bank-icon large" style={{ "--item-color": walletColor(a.color) } as CSSProperties}>
                <Wallet size={24} />
              </span>
              <div className="card-actions">
                <button
                  type="button"
                  className="secondary compact record-edit"
                  aria-label={`Modifier ${a.name}`}
                  onClick={() => open({ type: "account", item: a })}
                >
                  <Pencil size={15} />
                  Modifier
                </button>
              </div>
            </div>
            <span className="account-kind">{accountKind(a)}</span>
            <h3>{a.name}</h3>
            <p>{a.bank || "Compte personnel"}</p>
            <div className="account-balance">{m(accountBalance(b, a.id, today))}</div>
            <AccountVerification
              budget={b}
              accountId={a.id}
              today={today}
              saving={busy}
              onVerify={() => open({ type: "reconcile", accountId: a.id })}
            />
            <AccountActivity
              budget={b}
              accountId={a.id}
              today={today}
              hidden={hidden}
              onTransaction={(t) => open({ type: "transaction", item: t })}
              onUpcoming={(t) => {
                const rule = b.rules.find((r) => r.id === t.ruleId);
                open(rule ? { type: "rule", item: rule } : { type: "transaction", item: t });
              }}
              onAll={() => {
                onShowOperations(a.id);
              }}
            />
            <button
              type="button"
              className="secondary full-width balance-adjust-trigger"
              aria-label={`Ajuster le solde de ${a.name}`}
              disabled={busy}
              onClick={() => open({ type: "balance", accountId: a.id })}
            >
              <Pencil size={15} />
              Ajuster le solde
            </button>
            <div className="record-danger">
              <button
                type="button"
                className="destructive-action"
                aria-label={`Supprimer ${a.name}`}
                onClick={() => onRemoveAccount(a.id)}
              >
                <Trash2 size={15} />
                Supprimer ce compte
              </button>
            </div>
          </article>
        ))}
        <button className="add-tile" type="button" onClick={() => open({ type: "account" })}>
          <span>
            <Plus size={23} />
          </span>
          <strong>Un compte de plus ?</strong>
          <small>
            Courant, épargne ou espèces.
            <br />À vous de choisir.
          </small>
        </button>
      </div>
      <InfoNote title="Chacun ses comptes, chacun son espace." icon={LockKeyhole}>
        <p>
          Vos comptes sont liés à votre connexion personnelle. Ajouter un compte ici ne crée pas de connexion avec votre
          banque.
        </p>
      </InfoNote>
    </>
  );
}
