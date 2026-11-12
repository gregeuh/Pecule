import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./reference.css";
import "./budget-signal.css";
import "./bank-tools.css";
import "./mobile-navigation.css";
import "./mobile-forms.css";
import "./atelier.css";
import "./signature-interactions.css";
import "./menu-motion.css";
import "./iphone-capture.css";
import "./brief-corrections.css";
import "./motion.css";
import "./interaction-harmony.css";
import "./wallet.css";
import "./gestures.css";
import "./wallet-depth.css";
import "./launch.css";
import {launchBootstrap} from "../lib/launch-bootstrap";
import {launchImages} from "../lib/launch-images";
import AppearanceProvider from "./theme-provider";
export const metadata: Metadata = {
  title: "Pécule — Votre argent, l’esprit léger",
  description: "Votre budget personnel, vos prochaines échéances et vos projets d’épargne. Faites de la place pour ce qui compte.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Pécule", startupImage:launchImages.map(({url,media})=>({url,media})) },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#f2f3f7" }, { media: "(prefers-color-scheme: dark)", color: "#090b10" }] };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="fr" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{__html:launchBootstrap}}/><AppearanceProvider>{children}</AppearanceProvider></body></html>;
}
