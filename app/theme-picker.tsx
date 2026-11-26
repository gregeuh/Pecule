"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import {
  applyPaletteThemeColor,
  appearanceChoices,
  choiceToStorage,
  PALETTE_KEY,
  readPalette,
  storageToChoice,
  type AppearanceChoice,
} from "../lib/appearance";

const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Another window may change the palette (app/glass-backdrop.tsx applies it): refresh the radios too.
  const other = (event: StorageEvent) => {
    if (event.key === PALETTE_KEY) listener();
  };
  window.addEventListener("storage", other);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", other);
  };
};
const applyPalette = (palette: string) => {
  try {
    localStorage.setItem(PALETTE_KEY, palette);
  } catch {}
  document.documentElement.dataset.palette = palette;
  applyPaletteThemeColor(palette);
  listeners.forEach((listener) => listener());
};
const currentPalette = () => readPalette(document.documentElement.dataset.palette ?? null);

/** Thèmes Liquid Glass : quatre palettes claires, Nuit, et Automatique (palette claire le jour, Nuit le soir). */
export default function ThemePicker({ onSaved }: { onSaved?: () => void }) {
  const { theme = "system", setTheme } = useTheme();
  const palette = useSyncExternalStore(subscribe, currentPalette, () => "peche" as const);
  const chosen = storageToChoice(theme, palette);
  const choose = (choice: AppearanceChoice) => {
    const next = choiceToStorage(choice, palette);
    applyPalette(next.palette);
    setTheme(next.mode);
    onSaved?.();
  };
  return (
    <section className="card settings-card theme-card">
      <h3 id="theme-title">Thème</h3>
      <div className="theme-choices" role="radiogroup" aria-labelledby="theme-title">
        {appearanceChoices.map(({ id, label, swatch }) => (
          <label key={id} className="theme-choice" data-choice={id}>
            <input
              type="radio"
              name="theme"
              value={id}
              checked={chosen === id}
              onChange={() => choose(id)}
              className="theme-input"
            />
            <span className="theme-preview" aria-hidden="true" data-preview={id}>
              {swatch.map((color, index) => (
                <i key={index} style={{ background: color }} />
              ))}
              <b />
            </span>
            <span className="theme-name">
              {chosen === id && <Check size={14} aria-hidden="true" />}
              {label}
            </span>
          </label>
        ))}
      </div>
      <p className="field-hint">
        Automatique suit l’iPhone : votre dernier thème clair le jour, Nuit le soir. Ce choix s’applique à cet appareil.
      </p>
    </section>
  );
}
