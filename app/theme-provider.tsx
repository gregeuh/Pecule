"use client";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
export default function AppearanceProvider({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="pecule-theme" nonce={nonce}>
      {children}
    </ThemeProvider>
  );
}
