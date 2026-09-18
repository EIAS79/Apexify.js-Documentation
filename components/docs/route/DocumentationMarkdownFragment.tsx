import Link from 'next/link';
import React, { type ReactNode } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { StaticCodeBlock } from '@/components/mdx/StaticCodeBlock';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/mdx/Table';
import { DocHeadingAnchor } from '@/components/docs/DocHeadingAnchor';
import { canonicalizeLegacyDocumentationHref } from '@/lib/docs/legacy-routing';
import { parseHeadingTitleAndId, slugifyHeading } from '@/lib/docs-heading-utils';

function childrenToPlainText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(childrenToPlainText).join('');
  if (React.isValidElement(node)) return childrenToPlainText((node.props as { children?: ReactNode }).children);
  return '';
}

function heading(level: 1 | 2 | 3) {
  return function DocumentationHeading({ children, node: _node, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { node?: unknown }) {
    const rawLabel = childrenToPlainText(children);
    const parsed = parseHeadingTitleAndId(rawLabel);
    const id = parsed.id || slugifyHeading(parsed.label);
    const className = level === 1
      ? 'group not-prose mb-6 mt-4 scroll-mt-28 pb-4 text-3xl font-black leading-tight tracking-tight sm:mb-8 sm:mt-8 sm:text-4xl md:text-5xl text-grad-aurora'
      : level === 2
        ? 'group not-prose mb-4 mt-8 flex scroll-mt-28 flex-wrap items-center gap-2 text-2xl font-bold leading-snug sm:mb-6 sm:mt-12 sm:gap-3 sm:text-3xl md:text-4xl'
        : 'group not-prose mb-3 mt-6 flex scroll-mt-28 flex-wrap items-center gap-2 text-xl font-bold leading-snug sm:mb-4 sm:mt-8 sm:text-2xl';
    const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3';
    return <HeadingTag {...props} id={id} className={className} style={{ color: level === 1 ? undefined : 'var(--text-primary)', borderBottom: level === 1 ? '1px solid var(--border-default)' : undefined }}>{level > 1 ? <span aria-hidden style={{ color: level === 2 ? 'var(--accent-magenta)' : 'var(--accent-iris)' }}>{level === 2 ? '#' : '##'}</span> : null}<span>{parsed.label}</span><DocHeadingAnchor id={id} /></HeadingTag>;
  };
}

const markdownComponents: Components = {
  h1: heading(1), h2: heading(2), h3: heading(3),
  pre({ children }) { return <>{children}</>; },
  code({ className, children, ...props }) {
    const languageMatch = /language-([\w-]+)/.exec(className ?? '');
    if (languageMatch) return <StaticCodeBlock lang={languageMatch[1]} docsStudio>{String(children).replace(/\n$/, '')}</StaticCodeBlock>;
    return <code {...props} className="rounded-md px-2 py-1 font-mono text-sm" style={{ backgroundColor: 'var(--bg-sunken)', color: 'var(--text-primary)', border: '1px solid var(--border-default)', overflowWrap: 'anywhere', wordBreak: 'break-word' }}>{children}</code>;
  },
  table({ children, ...props }) { return <Table {...props}>{children}</Table>; },
  thead({ children, ...props }) { return <TableHead {...props}>{children}</TableHead>; },
  tbody({ children, ...props }) { return <TableBody {...props}>{children}</TableBody>; },
  tr({ children, ...props }) { return <TableRow {...props}>{children}</TableRow>; },
  th({ children, ...props }) { return <TableHeader {...props}>{children}</TableHeader>; },
  td({ children, ...props }) { return <TableCell {...props}>{children}</TableCell>; },
  a({ href = '', children, ...props }) {
    const targetHref = canonicalizeLegacyDocumentationHref(href);
    const className = 'font-medium underline transition-colors';
    const style = { color: 'var(--text-primary)', textDecorationColor: 'var(--accent-iris)' };
    if (targetHref.startsWith('/')) return <Link href={targetHref} className={className} style={style}>{children}</Link>;
    return <a {...props} href={targetHref} className={className} style={style}>{children}</a>;
  },
};

export function DocumentationMarkdownFragment({ content }: { content: string }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{content}</ReactMarkdown>;
}
