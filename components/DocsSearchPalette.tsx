"use client";

import { useEffect, useState } from "react";
import { SearchCommandPalette } from "@/components/docs/search/SearchCommandPalette";

/**
 * Compatibility export retained for existing shell imports. DOC-6 owns the implementation.
 * The wrapper also upgrades the legacy docs-route Cmd/Ctrl+K behavior: even when the
 * parent keeps its historical `open=false` on routed docs, the keyboard shortcut opens
 * the canonical command palette instead of requiring sidebar-taxonomy knowledge.
 */
export function DocsSearchPalette({
  open,
  onClose,
  initialQuery = "",
}: {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
}) {
  const [shortcutOpen, setShortcutOpen] = useState(false);

  useEffect(() => {
    if (open) setShortcutOpen(false);
  }, [open]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== "k") return;
      // Outside docs, DocHeader already owns the visible palette state. On docs routes
      // the legacy shell intentionally keeps `open` false, so DOC-6 opens locally.
      if (!open && document.getElementById("docs-sidebar-search-input")) {
        event.preventDefault();
        setShortcutOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => {
    setShortcutOpen(false);
    onClose();
  };

  return <SearchCommandPalette open={open || shortcutOpen} onClose={close} initialQuery={initialQuery} />;
}
