# Brand assets

Single source of truth for the Apexify.js logo, wordmark, and banner.
Drop replacement artwork here using the exact same filenames and the site
will pick it up automatically — no code changes needed.

## Files

| File              | Used for                                        | Recommended size            |
| ----------------- | ----------------------------------------------- | --------------------------- |
| `icon.svg`        | Navbar logo + footer logo (via `<BrandIcon />`) | square, vector              |
| `banner-light.svg`| Homepage hero banner — **light mode** variant   | 960 × 220 viewBox (4.4 : 1) |
| `banner-dark.svg` | Homepage hero banner — **dark mode** variant    | 960 × 220 viewBox (4.4 : 1) |

The Next.js favicon and Apple touch icon are kept as separate copies in
`app/icon.svg` and `app/apple-icon.svg` (Next.js file convention picks
those up automatically). If you change `icon.svg` here, also update those
two files so the favicon stays in sync.

## How the variants work

The homepage hero banner is theme-aware: it picks `banner-light.svg` when
`<html>` has the `.light` class and `banner-dark.svg` when it has `.dark`.
The variant is selected by the `<BrandBanner />` React component in
`components/Brand.tsx`.

If you only ever want one banner (e.g. always show the dark variant), pass
`variant="dark"` to `<BrandBanner />` in `components/home/HeroShowcase.tsx`.

## Where the banner appears

Homepage **only**, inside the hero — above the eyebrow pill and the H1.
It is **not** shown on `/gallery`, `/studio`, or `/docs`.

If you later want the banner on additional pages, import `BrandBanner`
from `@/components/Brand` and drop it where you want.

## Where the icon appears

- Browser favicon (via `app/icon.svg`)
- iOS home-screen icon (via `app/apple-icon.svg`)
- Top-left of the navbar on every page (via `components/Navbar.tsx`)

## Swapping artwork

1. Replace any of the three SVG files in this folder with your own.
2. Keep the same filename and roughly the same aspect ratio.
3. For PNG/JPG art, convert it to SVG **or** rename your file to keep the
   `.svg` extension — Next.js / `<Image>` will still serve it as a raster.
4. Save and refresh.

## Dimensions cheat sheet

- **Icon**: any square viewBox. The current art uses `0 0 256 256`.
- **Banner**: any aspect ratio between 4 : 1 and 5 : 1 looks good in the
  hero slot. The current art uses a 960 × 220 viewBox (≈ 4.4 : 1).
- The hero render width is capped at 460 CSS px on desktop, so artwork
  taller than ~120 px ends up around 100 px tall on screen.
