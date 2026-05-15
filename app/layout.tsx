import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SidebarProvider } from "@/contexts/SidebarContext";
import CustomCursor from "@/components/CustomCursor";

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
 * Favicon: set explicitly via `metadata.icons` pointing at `public/brand/icon.svg`.
 * (Relying only on `app/icon.svg` can produce `<link rel="icon" … sizes="…">` that
 * Chromium ignores for SVG, so the tab shows a generic document icon.)
 *
 * Apple touch icon: `app/apple-icon.tsx` (PNG via `ImageResponse`).
 */
export const metadata: Metadata = {
  title: "Apexify.js - Advanced Canvas Rendering Library",
  description:
    "Professional-grade TypeScript canvas library for Node.js. Create stunning visuals with image processing, shapes, text effects, patterns, filters, and charts.",
  icons: {
    icon: [{ url: "/brand/icon.svg", type: "image/svg+xml" }],
  },
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
          <CustomCursor />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
