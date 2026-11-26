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
  { id: "ocean", label: "Océan", swatch: ["#7db9ea", "#9be8df", "#93abe9"] },
  { id: "nuit", label: "Nuit", swatch: ["#8a3423", "#4a2f78", "#a0561f"] },
  { id: "auto", label: "Automatique", swatch: ["#ff9d7e", "#4a2f78", "#ffd0a6"] },
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

const themeColors: Record<LightPalette, string> = {
  peche: "#fbeee3",
  lavande: "#efeaff",
  menthe: "#e8f5ef",
  ocean: "#dbe7f3",
};
/** The iPhone status bar colour of a light palette (its --bg). Nuit keeps the dark meta tag. */
export function paletteThemeColor(palette: string | null): string {
  return themeColors[readPalette(palette)];
}
/** Points the light theme-color meta tag at the palette's ground. */
export function applyPaletteThemeColor(palette: string | null) {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][media*="light"]');
  if (meta) meta.content = paletteThemeColor(palette);
}

/** Inline, before the first paint: the light palette and its status bar colour, without a flash. Never throws. */
export const paletteBootstrap = `try{var p=localStorage.getItem("${PALETTE_KEY}")}catch(e){}var c=${JSON.stringify(
  themeColors,
)};p=c.hasOwnProperty(p)?p:"peche";document.documentElement.dataset.palette=p;try{var m=document.querySelector('meta[name="theme-color"][media*="light"]');if(m)m.content=c[p]}catch(e){}`;
