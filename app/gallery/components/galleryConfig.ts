import {
  AdjustmentsHorizontalIcon,
  ChartBarSquareIcon,
  FilmIcon,
  PhotoIcon,
  RectangleGroupIcon,
  SparklesIcon,
  Squares2X2Icon,
  SwatchIcon,
} from '@heroicons/react/24/outline';

export type FilterCategory =
  | 'all'
  | 'composition'
  | 'image'
  | 'typography'
  | 'data'
  | 'motion'
  | 'surface'
  | 'advanced';

export type SortMode = 'curated' | 'alpha' | 'shuffle';

export type CategoryConfig = {
  label: string;
  short: string;
  description: string;
  icon: typeof Squares2X2Icon;
  accent: string;
  accentSoft: string;
};

export const CATEGORY_CONFIG: Record<Exclude<FilterCategory, 'all'>, CategoryConfig> = {
  composition: {
    label: 'Composition',
    short: 'CMP',
    description: 'Multi-part layouts, reports, decks, and mixed visual systems.',
    icon: RectangleGroupIcon,
    accent: 'var(--gallery-blue)',
    accentSoft: 'color-mix(in srgb, var(--gallery-blue) 14%, transparent)',
  },
  image: {
    label: 'Image',
    short: 'IMG',
    description: 'Canvas imagery, shape work, raster composition, and image-led output.',
    icon: PhotoIcon,
    accent: 'var(--gallery-mint)',
    accentSoft: 'color-mix(in srgb, var(--gallery-mint) 14%, transparent)',
  },
  typography: {
    label: 'Typography',
    short: 'TYPE',
    description: 'Text-led studies, labels, plaques, and typographic composition.',
    icon: SparklesIcon,
    accent: 'var(--gallery-lavender)',
    accentSoft: 'color-mix(in srgb, var(--gallery-lavender) 14%, transparent)',
  },
  data: {
    label: 'Data',
    short: 'DATA',
    description: 'Charts and structured-data visualizations.',
    icon: ChartBarSquareIcon,
    accent: 'var(--gallery-steel)',
    accentSoft: 'color-mix(in srgb, var(--gallery-steel) 15%, transparent)',
  },
  motion: {
    label: 'Motion',
    short: 'MOTION',
    description: 'GIF, video, frame sequences, and time-based visual output.',
    icon: FilmIcon,
    accent: 'var(--gallery-cyan)',
    accentSoft: 'color-mix(in srgb, var(--gallery-cyan) 14%, transparent)',
  },
  surface: {
    label: 'Surface',
    short: 'BG',
    description: 'Background systems, gradients, patterns, texture, and atmosphere.',
    icon: SwatchIcon,
    accent: 'var(--gallery-sage)',
    accentSoft: 'color-mix(in srgb, var(--gallery-sage) 14%, transparent)',
  },
  advanced: {
    label: 'Advanced',
    short: 'ADV',
    description: 'Dense or experimental compositions that combine multiple engine features.',
    icon: AdjustmentsHorizontalIcon,
    accent: 'var(--gallery-violet)',
    accentSoft: 'color-mix(in srgb, var(--gallery-violet) 14%, transparent)',
  },
};

export const FILTER_ORDER: Exclude<FilterCategory, 'all'>[] = [
  'composition',
  'image',
  'typography',
  'data',
  'motion',
  'surface',
  'advanced',
];

export const HASH_TYPE_TO_FILTER: Record<string, FilterCategory> = {
  background: 'surface',
  image: 'image',
  chart: 'data',
  text: 'typography',
  gif: 'motion',
  video: 'motion',
  extra: 'composition',
  mix: 'composition',
  advance: 'advanced',
  composition: 'composition',
  typography: 'typography',
  data: 'data',
  motion: 'motion',
  surface: 'surface',
  advanced: 'advanced',
};
