/**
 * Legacy entry-point — kept only so older imports across the codebase
 * (gallery modal, etc.) keep resolving. New code should import from
 * `@/lib/studio/studioConfig` instead.
 */

export {
  STUDIO_STARTER_JS,
  STUDIO_STARTER_TS,
  STUDIO_STORAGE_KEY,
} from './studioConfig';
