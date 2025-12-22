/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useEffect, useState, useRef, useMemo } from "react";
import { useLoaderData, Link, useLocation, useNavigate } from "@remix-run/react";
import { bundleMDX } from "mdx-bundler";
import fs from "fs/promises";
import path from "path";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiHome, FiBook, FiSearch, 
  FiSun, FiMoon, FiChevronDown, FiChevronRight, 
  FiGithub,
  FiMenu, FiX,
} from "react-icons/fi";

import {
  CodeBlock,
  CodeGroup,
  ErrorBlock,
  ExampleBlock,
  HintBlock,
  InfoBlock,
  Table,
  WarnBlock,
  Dropdown,
  TextFormatter,
  Bold,
  Italic,
  Code,
  Underline,
  Strikethrough,
  Highlight,
  List,
  Menu,
  SplitBlock
} from "./components";

interface DocFile {
  id: string;
  title: string;
  path: string;
  isDirectory: false;
  icon: string;
}

interface DocDirectory {
  id: string;
  title: string;
  isDirectory: true;
  children: Array<DocFile | DocDirectory>;
  icon: string;
}

interface LoaderData {
  docFiles: Array<DocFile | DocDirectory>;
  docsContent: Record<string, string>;
}

export async function loader() {
  const docsDir = path.join(process.cwd(), "app", "content", "docs");

  function getFolderIcon(folderName: string): string {
    const name = folderName.toLowerCase();
    if (name.includes("getting") || name.includes("start")) return "📘";
    if (name.includes("api") || name.includes("core")) return "🔌";
    if (name.includes("advanced") || name.includes("feature")) return "🚀";
    return "📁";
  }

  function getFileIcon(fileName: string): string {
    const name = fileName.toLowerCase();
    if (name.includes("quick") || name.includes("start")) return "⚡";
    if (name.includes("auth")) return "🔐";
    if (name.includes("endpoint")) return "🌐";
    if (name.includes("stream")) return "📡";
    if (name.includes("image")) return "🖼️";
    if (name.includes("beta")) return "🧪";
    return "📄";
  }

  async function getFiles(dir: string, basePath: string = ""): Promise<Array<DocFile | DocDirectory>> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const filesPromises = entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.join(basePath, entry.name);

      if (entry.isDirectory()) {
        const children = await getFiles(fullPath, relativePath);
        return {
          id: relativePath,
          title: entry.name,
          isDirectory: true,
          children,
          icon: getFolderIcon(entry.name),
        } as DocDirectory;
      } else if (entry.name.endsWith(".mdx") || entry.name.endsWith(".md")) {
        return {
          id: relativePath.replace(/\.(mdx|md)$/, ""),
          title: entry.name.replace(/\.(mdx|md)$/, ""),
          path: relativePath,
          isDirectory: false,
          icon: getFileIcon(entry.name),
        } as DocFile;
      }
      return null;
    });

    const files = await Promise.all(filesPromises);
    const filtered = files.filter((f): f is DocFile | DocDirectory => f !== null);
    filtered.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.title.localeCompare(b.title);
    });
    return filtered;
  }

  const docFiles = await getFiles(docsDir);

  function flattenFiles(files: Array<DocFile | DocDirectory>): DocFile[] {
    const result: DocFile[] = [];
    for (const file of files) {
      if (file.isDirectory) {
        result.push(...flattenFiles(file.children));
      } else {
        result.push(file);
      }
    }
    return result;
  }

  const flatDocFiles = flattenFiles(docFiles);
  const docsContent: Record<string, string> = {};

  for (const file of flatDocFiles) {
    try {
      const filePath = path.join(docsDir, file.path);
      const source = await fs.readFile(filePath, "utf8");

      const result = await bundleMDX({
        source,
        mdxOptions(options: { remarkPlugins: any[]; rehypePlugins: any[]; }) {
          options.remarkPlugins = [...(options.remarkPlugins || [])];
          options.rehypePlugins = [...(options.rehypePlugins || [])];
          return options;
        },
      });

      docsContent[file.id] = result.code;
    } catch (error) {
      console.error(`Error processing ${file.path}:`, error);
      docsContent[file.id] = "";
    }
  }

  console.log("Loaded docs:", Object.keys(docsContent));
  return Response.json({ docFiles, docsContent });
}

const TableOfContents: React.FC<{ content: string }> = ({ content }) => {
  const headings = useMemo(() => {
    const regex = /^(#{2,4})\s+(.+)$/gm;
    const matches = [...content.matchAll(regex)];
    return matches.map(match => ({
      level: match[1].length,
      text: match[2],
      id: match[2].toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')
    }));
  }, [content]);

  if (headings.length === 0) return null;

  return (
    <div className="mb-8 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 text-indigo-600 dark:text-indigo-400">
        On This Page
      </h3>
      <nav>
        <ul className="space-y-2">
          {headings.map((heading, index) => (
            <li key={index}>
              <a 
                href={`#${heading.id}`}
                className={`text-sm flex items-center transition-colors duration-200 hover:text-indigo-600 dark:hover:text-indigo-400 ${
                  heading.level === 2 
                    ? "text-gray-700 dark:text-gray-300 font-medium" 
                    : heading.level === 3
                    ? "text-gray-600 dark:text-gray-400 ml-4"
                    : "text-gray-500 dark:text-gray-500 ml-8"
                }`}
              >
                <span className="w-1.5 h-1.5 bg-gray-400 dark:bg-gray-600 rounded-full mr-2 flex-shrink-0"></span>
                <span className="truncate">{heading.text}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default function DocsRoute() {
  const { docFiles, docsContent } = useLoaderData<LoaderData>();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeDoc, setActiveDoc] = useState<string | null>(null);
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState<boolean>(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    if (hash && docsContent[hash] && docsContent[hash].trim() !== "") {
      setActiveDoc(hash);
    } else if (Object.keys(docsContent).length > 0) {
      const defaultDoc = Object.keys(docsContent).find(key => docsContent[key] && docsContent[key].trim() !== "") || Object.keys(docsContent)[0];
      if (defaultDoc) {
        setActiveDoc(defaultDoc);
        if (!hash || hash !== defaultDoc) {
          navigate(`#${defaultDoc}`, { replace: true });
        }
      }
    }
  }, [location.hash, docsContent, navigate]);

  useEffect(() => {
    if (activeDoc && docsContent[activeDoc]) {
      setComponent(null);
      
      import("mdx-bundler/client")
        .then(({ getMDXComponent }) => {
          try {
            const MDXComponent = getMDXComponent(docsContent[activeDoc]);
            setComponent(() => MDXComponent);

            if (contentRef.current) {
              contentRef.current.scrollTop = 0;
            }
          } catch (error) {
            console.error("Failed to create MDX component:", error);
            setComponent(null);
          }
        })
        .catch((error) => {
          console.error("Failed to load mdx-bundler/client:", error);
          setComponent(null);
        });
    } else {
      setComponent(null);
    }
  }, [activeDoc, docsContent]);

  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        setShowScrollTop(contentRef.current.scrollTop > 300);
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [activeDoc]);

  const scrollToTop = () => {
    if (contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return docFiles;
    
    const query = searchQuery.toLowerCase();
    
    const filterItems = (items: Array<DocFile | DocDirectory>): Array<DocFile | DocDirectory> => {
      return items.filter(item => {
        if (item.isDirectory) {
          const filteredChildren = filterItems(item.children);
          if (filteredChildren.length > 0) {
            return { ...item, children: filteredChildren };
          }
          return item.title.toLowerCase().includes(query);
        }
        return item.title.toLowerCase().includes(query);
      });
    };
    
    return filterItems(docFiles);
  }, [docFiles, searchQuery]);

  const SidebarItem: React.FC<{ item: DocFile | DocDirectory; level?: number }> = ({ item, level = 0 }) => {
    const [isOpen, setIsOpen] = useState<boolean>(true);

    useEffect(() => {
      if (item.isDirectory) {
        const hasActiveChild = (items: Array<DocFile | DocDirectory>): boolean =>
          items.some((child) =>
            child.isDirectory ? hasActiveChild(child.children) : child.id === activeDoc
          );
        if (hasActiveChild(item.children)) {
          setIsOpen(true);
        }
      }
    }, [item, activeDoc]);

    if (item.isDirectory) {
      return (
        <li className="mb-1">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center w-full px-3 py-2 rounded-md transition-all duration-200 ${
              level === 0 ? "font-semibold" : ""
            } ${
              isDarkMode 
                ? "text-gray-200 hover:bg-amber-900/30 hover:text-amber-300" 
                : "text-gray-700 hover:bg-amber-100/50 hover:text-amber-900"
            }`}
            style={{ paddingLeft: `${(level * 0.75) + 0.75}rem` }}
          >
            <span className="mr-2 text-lg flex-shrink-0">{item.icon}</span>
            <span className="truncate text-sm">{item.title}</span>
            <span className="ml-auto transition-transform duration-200 flex-shrink-0" style={{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
              {isOpen ? <FiChevronDown size={16} /> : <FiChevronRight size={16} />}
            </span>
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                {item.children.map((child) => (
                  <SidebarItem key={child.id} item={child} level={level + 1} />
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </li>
      );
    } else {
      return (
        <li className="mb-1">
          <a
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveDoc(item.id);
              navigate(`#${item.id}`, { replace: false });
              setIsMobileMenuOpen(false);
            }}
            className={`flex items-center px-3 py-2 rounded-md transition-all duration-200 text-sm ${
              activeDoc === item.id
                ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/20 dark:shadow-amber-900/30"
                : isDarkMode
                ? "text-gray-300 hover:bg-amber-900/30 hover:text-amber-300"
                : "text-gray-700 hover:bg-amber-100/50 hover:text-amber-900"
            }`}
            style={{ paddingLeft: `${(level * 0.75) + 0.75}rem` }}
          >
            <span className="mr-2 text-lg flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.title}</span>
          </a>
        </li>
      );
    }
  };

  const mdxComponents = {
    code: CodeBlock,
    table: Table,
    Table,
    TextFormatter,
    Bold,
    Italic,
    Code,
    Underline,
    Strikethrough,
    Highlight,
    SplitBlock,
    ErrorBlock,
    WarnBlock,
    InfoBlock,
    HintBlock,
    ExampleBlock,
    CodeGroup,
    Dropdown,
    Menu,
    List,
    h1: (props: any) => (
      <h1 
        {...props} 
        className="text-4xl font-bold mt-8 mb-6 text-gray-900 dark:text-white" 
      />
    ),
    h2: (props: any) => {
      const id = props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      return (
        <h2 
          {...props} 
          id={id}
          className="group flex items-center text-3xl font-bold mt-10 mb-4 pt-2 text-gray-800 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700"
        >
          {props.children}
          <a 
            href={`#${id}`} 
            className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 dark:text-amber-400"
            aria-label="Link to section"
          >
            #
          </a>
        </h2>
      );
    },
    h3: (props: any) => {
      const id = props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      return (
        <h3 
          {...props} 
          id={id}
          className="group flex items-center text-2xl font-semibold mt-8 mb-3 text-gray-800 dark:text-gray-100"
        >
          {props.children}
          <a 
            href={`#${id}`} 
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-amber-600 dark:text-amber-400"
            aria-label="Link to section"
          >
            #
          </a>
        </h3>
      );
    },
    h4: (props: any) => {
      const id = props.children?.toString().toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
      return (
        <h4 
          {...props} 
          id={id}
          className="group flex items-center text-xl font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-100"
        >
          {props.children}
          <a 
            href={`#${id}`} 
            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-sm text-amber-600 dark:text-amber-400"
            aria-label="Link to section"
          >
            #
          </a>
        </h4>
      );
    },
    p: (props: any) => <p {...props} className="my-4 leading-7 text-gray-700 dark:text-gray-300 text-base" />,
    a: (props: any) => (
      <a 
        {...props} 
        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline decoration-2 decoration-indigo-300 dark:decoration-indigo-700 underline-offset-2 transition-colors duration-200"
      >
        {props.children}
      </a>
    ),
    ul: (props: any) => <ul {...props} className="my-4 ml-6 list-disc space-y-2 text-gray-700 dark:text-gray-300" />,
    ol: (props: any) => <ol {...props} className="my-4 ml-6 list-decimal space-y-2 text-gray-700 dark:text-gray-300" />,
    li: (props: any) => <li {...props} className="leading-7" />,
    blockquote: (props: any) => (
      <blockquote 
        {...props} 
        className="border-l-4 border-indigo-500 dark:border-indigo-400 pl-4 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 py-2" 
      />
    ),
    hr: (props: any) => <hr {...props} className="my-8 border-gray-200 dark:border-gray-700" />,
    img: (props: any) => (
      <img 
        {...props} 
        className="my-6 rounded-lg shadow-lg max-w-full h-auto" 
        loading="lazy"
      />
    ),
    pre: (props: any) => (
      <pre {...props} className="my-4 overflow-x-auto rounded-lg" />
    ),
  };

  return (
    <div className={`${
      isDarkMode 
        ? "dark bg-gradient-to-br from-stone-950 via-amber-950 to-orange-950 text-gray-100" 
        : "bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 text-gray-900"
    } min-h-screen flex flex-col transition-colors duration-300`}>
      {/* Canvas Texture Background */}
      <div className="fixed inset-0 opacity-30 dark:opacity-10 pointer-events-none -z-10">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='400' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.3'/%3E%3C/svg%3E")`,
            backgroundSize: '300px 300px',
          }}
        />
      </div>

      {/* Header - Fixed */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${
          isDarkMode
            ? "bg-stone-900/90 border-amber-900/30"
            : "bg-white/90 border-amber-200/50"
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
              </button>
              
              <Link to="/" className="flex items-center">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                  D
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
                  Docs
                </span>
              </Link>
              
              <nav className="hidden lg:flex space-x-1">
                <Link
                  to="/"
                  className="px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <FiHome className="inline mr-1" /> Home
                </Link>
                <Link 
                  to="/docs" 
                  className="px-3 py-2 rounded-md text-sm font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                >
                  <FiBook className="inline mr-1" /> Documentation
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-2">
              <a
                href="https://github.com/zenith-79/apexify.js"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="GitHub Repository"
              >
                <FiGithub size={20} />
              </a>
              
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout - CSS Grid */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
                onClick={() => setIsMobileMenuOpen(false)}
              />
              
              <motion.aside
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={`fixed top-16 left-0 bottom-0 w-80 z-50 overflow-y-auto ${
                  isDarkMode 
                    ? "bg-stone-900/95 border-amber-900/30" 
                    : "bg-white/95 border-amber-200/50"
                } border-r shadow-xl`}
                onClick={(e: { stopPropagation: () => any; }) => e.stopPropagation()}
              >
                <div className="p-4">
                  <div className="relative mb-4">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiSearch className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className={`block w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:outline-none transition-colors ${
                        isDarkMode 
                          ? "bg-stone-800/50 text-gray-200 placeholder-gray-400 focus:ring-amber-500/30 border border-amber-900/30" 
                          : "bg-amber-50/50 text-gray-700 placeholder-gray-500 focus:ring-amber-500/20 border border-amber-200/50"
                      }`}
                      placeholder="Search docs..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <nav>
                    <ul className="space-y-1">
                      {filteredDocs.map((item: DocFile | DocDirectory) => (
                        <SidebarItem key={item.id} item={item} />
                      ))}
                    </ul>
                  </nav>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Left Sidebar - Desktop */}
        <aside className={`hidden lg:block w-72 border-r overflow-y-auto ${
          isDarkMode 
            ? "bg-stone-900/90 border-amber-900/30" 
            : "bg-white/90 border-amber-200/50"
        }`}>
          <div className="p-4 sticky top-0">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className={`block w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:ring-2 focus:outline-none transition-colors ${
                  isDarkMode 
                    ? "bg-gray-800/50 text-gray-200 placeholder-gray-400 focus:ring-amber-500/30" 
                    : "bg-gray-50 text-gray-700 placeholder-gray-500 focus:ring-amber-500/20"
                }`}
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <nav>
              <ul className="space-y-1">
                {filteredDocs.map((item: DocFile | DocDirectory) => (
                  <SidebarItem key={item.id} item={item} />
                ))}
              </ul>
            </nav>
          </div>
        </aside>

        <main
          ref={contentRef}
          className="flex-1 overflow-y-auto relative"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <AnimatePresence mode="wait">
              {Component ? (
                <motion.div
                  key={activeDoc}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="prose dark:prose-invert prose-lg max-w-none"
                >
                  {/* Table of Contents - Mobile only */}
                  {activeDoc && docsContent[activeDoc] && (
                    <div className="mb-6 lg:hidden">
                      <TableOfContents content={docsContent[activeDoc]} />
                    </div>
                  )}
                  
                  <Component components={mdxComponents} />
                </motion.div>
              ) : (
                <motion.div
                  key="no-doc"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center h-64"
                >
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">No document selected</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Select a document from the sidebar to get started
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* Right Sidebar - Table of Contents (Desktop) */}
        <aside 
          className={`hidden xl:block w-72 border-l overflow-y-auto transition-all duration-300 ${
            isDarkMode 
              ? "bg-stone-900/80 border-amber-900/30" 
              : "bg-white/80 border-amber-200/50"
          } ${isRightSidebarOpen ? 'translate-x-0' : 'translate-x-full xl:hidden'}`}
        >
          <div className="p-4 sticky top-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                On This Page
              </h3>
              <button
                onClick={() => setIsRightSidebarOpen(false)}
                className="lg:hidden p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Close sidebar"
              >
                <FiX size={18} />
              </button>
            </div>
            {activeDoc && docsContent[activeDoc] && (
              <TableOfContents content={docsContent[activeDoc]} />
            )}
          </div>
        </aside>
      </div>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed right-6 bottom-6 p-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 z-40"
            onClick={scrollToTop}
            aria-label="Scroll to top"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={`border-t ${isDarkMode ? "bg-gray-800/95 border-gray-700" : "bg-gray-50/95 border-gray-200"} backdrop-blur-sm`}>
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 rounded-md bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold mr-2">
                  D
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-500">
                  Docs
                </span>
              </div>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Comprehensive documentation for apexify.js
              </p>
            </div>

            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                Documentation
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/docs" className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors duration-200`}>
                    Getting Started
                  </Link>
                </li>
                <li>
                  <a href="https://github.com/zenith-79/apexify.js" target="_blank" rel="noopener noreferrer" className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors duration-200`}>
                    GitHub Repository
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? "text-indigo-400" : "text-indigo-600"}`}>
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://github.com/zenith-79/apexify.js" target="_blank" rel="noopener noreferrer" className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors duration-200`}>
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="https://www.npmjs.com/package/apexify.js" target="_blank" rel="noopener noreferrer" className={`text-sm ${isDarkMode ? "text-gray-400 hover:text-white" : "text-gray-600 hover:text-gray-900"} transition-colors duration-200`}>
                    NPM Package
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-700 dark:border-gray-700">
            <p className={`text-sm text-center ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              &copy; {new Date().getFullYear()} Apexify.js Documentation. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}