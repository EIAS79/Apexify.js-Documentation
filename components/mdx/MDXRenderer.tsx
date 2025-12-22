'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
} from './index';

interface MDXRendererProps {
  content: string;
}

export function MDXRenderer({ content }: MDXRendererProps) {
  let processedContent = content;

  processedContent = processedContent.replace(
    /<Alert\s+type="(\w+)"(?:\s+title="([^"]*)")?>(.*?)<\/Alert>/gs,
    (match, type, title, children) => {
      return `\n\n<Alert type="${type}" title="${title || ''}">${children}</Alert>\n\n`;
    }
  );

  processedContent = processedContent.replace(
    /<CodeSwitcher(?:\s+tsLabel="([^"]*)")?(?:\s+jsLabel="([^"]*)")?>\s*<ts>(.*?)<\/ts>\s*<js>(.*?)<\/js>\s*<\/CodeSwitcher>/gs,
    (match, tsLabel, jsLabel, ts, js) => {
      return `\n\n<CodeSwitcher tsLabel="${tsLabel || 'TypeScript'}" jsLabel="${jsLabel || 'JavaScript'}" ts={${JSON.stringify(ts)}} js={${JSON.stringify(js)}} />\n\n`;
    }
  );

  processedContent = processedContent.replace(
    /<Dropdown\s+title="([^"]*)"(?:\s+defaultOpen={(\w+)})?>(.*?)<\/Dropdown>/gs,
    (match, title, defaultOpen, children) => {
      return `\n\n<Dropdown title="${title}" defaultOpen={${defaultOpen === 'true'}}>${children}</Dropdown>\n\n`;
    }
  );

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ node, ...props }: any) => {
          const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return <h1 className="text-4xl font-bold text-white mb-8 mt-8" id={id} {...props} />;
        },
        h2: ({ node, ...props }: any) => {
          const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return <h2 className="text-3xl font-semibold text-white mb-4 mt-8" id={id} {...props} />;
        },
        h3: ({ node, ...props }: any) => {
          const id = props.children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
          return <h3 className="text-2xl font-semibold text-white mb-3 mt-6" id={id} {...props} />;
        },
        code: ({ node, inline, className, children, ...props }: any) => {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match ? match[1] : '';
          const codeString = String(children).replace(/\n$/, '');
          
          if (!inline && lang) {
            return <CodeBlock lang={lang}>{codeString}</CodeBlock>;
          }
          
          return (
            <code className="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          );
        },
        p: ({ node, ...props }: any) => (
          <p className="text-gray-400 mb-4 leading-relaxed" {...props} />
        ),
        ul: ({ node, ...props }: any) => (
          <ul className="list-disc list-inside text-gray-400 mb-4 space-y-2 ml-4" {...props} />
        ),
        ol: ({ node, ...props }: any) => (
          <ol className="list-decimal list-inside text-gray-400 mb-4 space-y-2 ml-4" {...props} />
        ),
        li: ({ node, ...props }: any) => (
          <li className="text-gray-400" {...props} />
        ),
        strong: ({ node, ...props }: any) => (
          <strong className="text-white font-semibold" {...props} />
        ),
        em: ({ node, ...props }: any) => (
          <em className="text-gray-300 italic" {...props} />
        ),
        a: ({ node, href, ...props }: any) => (
          <a 
            href={href}
            className="text-blue-400 hover:text-blue-300 underline"
            {...props}
          />
        ),
        blockquote: ({ node, ...props }: any) => (
          <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4" {...props} />
        ),
        hr: (props: any) => (
          <hr className="border-gray-700 my-8" {...props} />
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
        Alert: ({ type, title, children }: any) => <Alert type={type} title={title}>{children}</Alert>,
        CodeSwitcher: ({ ts, js, tsLabel, jsLabel }: any) => <CodeSwitcher ts={ts} js={js} tsLabel={tsLabel} jsLabel={jsLabel} />,
        Dropdown: ({ title, defaultOpen, children }: any) => <Dropdown title={title} defaultOpen={defaultOpen}>{children}</Dropdown>,
        CodeWithImage: (props: any) => <CodeWithImage {...props} />,
      } as any}
    >
      {processedContent}
    </ReactMarkdown>
  );
}


