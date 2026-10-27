import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./reference.css";
import "./budget-signal.css";
import "./bank-tools.css";
import AppearanceProvider from "./theme-provider";
export const metadata: Metadata = {
  title: "PECULE — Votre argent, l’esprit léger",
  description: "Votre budget personnel, vos prochaines échéances et vos projets d’épargne. Faites de la place pour ce qui compte.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "PECULE" },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#f7f8fa" };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="fr" suppressHydrationWarning><body><AppearanceProvider>{children}</AppearanceProvider></body></html>;
}
