"use client";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  LoaderCircle,
  LogOut,
  Smartphone,
  Sparkles,
  Upload,
} from "lucide-react";
import type { Budget } from "../lib/budget";
import type { ConfirmationKind } from "../lib/confirmation-kind";
import { parseAmount } from "../lib/csv";
import type { Modal } from "./budget-modal";
import AnimatedDetails from "./animated-details";
import BudgetPreferences from "./budget-preferences";
import BudgetVersions from "./budget-versions";
import { useFormDraftStore } from "./form-drafts";
import GoogleConnection from "./google-connection";
import { ErrorMessage } from "./interface-feedback";
import ReminderSettings from "./reminder-settings";
import ThemePicker from "./theme-picker";
import { ValidatedForm, FormField } from "./validated-form";
import { downloadFile, inputAmount } from "./download-file";

export type SettingsPageProps = {
  budget: Budget;
  user: { id?: string; name: string | null; email: string } | null;
  demo: boolean;
  today: string;
  hasBudget: boolean;
  offlinePrepared: boolean;
  hidden: boolean;
  saving: boolean;
  busy: boolean;
  error: string;
  setError: (message: string) => void;
  setToast: (message: string, success?: boolean, kind?: ConfirmationKind) => void;
  save: (next: Budget, message?: string) => Promise<boolean>;
  open: (modal: Modal) => void;
  load: () => unknown;
  exportCSV: () => void;
  /** Leave the personal budget for the in-memory demonstration (drafts are cleared here). */
  onExploreDemo: () => void;
};

/** Réglages: appearance, budget preferences, data (backups, versions) and account. */
export default function SettingsPage({
  budget: b,
  user,
  demo,
  today,
  hasBudget,
  offlinePrepared,
  hidden,
  saving,
  busy,
  error,
  setError,
  setToast,
  save,
  open,
  load,
  exportCSV,
  onExploreDemo,
}: SettingsPageProps) {
  const drafts = useFormDraftStore();
  return (
    <div key={demo ? "demo-settings" : "personal-settings"} className="settings-workspace">
      <ReminderSettings demo={demo} />
      <section className="card settings-panel offline-preparation">
        <h3>Saisie hors connexion</h3>
        <p>
          {demo
            ? "Connectez-vous et ouvrez votre budget en ligne pour préparer cet appareil."
            : offlinePrepared
              ? "La saisie locale est prête sur cet appareil."
              : "La préparation se fait pendant une ouverture en ligne. Gardez Pécule ouvert tant qu’elle n’est pas terminée."}
        </p>
        <p className="field-hint">
          Seuls les noms des comptes et les opérations en attente sont conservés localement. Ouvrez Pécule avec le même
          compte pour synchroniser ; une déconnexion verrouille ce formulaire sans supprimer les saisies en attente.
        </p>
        <a className="text-button" href="/offline.html">
          Ouvrir la saisie locale
        </a>
      </section>
      <AnimatedDetails className="card gesture-help">
        <summary>
          Gestes et raccourcis iPhone
          <ChevronDown size={17} />
        </summary>
        <ul>
          <li>Balayez le contenu de l’accueil pour changer d’onglet. Les bords restent réservés à iOS.</li>
          <li>Glissez le + vers le haut pour une dépense. Maintenez-le pour choisir Dépense, Revenu ou Virement.</li>
          <li>Maintenez une opération pour son aperçu, ou balayez-la vers la gauche pour ses actions.</li>
          <li>Maintenez une carte de compte pour ses raccourcis.</li>
          <li>Tirez l’en-tête d’un panneau vers le bas pour le fermer. Votre brouillon reste conservé.</li>
          <li>
            Touchez l’onglet actif du menu pour remonter. Sur Opérations, deux appuis rapprochés ouvrent la recherche.
          </li>
        </ul>
        <p className="field-hint">
          Les boutons restent disponibles. Aucune écriture n’est enregistrée par un geste seul.
        </p>
      </AnimatedDetails>
      <nav className="settings-index" aria-label="Rubriques des réglages">
        <a href="#settings-appearance">Apparence</a>
        <a href="#settings-budget">Budget</a>
        <a href="#settings-data">Données</a>
        <a href="#settings-account">Compte</a>
      </nav>
      <section className="settings-group" id="settings-appearance" aria-labelledby="appearance-title">
        <header>
          <h2 id="appearance-title">Apparence et application</h2>
          <p>Votre confort de lecture, sur cet appareil.</p>
        </header>
        <div className="settings-grid">
          <ThemePicker
            onSaved={() => setToast("Votre apparence a été mise à jour sur cet appareil.", true, "settings")}
          />
          <section className="card settings-card">
            <span className="settings-icon">
              <Smartphone size={21} />
            </span>
            <h3>Toujours à portée de main.</h3>
            <p>Retrouvez Pécule sur votre écran d’accueil, comme une application.</p>
            <button className="secondary full-width" type="button" onClick={() => open({ type: "install" })}>
              Installer Pécule <ArrowUpRight size={15} />
            </button>
          </section>
        </div>
      </section>
      <section className="settings-group" id="settings-budget" aria-labelledby="budget-title">
        <header>
          <h2 id="budget-title">Votre budget au quotidien</h2>
          <p>Calcul du disponible, seuils et catégories.</p>
        </header>
        <div className="settings-grid">
          <section className="card settings-card">
            <h3>Mon quotidien</h3>
            <p>Quelques repères pour un budget qui vous ressemble.</p>
            <ValidatedForm
              draftKey="settings:preferences"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  reserve = parseAmount(String(f.get("reserve")));
                if (reserve === null || reserve < 0) {
                  setError("La réserve doit être un montant positif ou nul.");
                  return;
                }
                if (
                  await save({
                    ...b,
                    name: String(f.get("name")).trim(),
                    settings: {
                      ...b.settings,
                      horizon: f.get("horizon") as Budget["settings"]["horizon"],
                      reserve,
                      holidayCalendar: f.get("holidays") as Budget["settings"]["holidayCalendar"],
                    },
                  })
                )
                  drafts?.clear("settings:preferences");
              }}
            >
              <FormField label="Votre prénom">
                <input name="name" maxLength={60} defaultValue={b.name} />
              </FormField>
              <FormField
                label="Calculer mon disponible jusqu’à…"
                hint="Sans salaire prévu, Pécule utilise la fin du mois."
              >
                <select name="horizon" defaultValue={b.settings.horizon}>
                  <option value="salary">Mon prochain salaire</option>
                  <option value="month">La fin du mois</option>
                </select>
              </FormField>
              <FormField
                label="Réserve complémentaire pour la période"
                hint="S’ajoute aux réserves mensuelles de vos objectifs. Ce montant est retiré du disponible sans mouvement bancaire."
              >
                <span className="amount-input">
                  <input
                    type="number"
                    name="reserve"
                    min="0"
                    max="1000000000"
                    step="0.01"
                    defaultValue={inputAmount(b.settings.reserve)}
                  />
                  <span>€</span>
                </span>
              </FormField>
              <FormField
                label="Calendrier par défaut des nouvelles récurrences"
                hint="France : jours fériés nationaux, hors spécificités régionales. Chaque récurrence garde son propre calendrier."
              >
                <select name="holidays" defaultValue={b.settings.holidayCalendar}>
                  <option value="FR">France · lundi à vendredi, hors jours fériés</option>
                  <option value="none">Lundi à vendredi · sans jours fériés</option>
                </select>
              </FormField>
              {error && <ErrorMessage>{error}</ErrorMessage>}
              <button className="primary" type="submit" disabled={busy}>
                {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}Enregistrer mes préférences
              </button>
            </ValidatedForm>
          </section>
          <BudgetPreferences
            key={JSON.stringify(b.settings)}
            budget={b}
            saving={busy}
            hidden={hidden}
            save={save}
            confirm={(title, message, action) => open({ type: "confirm", title, message, action })}
          />
        </div>
      </section>
      <section className="settings-group" id="settings-data" aria-labelledby="data-title">
        <header>
          <h2 id="data-title">Vos données</h2>
          <p>Sauvegarder, exporter et retrouver votre budget.</p>
        </header>
        <section className="card settings-card">
          <h3>Vos données vous appartiennent.</h3>
          <p>
            {demo
              ? "Vous explorez la démonstration. Aucune donnée de cette démo n’est enregistrée sur votre compte."
              : "Vos données sont enregistrées sur votre compte et synchronisées entre vos appareils. Elles ne sont pas partagées avec les autres utilisateurs."}
          </p>
          <div className="settings-links">
            {demo ? (
              <button
                type="button"
                onClick={() =>
                  downloadFile(JSON.stringify(b, null, 2), `pecule-sauvegarde-${today}.json`, "application/json")
                }
              >
                <Download size={16} />
                Télécharger une sauvegarde JSON
              </button>
            ) : (
              <a href="/api/budget/export" download>
                <Download size={16} />
                Télécharger une sauvegarde JSON
              </a>
            )}
            <button type="button" onClick={exportCSV}>
              <Download size={16} />
              Exporter mes opérations en CSV
            </button>
            <label className="restore-backup">
              <Upload size={16} />
              Restaurer une sauvegarde JSON
              <input
                type="file"
                accept=".json,application/json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  e.target.value = "";
                  if (file.size > 4000000) {
                    setToast("La sauvegarde dépasse 4 Mo.");
                    return;
                  }
                  try {
                    const { budgetSchema } = await import("../lib/validation");
                    const result = budgetSchema.safeParse(JSON.parse(await file.text()));
                    if (!result.success) throw new Error("La sauvegarde Pécule est invalide.");
                    const restored = result.data;
                    open({
                      type: "confirm",
                      title: "Restaurer cette sauvegarde ?",
                      tone: "restore",
                      message:
                        "Cette sauvegarde remplacera votre budget actuel. Téléchargez d’abord votre budget si vous souhaitez le conserver.",
                      action: () => save(restored, "Votre sauvegarde a été restaurée."),
                    });
                  } catch (err) {
                    setToast(err instanceof Error ? err.message : "Fichier illisible.");
                  }
                }}
              />
            </label>
            <button
              type="button"
              onClick={() => {
                drafts?.clearAll();
                onExploreDemo();
              }}
            >
              <Sparkles size={16} />
              Explorer la démonstration
            </button>
            {demo ? (
              <button type="button" onClick={() => (hasBudget ? void load() : open({ type: "start" }))}>
                <ArrowRight size={16} />
                {hasBudget ? "Retrouver mon budget" : "Créer mon budget personnel"}
              </button>
            ) : null}
          </div>
          {demo ? null : (
            <BudgetVersions
              onError={setToast}
              onRestore={(restored, savedAt) =>
                open({
                  type: "confirm",
                  title: "Restaurer cette version ?",
                  tone: "restore",
                  message: `Votre budget reviendra à son état du ${savedAt}. La version actuelle restera disponible dans les versions précédentes.`,
                  action: () => save(restored, "La version a été restaurée."),
                })
              }
            />
          )}
        </section>
      </section>
      <section className="settings-group" id="settings-account" aria-labelledby="account-title">
        <header>
          <h2 id="account-title">Votre compte</h2>
          <p>{user ? "Votre accès personnel à Pécule." : "Vous explorez Pécule sans connexion."}</p>
        </header>
        <div className="settings-grid">
          {user ? (
            <>
              <section className="card settings-card">
                <h3>Connexion personnelle</h3>
                <p className="account-email">{user.email}</p>
                <a className="secondary" href="/sign-out" target="_top">
                  <LogOut size={16} />
                  Me déconnecter
                </a>
              </section>
              <GoogleConnection email={user.email} />
            </>
          ) : (
            <section className="card settings-card">
              <h3>Un espace pour votre budget</h3>
              <p>Connectez-vous pour retrouver vos données sur vos appareils.</p>
              <a className="secondary" href="/sign-in">
                Me connecter <ArrowRight size={15} />
              </a>
            </section>
          )}
        </div>
      </section>
      <div className="settings-brand">
        <Image unoptimized width={32} height={32} src="/favicon.svg" alt="" />
        <span>
          Pécule <small>Votre argent, l’esprit léger. · v1.0</small>
        </span>
      </div>
    </div>
  );
}
