'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  CodeBlock, 
  CodeSwitcher, 
  Alert, 
  Dropdown, 
  CodeWithImage,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeader,
  TableCell
} from '@/components/mdx';
import ChangelogRenderer from '@/components/ChangelogRenderer';
import { ReactElement } from 'react';

interface ComponentData {
  type: 'Alert' | 'CodeSwitcher' | 'Dropdown' | 'CodeWithImage' | 'CodeBlock';
  props: any;
  children?: string;
}

export function parseMDXContent(content: string): Array<string | ComponentData> {
  const segments: Array<string | ComponentData> = [];
  const markers: Array<{ index: number; type: string; match: RegExpMatchArray }> = [];
  
  const patterns = [
    { 
      regex: /<CodeWithImage\s+([^>]*)\/>/g, 
      type: 'CodeWithImage',
      isSelfClosing: true 
    },
    { 
      regex: /<CodeBlock\s+lang="(\w+)"(?:\s+filename="([^"]*)")?>([\s\S]*?)<\/CodeBlock>/g, 
      type: 'CodeBlock',
      isSelfClosing: false 
    },
    { 
      regex: /<Alert\s+type="(\w+)"(?:\s+title="([^"]*)")?>([\s\S]*?)<\/Alert>/g, 
      type: 'Alert',
      isSelfClosing: false 
    },
    { 
      regex: /<CodeSwitcher(?:\s+tsLabel="([^"]*)")?(?:\s+jsLabel="([^"]*)")?>([\s\S]*?)<\/CodeSwitcher>/gs, 
      type: 'CodeSwitcher',
      isSelfClosing: false 
    },
    { 
      regex: /<Dropdown\s+title="([^"]*)"(?:\s+defaultOpen={(\w+)})?>([\s\S]*?)<\/Dropdown>/g, 
      type: 'Dropdown',
      isSelfClosing: false 
    },
  ];

  patterns.forEach(pattern => {
    let match;
    pattern.regex.lastIndex = 0; 
    while ((match = pattern.regex.exec(content)) !== null) {
      markers.push({
        index: match.index,
        type: pattern.type,
        match: match as RegExpMatchArray
      });
    }
  });

  markers.sort((a, b) => a.index - b.index);

  const filteredMarkers: typeof markers = [];
  let lastEnd = 0;
  markers.forEach(marker => {
    const end = marker.index + marker.match[0].length;
    if (marker.index >= lastEnd) {
      filteredMarkers.push(marker);
      lastEnd = end;
    }
  });

  let lastIndex = 0;
  filteredMarkers.forEach(marker => {
    if (marker.index > lastIndex) {
      segments.push(content.substring(lastIndex, marker.index));
    }

    const componentData = parseComponent(marker.type, marker.match);
    if (componentData) {
      segments.push(componentData);
    }

    lastIndex = marker.index + marker.match[0].length;
  });

  if (lastIndex < content.length) {
    segments.push(content.substring(lastIndex));
  }

  if (segments.length === 0) {
    segments.push(content);
  }

  return segments;
}

const stripCodeBlock = (code: string): string => {
  if (!code) return '';
  return code
    .replace(/^```[\w]*\n?/, '') 
    .replace(/\n?```$/, '') 
    .trim();
};

function parseComponent(type: string, match: RegExpMatchArray): ComponentData | null {
  switch (type) {
    case 'CodeWithImage': {
      const props: any = {};
      const attrRegex = /(\w+)="([^"]*)"/g;
      let attrMatch;
      while ((attrMatch = attrRegex.exec(match[1])) !== null) {
        const key = attrMatch[1];
        const value = attrMatch[2];
        if (value === 'true') props[key] = true;
        else if (value === 'false') props[key] = false;
        else if (!isNaN(Number(value))) props[key] = Number(value);
        else props[key] = value;
      }
      return { type: 'CodeWithImage', props };
    }

    case 'CodeBlock': {
      const lang = match[1];
      const filename = match[2] || undefined;
      const children = match[3] || '';
      const code = stripCodeBlock(children);
      
      return {
        type: 'CodeBlock',
        props: { lang, filename },
        children: code
      };
    }

    case 'Alert': {
      const type = match[1];
      const title = match[2] || undefined;
      const children = match[3].trim();
      return {
        type: 'Alert',
        props: { type, title },
        children
      };
    }

    case 'CodeSwitcher': {
      const tsLabel = match[1] || 'TypeScript';
      const jsLabel = match[2] || 'JavaScript';
      const children = match[3] || '';
      
      const tsMatch = children.match(/<ts>([\s\S]*?)<\/ts>/);
      const jsMatch = children.match(/<js>([\s\S]*?)<\/js>/);
      
      return {
        type: 'CodeSwitcher',
        props: {
          ts: tsMatch ? stripCodeBlock(tsMatch[1]) : undefined,
          js: jsMatch ? stripCodeBlock(jsMatch[1]) : undefined,
          tsLabel,
          jsLabel
        }
      };
    }

    case 'Dropdown': {
      const title = match[1];
      const defaultOpen = match[2] === 'true';
      const children = match[3].trim();
      return {
        type: 'Dropdown',
        props: { title, defaultOpen },
        children
      };
    }

    default:
      return null;
  }
}

const markdownComponents = {
  h1: ({ node, ...props }: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (
      <h1 
        className="text-3xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-blue-50 to-white bg-clip-text text-transparent mb-6 sm:mb-8 mt-4 sm:mt-8 pb-4 border-b border-slate-800/50" 
        id={id} 
        {...props}
        style={{
          textShadow: '0 0 30px rgba(59, 130, 246, 0.2)',
        }}
      />
    );
  },
  h2: ({ node, ...props }: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (
      <h2 
        className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 mt-8 sm:mt-12 flex items-center gap-2 sm:gap-3 flex-wrap" 
        id={id} 
        {...props}
      >
        <span className="text-blue-400">#</span>
        <span>{props.children}</span>
      </h2>
    );
  },
  h3: ({ node, ...props }: any) => {
    const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return (
      <h3 
        className="text-xl sm:text-2xl font-bold text-gray-100 mb-3 sm:mb-4 mt-6 sm:mt-8 flex items-center gap-2 flex-wrap" 
        id={id} 
        {...props}
      >
        <span className="text-purple-400">##</span>
        <span>{props.children}</span>
      </h3>
    );
  },
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    const lang = match ? match[1] : '';
    const codeString = String(children).replace(/\n$/, '');
    
    if (!inline && lang) {
      return <CodeBlock lang={lang}>{codeString}</CodeBlock>;
    }
    
    return (
      <code className="bg-slate-800/80 text-emerald-300 px-2 py-1 rounded-md text-sm font-mono border border-slate-700/50" {...props}>
        {children}
      </code>
    );
  },
  p: ({ node, ...props }: any) => (
    <p className="text-gray-300 mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg" {...props} />
  ),
  ul: ({ node, ...props }: any) => (
    <ul className="list-disc list-inside text-gray-300 mb-4 sm:mb-6 space-y-2 ml-4 sm:ml-6 text-base sm:text-lg" {...props} />
  ),
  ol: ({ node, ...props }: any) => (
    <ol className="list-decimal list-inside text-gray-300 mb-4 sm:mb-6 space-y-2 ml-4 sm:ml-6 text-base sm:text-lg" {...props} />
  ),
  li: ({ node, ...props }: any) => (
    <li className="text-gray-300 leading-relaxed" {...props} />
  ),
  strong: ({ node, ...props }: any) => (
    <strong className="text-white font-bold" {...props} />
  ),
  em: ({ node, ...props }: any) => (
    <em className="text-blue-200 italic" {...props} />
  ),
  a: ({ node, href, ...props }: any) => (
    <a 
      href={href}
      className="text-blue-400 hover:text-blue-300 font-medium underline decoration-blue-500/50 hover:decoration-blue-400 transition-colors duration-150"
      {...props}
    />
  ),
  blockquote: ({ node, ...props }: any) => (
    <blockquote className="border-l-4 border-blue-500/60 bg-blue-950/20 pl-6 pr-4 py-4 italic text-blue-100 my-6 rounded-r-lg" {...props} />
  ),
  hr: (props: any) => (
    <hr className="border-t-2 border-slate-800 my-12" {...props} />
  ),
  table: ({ node, ...props }: any) => (
    <div className="my-6 overflow-x-auto">
      <Table {...props} />
    </div>
  ),
  thead: ({ node, ...props }: any) => <TableHead {...props} />,
  tbody: ({ node, ...props }: any) => <TableBody {...props} />,
  tr: ({ node, ...props }: any) => <TableRow {...props} />,
  th: ({ node, ...props }: any) => <TableHeader {...props} />,
  td: ({ node, ...props }: any) => <TableCell {...props} />,
};

function renderComponent(component: ComponentData, index: number): ReactElement {
  switch (component.type) {
    case 'CodeBlock':
      return (
        <CodeBlock 
          key={`codeblock-${index}`} 
          lang={component.props.lang}
          filename={component.props.filename}
        >
          {component.children || ''}
        </CodeBlock>
      );
    case 'Alert':
      return (
        <Alert key={`alert-${index}`} type={component.props.type} title={component.props.title}>
          {component.children ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
              {component.children}
            </ReactMarkdown>
          ) : null}
        </Alert>
      );
    case 'CodeSwitcher':
      return (
        <CodeSwitcher 
          key={`codeswitcher-${index}`}
          ts={component.props.ts} 
          js={component.props.js}
          tsLabel={component.props.tsLabel}
          jsLabel={component.props.jsLabel}
        />
      );
    case 'Dropdown':
      return (
        <Dropdown key={`dropdown-${index}`} title={component.props.title} defaultOpen={component.props.defaultOpen}>
          {component.children ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
              {component.children}
            </ReactMarkdown>
          ) : null}
        </Dropdown>
      );
    case 'CodeWithImage':
      return <CodeWithImage key={`codewithimage-${index}`} {...component.props} />;
    default:
      return <div key={`unknown-${index}`} />;
  }
}

export function MDXContentRenderer({ content }: { content: string }) {
  const segments = parseMDXContent(content);
  
  // Check if this is the changelog page
  const isChangelog = content.includes('# Changelog') || content.match(/^##\s+\[/m);
  
  if (isChangelog) {
    return <ChangelogRenderer content={content} />;
  }

  return (
    <>
      {segments.map((segment, index) => {
        if (typeof segment === 'string') {
          return (
            <ReactMarkdown
              key={`md-${index}`}
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {segment}
            </ReactMarkdown>
          );
        } else {
          return renderComponent(segment, index);
        }
      })}
    </>
  );
}
