"use client";
import { useTheme } from "next-themes";
export default function ThemePicker() {
  const {theme="system",setTheme}=useTheme();
  return <section className="card settings-card"><h2>À la lumière de votre journée.</h2><p>L’apparence automatique suit le mode clair ou sombre de cet appareil, même lorsqu’il change pendant l’utilisation.</p><label className="field" htmlFor="theme-preference"><span>Apparence</span><select id="theme-preference" value={theme} onChange={e=>{setTheme(e.target.value);}}><option value="system">Automatique · comme l’appareil</option><option value="light">Clair</option><option value="dark">Sombre</option></select></label><p className="field-hint">Ce choix s’applique à cet appareil.</p></section>;
}
