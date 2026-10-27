# Supervisor #4 security exposure assessment — 2026-10-19

## Installation audit
The read-only npm audit --json on the unchanged lockfile found 17 vulnerable packages: 1 critical, 13 high, 2 moderate and 1 low. Runtime Next.js 14.2.35 and Apexify.js 6.0.0 are unchanged.

The critical direct package is Next.js. The local audit specifically reports:
- GHSA-p293-qw3h-jr36 — Windows-hosted server remote code execution via filesystem cache paths; vulnerable through Next versions below 15.5.24.
- GHSA-2xp9-vwfh-vxw4 — Image Optimization AVIF unauthenticated remote code execution; affected versions below 15.5.24.
- Local npm resolver suggests Next 16.4.2, a major upgrade that was NOT applied.

High findings include direct postcss and tailwindcss, and transitive axios, braces, browserslist, chokidar, fast-glob, form-data, micromatch, nanoid, picomatch, sharp, source-map-js.

## Deployment-path assessment
The deployed documentation architecture uses the App Router and some Next Image components (e.g. components/Brand.tsx). The Vercel production runtime should not be assumed to be Windows simply because the local verification machine is Windows. Windows-specific exploitation depends on the actual hosting OS. The AVIF Image Optimization path may be reachable, and needs targeted request/path testing; no blanket assertion of safety is justified.

The Workspace public rendering route has separate resource/cost/throttling and trust-boundary concerns. Canvas authoring in this checkpoint allows only validated, source-free procedural backgrounds. Native video/image sources remain explicitly blocked in the advanced path.

## Smallest compatible remediation candidate
1. Confirm live Next, hosting OS and AVIF optimizer exposure through authorized release diagnostics. No Vercel settings changes without approval.
2. In a separate local worktree, evaluate a currently supported patched Next 15.x line at or above 15.5.24, and then a patched 16.x option if necessary; review React and other dependency compatibility. Next 14 is out of security support.
3. Run npm ci, standalone typecheck, production build, image optimization regression, API concurrency and browser regression on each candidate, with a deployment-size and rollback comparison.
4. Triage transitive vulnerabilities by dependency chain and production reachability; do not automatically change Apexify.js pin, Next major or Tailwind major.
5. Obtain owner approval before the selected upgrade, remote integration or any production deployment.

Decision: SECURITY BLOCKED. No dependency upgrades, remote pushes, PRs or deployments were performed.
