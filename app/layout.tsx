import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import "@/styles/docs-examples.css";
import "@/styles/doc7-product-accessibility.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { CustomCursorGate } from "@/components/docs/shell/CustomCursorGate";
import { SiteTelemetry } from "@/components/analytics/SiteTelemetry";
import { SITE_DESCRIPTION, SITE_NAME, SITE_ORIGIN } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "optional" });
const THEME_BOOTSTRAP = `(() => { try { const stored = localStorage.getItem('apexify-theme') || localStorage.getItem('theme') || 'system'; const mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'; const resolved = mode === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : mode; const root = document.documentElement; root.classList.toggle('dark', resolved === 'dark'); root.classList.toggle('light', resolved === 'light'); root.style.colorScheme = resolved; } catch {} })();`;
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "Apexify.js - Advanced Canvas Rendering Library",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  icons: { icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }] },
  openGraph: {
    type: 'website',
    url: SITE_ORIGIN,
    siteName: 'Apexify.js Documentation',
    title: 'Apexify.js - Advanced Canvas Rendering Library',
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary',
    title: 'Apexify.js - Advanced Canvas Rendering Library',
    description: SITE_DESCRIPTION,
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} /></head><body className={`${inter.className} ${inter.variable}`}><ThemeProvider><SidebarProvider>{children}</SidebarProvider><CustomCursorGate /></ThemeProvider><SiteTelemetry />{process.env.VERCEL ? <SpeedInsights /> : null}</body></html>; }
