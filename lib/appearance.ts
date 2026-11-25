/** Appearance: a light palette (stored apart) plus the light/dark/system mode owned by next-themes. */
export type LightPalette = "peche" | "lavande" | "menthe" | "ocean";
export type AppearanceChoice = LightPalette | "nuit" | "auto";
export const PALETTE_KEY = "pecule-palette";
export const MODE_KEY = "pecule-theme";

const lightPalettes: LightPalette[] = ["peche", "lavande", "menthe", "ocean"];

/** Swatches are each palette's three colour washes (see app/theme.css). */
export const appearanceChoices: { id: AppearanceChoice; label: string; swatch: [string, string, string] }[] = [
  { id: "peche", label: "Pêche", swatch: ["#ff9d7e", "#ffd0a6", "#d6c4ff"] },
  { id: "lavande", label: "Lavande", swatch: ["#b8a4ff", "#ffc0a4", "#a9d6ff"] },
  { id: "menthe", label: "Menthe", swatch: ["#8fdcc0", "#a9d6ff", "#ffe1a8"] },
  { id: "ocean", label: "Océan", swatch: ["#5aa9e6", "#7fe0d6", "#6f8fe0"] },
  { id: "nuit", label: "Nuit", swatch: ["#a0412c", "#5a3a8e", "#c06a2e"] },
  { id: "auto", label: "Automatique", swatch: ["#ff9d7e", "#5a3a8e", "#ffd0a6"] },
];

export function readPalette(value: string | null): LightPalette {
  return lightPalettes.includes(value as LightPalette) ? (value as LightPalette) : "peche";
}

export function choiceToStorage(
  choice: AppearanceChoice,
  currentPalette: LightPalette,
): { mode: "light" | "dark" | "system"; palette: LightPalette } {
  if (choice === "nuit") return { mode: "dark", palette: currentPalette };
  if (choice === "auto") return { mode: "system", palette: currentPalette };
  return { mode: "light", palette: choice };
}

export function storageToChoice(mode: string | null, palette: string | null): AppearanceChoice {
  if (mode === "dark") return "nuit";
  if (mode === "light") return readPalette(palette);
  return "auto";
}

/** Inline, before the first paint: the light palette, without a flash. Never throws. */
export const paletteBootstrap = `try{var p=localStorage.getItem("${PALETTE_KEY}")}catch(e){}document.documentElement.dataset.palette=${JSON.stringify(
  lightPalettes.slice(1),
)}.indexOf(p)>=0?p:"peche";`;
