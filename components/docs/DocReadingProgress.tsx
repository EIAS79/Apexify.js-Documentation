'use client';

import { useEffect, useState } from 'react';

export function DocReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;

    const update = () => {
      const article =
        (document.querySelector('[data-doc-article]') as HTMLElement | null) ??
        document.body;
      const rect = article.getBoundingClientRect();
      const scrollY = -rect.top;
      const articleHeight = Math.max(1, rect.height - window.innerHeight);
      const ratio = articleHeight <= 0 ? 0 : Math.min(1, Math.max(0, scrollY / articleHeight));
      setProgress(ratio);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('hashchange', onScroll);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="apx-doc-reading-progress"
      style={{ top: 'var(--apx-header-height)' }}
    >
      <div style={{ width: String(progress * 100) + '%' }} />
    </div>
  );
}
