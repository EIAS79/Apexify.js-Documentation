"use client";

import { useEffect, useRef } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { GlobalDocsSearch } from "./GlobalDocsSearch";

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

export function SearchCommandPalette({
  open,
  onClose,
  initialQuery = "",
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const restoreRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])]
        .filter((element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      requestAnimationFrame(() => restoreRef.current?.focus());
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center px-3 pt-[8vh] sm:px-4 sm:pt-[12vh]"
      style={{ background: "color-mix(in srgb, var(--bg-base) 72%, black)", backdropFilter: "blur(10px)" }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search Apexify documentation"
        className="w-full max-w-3xl overflow-hidden rounded-2xl p-3 sm:p-4"
        style={{ background: "var(--bg-raised)", border: "1px solid var(--border-default)", boxShadow: "var(--shadow-xl)" }}
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Search Apexify</h2>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>Docs, API symbols, nested options, types, examples, Gallery, and diagnostics.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" aria-label="Close search">
            <XMarkIcon className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <GlobalDocsSearch
          inputId="docs-command-search-input"
          initialQuery={initialQuery}
          autoFocus
          onEscape={onClose}
          onNavigate={onClose}
        />
        <p className="mt-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
          ↑/↓ select · Enter open canonical result · Esc clear/close · Tab stays inside palette · recent searches stay in this browser only
        </p>
      </div>
    </div>
  );
}
