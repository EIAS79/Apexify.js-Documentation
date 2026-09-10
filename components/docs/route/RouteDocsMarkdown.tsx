import Link from 'next/link';
import React, { type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CodeBlock } from '@/components/mdx/CodeBlock';
import { DocHeadingAnchor } from '@/components/docs/DocHeadingAnchor';
import { canonicalizeLegacyDocumentationHref } from '@/lib/docs/legacy-routing';
import { parseHeadingTitleAndId, slugifyHeading } from '@/lib/docs-heading-utils';

function childrenToPlainText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(childrenToPlainText).join('');
  if (React.isValidElement(node)) {
    return childrenToPlainText(
      (node.props as { children?: ReactNode }).children,
    );
  }
  return '';
}

function heading(level: 1 | 2 | 3) {
  return function DocumentationHeading({
    children,
    node: _node,
    ...props
  }: React.HTMLAttributes<HTMLHeadingElement> & { node?: unknown }) {
    const rawLabel = childrenToPlainText(children);
    const parsed = parseHeadingTitleAndId(rawLabel);
    const id = parsed.id || slugifyHeading(parsed.label);
    const className =
      level === 1
        ? 'group not-prose mb-6 mt-4 scroll-mt-28 pb-4 text-3xl font-black leading-tight tracking-tight sm:mb-8 sm:mt-8 sm:text-4xl md:text-5xl text-grad-aurora'
        : level === 2
          ? 'group not-prose mb-4 mt-8 flex scroll-mt-28 flex-wrap items-center gap-2 text-2xl font-bold leading-snug sm:mb-6 sm:mt-12 sm:gap-3 sm:text-3xl md:text-4xl'
          : 'group not-prose mb-3 mt-6 flex scroll-mt-28 flex-wrap items-center gap-2 text-xl font-bold leading-snug sm:mb-4 sm:mt-8 sm:text-2xl';

    const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3';
    return (
      <HeadingTag
        {...props}
        id={id}
        className={className}
        style={{
          color: level === 1 ? undefined : 'var(--text-primary)',
          borderBottom: level === 1 ? '1px solid var(--border-default)' : undefined,
        }}
      >
        {level > 1 && (
          <span
            aria-hidden
            style={{
              color: level === 2 ? 'var(--accent-magenta)' : 'var(--accent-iris)',
            }}
          >
            {level === 2 ? '#' : '##'}
          </span>
        )}
        <span>{parsed.label}</span>
        <DocHeadingAnchor id={id} />
      </HeadingTag>
    );
  };
}

const markdownComponents: Components = {
  h1: heading(1),
  h2: heading(2),
  h3: heading(3),
  pre({ node: _node, children }) {
    return <>{children}</>;
  },
  code({ node: _node, className, children, ...props }) {
    const languageMatch = /language-([\w-]+)/.exec(className ?? '');
    if (languageMatch) {
      return (
        <CodeBlock lang={languageMatch[1]} docsStudio>
          {String(children).replace(/\n$/, '')}
        </CodeBlock>
      );
    }
    return (
      <code
        {...props}
        className="rounded-md px-2 py-1 font-mono text-sm"
        style={{
          backgroundColor: 'var(--bg-sunken)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-default)',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      >
        {children}
      </code>
    );
  },
  p({ node: _node, children, ...props }) {
    return (
      <p
        {...props}
        className="mb-4 text-base leading-relaxed sm:mb-6 sm:text-lg"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </p>
    );
  },
  ul({ node: _node, children, ...props }) {
    return (
      <ul
        {...props}
        className="mb-4 ml-4 list-disc space-y-2 text-base sm:mb-6 sm:ml-6 sm:text-lg"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </ul>
    );
  },
  ol({ node: _node, children, ...props }) {
    return (
      <ol
        {...props}
        className="mb-4 ml-4 list-decimal space-y-2 text-base sm:mb-6 sm:ml-6 sm:text-lg"
        style={{ color: 'var(--text-secondary)' }}
      >
        {children}
      </ol>
    );
  },
  li({ node: _node, children, ...props }) {
    return (
      <li {...props} className="leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
        {children}
      </li>
    );
  },
  strong({ node: _node, children, ...props }) {
    return (
      <strong {...props} className="font-bold" style={{ color: 'var(--text-primary)' }}>
        {children}
      </strong>
    );
  },
  em({ node: _node, children, ...props }) {
    return (
      <em {...props} className="italic" style={{ color: 'var(--text-primary)' }}>
        {children}
      </em>
    );
  },
  a({ node: _node, href = '', children, ...props }) {
    const targetHref = canonicalizeLegacyDocumentationHref(href);
    const className = 'font-medium underline transition-colors';
    const style = {
      color: 'var(--text-primary)',
      textDecorationColor: 'var(--accent-iris)',
    };
    if (targetHref.startsWith('/')) {
      return (
        <Link href={targetHref} className={className} style={style}>
          {children}
        </Link>
      );
    }
    return (
      <a {...props} href={targetHref} className={className} style={style}>
        {children}
      </a>
    );
  },
  blockquote({ node: _node, children, ...props }) {
    return (
      <blockquote
        {...props}
        className="my-6 rounded-r-lg py-4 pl-6 pr-4 italic"
        style={{
          borderLeft: '4px solid var(--accent-magenta)',
          backgroundColor: 'color-mix(in srgb, var(--accent-magenta) 8%, transparent)',
          color: 'var(--text-secondary)',
        }}
      >
        {children}
      </blockquote>
    );
  },
  hr({ node: _node, ...props }) {
    return (
      <hr
        {...props}
        className="my-12"
        style={{ border: 0, borderTop: '1px solid var(--border-default)' }}
      />
    );
  },
  table({ node: _node, children, ...props }) {
    return (
      <div
        className="my-6 overflow-x-auto rounded-xl"
        style={{ border: '1px solid var(--border-default)' }}
        tabIndex={0}
        role="region"
        aria-label="Documentation table"
      >
        <table {...props} className="w-full border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    );
  },
  th({ node: _node, children, ...props }) {
    return (
      <th
        {...props}
        className="px-3 py-2 font-semibold"
        style={{
          backgroundColor: 'var(--bg-sunken)',
          color: 'var(--text-primary)',
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        {children}
      </th>
    );
  },
  td({ node: _node, children, ...props }) {
    return (
      <td
        {...props}
        className="px-3 py-2 align-top"
        style={{
          color: 'var(--text-secondary)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        {children}
      </td>
    );
  },
};

export function RouteDocsMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
