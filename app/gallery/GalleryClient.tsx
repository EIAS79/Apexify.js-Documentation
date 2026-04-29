'use client';

import { useState, useEffect, useRef } from 'react';
import {
  PhotoIcon,
  SparklesIcon,
  ChartBarIcon,
  FilmIcon,
  PlayIcon,
  Squares2X2Icon,
  PaintBrushIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/Navbar';
import { GalleryCodeEditor } from '@/components/GalleryCodeEditor';
import Link from 'next/link';
import { backgroundGalleryItems } from '@/lib/gallery/backgroundSnippets';
import { spinWheelGalleryItems } from '@/lib/gallery/spinWheelSnippets';
import { presentationSlideGalleryItems } from '@/lib/gallery/presentationSlideSnippet';
import { formatDurationMs } from '@/lib/gallery/formatDuration';
import { isAbortError } from '@/lib/gallery/runErrors';

/** Time-based estimate until the HTTP response returns (server does not stream real step %). */
function approxRunPercent(elapsedMs: number): number {
  return Math.min(93, Math.floor(100 * (1 - Math.exp(-elapsedMs / 24000))));
}

function runPhaseLabel(percent: number): string {
  if (percent < 14) return 'Starting…';
  if (percent < 32) return 'Preparing & validating code…';
  if (percent < 52) return 'Executing in sandbox…';
  if (percent < 72) return 'Drawing / encoding…';
  if (percent < 88) return 'Almost there…';
  return 'Finishing up…';
}

type Category = 'all' | 'background' | 'images' | 'text' | 'charts' | 'videos' | 'gifs' | 'extras' | 'mix' | 'advance';

interface GalleryItem {
  id: string;
  title: string;
  category: Category;
  description: string;
  thumbnail: string;
  featured?: boolean;
  code?: {
    ts?: string;
    js?: string;
  };
}

/** Curated examples; add more modules (e.g. charts) and spread here. */
const galleryItems: GalleryItem[] = [
  ...backgroundGalleryItems,
  ...spinWheelGalleryItems,
  ...presentationSlideGalleryItems,
];

const categoryConfig: Record<Category, { label: string; icon: typeof Squares2X2Icon; color: string; gradient: string }> = {
  all: { label: 'All', icon: Squares2X2Icon, color: 'text-gray-300', gradient: 'from-gray-500 to-gray-600' },
  background: { label: 'Background', icon: PaintBrushIcon, color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500' },
  images: { label: 'Images', icon: PhotoIcon, color: 'text-green-400', gradient: 'from-green-500 to-emerald-500' },
  text: { label: 'Text', icon: SparklesIcon, color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500' },
  charts: { label: 'Charts', icon: ChartBarIcon, color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500' },
  videos: { label: 'Videos', icon: FilmIcon, color: 'text-red-400', gradient: 'from-red-500 to-pink-500' },
  gifs: { label: 'GIFs', icon: PlayIcon, color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500' },
  extras: { label: 'Extras', icon: RocketLaunchIcon, color: 'text-indigo-400', gradient: 'from-indigo-500 to-purple-500' },
  mix: { label: 'Mix', icon: Squares2X2Icon, color: 'text-orange-400', gradient: 'from-orange-500 to-red-500' },
  advance: { label: 'Advance', icon: CheckCircleIcon, color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500' },
};

export default function GalleryClient() {
  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [visibleItems, setVisibleItems] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const filteredItems = selectedCategory === 'all' ? galleryItems : galleryItems.filter((item) => item.category === selectedCategory);

  const featuredItems = filteredItems.filter((item) => item.featured);
  const regularItems = filteredItems.filter((item) => !item.featured);

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

  const handleItemClick = (item: GalleryItem) => {
    setSelectedItem(item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
  };

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

      <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6">
              <span
                className="relative inline-block"
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899, #06b6d4, #3b82f6)',
                  backgroundSize: '300% 300%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradient 5s ease infinite',
                }}
              >
                Gallery
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
              Explore stunning examples of what you can create with Apexify.js
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-30 bg-black/80 backdrop-blur-md border-b border-slate-800/50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {Object.entries(categoryConfig).map(([key, config]) => {
              const IconComponent = config.icon;
              const isActive = selectedCategory === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key as Category)}
                  className={`group relative flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 ${
                    isActive
                      ? `bg-gradient-to-r ${config.gradient} text-white shadow-lg shadow-blue-500/30 scale-105`
                      : 'bg-slate-800/60 text-gray-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  <IconComponent className={`h-5 w-5 ${isActive ? 'text-white' : config.color}`} />
                  <span className="text-sm sm:text-base">{config.label}</span>
                  {isActive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping" />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8" ref={galleryRef}>
        <div className="max-w-7xl mx-auto">
          {featuredItems.length > 0 && (
            <div className="mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-200 flex items-center gap-3">
                <span className="text-2xl">⭐</span>
                Featured Examples
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {featuredItems.map((item, index) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={index}
                    isVisible={visibleItems.has(item.id)}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {regularItems.length > 0 && (
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-gray-200">
                {selectedCategory === 'all' ? 'All Examples' : categoryConfig[selectedCategory].label + ' Examples'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
                {regularItems.map((item, index) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={index}
                    isVisible={visibleItems.has(item.id)}
                    onClick={() => handleItemClick(item)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredItems.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-6">🎨</div>
              <h3 className="text-2xl font-bold text-gray-300 mb-4">Gallery is being refreshed</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                New samples and thumbnails will appear here once you add them to <code className="text-slate-400">backgroundGalleryItems</code> in{' '}
                <code className="text-slate-400">lib/gallery/backgroundSnippets.ts</code>.
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

      {selectedItem && <GalleryModal item={selectedItem} onClose={handleCloseModal} />}
    </div>
  );
}

type MobilePanel = 'preview' | 'code';

function GalleryModal({ item, onClose }: { item: GalleryItem; onClose: () => void }) {
  const categoryInfo = categoryConfig[item.category];
  const hasTs = Boolean(item.code?.ts?.trim());
  const hasJs = Boolean(item.code?.js?.trim());
  const hasEditableCode = hasTs || hasJs;

  const runAbortRef = useRef<AbortController | null>(null);
  const clientRunStartedRef = useRef(0);
  const runProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const runStartedAtRef = useRef<number>(0);

  const [panel, setPanel] = useState<MobilePanel>('preview');
  const [codeLang, setCodeLang] = useState<'ts' | 'js'>('ts');
  const [editedTs, setEditedTs] = useState('');
  const [editedJs, setEditedJs] = useState('');
  const [liveUrl, setLiveUrl] = useState<string | null>(null);
  const [liveMime, setLiveMime] = useState<string>('image/png');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [runProgressPct, setRunProgressPct] = useState(0);
  const [runProgressDetail, setRunProgressDetail] = useState('');
  const [elapsedWallMs, setElapsedWallMs] = useState(0);
  const [sandboxLimitMs, setSandboxLimitMs] = useState<number | null>(null);
  const [lastRunTiming, setLastRunTiming] = useState<{
    serverMs: number;
    roundTripMs: number;
  } | null>(null);

  const clearRunProgressTick = () => {
    if (runProgressIntervalRef.current) {
      clearInterval(runProgressIntervalRef.current);
      runProgressIntervalRef.current = null;
    }
    setElapsedWallMs(0);
  };

  const startRunProgressTick = () => {
    clearRunProgressTick();
    runStartedAtRef.current = Date.now();
    setRunProgressPct(0);
    setRunProgressDetail('Starting…');
    setElapsedWallMs(0);
    runProgressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - runStartedAtRef.current;
      const pct = approxRunPercent(elapsed);
      setRunProgressPct(pct);
      setRunProgressDetail(runPhaseLabel(pct));
      setElapsedWallMs(elapsed);
    }, 220);
  };

  useEffect(() => {
    runAbortRef.current?.abort();
    clearRunProgressTick();
    setRunProgressPct(0);
    setRunProgressDetail('');
    setLastRunTiming(null);
    setPanel('preview');
    setLiveUrl(null);
    setPreviewError(null);
    setPreviewLoading(false);
    setEditedTs(item.code?.ts ?? '');
    setEditedJs(item.code?.js ?? '');
    setCodeLang(hasTs ? 'ts' : 'js');
  }, [item.id, item.code?.ts, item.code?.js, hasTs]);

  useEffect(() => {
    return () => {
      runAbortRef.current?.abort();
      clearRunProgressTick();
    };
  }, []);

  useEffect(() => {
    return () => {
      if (liveUrl?.startsWith('blob:')) URL.revokeObjectURL(liveUrl);
    };
  }, [liveUrl]);

  const resetEditors = () => {
    setEditedTs(item.code?.ts ?? '');
    setEditedJs(item.code?.js ?? '');
    setPreviewError(null);
  };

  const runSandboxed = async () => {
    if (!hasEditableCode) return;
    const language = codeLang;
    const code = language === 'ts' ? editedTs : editedJs;
    if (!code.trim()) {
      setPreviewError('Add some code before running.');
      return;
    }

    runAbortRef.current?.abort();
    const ac = new AbortController();
    runAbortRef.current = ac;

    clientRunStartedRef.current = typeof performance !== 'undefined' ? performance.now() : Date.now();
    setPreviewLoading(true);
    setPreviewError(null);
    setLastRunTiming(null);
    startRunProgressTick();
    try {
      const res = await fetch('/api/gallery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language }),
        signal: ac.signal,
      });

      const text = await res.text();
      let payload: {
        error?: string;
        mime?: string;
        data?: string;
        durationMs?: number;
        sandboxTimeoutMs?: number;
      };
      try {
        payload = text ? (JSON.parse(text) as typeof payload) : {};
      } catch {
        clearRunProgressTick();
        setRunProgressPct(0);
        setRunProgressDetail('');
        setPreviewError(res.ok ? 'Invalid response from server.' : `Run failed (${res.status}). Try again.`);
        return;
      }

      if (typeof payload.sandboxTimeoutMs === 'number' && Number.isFinite(payload.sandboxTimeoutMs)) {
        setSandboxLimitMs(payload.sandboxTimeoutMs);
      }

      if (!res.ok) {
        clearRunProgressTick();
        setRunProgressPct(0);
        setRunProgressDetail('');
        const baseErr =
          typeof payload.error === 'string' && payload.error.trim()
            ? payload.error.trim()
            : `Run failed (${res.status}).`;
        const dm = typeof payload.durationMs === 'number' ? payload.durationMs : undefined;
        setPreviewError(
          dm !== undefined ? `${baseErr} (elapsed ${formatDurationMs(dm)})` : baseErr
        );
        return;
      }

      clearRunProgressTick();
      setRunProgressPct(100);
      setRunProgressDetail('Done — preparing output…');

      const mime = typeof payload.mime === 'string' && payload.mime.trim() ? payload.mime.trim() : 'image/png';
      const b64 = payload.data;
      if (typeof b64 !== 'string' || !b64.trim()) {
        setRunProgressPct(0);
        setRunProgressDetail('');
        setPreviewError('Server did not return image data.');
        return;
      }

      let bin: Uint8Array;
      try {
        bin = Uint8Array.from(atob(b64.trim()), (c) => c.charCodeAt(0));
      } catch {
        setRunProgressPct(0);
        setRunProgressDetail('');
        setPreviewError('Could not decode image data.');
        return;
      }

      const blob = new Blob([new Uint8Array(bin)], { type: mime });
      const url = URL.createObjectURL(blob);
      setLiveUrl((prev) => {
        if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
        return url;
      });
      setLiveMime(mime);
      setPanel('preview');
      setRunProgressDetail('Finished — output ready.');
      const roundTripMs =
        typeof performance !== 'undefined'
          ? Math.round(performance.now() - clientRunStartedRef.current)
          : Math.round(Date.now() - runStartedAtRef.current);
      const serverMs = typeof payload.durationMs === 'number' ? payload.durationMs : roundTripMs;
      setLastRunTiming({ serverMs, roundTripMs });
      await new Promise((r) => setTimeout(r, 450));
    } catch (e) {
      if (isAbortError(e)) {
        clearRunProgressTick();
        setRunProgressPct(0);
        setRunProgressDetail('');
        return;
      }
      clearRunProgressTick();
      setRunProgressPct(0);
      setRunProgressDetail('');
      const msg =
        e instanceof TypeError && /fetch|network|failed/i.test(e.message)
          ? 'Network error. Check your connection and try again.'
          : e instanceof Error
            ? e.message
            : 'Run failed.';
      setPreviewError(msg || 'Run failed.');
    } finally {
      clearRunProgressTick();
      if (!ac.signal.aborted) {
        setPreviewLoading(false);
        setRunProgressPct(0);
        setRunProgressDetail('');
      }
    }
  };

  const displayUrl = liveUrl || item.thumbnail;
  const isVideoThumb = /\.(mp4|webm|mov)(\?|$)/i.test(item.thumbnail);
  const showVideoFallback = isVideoThumb && !liveUrl;

  const runResetButtons = (
    <>
      <button
        type="button"
        onClick={runSandboxed}
        disabled={previewLoading || !hasEditableCode}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white min-w-0"
      >
        <PlayIcon className="h-4 w-4 shrink-0" />
        <span className="truncate">{previewLoading ? 'Running…' : 'Run'}</span>
      </button>
      <button
        type="button"
        onClick={resetEditors}
        disabled={previewLoading || !hasEditableCode}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-gray-200 border border-slate-600 min-w-0"
        title="Restore original snippet"
      >
        <ArrowPathIcon className="h-4 w-4 shrink-0" />
        Reset
      </button>
    </>
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] animate-fade-in" onClick={onClose} aria-hidden />

      <div
        className="fixed inset-0 z-[101] flex flex-col p-0 sm:p-3 md:p-6 lg:p-10 animate-fade-in pointer-events-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gallery-modal-title"
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

          <div className="flex-shrink-0 pt-14 sm:pt-4 px-4 pb-3 border-b border-slate-800/50 bg-slate-950/90">
            <div className="flex items-start gap-3 pr-10">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${categoryInfo.gradient} flex-shrink-0`}>
                <categoryInfo.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 id="gallery-modal-title" className="text-lg sm:text-xl lg:text-2xl font-bold text-white break-words">
                  {item.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 line-clamp-3 sm:line-clamp-none">{item.description}</p>
              </div>
            </div>

            {/* Small screens: Code / Output tabs + Run / Reset (hidden on lg+ where both panes show) */}
            <div className="flex flex-wrap items-center gap-2 mt-4 lg:hidden">
              <button
                type="button"
                onClick={() => setPanel('code')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  panel === 'code' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                Code
              </button>
              <button
                type="button"
                onClick={() => setPanel('preview')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  panel === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                }`}
              >
                Output
              </button>
              {runResetButtons}
            </div>

            {/* Large screens: Run / Reset only (no Code/Output tabs — dual pane) */}
            <div className="hidden lg:flex flex-wrap items-center gap-2 mt-4">{runResetButtons}</div>

            {previewLoading && (
              <div
                className="mt-3 space-y-2 max-w-xl"
                role="progressbar"
                aria-valuenow={runProgressPct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Run progress"
              >
                <div className="flex justify-between gap-3 text-xs text-slate-400 flex-wrap">
                  <span className="min-w-0 truncate">{runProgressDetail || 'Working…'}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-0.5 shrink-0 tabular-nums font-medium text-slate-300">
                    <span>{runProgressPct}%</span>
                    {elapsedWallMs > 0 && (
                      <span className="text-slate-500 font-normal">Elapsed {formatDurationMs(elapsedWallMs)}</span>
                    )}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-800/90 overflow-hidden ring-1 ring-slate-700/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-[width] duration-300 ease-out"
                    style={{ width: `${runProgressPct}%` }}
                  />
                </div>
                <p className="text-[11px] leading-snug text-slate-500">
                  Percent is estimated from elapsed time (server does not stream real steps).{' '}
                  {sandboxLimitMs != null && (
                    <>
                      Sandbox VM limit: {formatDurationMs(sandboxLimitMs)} (set{' '}
                      <code className="text-slate-400">GALLERY_VM_TIMEOUT_MS</code> on the server to allow longer GIF/MP4).{' '}
                    </>
                  )}
                  Long jobs fail once that limit is hit.
                </p>
              </div>
            )}

            {hasEditableCode && (
              <p className="text-xs text-slate-400 mt-2 max-w-3xl">
                Run executes your edited code in a locked-down server sandbox (ApexPainter and safe builtins — no{' '}
                <code className="text-slate-300">require</code>, raw <code className="text-slate-300">fs</code>, or{' '}
                <code className="text-slate-300">process</code>). Return PNG (<code className="text-slate-300">canvas.buffer</code>
                ), GIF, or MP4 bytes — GIF/MP4 spins need FFmpeg on the server.
              </p>
            )}
            {previewError && (
              <p className="text-sm text-red-400 mt-2 break-words max-h-32 overflow-y-auto" role="alert">
                {previewError}
              </p>
            )}
          </div>

          <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
            <div
              className={`flex flex-col min-h-0 min-w-0 lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-800/50 bg-slate-950 ${
                panel === 'code' ? 'flex flex-1 min-h-[50vh] lg:min-h-0' : 'hidden lg:flex lg:flex-1'
              }`}
            >
              <div className="flex-shrink-0 flex flex-wrap items-center gap-2 px-3 sm:px-4 pt-3 border-b border-slate-800/50">
                {hasTs && (
                  <button
                    type="button"
                    onClick={() => setCodeLang('ts')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      codeLang === 'ts' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    TypeScript
                  </button>
                )}
                {hasJs && (
                  <button
                    type="button"
                    onClick={() => setCodeLang('js')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      codeLang === 'js' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
                    }`}
                  >
                    JavaScript
                  </button>
                )}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto p-3 sm:p-4 lg:p-6 overscroll-contain touch-pan-y">
                {hasEditableCode ? (
                  <GalleryCodeEditor
                    key={`${item.id}-${codeLang}`}
                    language={codeLang === 'ts' ? 'typescript' : 'javascript'}
                    value={codeLang === 'ts' ? editedTs : editedJs}
                    onChange={(next) => (codeLang === 'ts' ? setEditedTs(next) : setEditedJs(next))}
                  />
                ) : (
                  <div className="flex items-center justify-center min-h-[200px] text-gray-400 text-center">
                    <div>
                      <p className="text-lg mb-2">No code available</p>
                      <p className="text-sm">Code will be displayed here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div
              className={`flex flex-col min-h-0 min-w-0 lg:w-1/2 ${
                panel === 'preview' ? 'flex flex-1 lg:flex-[1]' : 'hidden lg:flex lg:flex-1'
              }`}
            >
              <div className="flex-1 min-h-0 overflow-auto p-3 sm:p-4 lg:p-6 bg-slate-900/40 touch-pan-y">
                <div className="min-h-[200px] sm:min-h-[240px] flex flex-col items-center justify-center gap-3">
                  {showVideoFallback ? (
                    <div className="text-center text-gray-400 px-4">
                      <p className="mb-2">Video thumbnail in browser</p>
                      <video src={item.thumbnail} className="max-w-full max-h-[50vh] rounded-xl mx-auto" controls playsInline />
                    </div>
                  ) : liveMime.startsWith('video/') && liveUrl ? (
                    <video src={displayUrl} className="max-w-full max-h-[min(70vh,800px)] rounded-xl shadow-2xl" controls playsInline />
                  ) : (
                    <img
                      src={displayUrl}
                      alt={item.title}
                      className="max-w-full max-h-[min(70vh,800px)] w-auto h-auto object-contain rounded-xl shadow-2xl"
                    />
                  )}
                  {liveUrl && lastRunTiming && (
                    <p className="text-xs text-slate-400 text-center max-w-lg px-2" aria-live="polite">
                      Server execution: <span className="text-slate-300 font-medium">{formatDurationMs(lastRunTiming.serverMs)}</span>
                      {' · '}
                      Round trip (browser):{' '}
                      <span className="text-slate-300 font-medium">{formatDurationMs(lastRunTiming.roundTripMs)}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
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
  const categoryInfo = categoryConfig[item.category];
  const IconComponent = categoryInfo.icon;

  return (
    <div
      data-gallery-item
      id={item.id}
      onClick={onClick}
      className={`group relative glass-strong border border-gray-700/50 rounded-2xl sm:rounded-3xl overflow-hidden hover:border-blue-500/40 transition-all duration-500 hover-lift cursor-pointer ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{
        animationDelay: `${index * 50}ms`,
        boxShadow: '0 0 30px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div className="relative aspect-video overflow-hidden bg-slate-900">
        <img
          src={item.thumbnail}
          alt={item.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          style={{ willChange: 'transform' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-4 left-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${categoryInfo.gradient} bg-opacity-90 backdrop-blur-sm`}>
            <IconComponent className="h-4 w-4 text-white" />
            <span className="text-xs font-bold text-white uppercase">{categoryInfo.label}</span>
          </div>
        </div>

        {item.featured && (
          <div className="absolute top-4 right-4">
            <div className="px-3 py-1.5 rounded-lg bg-yellow-500/90 backdrop-blur-sm">
              <span className="text-xs font-bold text-black">⭐ Featured</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-300 transition-colors duration-200">{item.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{item.description}</p>
      </div>

      <div className={`absolute inset-0 bg-gradient-to-r ${categoryInfo.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 -z-10`} />
    </div>
  );
}
