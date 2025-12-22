import type { MDXComponents } from 'mdx/types';
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
} from './components/mdx';

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    CodeBlock,
    CodeSwitcher,
    Alert,
    Warning: (props) => <Alert type="warning" {...props} />,
    Info: (props) => <Alert type="info" {...props} />,
    Error: (props) => <Alert type="error" {...props} />,
    Note: (props) => <Alert type="info" {...props} />,
    Success: (props) => <Alert type="success" {...props} />,
    Dropdown,
    CodeWithImage,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableHeader,
    TableCell,
    code: ({ className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || '');
      const lang = match ? match[1] : '';
      
      if (lang) {
        return <CodeBlock className={className} lang={lang}>{children}</CodeBlock>;
      }
      
      return (
        <code className="bg-gray-800 text-green-400 px-1.5 py-0.5 rounded text-sm" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children, ...props }: any) => (
      <h1 className="text-4xl font-bold text-white mb-8 mt-8" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 className="text-3xl font-semibold text-white mb-4 mt-8" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 className="text-2xl font-semibold text-white mb-3 mt-6" {...props}>
        {children}
      </h3>
    ),
    p: ({ children, ...props }: any) => (
      <p className="text-gray-400 mb-4 leading-relaxed" {...props}>
        {children}
      </p>
    ),
    ul: ({ children, ...props }: any) => (
      <ul className="list-disc list-inside text-gray-400 mb-4 space-y-2 ml-4" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: any) => (
      <ol className="list-decimal list-inside text-gray-400 mb-4 space-y-2 ml-4" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: any) => (
      <li className="text-gray-400" {...props}>
        {children}
      </li>
    ),
    strong: ({ children, ...props }: any) => (
      <strong className="text-white font-semibold" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: any) => (
      <em className="text-gray-300 italic" {...props}>
        {children}
      </em>
    ),
    a: ({ children, href, ...props }: any) => (
      <a 
        href={href}
        className="text-blue-400 hover:text-blue-300 underline"
        {...props}
      >
        {children}
      </a>
    ),
    blockquote: ({ children, ...props }: any) => (
      <blockquote className="border-l-4 border-gray-600 pl-4 italic text-gray-300 my-4" {...props}>
        {children}
      </blockquote>
    ),
    hr: (props: any) => (
      <hr className="border-gray-700 my-8" {...props} />
    ),
    table: ({ children, ...props }: any) => <Table {...props}>{children}</Table>,
    thead: ({ children, ...props }: any) => <TableHead {...props}>{children}</TableHead>,
    tbody: ({ children, ...props }: any) => <TableBody {...props}>{children}</TableBody>,
    tr: ({ children, ...props }: any) => <TableRow {...props}>{children}</TableRow>,
    th: ({ children, ...props }: any) => <TableHeader {...props}>{children}</TableHeader>,
    td: ({ children, ...props }: any) => <TableCell {...props}>{children}</TableCell>,
    ...components,
  };
}

