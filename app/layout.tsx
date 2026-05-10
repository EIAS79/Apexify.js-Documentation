import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";

const inter = Inter({ subsets: ["latin"] });

/** Works with notched phones + `/studio` full-viewport layout (`viewport-fit=cover`). */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

/**
 * Site-wide metadata.
 *
 * Favicon + Apple touch icon are picked up automatically by Next.js from
 * `app/icon.svg` and `app/apple-icon.svg` (file convention) — no `icons`
 * field needed here. The actual SVG sources live in `public/brand/` so
 * the in-page <BrandIcon /> and <BrandBanner /> components share them.
 */
export const metadata: Metadata = {
  title: "Apexify.js - Advanced Canvas Rendering Library",
  description: "Professional-grade TypeScript canvas library for Node.js. Create stunning visuals with image processing, shapes, text effects, patterns, filters, and charts.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <SidebarProvider>
          {children}
          </SidebarProvider>
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
