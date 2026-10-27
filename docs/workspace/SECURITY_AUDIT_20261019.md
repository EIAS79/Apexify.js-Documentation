# npm audit triage — pinned 2026-10-19 baseline

Node 24.21.0; npm 11.19.0; Next 14.2.35; installed Apexify.js 6.0.0 Git SHA 379a5248f09ed39c1b1734fe104b6bd73a77857f.
Read-only npm audit --json and npm audit --omit=dev --json each exited 1.

Full tree: 17 vulnerable packages = 1 critical / 13 high / 2 moderate / 1 low.
Production-tree omit-dev: 8 = 1 critical / 6 high / 0 moderate / 1 low.

| Package | Severity | Direct? | Production tree? | Relevant advisory and path |
|---|---|---|---|---|
| next 14.2.35 | CRITICAL | yes | yes | GHSA-p293-qw3h-jr36 and GHSA-2xp9-vwfh-vxw4; npm major fix Next 16.4.2 requires compatibility |
| axios 1.15.1 | high | no | yes | GHSA-3w6x-2g7m-8v23; Apexify -> imgur -> axios; newest audit up to <1.20.0 |
| form-data 4.0.5 | high | no | yes | GHSA-hmw2-7cc7-3qxx; engine imgur/axios transitive; 4.0.6+ |
| sharp 0.35.4 | high | no | yes | GHSA-wq5f-xc86-pv6w; Apexify engine dependency; 0.35.5+ |
| postcss | high | yes | yes | GHSA-fxqj-rqcc-2cmp; root 8.5.6 and Next nested 8.4.31 |
| nanoid | high | no | yes | GHSA-2v37-7h3g-55p8; 3.3.18+ |
| source-map-js | high | no | yes | GHSA-68fv-2mgg-jv7q; 1.2.2+ |
| esbuild | low | no | yes per audit | GHSA-g7r4-m6w7-qqqr; Windows development server; 0.28.1+ |
| braces | high | no | no | GHSA-vfj7-8cjw-p6xm; Tailwind watch/globs |
| browserslist | high | no | no | GHSA-c83g-rgw3-j3cx |
| chokidar | high | no | no | inherits braces via Tailwind |
| fast-glob | high | no | no | inherits micromatch |
| micromatch | high | no | no | inherits braces |
| picomatch | high | no | no | GHSA-c2c7-rcm5-vvqj |
| tailwindcss 3.4.19 | high | yes | no | npm major remediation 4.3.3 requires CSS regression |
| baseline-browser-mapping | moderate | no | no | GHSA-w5vr-8v7q-w6rv; 2.11.0+ |
| postcss-selector-parser | moderate | no | no | GHSA-rj75-hqrm-r3gf; 7.1.6+ |

Priority: separately assess Next critical production-request reachability, then pinned engine image/upload chains, then compatible transitive parser updates, then Tailwind and build-time glob/CSS exposure. Check actual deployed route/image config and trust boundaries; audit tree reachability alone does not prove exploitation or harmlessness. Never force audit fixes or silently upgrade engine/Next. No lockfile or dependencies modified.
