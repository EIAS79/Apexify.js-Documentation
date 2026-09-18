'use client';

import { useEffect, useState } from 'react';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

export default function ScrollTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 700);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 inline-flex h-10 w-10 items-center justify-center rounded-md border focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: 'var(--surface-1)', borderColor: 'var(--border)', color: 'var(--accent)', boxShadow: 'var(--shadow-1)' }}
      aria-label="Scroll to top"
    >
      <ArrowUpIcon className="h-4 w-4" />
    </button>
  );
}
