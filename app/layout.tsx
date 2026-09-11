import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@/styles/docs-examples.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CustomCursorGate } from "@/components/docs/shell/CustomCursorGate";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const THEME_BOOTSTRAP = `(() => { try { const stored = localStorage.getItem('apexify-theme') || localStorage.getItem('theme') || 'system'; const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'; const resolved = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode; const root = document.documentElement; root.classList.toggle('dark', resolved === 'dark'); root.classList.toggle('light', resolved === 'light'); root.style.colorScheme = resolved; } catch {} })();`;
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export const metadata: Metadata = { title: "Apexify.js - Advanced Canvas Rendering Library", description: "Professional-grade TypeScript canvas library for Node.js. Create stunning visuals with image processing, shapes, text effects, patterns, filters, and charts.", icons: { icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }] } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} /></head><body className={`${inter.className} ${inter.variable}`}><ThemeProvider><SidebarProvider>{children}</SidebarProvider><CustomCursorGate /></ThemeProvider><SpeedInsights /></body></html>; }
