"use client";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
export default function AppearanceProvider({children}:{children:ReactNode}){return <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem storageKey="pecule-theme">{children}</ThemeProvider>;}
