'use client';

import { useId, useState } from 'react';
import { CodeBlock } from './CodeBlock';

export interface DocsTabItem {
  label: string;
  content: string;
  language?: string;
}

export function Tabs({ items, ariaLabel = 'Documentation examples' }: { items: DocsTabItem[]; ariaLabel?: string }) {
  const [active, setActive] = useState(0);
  const id = useId().replace(/:/g, '');
  const safeItems = items.filter((item) => item && typeof item.label === 'string');
  if (safeItems.length === 0) return null;
  const selected = Math.min(active, safeItems.length - 1);
  const move = (index: number) => setActive((index + safeItems.length) % safeItems.length);

  return (
    <div className="apx-doc3-tabs" data-doc3-component="Tabs">
      <div role="tablist" aria-label={ariaLabel} className="apx-doc3-tabs__list">
        {safeItems.map((item, index) => (
          <button
            key={`${item.label}-${index}`}
            id={`${id}-tab-${index}`}
            type="button"
            role="tab"
            aria-selected={selected === index}
            aria-controls={`${id}-panel-${index}`}
            tabIndex={selected === index ? 0 : -1}
            onClick={() => move(index)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') { event.preventDefault(); move(index + 1); }
              if (event.key === 'ArrowLeft') { event.preventDefault(); move(index - 1); }
              if (event.key === 'Home') { event.preventDefault(); move(0); }
              if (event.key === 'End') { event.preventDefault(); move(safeItems.length - 1); }
            }}
            className="apx-doc3-tabs__tab"
          >
            {item.label}
          </button>
        ))}
      </div>
      {safeItems.map((item, index) => (
        <div
          key={`${item.label}-panel-${index}`}
          id={`${id}-panel-${index}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${index}`}
          hidden={selected !== index}
          tabIndex={0}
          className="apx-doc3-tabs__panel"
        >
          {item.language ? <CodeBlock lang={item.language} docsStudio>{item.content}</CodeBlock> : <p>{item.content}</p>}
        </div>
      ))}
    </div>
  );
}
