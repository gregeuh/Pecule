"use client";
import { useState } from "react";
import { Check, ChevronDown, ChevronUp, GripVertical, LoaderCircle, Lock, Minus, Plus, RotateCcw } from "lucide-react";
import type { Budget } from "../lib/budget";
import {
  DEFAULT_HOME_LAYOUT,
  HOME_BLOCK_LABELS,
  hideBlock,
  isDefaultLayout,
  moveBlock,
  normalizeLayout,
  showBlock,
} from "../lib/home-layout";

/** « Mon accueil »: move a block up or down, remove it, put it back, or go back to the default home. */
export default function HomeLayoutEditor({
  budget: b,
  saving,
  save,
  onDone,
}: {
  budget: Budget;
  saving: boolean;
  save: (next: Budget, message?: string) => Promise<boolean>;
  onDone: () => void;
}) {
  const [layout, setLayout] = useState(() => normalizeLayout(b.settings.homeLayout));
  const shown = layout.order.filter((id) => !layout.hidden.includes(id));
  return (
    <div className="home-layout-editor">
      <p className="form-intro">
        Montez, descendez ou retirez les blocs de votre accueil. Vous retrouverez cette disposition sur tous vos
        appareils.
      </p>
      <div className="home-layout-fixed">
        <Lock size={16} aria-hidden="true" />
        <span>
          <strong>Ce qu’il vous reste</strong> · toujours en haut
        </span>
      </div>
      <ol className="home-layout-list">
        {shown.map((id, i) => (
          <li key={id}>
            <GripVertical size={16} aria-hidden="true" />
            <span>
              <strong>{HOME_BLOCK_LABELS[id].name}</strong>
              <small>{HOME_BLOCK_LABELS[id].hint}</small>
            </span>
            <button
              type="button"
              aria-label={`Monter « ${HOME_BLOCK_LABELS[id].name} »`}
              disabled={i === 0 || saving}
              onClick={() => setLayout(moveBlock(layout, id, -1))}
            >
              <ChevronUp size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Descendre « ${HOME_BLOCK_LABELS[id].name} »`}
              disabled={i === shown.length - 1 || saving}
              onClick={() => setLayout(moveBlock(layout, id, 1))}
            >
              <ChevronDown size={17} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="home-layout-remove"
              aria-label={`Retirer « ${HOME_BLOCK_LABELS[id].name} »`}
              disabled={shown.length === 1 || saving}
              onClick={() => setLayout(hideBlock(layout, id))}
            >
              <Minus size={17} aria-hidden="true" />
            </button>
          </li>
        ))}
      </ol>
      {layout.hidden.length > 0 && (
        <div className="home-layout-hidden">
          <h3>Blocs retirés</h3>
          <div>
            {layout.hidden.map((id) => (
              <button key={id} type="button" disabled={saving} onClick={() => setLayout(showBlock(layout, id))}>
                <Plus size={15} aria-hidden="true" />
                {HOME_BLOCK_LABELS[id].name}
              </button>
            ))}
          </div>
          {layout.hidden.includes("conseils") && (
            <p className="field-hint">Si votre reste passe sous zéro, l’alerte s’affichera quand même.</p>
          )}
        </div>
      )}
      <div className="form-actions">
        <button
          type="button"
          className="primary"
          disabled={saving}
          onClick={async () => {
            const settings = { ...b.settings };
            if (isDefaultLayout(layout)) delete settings.homeLayout;
            else settings.homeLayout = layout;
            if (await save({ ...b, settings }, "Votre accueil est enregistré.")) onDone();
          }}
        >
          {saving ? <LoaderCircle size={16} className="spin" /> : <Check size={16} />}
          Terminé
        </button>
        <button
          type="button"
          className="text-button"
          disabled={saving || isDefaultLayout(layout)}
          onClick={() => setLayout(normalizeLayout(DEFAULT_HOME_LAYOUT))}
        >
          <RotateCcw size={15} aria-hidden="true" />
          Revenir à l’accueil par défaut
        </button>
      </div>
    </div>
  );
}
