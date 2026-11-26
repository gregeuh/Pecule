"use client";
import { goalProgress } from "../lib/budget-presentation";
import { useId, useState } from "react";
import OperationGesture from "./operation-gesture";
import SwipeTabs from "./swipe-tabs";
import WalletAccounts from "./wallet-accounts";
import { recordedOperationTotals } from "../lib/operation-totals";
import { useCompactViewport } from "./browser-preferences";
import Link from "next/link";
import AnimatedDetails from "./animated-details";
import type { ReactNode } from "react";
import CategoryIcon from "./category-icon";
import EmptyState from "./empty-state";
import { PrivacyShutter, GoalIllustration, NavigationIndicator } from "./signature-interactions";
import BudgetAlerts from "./budget-alerts";
import MonthAssist from "./month-assist";
import HomeHero from "./home-hero";
import RecurrenceWeek from "./recurrence-week";
import HomeTiles from "./home-tiles";
import type { PaydayPlan } from "../lib/month-assist";
import { getAvailableSignal } from "../lib/available-signal";
import {
  ArrowRight,
  Cloud,
  CloudOff,
  LoaderCircle,
  Settings2,
  Search,
  Info,
  ShieldCheck,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  TriangleAlert,
  ChevronDown,
  Plus,
} from "lucide-react";
import {
  futureTransactions,
  overview,
  parseDate,
  shortDate,
  shiftDate,
  money,
  type Budget,
  type Account,
  type Transaction,
} from "../lib/budget";
import { MerchantIcon } from "./merchant-fields";
type Props = {
  pending?: number;
  budget: Budget;
  today: string;
  hidden: boolean;
  demo: boolean;
  online: boolean;
  saving: boolean;
  loadError: boolean;
  onWalletAccount: (a: Account) => void;
  onAccountForecast: (a: Account) => void;
  onTransfer: () => void;
  onImport: () => void;
  onToggleHidden: () => void;
  onSettings: () => void;
  onAdd: () => void;
  onCalculate: () => void;
  onAccounts: () => void;
  onAccount: (a: Account) => void;
  onAdjustAccount: (a: Account) => void;
  onTransaction: (t: Transaction) => void;
  onUpcoming: (t: Transaction) => void;
  onTransactions: () => void;
  onRecurring: () => void;
  onGoals: () => void;
  onPlan: () => void;
  onSearch: () => void;
  onPaydaySavings: (plan: PaydayPlan) => void;
  onPostpone: (item: Transaction, date: string) => void;
  onAddAccount: () => void;
  chart: ReactNode;
  capture: ReactNode;
};
export default function ClarteDashboard(p: Props) {
  const compact = useCompactViewport();
  const [tab, setTab] = useState("overview");
  const tabId = useId();
  const b = p.budget,
    o = overview(b, p.today),
    m = (n: number, decimals = true, signed = false) => (p.hidden ? "•••• €" : money(n, decimals, signed));
  const signal = getAvailableSignal(o.available, o.days, b.settings.dailyComfortCents);
  const showSignal = !p.hidden && !p.loadError && b.accounts.some((a) => a.type !== "savings");
  const SignalIcon =
    signal.tone === "negative" ? CircleAlert : signal.tone === "attention" ? TriangleAlert : ShieldCheck;
  const upcoming = futureTransactions(b, shiftDate(p.today, 1), shiftDate(p.today, 60));
  const recent = [...b.transactions]
    .filter((t) => t.date <= p.today)
    .sort((a, b) => b.date.localeCompare(a.date) || a.label.localeCompare(b.label));
  const forecast = upcoming.filter((t) => t.date <= (o.salary?.date ?? o.end)).slice(0, 3),
    goal = b.goals[0];
  const goalReserve = goal
    ? Math.max(
        0,
        goal.monthly -
          b.transactions
            .filter(
              (t) => t.goalId === goal.id && t.amount > 0 && t.date >= p.today.slice(0, 7) + "-01" && t.date <= p.today,
            )
            .reduce((sum, t) => sum + t.amount, 0),
      )
    : 0;
  const state = !p.online
    ? "Hors connexion"
    : p.saving
      ? "Enregistrement…"
      : p.loadError
        ? "Connexion à vérifier"
        : p.demo
          ? "Démonstration"
          : p.pending
            ? `${p.pending} en attente`
            : "Synchronisé";
  const until =
    o.salary && b.settings.horizon === "salary"
      ? `votre paie, le ${shortDate(o.salary.date)}`
      : `la fin du mois, le ${shortDate(o.end)}`;
  const icon = (t: Transaction) => (
    <MerchantIcon
      label={t.label}
      merchantId={t.merchantId}
      customIconUrl={t.customIconUrl}
      fallback={<CategoryIcon category={t.category} size={21} />}
    />
  );
  const available = (
    <section
      className="clarte-budget"
      aria-label="Votre disponible"
      data-budget-tone={showSignal ? signal.tone : undefined}
    >
      <div className="clarte-available">
        <div className="clarte-available-title">
          <p>
            Votre disponible
            {showSignal && (
              <span
                className="budget-signal"
                role="status"
                aria-label={`${signal.label} : ${signal.description}`}
                title={signal.description}
              >
                <SignalIcon size={14} aria-hidden="true" />
                {signal.label}
              </span>
            )}
          </p>
          <span className="clarte-desktop-until">D’ici {until}</span>
          <button
            type="button"
            className="icon-button"
            aria-label="Comprendre le calcul du disponible"
            onClick={p.onCalculate}
          >
            <Info size={19} />
          </button>
        </div>
        <div className="clarte-amount-row">
          <strong className="clarte-amount" data-long={m(o.available).length > 13}>
            {m(o.available)}
          </strong>
          <div className="clarte-daily-desktop">
            <strong>{m(Math.floor(o.daily / 100) * 100, false)} / jour</strong>
            <span>
              sur les {o.days} jour{o.days > 1 ? "s" : ""} restants
            </span>
          </div>
        </div>
        <div className="clarte-mobile-period">
          <strong>{m(Math.floor(o.daily / 100) * 100, false)} / jour</strong>
          <span>D’ici {until}</span>
        </div>
        <button type="button" className="text-button clarte-calculation-link" onClick={p.onCalculate}>
          <Info size={15} />
          Comprendre mon disponible <ChevronRight size={15} />
        </button>
      </div>
      <dl className="clarte-formula">
        <div>
          <dt>Sur vos comptes courants</dt>
          <dd>{m(o.total)}</dd>
        </div>
        <div>
          <dt>Charges à venir</dt>
          <dd>{m(-o.expenses)}</dd>
        </div>
        <div>
          <dt>Réserve d’épargne</dt>
          <dd>{m(-o.reserve)}</dd>
        </div>
      </dl>
    </section>
  );
  const forecastCard = (
    <section className="clarte-card clarte-forecast">
      <div className="clarte-section-title">
        <h2>Les jours qui viennent</h2>
        <span>
          {shortDate(p.today)} → {shortDate(o.salary?.date ?? o.end)}
        </span>
      </div>
      <div className="clarte-calendar">
        <button type="button" className="current" onClick={p.onAccounts}>
          <span>{parseDate(p.today).toLocaleDateString("fr-FR", { weekday: "short" })}</span>
          <strong>
            {parseDate(p.today).getDate()}{" "}
            <small>{parseDate(p.today).toLocaleDateString("fr-FR", { month: "short" })}</small>
          </strong>
          <span>Aujourd’hui</span>
          <b>{m(o.total)}</b>
        </button>
        {forecast.map((t) => (
          <button type="button" key={t.id} onClick={() => p.onUpcoming(t)}>
            <span>{parseDate(t.date).toLocaleDateString("fr-FR", { weekday: "short" })}</span>
            <strong>
              {parseDate(t.date).getDate()}{" "}
              <small>{parseDate(t.date).toLocaleDateString("fr-FR", { month: "short" })}</small>
            </strong>
            <span>{t.label}</span>
            <b>{m(t.amount, true, true)}</b>
          </button>
        ))}
      </div>
      <p className="clarte-footnote">
        Les revenus futurs sont affichés ici, mais ne s’ajoutent pas au disponible d’aujourd’hui.
      </p>
    </section>
  );
  const visibleRecent = recent;
  const recentCard = (limit = compact ? 3 : 5) => (
    <section className="clarte-card clarte-recent">
      <div className="clarte-section-title">
        <h2>{"Dernières opérations"}</h2>
        <button type="button" className="text-button" onClick={p.onTransactions}>
          Tout voir <ArrowRight size={15} />
        </button>
      </div>
      {recent.length ? (
        visibleRecent.slice(0, limit).map((t) => (
          <OperationGesture
            id={t.id}
            label={t.label}
            className="clarte-transaction"
            key={t.id}
            onClick={() => p.onTransaction(t)}
          >
            {icon(t)}
            <span>
              <strong>{t.label}</strong>
              <small>
                {shortDate(t.date)} · {t.category}
              </small>
            </span>
            <b className={t.amount > 0 ? "positive" : ""}>{m(t.amount, true, true)}</b>
          </OperationGesture>
        ))
      ) : (
        <EmptyState
          title="Votre première opération"
          description="Ajoutez une opération ou importez un relevé CSV."
          action={
            <button type="button" className="text-button" onClick={p.onAdd}>
              Commencer <ArrowRight size={15} />
            </button>
          }
        />
      )}
    </section>
  );
  const plan = (
    <section className="clarte-card clarte-plan-link">
      <div>
        <h2>Votre équilibre 50 / 30 / 20.</h2>
        <p>Suivez vos besoins, vos envies et ce que vous mettez de côté.</p>
      </div>
      <button type="button" className="text-button" onClick={p.onPlan}>
        Voir ma répartition <ArrowRight size={16} />
      </button>
    </section>
  );
  const chart = (
    <AnimatedDetails className="clarte-card clarte-chart">
      <summary>
        Anticiper mes soldes <ChevronRight size={18} />
      </summary>
      <div>
        {p.chart}
        <p className="clarte-footnote">D’après les opérations enregistrées et les récurrences prévues.</p>
      </div>
    </AnimatedDetails>
  );
  const accounts = (
    <WalletAccounts
      budget={b}
      today={p.today}
      hidden={p.hidden}
      onAccount={p.onWalletAccount}
      onForecast={p.onAccountForecast}
      onAll={p.onAccounts}
      onAdd={p.onAddAccount}
    />
  );
  const { share: goalShare, percent: goalPercent } = goal
    ? goalProgress(goal.saved, goal.target)
    : { share: 0, percent: 0 };
  const goalCard = (
    <section className="clarte-goal">
      <GoalIllustration icon={goal?.icon ?? "shield"} progress={p.hidden ? 0 : goalShare} />
      <div>
        <h2>{goal?.name ?? "De la place pour vos projets."}</h2>
        <p className="clarte-goal-mobile">
          {goal ? `${m(goalReserve)} réservés pour cet objectif ce mois-ci` : "Créez votre premier objectif d’épargne."}
        </p>
        <div className="clarte-goal-desktop">
          <p>{goal ? `Votre objectif : ${m(goal.target, false)}` : "Chaque petit pas compte."}</p>
          {goal && (
            <dl>
              <dt>Réserve mensuelle</dt>
              <dd>{m(goal.monthly, false)}</dd>
            </dl>
          )}
          <p>Réserver une somme dans Pécule ne réalise aucun virement bancaire.</p>
          <button type="button" className="primary full-width" onClick={p.onGoals}>
            {goal ? "Voir mon objectif" : "Créer un objectif"}
          </button>
        </div>
      </div>
      <button type="button" className="clarte-goal-hit" aria-label="Voir mon épargne" onClick={p.onGoals} />
    </section>
  );
  const upcomingCard = (
    <section className="clarte-upcoming">
      <div className="clarte-section-title">
        <h2>À venir</h2>
        <button type="button" className="text-button" onClick={p.onRecurring}>
          Tout voir <ArrowRight size={15} />
        </button>
      </div>
      {!upcoming.length && <p className="clarte-upcoming-empty">Aucune échéance prévue pour les 60 prochains jours.</p>}
      {upcoming.slice(0, 3).map((t) => (
        <button type="button" className="clarte-due" key={t.id} onClick={() => p.onUpcoming(t)}>
          <span className="clarte-icon">
            <CalendarDays size={19} />
          </span>
          <span>
            <strong>{t.label}</strong>
            <small>
              {shortDate(t.date)} · {t.amount > 0 ? "entrée prévue" : "échéance prévue"}
            </small>
          </span>
          <b>{m(t.amount, true, true)}</b>
        </button>
      ))}
    </section>
  );
  const monthly = recordedOperationTotals(
    b.transactions.filter((t) => t.date.startsWith(p.today.slice(0, 7))),
    p.today,
  );
  const tabs = [
    { id: "overview", label: "Aperçu" },
    { id: "operations", label: "Activité" },
    { id: "forecast", label: "Prévisions" },
  ];
  const header = (
    <header className="clarte-header">
      <Link href="/" className="clarte-mobile-logo" aria-label="Pécule, accueil">
        pecule.
      </Link>
      <div className="clarte-desktop-title">
        <h1>Vue d’ensemble</h1>
        <p>
          {parseDate(p.today).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
          {p.demo ? "données de démonstration" : "votre espace personnel"}
        </p>
      </div>
      <h1 className="wallet-mobile-heading sr-only">Vue d’ensemble</h1>
      <div className="clarte-header-actions">
        <span className="clarte-sync" title={state} role="status">
          <span className="sr-only">{state}</span>
          {p.saving ? (
            <LoaderCircle size={18} className="spin" />
          ) : p.online ? (
            <Cloud size={18} />
          ) : (
            <CloudOff size={18} />
          )}
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label="Rechercher dans Pécule"
          title="Rechercher (touche /)"
          onClick={p.onSearch}
        >
          <Search size={20} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label={p.hidden ? "Afficher les montants" : "Masquer les montants"}
          aria-pressed={p.hidden}
          onClick={p.onToggleHidden}
        >
          <PrivacyShutter hidden={p.hidden} />
        </button>
        <button type="button" className="icon-button" aria-label="Réglages" onClick={p.onSettings}>
          <Settings2 size={22} />
        </button>
      </div>
    </header>
  );
  const footer = (
    <div className="clarte-footer">
      Votre espace est personnel. Vous gardez la main sur votre argent. {p.demo ? "Démonstration" : ""}
    </div>
  );
  if (compact)
    return (
      <div className="clarte-dashboard wallet-dashboard home-tiles-layout">
        {header}
        {b.accounts.some((a) => a.type !== "savings") && !p.loadError && (
          <HomeHero
            available={o.available}
            daily={o.daily}
            until={o.salary && b.settings.horizon === "salary" ? o.salary.date : o.end}
            untilPayday={!!o.salary && b.settings.horizon === "salary"}
            tone={showSignal ? signal.tone : null}
            hidden={p.hidden}
            savedCents={b.goals.reduce((sum, g) => sum + g.saved, 0)}
            budgetKey={`${b.name}|${b.goals.map((g) => g.id).join(",")}`}
            onOpen={p.onCalculate}
          />
        )}
        {!p.loadError && (
          <MonthAssist
            budget={b}
            today={p.today}
            hidden={p.hidden}
            busy={p.saving}
            onPaydaySavings={p.onPaydaySavings}
            onPostpone={p.onPostpone}
          />
        )}
        {!p.loadError && <BudgetAlerts budget={b} today={p.today} hidden={p.hidden} onOperations={p.onTransactions} />}
        <HomeTiles
          budget={b}
          today={p.today}
          end={o.end}
          untilPayday={!!o.salary && b.settings.horizon === "salary"}
          spent={monthly.spent}
          income={o.income}
          hidden={p.hidden}
          m={m}
          onAccounts={p.onAccounts}
          onRecurring={p.onRecurring}
          onTransactions={p.onTransactions}
          onGoals={p.onGoals}
        />
        <div className="wallet-overview-recent">{recentCard(2)}</div>
        <AnimatedDetails className="wallet-capture home-forecast">
          <summary>
            Prévisions et calcul du disponible
            <ChevronDown size={17} />
          </summary>
          <div className="home-forecast-body">
            {available}
            <WalletAccounts
              forecastsOnly
              budget={b}
              today={p.today}
              hidden={p.hidden}
              onAccount={p.onWalletAccount}
              onForecast={p.onAccountForecast}
              onAll={p.onAccounts}
              onAdd={p.onAddAccount}
            />
            {chart}
            {forecastCard}
          </div>
        </AnimatedDetails>
        <AnimatedDetails className="wallet-capture">
          <summary>
            Ma saisie et mes favoris
            <ChevronDown size={17} />
          </summary>
          {p.capture}
        </AnimatedDetails>
        {footer}
      </div>
    );
  return (
    <div className="clarte-dashboard wallet-dashboard">
      {header}
      <div className="wallet-home-grid">
        <div className="wallet-home-accounts">
          {b.accounts.some((a) => a.type !== "savings") && !p.loadError && (
            <HomeHero
              available={o.available}
              daily={o.daily}
              until={o.salary && b.settings.horizon === "salary" ? o.salary.date : o.end}
              untilPayday={!!o.salary && b.settings.horizon === "salary"}
              tone={showSignal ? signal.tone : null}
              hidden={p.hidden}
              savedCents={b.goals.reduce((sum, g) => sum + g.saved, 0)}
              budgetKey={`${b.name}|${b.goals.map((g) => g.id).join(",")}`}
              onOpen={p.onCalculate}
            />
          )}
          {accounts}
          {!p.loadError && (
            <MonthAssist
              budget={b}
              today={p.today}
              hidden={p.hidden}
              busy={p.saving}
              onPaydaySavings={p.onPaydaySavings}
              onPostpone={p.onPostpone}
            />
          )}
          <AnimatedDetails className="wallet-capture">
            <summary>
              Ma saisie et mes favoris
              <ChevronDown size={17} />
            </summary>
            {p.capture}
          </AnimatedDetails>
        </div>
        <div className="wallet-home-content">
          <div className="wallet-tabs" role="tablist" aria-label="Vue du budget">
            <NavigationIndicator active={tab} selector='button[aria-selected="true"]' />
            {tabs.map((item, index) => (
              <button
                key={item.id}
                id={`${tabId}-${item.id}`}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`${tabId}-panel-${item.id}`}
                tabIndex={tab === item.id ? 0 : -1}
                onClick={() => setTab(item.id)}
                onKeyDown={(e) => {
                  const next =
                    e.key === "ArrowRight"
                      ? (index + 1) % tabs.length
                      : e.key === "ArrowLeft"
                        ? (index + tabs.length - 1) % tabs.length
                        : e.key === "Home"
                          ? 0
                          : e.key === "End"
                            ? tabs.length - 1
                            : -1;
                  if (next < 0) return;
                  e.preventDefault();
                  setTab(tabs[next].id);
                  document.getElementById(`${tabId}-${tabs[next].id}`)?.focus();
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <SwipeTabs index={tabs.findIndex((t) => t.id === tab)} onChange={(index) => setTab(tabs[index].id)}>
            <div className="wallet-tab-content">
              <div
                role="tabpanel"
                tabIndex={0}
                id={`${tabId}-panel-overview`}
                aria-labelledby={`${tabId}-overview`}
                hidden={tab !== "overview"}
              >
                {!p.loadError && (
                  <RecurrenceWeek
                    budget={b}
                    today={p.today}
                    end={o.end}
                    untilPayday={!!o.salary && b.settings.horizon === "salary"}
                    hidden={p.hidden}
                    m={m}
                    onOpen={p.onUpcoming}
                    onMonth={p.onRecurring}
                  />
                )}
                <section className="wallet-month-summary" aria-label="Repères du mois et de la période choisie">
                  <div>
                    <span>Dépenses de {parseDate(p.today).toLocaleDateString("fr-FR", { month: "long" })}</span>
                    <strong>{m(monthly.spent)}</strong>
                    <small>Virements internes exclus</small>
                  </div>
                  <div>
                    <span>Revenus de {parseDate(p.today).toLocaleDateString("fr-FR", { month: "long" })}</span>
                    <strong>{m(o.income)}</strong>
                    <small>Reçus jusqu’à aujourd’hui</small>
                  </div>
                </section>
                {!p.loadError && (
                  <BudgetAlerts budget={b} today={p.today} hidden={p.hidden} onOperations={p.onTransactions} />
                )}
                <div className="wallet-overview-recent">{recentCard(2)}</div>
                {goal ? (
                  <button type="button" className="wallet-goal-row" onClick={p.onGoals}>
                    <span className="wallet-goal-icon">
                      <GoalIllustration icon={goal.icon} progress={p.hidden ? 0 : goalShare} />
                    </span>
                    <span>
                      <strong>{goal.name}</strong>
                      <small>
                        {m(goal.saved)} sur {m(goal.target)}
                      </small>
                      <span className="wallet-goal-track" aria-hidden="true">
                        <i style={{ width: p.hidden ? "0%" : `${goalShare}%` }} />
                      </span>
                    </span>
                    <b>{p.hidden ? "Masqué" : `${goalPercent} %`}</b>
                  </button>
                ) : (
                  <button type="button" className="secondary full-width wallet-goal-create" onClick={p.onGoals}>
                    <Plus size={17} aria-hidden="true" />
                    Créer un objectif d’épargne
                  </button>
                )}
              </div>
              <div
                role="tabpanel"
                tabIndex={0}
                id={`${tabId}-panel-operations`}
                aria-labelledby={`${tabId}-operations`}
                hidden={tab !== "operations"}
              >
                {recentCard()}
                <button type="button" className="secondary full-width" onClick={p.onTransactions}>
                  Voir toutes les opérations
                  <ArrowRight size={16} />
                </button>
              </div>
              <div
                role="tabpanel"
                tabIndex={0}
                id={`${tabId}-panel-forecast`}
                aria-labelledby={`${tabId}-forecast`}
                hidden={tab !== "forecast"}
              >
                {available}
                {chart}
                {upcomingCard}
                {forecastCard}
                {goalCard}
                {plan}
              </div>
            </div>
          </SwipeTabs>
        </div>
      </div>
      {footer}
    </div>
  );
}
