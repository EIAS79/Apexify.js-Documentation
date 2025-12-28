'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline';
import SearchResults from './SearchResults';
import { useSidebar } from '@/contexts/SidebarContext';

interface DocHeaderProps {
  // Props removed - no menu button needed
}

interface SearchResult {
  filename: string;
  name: string;
  folder: string;
  matchType: 'filename' | 'folder' | 'content';
  snippet?: string;
}

export default function DocHeader({ }: DocHeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toggleSidebar, sidebarOpen } = useSidebar();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsMobileSearchOpen(true);
        setTimeout(() => {
        searchInputRef.current?.focus();
        }, 100);
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isMobileSearchOpen]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/docs/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();
        setSearchResults(data.results || []);
        setIsSearchOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim().length >= 2 && searchResults.length > 0) {
      setIsSearchOpen(true);
    }
  };

  return (
    <>
      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden"
          onClick={() => setIsMobileSearchOpen(false)}
        >
          <div 
            className="absolute top-0 left-0 right-0 bg-black/95 backdrop-blur-md border-b border-slate-900/70 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                className="w-full pl-12 pr-4 py-3 bg-slate-950 border-2 border-blue-500/50 rounded-lg text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
              {isSearching && (
                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-400"></div>
                </div>
              )}
              <button
                onClick={() => setIsMobileSearchOpen(false)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1"
                aria-label="Close search"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <SearchResults
                results={searchResults}
                query={searchQuery}
                onClose={() => {
                  setIsSearchOpen(false);
                  setIsMobileSearchOpen(false);
                }}
                isOpen={isSearchOpen}
              />
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-slate-900/70 transition-all duration-300 shadow-sm">
        <div className="flex items-center justify-between h-16 px-3 sm:px-4 lg:px-6">
        {/* Left side - Logo and nav */}
          <div className="flex items-center space-x-3 sm:space-x-4 lg:space-x-8 flex-shrink-0">
            {/* Mobile menu button to toggle sidebar */}
          <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200 flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <Bars3Icon className="h-6 w-6" />
          </button>
            <Link href="/" className="flex items-center group flex-shrink-0">
              <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent transition-all duration-300 group-hover:from-blue-500 group-hover:to-purple-500">
              Apexify.js
            </span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link
              href="/"
              className="text-base text-gray-300 hover:text-blue-400 transition-colors font-medium"
            >
              Home
            </Link>
              <Link
                href="/gallery"
                className="text-base text-gray-300 hover:text-blue-400 transition-colors font-medium"
              >
                Gallery
              </Link>
            <Link
              href="/docs"
              className="text-base text-gray-300 hover:text-blue-400 transition-colors font-medium"
            >
              Docs
            </Link>
          </nav>
        </div>

          {/* Center - Search - Desktop/Tablet only */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-500 transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search documentation... (Ctrl+K)"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:border-transparent transition-all duration-200"
            />
            {isSearching && (
              <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              </div>
            )}
            {!isSearching && searchQuery.trim().length === 0 && (
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 hidden xl:inline-flex items-center px-2 py-1 text-xs font-semibold text-gray-400 bg-gray-700 border border-gray-600 rounded">
                Ctrl+K
              </kbd>
            )}
            <SearchResults
              results={searchResults}
              query={searchQuery}
              onClose={() => setIsSearchOpen(false)}
              isOpen={isSearchOpen}
            />
          </div>
        </div>

          {/* Right side - Search button (mobile) + GitHub, npm */}
          <div className="flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
            {/* Mobile search button */}
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="lg:hidden p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors duration-200"
              aria-label="Search"
            >
              <MagnifyingGlassIcon className="h-6 w-6" />
            </button>
          <a
            href="https://github.com/EIAS79/apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-gray-800"
            aria-label="GitHub"
          >
              <svg className="h-6 w-6 lg:h-7 lg:w-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
          <a
            href="https://www.npmjs.com/package/apexify.js"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-white transition-all duration-200 p-2 rounded-lg hover:bg-gray-800"
            aria-label="npm"
          >
              <svg className="h-6 w-6 lg:h-7 lg:w-7" fill="currentColor" viewBox="0 0 24 24">
              <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
            </svg>
          </a>
        </div>
      </div>
    </header>
    </>
  );
}
