'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import {
  FilmIcon,
  PlayIcon,
  Squares2X2Icon,
  PaintBrushIcon,
  CheckCircleIcon,
  RocketLaunchIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  PhotoIcon,
  SparklesIcon,
  ChartBarIcon,
  CodeBracketIcon,
  ViewColumnsIcon,
  MagnifyingGlassPlusIcon,
  MagnifyingGlassMinusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { backgroundGalleryItems } from '@/lib/gallery/backgroundSnippets';
import { spinWheelGalleryItems } from '@/lib/gallery/spinWheelSnippets';
import { extraMotionGalleryItems } from '@/lib/gallery/motionSnippets';
import { presentationSlideGalleryItems } from '@/lib/gallery/presentationSlideSnippet';
import { advanceGalleryItems } from '@/lib/gallery/advanceSnippets';
import type { BackgroundGalleryCard } from '@/lib/gallery/backgroundSnippets';
import type { SpinWheelGalleryCard } from '@/lib/gallery/spinWheelSnippets';
import type { AdvanceGalleryCard, GalleryMediaKind } from '@/lib/gallery/galleryTypes';

type GalleryItem = BackgroundGalleryCard | SpinWheelGalleryCard | AdvanceGalleryCard;

/** Rich filters (restored) — items can appear under several lenses via `discoverCategories`. */
type FilterCategory =
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

function inferMediaKind(src: string, explicit?: GalleryMediaKind): GalleryMediaKind {
  if (explicit) return explicit;
  if (/\.(mp4|webm|mov)(\?|#|$)/i.test(src)) return 'video';
  if (/\.gif(\?|#|$)/i.test(src)) return 'gif';
  return 'image';
}

const galleryItems: GalleryItem[] = [
  ...backgroundGalleryItems,
  ...spinWheelGalleryItems,
  ...extraMotionGalleryItems,
  ...presentationSlideGalleryItems,
  ...advanceGalleryItems,
];

const FILTER_ORDER: Exclude<FilterCategory, 'all'>[] = [
  'background',
  'images',
  'charts',
  'text',
  'gifs',
  'videos',
  'extras',
  'mix',
  'advance',
];

const categoryConfig: Record<
  Exclude<FilterCategory, 'all'>,
  { label: string; short: string; icon: typeof Squares2X2Icon; color: string; gradient: string }
> = {
  background: {
    label: 'Background',
    short: 'BG',
    icon: PaintBrushIcon,
    color: 'text-sky-400',
    gradient: 'from-sky-500 to-cyan-400',
  },
  images: {
    label: 'Images',
    short: 'IMG',
    icon: PhotoIcon,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500 to-teal-400',
  },
  charts: {
    label: 'Charts',
    short: 'DATA',
    icon: ChartBarIcon,
    color: 'text-amber-400',
    gradient: 'from-amber-500 to-orange-500',
  },
  text: {
    label: 'Text',
    short: 'TYPE',
    icon: SparklesIcon,
    color: 'text-fuchsia-400',
    gradient: 'from-fuchsia-500 to-violet-500',
  },
  gifs: {
    label: 'GIFs',
    short: 'GIF',
    icon: PlayIcon,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500 to-blue-500',
  },
  videos: {
    label: 'Videos',
    short: 'MP4',
    icon: FilmIcon,
    color: 'text-rose-400',
    gradient: 'from-rose-500 to-pink-500',
  },
  extras: {
    label: 'Extras',
    short: 'LAB',
    icon: RocketLaunchIcon,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500 to-purple-500',
  },
  mix: {
    label: 'Mix',
    short: 'MIX',
    icon: Squares2X2Icon,
    color: 'text-orange-400',
    gradient: 'from-orange-500 to-amber-500',
  },
  advance: {
    label: 'Advance',
    short: 'ADV',
    icon: CheckCircleIcon,
    color: 'text-pink-400',
    gradient: 'from-pink-500 to-rose-500',
  },
};

function discoverCategories(item: GalleryItem): Exclude<FilterCategory, 'all'>[] {
  const tags = new Set<Exclude<FilterCategory, 'all'>>();

  if (item.category === 'background') {
    tags.add('background');
    tags.add('mix');
    return [...tags];
  }

  if (item.category === 'gifs') {
    tags.add('gifs');
    tags.add('extras');
    tags.add('mix');
    return [...tags];
  }

  if (item.category === 'videos') {
    tags.add('videos');
    tags.add('extras');
    tags.add('mix');
    return [...tags];
  }

  if (item.category === 'advance') {
    tags.add('advance');
    tags.add('images');

    const advanceChartIds: string[] = [
      'advance-chart-donut-glow',
      'advance-comparison-donut-line',
      'presentation-deck-slide',
      'advance-chart-bar-quarterly',
      'advance-chart-hbar-routes',
      'advance-chart-line-dual-target',
    ];
    if (advanceChartIds.includes(item.id) || item.id.startsWith('advance-chartshowcase-')) {
      tags.add('charts');
    }

    if (item.id === 'advance-chartshowcase-comparison-pie-bar') {
      tags.add('mix');
    }

    if (
      item.id === 'presentation-deck-slide' ||
      item.id === 'advance-shape-collage' ||
      item.id === 'advance-text-glow-plaque'
    ) {
      tags.add('text');
    }

    if (
      item.id === 'advance-comparison-donut-line' ||
      item.id === 'presentation-deck-slide' ||
      item.id === 'advance-shape-collage'
    ) {
      tags.add('mix');
    }

    return [...tags];
  }

  return [...tags];
}

function itemMatchesFilter(item: GalleryItem, filter: FilterCategory): boolean {
  if (filter === 'all') return true;
  return discoverCategories(item).includes(filter);
}

/** Strip lightweight markdown so grid tiles stay readable (modal uses full markdown). */
function plainGallerySummary(text: string): string {
  return text
    .replace(/\r?\n+/g, ' ')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

const galleryModalMarkdownComponents: Components = {
  p: ({ children }) => <p className="mb-2 text-slate-300 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-slate-100">{children}</strong>,
  code: ({ children }) => (
    <code className="rounded-md bg-slate-800/95 px-1.5 py-0.5 font-mono text-[13px] text-sky-200/95">{children}</code>
  ),
};

/** Badge / modal accent — one readable “home” lane per card. */
function primaryBadgeCategory(item: GalleryItem): Exclude<FilterCategory, 'all'> {
  if (item.category === 'background') return 'background';
  if (item.category === 'gifs') return 'gifs';
  if (item.category === 'videos') return 'videos';
  const advanceChartBadgeIds = [
    'advance-chart-donut-glow',
    'advance-comparison-donut-line',
    'presentation-deck-slide',
    'advance-chart-bar-quarterly',
    'advance-chart-hbar-routes',
    'advance-chart-line-dual-target',
  ];
  if (item.id.startsWith('advance-chartshowcase-') || advanceChartBadgeIds.includes(item.id)) return 'charts';
  if (item.id === 'advance-text-glow-plaque') return 'text';
  if (item.id === 'advance-shape-collage') return 'images';
  return 'advance';
}

export default function GalleryClient() {
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const filterCounts = useMemo(() => {
    const counts: Record<Exclude<FilterCategory, 'all'>, number> = {
      background: 0,
      images: 0,
      charts: 0,
      text: 0,
      gifs: 0,
      videos: 0,
      extras: 0,
      mix: 0,
      advance: 0,
    };
    for (const item of galleryItems) {
      for (const c of discoverCategories(item)) {
        counts[c] += 1;
      }
    }
    return counts;
  }, []);

  const filteredItems = useMemo(
    () => (selectedCategory === 'all' ? galleryItems : galleryItems.filter((item) => itemMatchesFilter(item, selectedCategory))),
    [selectedCategory]
  );

  const sortedGridItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
  }, [filteredItems]);

  const spotlightItem = useMemo(() => sortedGridItems.find((i) => i.featured) ?? null, [sortedGridItems]);

  const riverItems = useMemo(() => {
    if (!spotlightItem) return sortedGridItems;
    return sortedGridItems.filter((i) => i.id !== spotlightItem.id);
  }, [sortedGridItems, spotlightItem]);

  useEffect(() => {
    setIsVisible(true);

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleItems((prev) => new Set(prev).add(entry.target.id));
        }
      });
    }, observerOptions);

    const timer = setTimeout(() => {
      const items = galleryRef.current?.querySelectorAll('[data-gallery-item]');
      items?.forEach((item) => observer.observe(item));
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [selectedCategory]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
      }
    };

    if (selectedItem) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedItem]);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 80% 50% at 50% 100%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              #000000
            `,
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px',
          }}
        />
      </div>

      <Navbar />

      <section className="relative pt-28 sm:pt-36 pb-10 sm:pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="pointer-events-none absolute top-40 -left-20 h-80 w-80 rounded-full bg-cyan-500/15 blur-[90px]" />
        <div className="max-w-7xl mx-auto">
          <div
            className={`grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-end transition-all duration-1000 delay-150 ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500 mb-4">Apexify.js gallery</p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                <span
                  className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent"
                  style={{
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Art direction,
                </span>
                <br />
                <span
                  className="bg-gradient-to-r from-sky-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent"
                  style={{
                    backgroundSize: '200% auto',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    animation: 'gradient 6s ease infinite',
                  }}
                >
                  on demand
                </span>
              </h1>
              <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                A hand-picked set of finished looks—moody backdrops, motion you can feel, charts that read at a glance, and full compositions worth stealing. Tap a tile to see the{' '}
                <strong className="text-slate-200 font-semibold">output beside the recipe</strong>
                , then lift the idea into your own product pages, bots, decks, or drops.
              </p>
            </div>
            <div className="rounded-3xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-transparent p-6 sm:p-8 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset]">
              <p className="text-sm font-medium text-slate-200 leading-relaxed">Browse like a creative director</p>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                The filters above are <span className="text-slate-300">lenses</span>, not silos—one piece can show up under Motion and Mix because it earns both. Start broad, narrow until something sparks, then open it full screen for the story and the code.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-white/[0.06] bg-black/75 backdrop-blur-xl supports-[backdrop-filter]:bg-black/55">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`shrink-0 flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'border-white/20 bg-white/10 text-white shadow-[0_0_24px_rgba(99,102,241,0.25)]'
                  : 'border-transparent bg-white/[0.04] text-slate-400 hover:border-white/10 hover:text-white'
              }`}
            >
              <Squares2X2Icon className="h-4 w-4" />
              All
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-bold text-slate-300">{galleryItems.length}</span>
            </button>
            {FILTER_ORDER.map((key) => {
              const config = categoryConfig[key];
              const IconComponent = config.icon;
              const isActive = selectedCategory === key;
              const count = filterCounts[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key)}
                  className={`shrink-0 flex items-center gap-2 rounded-2xl border px-3.5 sm:px-4 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? `border-transparent bg-gradient-to-r ${config.gradient} text-white shadow-lg`
                      : 'border-transparent bg-white/[0.04] text-slate-400 hover:border-white/10 hover:text-white'
                  }`}
                >
                  <IconComponent className={`h-4 w-4 ${isActive ? 'text-white' : config.color}`} />
                  <span className="hidden sm:inline">{config.label}</span>
                  <span className="sm:hidden">{config.short}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      isActive ? 'bg-black/25 text-white' : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 lg:py-16 px-4 sm:px-6 lg:px-8" ref={galleryRef}>
        <div className="mx-auto max-w-[min(100%,1400px)]">
          {sortedGridItems.length > 0 && (
            <div>
              <header className="mb-10 sm:mb-12 lg:mb-14 max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                  {selectedCategory === 'all' ? 'Collection' : categoryConfig[selectedCategory].label}
                </p>
                <div className="mt-3 flex items-baseline gap-4">
                  <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight text-white">
                    {selectedCategory === 'all' ? 'Explore' : 'In this lane'}
                  </h2>
                  <span className="hidden h-px flex-1 translate-y-[-0.35em] bg-gradient-to-r from-white/25 to-transparent sm:block" aria-hidden />
                </div>
                <p className="mt-4 text-[15px] leading-relaxed text-slate-400">
                  {selectedCategory === 'all'
                    ? `${sortedGridItems.length} pieces in the studio — when something is featured it steps forward first; the rest follows in an easy scan.`
                    : `${sortedGridItems.length} works match this filter.`}
                </p>
              </header>

              {spotlightItem && (
                <ExploreSpotlight
                  item={spotlightItem}
                  index={sortedGridItems.findIndex((i) => i.id === spotlightItem.id)}
                  isVisible={visibleItems.has(spotlightItem.id)}
                  onOpen={() => setSelectedItem(spotlightItem)}
                />
              )}

              {riverItems.length > 0 && (
                <div className="columns-1 gap-8 sm:columns-2 xl:columns-3 [column-fill:_balance]">
                  {riverItems.map((item, index) => (
                    <GalleryCard
                      key={item.id}
                      item={item}
                      index={index}
                      isVisible={visibleItems.has(item.id)}
                      onClick={() => setSelectedItem(item)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-20 rounded-3xl border border-dashed border-white/10 bg-white/[0.02]">
              <div className="text-5xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-slate-300 mb-2">Nothing tagged here yet</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm">
                Add cards in <code className="text-slate-400">lib/gallery/*.ts</code> and map them in <code className="text-slate-400">discoverCategories</code> in{' '}
                <code className="text-slate-400">GalleryClient.tsx</code>.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-strong border border-gray-700/50 rounded-3xl p-8 sm:p-12">
            <h2 className="text-3xl sm:text-4xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Ready to Create Your Own?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8">Start building stunning visuals with Apexify.js today</p>
            <Link
              href="/docs#Getting-Started"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-lg font-bold rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105"
            >
              <RocketLaunchIcon className="h-6 w-6" />
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {selectedItem && <GalleryModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
}

/** Modal body: code-only (maximize source), split, or preview-only (hide code). */
type ModalLayoutMode = 'code' | 'split' | 'media';

const galleryMono =
  'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace';

function GalleryIosCodeWindow({
  code,
  codeLang,
  hasTs,
  hasJs,
  onLangChange,
}: {
  code: string;
  codeLang: 'ts' | 'js';
  hasTs: boolean;
  hasJs: boolean;
  onLangChange: (lang: 'ts' | 'js') => void;
}) {
  const [copied, setCopied] = useState(false);

  const prismLang = codeLang === 'ts' ? 'typescript' : 'javascript';
  const fileLabel = codeLang === 'ts' ? 'Snippet.ts' : 'Snippet.js';

  const copy = () => {
    if (!code.trim()) return;
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="flex flex-col flex-1 min-h-0 min-w-0 h-full max-h-full rounded-[14px] overflow-hidden border border-white/[0.06] shadow-[0_8px_40px_rgba(0,0,0,0.45)] bg-[#2C2C2E]"
      style={{ fontFamily: galleryMono }}
    >
      {/* iOS / Xcode-adjacent chrome: dots + title + lang + copy */}
      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#3A3A3C] border-b border-black/25">
        <div className="flex items-center gap-1.5 shrink-0" aria-hidden>
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28CA42]" />
        </div>
        <span className="text-[13px] font-medium text-white/90 truncate min-w-0 tracking-tight">{fileLabel}</span>
        <span className="flex-1" />
        {(hasTs || hasJs) && hasTs && hasJs && (
          <div
            className="flex rounded-[10px] bg-black/28 p-0.5 shrink-0"
            role="tablist"
            aria-label="Source language"
          >
            <button
              type="button"
              role="tab"
              aria-selected={codeLang === 'ts'}
              onClick={() => onLangChange('ts')}
              className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold transition-all ${
                codeLang === 'ts' ? 'bg-white/18 text-white shadow-sm' : 'text-white/45 hover:text-white/70'
              }`}
            >
              TS
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={codeLang === 'js'}
              onClick={() => onLangChange('js')}
              className={`px-2.5 py-1 rounded-[8px] text-[11px] font-semibold transition-all ${
                codeLang === 'js' ? 'bg-white/18 text-white shadow-sm' : 'text-white/45 hover:text-white/70'
              }`}
            >
              JS
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={copy}
          title={copied ? 'Copied' : 'Copy code'}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.08] text-white/85 hover:bg-white/[0.14] active:scale-95 transition-all border border-white/[0.06]"
        >
          {copied ? <CheckIcon className="h-[18px] w-[18px] text-[#34C759]" /> : <ClipboardDocumentIcon className="h-[18px] w-[18px]" />}
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-[#1C1C1E] overflow-y-auto overflow-x-auto overscroll-contain touch-pan-y [scrollbar-gutter:stable]">
        <div className="p-3 sm:p-4 min-w-0">
          <SyntaxHighlighter
            language={prismLang}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: 0,
              background: 'transparent',
              fontSize: 'clamp(11px, 2.4vw, 13px)',
              lineHeight: 1.55,
            }}
            showLineNumbers
            lineNumberStyle={{
              color: 'rgba(235,235,245,0.22)',
              paddingRight: '0.85rem',
              minWidth: '2.35em',
              userSelect: 'none',
            }}
            codeTagProps={{
              style: {
                fontFamily: galleryMono,
                background: 'transparent',
              },
            }}
            PreTag="div"
          >
            {code || ' '}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}

function clampZoom(z: number) {
  return Math.min(4, Math.max(0.25, Math.round(z * 100) / 100));
}

function ModalLayoutToolbar({
  mode,
  onChange,
  hasCode,
}: {
  mode: ModalLayoutMode;
  onChange: (m: ModalLayoutMode) => void;
  hasCode: boolean;
}) {
  if (!hasCode) return null;

  const pill =
    'flex flex-1 sm:flex-none items-center justify-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold transition-colors min-w-0';
  const active = 'bg-blue-600 text-white shadow-md';
  const idle = 'bg-transparent text-gray-400 hover:text-white hover:bg-slate-700/80';

  return (
    <div
      className="flex w-full max-w-md mx-auto lg:mx-0 lg:ml-auto rounded-xl bg-slate-800/90 p-1 gap-0.5 border border-slate-700/60"
      role="group"
      aria-label="Layout: code, split, or preview"
    >
      <button
        type="button"
        className={`${pill} ${mode === 'code' ? active : idle}`}
        aria-pressed={mode === 'code'}
        aria-label="Code only — maximize source"
        title="Code only"
        onClick={() => onChange('code')}
      >
        <CodeBracketIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate hidden sm:inline">Code</span>
      </button>
      <button
        type="button"
        className={`${pill} ${mode === 'split' ? active : idle}`}
        aria-pressed={mode === 'split'}
        aria-label="Code and preview side by side"
        title="Code + preview"
        onClick={() => onChange('split')}
      >
        <ViewColumnsIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate hidden sm:inline">Both</span>
      </button>
      <button
        type="button"
        className={`${pill} ${mode === 'media' ? active : idle}`}
        aria-pressed={mode === 'media'}
        aria-label="Preview only — hide code"
        title="Preview only"
        onClick={() => onChange('media')}
      >
        <PhotoIcon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="truncate hidden sm:inline">Preview</span>
      </button>
    </div>
  );
}

function ZoomableStillPreview({ src, alt }: { src: string; alt: string }) {
  const [zoom, setZoom] = useState(1);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1);
  const pinchRef = useRef<{ startDist: number; startZoom: number } | null>(null);

  zoomRef.current = zoom;

  useEffect(() => {
    setZoom(1);
    setNatural(null);
  }, [src]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.12 : 0.12;
      setZoom((z) => clampZoom(z + delta));
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    const dist = (touches: TouchList | Touch[]) => {
      if (touches.length < 2) return 0;
      const a = touches[0];
      const b = touches[1];
      return Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const d = dist(e.touches);
        if (d > 0) pinchRef.current = { startDist: d, startZoom: zoomRef.current };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || !pinchRef.current) return;
      const d = dist(e.touches);
      if (d <= 0) return;
      e.preventDefault();
      const { startDist, startZoom } = pinchRef.current;
      setZoom(clampZoom(startZoom * (d / startDist)));
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinchRef.current = null;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const zoomIn = () => setZoom((z) => clampZoom(z + 0.25));
  const zoomOut = () => setZoom((z) => clampZoom(z - 0.25));
  const resetZoom = () => setZoom(1);

  const onDoubleClick = () => {
    setZoom((z) => (z <= 1.01 ? 2 : 1));
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-between shrink-0 px-0.5">
        <p className="text-[11px] text-slate-500 order-last sm:order-first w-full sm:w-auto text-center sm:text-left leading-snug">
          Two-finger pinch to zoom · or{' '}
          <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300">Ctrl</kbd> /{' '}
          <kbd className="rounded bg-slate-800 px-1 py-0.5 font-mono text-[10px] text-slate-300">⌘</kbd> + scroll
        </p>
        <div className="flex items-center gap-1 rounded-lg bg-slate-800/80 border border-slate-700/50 p-0.5">
          <button
            type="button"
            onClick={zoomOut}
            disabled={zoom <= 0.26}
            className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition-colors"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <MagnifyingGlassMinusIcon className="h-4 w-4" />
          </button>
          <span className="tabular-nums text-xs font-medium text-slate-400 min-w-[3rem] text-center" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={zoomIn}
            disabled={zoom >= 3.99}
            className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-35 disabled:pointer-events-none transition-colors"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <MagnifyingGlassPlusIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="p-2 rounded-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-l border-slate-700/80 ml-0.5 pl-2"
            aria-label="Reset zoom"
            title="Reset zoom"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 min-h-[180px] overflow-auto rounded-xl bg-black/25 ring-1 ring-white/[0.06] touch-pan-x touch-pan-y"
      >
        <div className="flex min-h-full min-w-full items-center justify-center p-4 sm:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            draggable={false}
            onDoubleClick={onDoubleClick}
            onLoad={(e) => {
              const el = e.currentTarget;
              setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            }}
            style={
              natural
                ? {
                    width: natural.w * zoom,
                    height: natural.h * zoom,
                    maxWidth: 'none',
                  }
                : {
                    maxHeight: 'min(70vh, 800px)',
                    width: 'auto',
                    height: 'auto',
                  }
            }
            className={`rounded-lg shadow-2xl select-none object-contain ${natural ? 'cursor-zoom-in' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}

function ModalMediaPane({ item }: { item: GalleryItem }) {
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);

  if (mediaKind === 'video') {
    return (
      <div className="flex flex-1 min-h-0 flex-col items-center justify-center p-3 sm:p-4 lg:p-6">
        <video
          src={item.thumbnail}
          className="max-w-full max-h-[min(78vh,880px)] rounded-xl shadow-2xl"
          controls
          playsInline
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-1 min-h-0 min-w-0 flex-col p-3 sm:p-4 lg:p-6">
      <ZoomableStillPreview src={item.thumbnail} alt={item.title} />
    </div>
  );
}

function GalleryModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const categoryInfo = categoryConfig[primaryBadgeCategory(item)];
  const hasTs = Boolean(item.code?.ts?.trim());
  const hasJs = Boolean(item.code?.js?.trim());
  const hasCode = hasTs || hasJs;

  const [layoutMode, setLayoutMode] = useState<ModalLayoutMode>('split');
  const [codeLang, setCodeLang] = useState<'ts' | 'js'>('ts');

  useEffect(() => {
    setLayoutMode(hasCode ? 'split' : 'media');
    setCodeLang(hasTs ? 'ts' : 'js');
  }, [item.id, hasTs, hasCode]);

  const showCode = hasCode && layoutMode !== 'media';
  const showMedia = layoutMode !== 'code';

  const codeText = codeLang === 'ts' ? (item.code?.ts ?? '') : (item.code?.js ?? '');

  const codeShellClass = [
    'flex flex-col min-h-0 min-w-0 bg-slate-950',
    showCode ? 'border-b border-slate-800/50 lg:border-b-0 lg:border-r lg:border-slate-800/50' : 'hidden',
    showCode && layoutMode === 'split' && 'flex-1 min-h-[34vh] lg:min-h-0 lg:w-1/2 lg:flex-none lg:max-w-[50%] lg:shrink-0',
    showCode && layoutMode === 'code' && 'flex-1 min-h-0 w-full lg:flex-1',
  ]
    .filter(Boolean)
    .join(' ');

  const mediaShellClass = [
    'flex flex-col min-h-0 min-w-0 bg-slate-900/40',
    !showMedia && 'hidden',
    showMedia && layoutMode === 'split' && 'flex-1 min-h-[34vh] lg:min-h-0 lg:w-1/2 lg:flex-none lg:max-w-[50%] lg:shrink-0',
    showMedia && layoutMode === 'media' && 'flex-1 min-h-0 w-full lg:flex-1',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] animate-fade-in" onClick={onClose} aria-hidden />

      <div
        className="fixed inset-0 z-[101] flex flex-col p-0 sm:p-3 md:p-6 lg:p-10 animate-fade-in pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
        aria-describedby="gallery-modal-about"
      >
        <div className="pointer-events-auto flex flex-col flex-1 min-h-0 max-h-[100dvh] sm:max-h-[calc(100dvh-1.5rem)] md:max-h-[calc(100dvh-3rem)] w-full max-w-7xl mx-auto bg-slate-950/98 backdrop-blur-xl border-0 sm:border-2 border-slate-800/50 rounded-none sm:rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 p-2.5 sm:p-3 bg-slate-900/95 hover:bg-slate-800 rounded-xl text-gray-400 hover:text-white transition-all border border-slate-700/50"
            aria-label="Close modal"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <div className="flex-shrink-0 pt-14 sm:pt-4 px-4 sm:px-5 pb-4 border-b border-slate-800/50 bg-slate-950/90">
            <div className="flex items-start gap-3 sm:gap-4 pr-11 sm:pr-12">
              <div className={`p-2 rounded-xl bg-gradient-to-r ${categoryInfo.gradient} flex-shrink-0 shadow-lg`}>
                <categoryInfo.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
                <h2
                  id="gallery-modal-title"
                  className="text-lg sm:text-xl lg:text-2xl font-bold text-white break-words tracking-tight lg:max-w-[min(100%,36rem)]"
                >
                  {item.title}
                </h2>
                {hasCode && (
                  <div className="flex flex-col gap-2 shrink-0 lg:items-end lg:pt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:text-right">
                      Layout
                    </span>
                    <ModalLayoutToolbar mode={layoutMode} onChange={setLayoutMode} hasCode={hasCode} />
                  </div>
                )}
              </div>
            </div>

            <div
              id="gallery-modal-about"
              className="mt-4 rounded-2xl border border-slate-800/80 bg-slate-900/40 px-4 py-3.5 sm:px-5 sm:py-4 ring-1 ring-white/[0.03]"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2.5">About this example</p>
              <div className="text-sm leading-relaxed max-w-none">
                <ReactMarkdown components={galleryModalMarkdownComponents}>{item.description}</ReactMarkdown>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            <div className={codeShellClass}>
              <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden p-3 sm:p-4 lg:p-5">
                {hasCode ? (
                  <GalleryIosCodeWindow
                    code={codeText}
                    codeLang={codeLang}
                    hasTs={hasTs}
                    hasJs={hasJs}
                    onLangChange={setCodeLang}
                  />
                ) : (
                  <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-center rounded-[14px] border border-white/[0.06] bg-[#1C1C1E]/80">
                    <p>No source listing for this item.</p>
                  </div>
                )}
              </div>
            </div>

            <div className={mediaShellClass}>
              <ModalMediaPane item={item} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function ExploreSpotlight({
  item,
  index,
  isVisible,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  isVisible: boolean;
  onOpen: () => void;
}) {
  const badgeKey = primaryBadgeCategory(item);
  const categoryInfo = categoryConfig[badgeKey];
  const IconComponent = categoryInfo.icon;
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);

  return (
    <article
      data-gallery-item
      id={item.id}
      className={`mb-12 transition-all duration-700 ease-out sm:mb-14 lg:mb-16 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${Math.min(index, 14) * 35}ms` }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group relative block w-full cursor-pointer rounded-[1.85rem] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
      >
        <div className="relative overflow-hidden rounded-[1.85rem] bg-zinc-950 shadow-[0_32px_100px_-40px_rgba(0,0,0,0.92),inset_0_0_0_1px_rgba(255,255,255,0.06)] ring-1 ring-white/[0.07] transition-[box-shadow,ring-color] duration-500 group-hover:shadow-[0_40px_120px_-42px_rgba(99,102,241,0.22)] group-hover:ring-violet-400/20">
          <div className="relative aspect-[5/3] min-h-[200px] max-h-[min(48vh,420px)] w-full overflow-hidden sm:aspect-[21/9] sm:max-h-[min(46vh,460px)]">
            {mediaKind === 'video' ? (
              <video
                src={item.thumbnail}
                className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
                muted
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={item.thumbnail}
                alt={item.title}
                className="h-full w-full object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
              />
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black via-black/55 to-transparent sm:via-black/40" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-[55%] bg-gradient-to-l from-fuchsia-600/10 via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          </div>

          <div className="pointer-events-none absolute left-5 top-5 flex flex-wrap items-center gap-2 sm:left-8 sm:top-8">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${categoryInfo.gradient} px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white shadow-md`}
            >
              <IconComponent className="h-3.5 w-3.5 opacity-95" />
              {categoryInfo.label}
            </span>
            <span className="rounded-full border border-amber-400/45 bg-black/35 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-100/95 backdrop-blur-md">
              Featured
            </span>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-6 pt-24 sm:p-10 sm:pt-28 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-10 lg:p-12 lg:pt-32">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/40">Editor&apos;s pick</p>
              <h3 className="mt-2 max-w-[22ch] text-2xl font-semibold leading-[1.12] tracking-tight text-white sm:max-w-xl sm:text-3xl lg:text-[2.35rem]">
                {item.title}
              </h3>
              <p className="mt-3 max-w-prose text-sm leading-relaxed text-white/60 line-clamp-2 sm:line-clamp-3 lg:text-[15px]">
                {plainGallerySummary(item.description)}
              </p>
            </div>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35 transition-colors duration-300 group-hover:text-white/55 lg:mt-0 lg:pb-0.5">
              Open →
            </p>
          </div>
        </div>
      </button>
    </article>
  );
}

function GalleryCard({
  item,
  index,
  isVisible,
  onClick,
}: {
  item: GalleryItem;
  index: number;
  isVisible: boolean;
  onClick: () => void;
}) {
  const badgeKey = primaryBadgeCategory(item);
  const categoryInfo = categoryConfig[badgeKey];
  const IconComponent = categoryInfo.icon;
  const mediaKind = inferMediaKind(item.thumbnail, item.thumbnailMedia);
  const extraTags = discoverCategories(item)
    .filter((c) => c !== badgeKey)
    .slice(0, 3);

  return (
    <div
      data-gallery-item
      id={item.id}
      onClick={onClick}
      className={`break-inside-avoid mb-8 w-full group relative isolate cursor-pointer overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/80 shadow-[0_20px_50px_-28px_rgba(0,0,0,0.85)] ring-1 ring-inset ring-white/[0.04] transition-[box-shadow,border-color,ring-color] duration-300 hover:border-white/[0.12] hover:shadow-[0_28px_70px_-32px_rgba(99,102,241,0.18)] hover:ring-white/[0.08] ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
      style={{
        transitionDelay: `${index * 30}ms`,
      }}
    >
      <div className="relative flex flex-col">
        <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-zinc-900">
          {mediaKind === 'video' ? (
            <video
              src={item.thumbnail}
              className="h-full w-full object-cover transition-transform duration-[0.85s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]"
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-[0.85s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10 opacity-80" />

          <div className="absolute left-3.5 top-3.5 right-3.5 flex flex-wrap items-start justify-between gap-2">
            <div className={`flex items-center gap-1.5 rounded-full bg-gradient-to-r ${categoryInfo.gradient} px-2.5 py-1 shadow-md`}>
              <IconComponent className="h-3.5 w-3.5 text-white" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-white">{categoryInfo.label}</span>
            </div>
            {item.featured && (
              <div className="rounded-full border border-amber-400/35 bg-black/40 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-100/90 backdrop-blur-sm">
                Featured
              </div>
            )}
          </div>
        </div>

        <div className="relative flex flex-col border-t border-white/[0.06] bg-gradient-to-b from-zinc-950 to-black px-4 py-4 sm:px-5 sm:py-4">
          {extraTags.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-1">
              {extraTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-500"
                >
                  +{categoryConfig[tag].label}
                </span>
              ))}
            </div>
          )}
          <h3 className="text-base font-semibold leading-snug tracking-tight text-white sm:text-[1.05rem]">{item.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500 line-clamp-3">
            {plainGallerySummary(item.description)}
          </p>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600 transition-colors group-hover:text-violet-300/80">
            Open
          </p>
        </div>
      </div>
    </div>
  );
}
