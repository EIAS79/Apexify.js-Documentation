'use client';

import { useEffect, useState } from 'react';
import type { DocumentationHeading } from '@/lib/docs/schema';

export function DocsChapterNav({ headings }: { headings: DocumentationHeading[] }) {
  const chapters = headings.filter(heading => heading.level === 2);
  const [active, setActive] = useState(chapters[0]?.id ?? '');
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let id = chapters[0]?.id ?? '';
      for (const chapter of chapters) {
        const element = document.getElementById(chapter.id);
        if (element && element.getBoundingClientRect().top < 190) id = chapter.id;
      }
      setActive(id);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    return () => { window.removeEventListener('scroll', schedule); cancelAnimationFrame(frame); };
  // Headings are server-owned and stable within a route.
  }, [headings]);
  if (!chapters.length) return null;
  return <nav className="frame-doc-chapters" aria-label="Article chapters"><span className="frame-doc-chapters-label">IN THIS GUIDE</span><div>{chapters.map((chapter, index) => <a key={chapter.id} href={`#${chapter.id}`} aria-current={active === chapter.id ? 'location' : undefined}><span>{String(index + 1).padStart(2, '0')}</span>{chapter.text}</a>)}</div></nav>;
}
