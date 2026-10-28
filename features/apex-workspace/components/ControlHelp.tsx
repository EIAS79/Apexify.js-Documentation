"use client";
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import { controlHelp } from '../control-help';

/** Click/touch and keyboard help, portalled outside scrolling inspector panels. */
export default function ControlHelp({label, description}: {label: string; description?: string}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({left: 12, top: 12});
  const button = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = button.current!.getBoundingClientRect();
      const width = Math.min(284, window.innerWidth - 24);
      const height = card.current?.getBoundingClientRect().height ?? 190;
      const top = rect.bottom + 8 + height <= window.innerHeight - 12 ? rect.bottom + 8 : rect.top - height - 8;
      setPosition({left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
        top: Math.max(12, Math.min(top, window.innerHeight - height - 12))});
    };
    place();
    const close = (event: Event) => {
      const target=event.target instanceof Node?event.target:null;
      if (!target || (!card.current?.contains(target) && !button.current?.contains(target))) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {if (event.key === 'Escape') {event.stopPropagation();setOpen(false);button.current?.focus();}};
    document.addEventListener('pointerdown', close);
    document.addEventListener('focusin', close);
    document.addEventListener('keydown', key, true);
    document.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('focusin', close);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open]);
  return <>
    <button ref={button} type="button" className="aw-help-button" aria-label={`About ${label}`}
      aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => setOpen(!open)} title={`About ${label}`}>
      <InformationCircleIcon />
    </button>
    {open && createPortal(<div ref={card} id={id} role="note" aria-label={`${label} help`}
      className="aw-help-card frame-palette" style={position}>
      <strong>{label}</strong><p>{description ?? controlHelp(label)}</p><small>Esc to close</small>
    </div>, document.body)}
  </>;
}
