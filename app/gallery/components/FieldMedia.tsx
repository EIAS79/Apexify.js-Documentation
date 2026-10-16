'use client';
import { useEffect, useRef, useState } from 'react';
import { PauseIcon, PlayIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import type { FieldEntry } from '@/lib/gallery/motion-field/catalog';

export function FieldThumbnail({ item, eager = false }: { item: FieldEntry; eager?: boolean }) {
  if (item.media === 'video' && !item.poster) return <video src={item.thumbnail} muted playsInline preload="metadata" aria-label={item.title} />;
  return <img src={item.poster ?? item.thumbnail} alt={item.title} width={1200} height={675} loading={eager ? 'eager' : 'lazy'} draggable={false} />;
}
const time = (value: number) => `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
export function FieldPlayer({ item, motion, onInspect }: { item: FieldEntry; motion: boolean; onInspect: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(true);
  const [foreground, setForeground] = useState(true);
  const [requested, setRequested] = useState(true);
  useEffect(() => {
    const update = () => setForeground(!document.hidden);
    update(); document.addEventListener('visibilitychange', update);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: .2 });
    if (surface.current) observer.observe(surface.current);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  useEffect(() => {
    const node = video.current;
    if (!node) return;
    if (Number.isFinite(node.duration)) setDuration(node.duration);
    if (motion && requested && visible && foreground) void node.play().catch(() => setPlaying(false));
    else node.pause();
  }, [motion, requested, visible, foreground, item.id]);
  return <div className="field-player" ref={surface}>
    <div className="field-player-art">
      {item.media === 'video' ? <video ref={video} src={item.thumbnail} poster={item.poster} muted playsInline loop preload="metadata"
        onDurationChange={event => { if (Number.isFinite(event.currentTarget.duration)) setDuration(event.currentTarget.duration); }} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => setPosition(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onError={() => setError(true)} aria-label={`${item.title} rendered preview`} />
        : item.media === 'gif' ? <img src={motion ? item.thumbnail : (item.poster ?? item.thumbnail)} alt={item.title} width={1200} height={675} /> : <FieldThumbnail item={item} eager />}
    </div>
    <div className="field-player-controls">
      {item.media === 'video' && !error ? <>
        <button className="field-icon" disabled={!motion} aria-label={playing ? 'Pause preview' : 'Play preview'} onClick={() => setRequested(!playing)}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
        <input aria-label="Preview position" type="range" min={0} max={duration || 4} step={.05} value={position} onChange={event => { const value = Number(event.target.value); if (video.current) video.current.currentTime = value; setPosition(value); }} />
        <span className="field-mono">{time(position)} / {time(duration)}</span>
      </> : <span className="field-mono">{error ? 'Preview unavailable. Open the example to view its source.' : 'RENDERED CANVAS / PNG'}</span>}
      <button className="field-icon" aria-label={`Inspect ${item.title}`} onClick={onInspect}><ArrowsPointingOutIcon /></button>
    </div>
  </div>;
}
