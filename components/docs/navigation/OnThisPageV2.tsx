'use client';

import { useEffect, useMemo, useState } from 'react';
import type { DocumentationHeading } from '@/lib/docs/schema';

type TocNode = { heading: DocumentationHeading; children: TocNode[] };

function buildTree(headings: DocumentationHeading[]): TocNode[] {
  const roots: TocNode[] = [];
  const stack: TocNode[] = [];
  for (const heading of headings) {
    const node: TocNode = { heading, children: [] };
    while (stack.length && stack[stack.length - 1].heading.level >= heading.level) stack.pop();
    if (stack.length) stack[stack.length - 1].children.push(node);
    else roots.push(node);
    stack.push(node);
  }
  return roots;
}

function TocItems({ nodes, activeId }: { nodes: TocNode[]; activeId: string }) {
  return (
    <ul className="apx-toc-list">
      {nodes.map((node) => (
        <li key={node.heading.id}>
          <a
            className="apx-toc-link"
            href={`#${node.heading.id}`}
            aria-current={activeId === node.heading.id ? 'location' : undefined}
            onClick={() => {
              setTimeout(() => window.dispatchEvent(new Event('apx-close-docs-toc')), 0);
            }}
          >
            {node.heading.text}
          </a>
          {node.children.length ? <TocItems nodes={node.children} activeId={activeId} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function OnThisPageV2({ headings }: { headings: DocumentationHeading[] }) {
  const tree = useMemo(() => buildTree(headings), [headings]);
  const [activeId, setActiveId] = useState(headings[0]?.id ?? '');

  useEffect(() => {
    if (!headings.length) return;
    const elements = headings.map((heading) => document.getElementById(heading.id)).filter((element): element is HTMLElement => Boolean(element));
    if (!elements.length) return;
    const update = () => {
      const threshold = 112;
      let active = elements[0].id;
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= threshold) active = element.id;
      }
      setActiveId((current) => current === active ? current : active);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    window.addEventListener('hashchange', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      window.removeEventListener('hashchange', update);
    };
  }, [headings]);

  if (!headings.length) return null;
  return (
    <nav aria-label="On this page" id="docs-toc-rail" data-doc2-toc>
      <p className="apx-toc-title">On this page</p>
      <TocItems nodes={tree} activeId={activeId} />
    </nav>
  );
}
