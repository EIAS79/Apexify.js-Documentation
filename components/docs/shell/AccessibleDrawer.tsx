'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export function AccessibleDrawer({
  label,
  triggerLabel,
  trigger,
  side = 'left',
  eventName,
  closeEventName,
  children,
}: {
  label: string;
  triggerLabel: string;
  trigger: ReactNode;
  side?: 'left' | 'right' | 'bottom';
  eventName?: string;
  closeEventName?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = `apx-drawer-${useId().replace(/:/g, '')}`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const previousPath = useRef(pathname);

  const close = (restore = true) => {
    // Restore focus synchronously before the dialog unmounts. Scheduling this
    // with requestAnimationFrame creates a race where assistive technology or
    // automation can observe the closed dialog before focus has returned.
    if (restore) triggerRef.current?.focus();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    (focusables[0] ?? dialog).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key !== 'Tab') return;
      const nodes = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!nodes.length) { event.preventDefault(); dialog.focus(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (previousPath.current !== pathname && open) close(false);
    previousPath.current = pathname;
  }, [pathname, open]);

  useEffect(() => {
    if (!eventName) return;
    const onOpen = () => setOpen(true);
    window.addEventListener(eventName, onOpen);
    return () => window.removeEventListener(eventName, onOpen);
  }, [eventName]);

  useEffect(() => {
    if (!closeEventName) return;
    const onClose = () => close(true);
    window.addEventListener(closeEventName, onClose);
    return () => window.removeEventListener(closeEventName, onClose);
  }, [closeEventName]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="apx-icon-button"
        aria-label={triggerLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen(true)}
      >{trigger}</button>
      {open && (
        <>
          <button type="button" className="apx-drawer-backdrop" aria-label={`Close ${label}`} onClick={() => close(true)} />
          <div ref={dialogRef} id={id} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} className="apx-drawer" data-side={side}>
            <div className="apx-drawer__header">
              <span className="apx-drawer__title">{label}</span>
              <button type="button" className="apx-icon-button" aria-label={`Close ${label}`} onClick={() => close(true)}>
                <XMarkIcon className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="apx-drawer__body">{children}</div>
          </div>
        </>
      )}
    </>
  );
}
