'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import CustomCursor from '@/components/CustomCursor';

export function CustomCursorGate() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setEnabled(!pathname?.startsWith('/docs') && finePointer.matches && !reducedMotion.matches);
    };
    sync();
    finePointer.addEventListener('change', sync);
    reducedMotion.addEventListener('change', sync);
    return () => {
      finePointer.removeEventListener('change', sync);
      reducedMotion.removeEventListener('change', sync);
    };
  }, [pathname]);

  return enabled ? <CustomCursor /> : null;
}
