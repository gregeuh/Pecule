"use client";
import { useCallback, useContext, useMemo, type CSSProperties } from "react";
import AnimatedAmount from "./animated-amount";
import AccountVerification from "./account-verification";
import Pressable from "./pressable";
import { GestureActions } from "./operation-gesture";
import { Plus, Wallet, ArrowRight, ChevronDown } from "lucide-react";
import { balanceOutlook } from "../lib/balance-outlook";
import { accountBalance, money, shortDate, type Budget, type Account } from "../lib/budget";
import { walletSurfaceStyles, accountKind } from "../lib/wallet-presentation";
import EmptyState from "./empty-state";
export default function WalletAccounts({
  budget,
  today,
  hidden,
  onAccount,
  onAll,
  onAdd,
  onForecast,
  forecastsOnly = false,
}: {
  /** iPhone home in tiles: only the list of balances and forecasts, every account. */
  forecastsOnly?: boolean;
  onForecast: (account: Account) => void;
  budget: Budget;
  today: string;
  hidden: boolean;
  onAccount: (account: Account) => void;
  onAll: () => void;
  onAdd: () => void;
}) {
  const actions = useContext(GestureActions);
  const first = budget.accounts.find((a) => a.type === "current") ?? budget.accounts[0];
  const cards = first
    ? [
        ...budget.accounts
          .filter((a) => a.id !== first.id)
          .slice(0, 2)
          .reverse(),
        first,
      ]
    : [];
  const forecasts = useMemo(
    () =>
      budget.accounts.map((account) => {
        const outlook = balanceOutlook(budget, today, 30, account.id);
        const projected =
          outlook.movements.length > 0 || (account.openingDate > today && account.openingDate <= outlook.end.date);
        return { account, outlook, projected };
      }),
    [budget, today],
  );
  const summaries = forecastsOnly
    ? forecasts
    : forecasts.filter(({ account, projected }) => projected || !cards.some((card) => card.id === account.id));
  const m = useCallback((amount: number) => (hidden ? "•••• €" : money(amount)), [hidden]);
  const total = budget.accounts.reduce((sum, a) => sum + accountBalance(budget, a.id, today), 0);
  const forecastList = summaries.length > 0 && (
    <ul className="wallet-account-forecasts" aria-label="Soldes et prévisions des comptes">
      {summaries.map(({ account, outlook, projected }) => (
        <li key={account.id}>
          <button
            type="button"
            onClick={() => (projected ? onForecast(account) : onAccount(account))}
            aria-label={
              projected
                ? `Prévision de ${account.name}, actuel ${m(outlook.current)}, ${m(outlook.end.value)} au ${shortDate(outlook.end.date)}`
                : `${account.name}, ${m(outlook.current)}, voir le détail`
            }
          >
            <span>
              <strong>{projected ? `Prévu au ${shortDate(outlook.end.date)}` : account.name}</strong>
              <small>{projected ? account.name : "Solde actuel"}</small>
            </span>
            <b>{m(projected ? outlook.end.value : outlook.current)}</b>
            <ArrowRight size={15} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
  if (forecastsOnly) return forecastList || null;
  return (
    <section className="wallet-accounts" aria-label="Soldes de vos comptes">
      <div className="wallet-accounts-heading">
        <h2>
          <button
            type="button"
            className="wallet-manage-title"
            aria-label={budget.accounts.length > 3 ? `Voir les ${budget.accounts.length} comptes` : "Gérer mes comptes"}
            onClick={onAll}
          >
            Mes comptes
            <ChevronDown size={16} />
          </button>
        </h2>
        <div>
          <span>Total des comptes</span>
          <strong>{m(total)}</strong>
        </div>
      </div>
      {cards.length ? (
        <>
          <div className="wallet-stack" style={{ "--wallet-depth": cards.length - 1 } as CSSProperties}>
            {cards.map((a, index) => (
              <Pressable
                depth
                type="button"
                onHold={() => actions.account(a.id)}
                key={a.id}
                className={`wallet-card clarte-account ${index === cards.length - 1 ? "wallet-front" : ""}`}
                data-wallet-account={a.id}
                aria-label={`${a.name}, ${hidden ? "solde masqué" : money(accountBalance(budget, a.id, today))}, voir le détail`}
                style={{ "--wallet-index": index, ...walletSurfaceStyles(a.color) } as CSSProperties}
                onClick={(e) => {
                  e.currentTarget.focus({ preventScroll: true });
                  onAccount(a);
                }}
              >
                <span className="wallet-card-top">
                  <strong>{a.name}</strong>
                  {index === cards.length - 1 ? (
                    <Wallet size={19} aria-hidden="true" />
                  ) : (
                    <b>{m(accountBalance(budget, a.id, today))}</b>
                  )}
                </span>
                <span className="wallet-card-balance" data-long={m(accountBalance(budget, a.id, today)).length > 15}>
                  <AnimatedAmount cents={accountBalance(budget, a.id, today)} hidden={hidden} format={m} />
                </span>
                <span className="wallet-card-bottom">
                  <span>{accountKind(a)}</span>
                  <span>
                    Voir le compte <ArrowRight size={14} />
                  </span>
                </span>
                <span className="wallet-card-mark" aria-hidden="true">
                  P
                </span>
              </Pressable>
            ))}
          </div>
          {forecastList}
          <AccountVerification budget={budget} accountId={first!.id} today={today} compact />
        </>
      ) : (
        <EmptyState
          title="Votre premier compte"
          description="Ajoutez votre solde de référence pour commencer."
          action={
            <button type="button" className="primary" onClick={onAdd}>
              <Plus size={17} />
              Ajouter un compte
            </button>
          }
        />
      )}
    </section>
  );
}
