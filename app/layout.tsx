import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./theme.css";
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
import "./save-continuity.css";
import "./glass.css";
import { launchBootstrap } from "../lib/launch-bootstrap";
import { paletteBootstrap } from "../lib/appearance";
import { launchImages } from "../lib/launch-images";
import AppearanceProvider from "./theme-provider";
import GlassBackdrop from "./glass-backdrop";
export const metadata: Metadata = {
  title: "Pécule — Votre argent, l’esprit léger",
  description:
    "Votre budget personnel, vos prochaines échéances et vos projets d’épargne. Faites de la place pour ce qui compte.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Pécule",
    startupImage: launchImages.map(({ url, media }) => ({ url, media })),
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg", apple: "/icons/apple-touch-icon.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbeee3" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1216" },
  ],
};
export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Per-request nonce from proxy.ts (Content Security Policy); reading headers keeps every page dynamic.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/nunito-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: launchBootstrap }} />
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: paletteBootstrap }} />
        <AppearanceProvider nonce={nonce}>
          <GlassBackdrop />
          {children}
        </AppearanceProvider>
      </body>
    </html>
  );
}
