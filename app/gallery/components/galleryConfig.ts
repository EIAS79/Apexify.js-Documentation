import {
  PaintBrushIcon,
  PhotoIcon,
  ChartBarIcon,
  SparklesIcon,
  PlayIcon,
  FilmIcon,
  RocketLaunchIcon,
  Squares2X2Icon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

export type FilterCategory =
  | 'all'
  | 'background'
  | 'images'
  | 'text'
  | 'charts'
  | 'gifs'
  | 'videos'
  | 'extras'
  | 'mix'
  | 'advance';

export type SortMode = 'curated' | 'alpha' | 'shuffle';

export type CategoryConfig = {
  label: string;
  short: string;
  icon: typeof PaintBrushIcon;
  /** CSS color for badge / icon. */
  accent: string;
  /** Subtle hue bg used for hover ring + badge tint. */
  accentSoft: string;
};

export const CATEGORY_CONFIG: Record<Exclude<FilterCategory, 'all'>, CategoryConfig> = {
  background: {
    label: 'Background',
    short: 'BG',
    icon: PaintBrushIcon,
    accent: 'var(--accent-iris)',
    accentSoft: 'color-mix(in srgb, var(--accent-iris) 18%, transparent)',
  },
  images: {
    label: 'Images',
    short: 'IMG',
    icon: PhotoIcon,
    accent: 'var(--success)',
    accentSoft: 'color-mix(in srgb, var(--success) 18%, transparent)',
  },
  charts: {
    label: 'Charts',
    short: 'DATA',
    icon: ChartBarIcon,
    accent: 'var(--accent-amber)',
    accentSoft: 'color-mix(in srgb, var(--accent-amber) 18%, transparent)',
  },
  text: {
    label: 'Text',
    short: 'TYPE',
    icon: SparklesIcon,
    accent: 'var(--accent-magenta)',
    accentSoft: 'color-mix(in srgb, var(--accent-magenta) 18%, transparent)',
  },
  gifs: {
    label: 'GIFs',
    short: 'GIF',
    icon: PlayIcon,
    accent: 'var(--accent-iris-soft)',
    accentSoft: 'color-mix(in srgb, var(--accent-iris-soft) 22%, transparent)',
  },
  videos: {
    label: 'Videos',
    short: 'MP4',
    icon: FilmIcon,
    accent: 'var(--accent-rose)',
    accentSoft: 'color-mix(in srgb, var(--accent-rose) 22%, transparent)',
  },
  extras: {
    label: 'Extras',
    short: 'LAB',
    icon: RocketLaunchIcon,
    accent: 'var(--accent-coral)',
    accentSoft: 'color-mix(in srgb, var(--accent-coral) 22%, transparent)',
  },
  mix: {
    label: 'Mix',
    short: 'MIX',
    icon: Squares2X2Icon,
    accent: 'var(--accent-amber-soft)',
    accentSoft: 'color-mix(in srgb, var(--accent-amber-soft) 22%, transparent)',
  },
  advance: {
    label: 'Advance',
    short: 'ADV',
    icon: CheckCircleIcon,
    accent: 'var(--accent-magenta-soft)',
    accentSoft: 'color-mix(in srgb, var(--accent-magenta-soft) 22%, transparent)',
  },
};

export const FILTER_ORDER_PRIMARY: Exclude<FilterCategory, 'all'>[] = [
  'background',
  'images',
  'charts',
  'text',
  'gifs',
  'videos',
  'extras',
];

export const FILTER_ORDER_SECONDARY: Exclude<FilterCategory, 'all'>[] = ['mix', 'advance'];

export const HASH_TYPE_TO_FILTER: Record<string, FilterCategory> = {
  background: 'background',
  image: 'images',
  chart: 'charts',
  text: 'text',
  gif: 'gifs',
  video: 'videos',
  extra: 'extras',
  mix: 'mix',
  advance: 'advance',
};
