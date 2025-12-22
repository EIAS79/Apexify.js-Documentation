'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SearchResult {
  filename: string;
  name: string;
  folder: string;
  matchType: 'filename' | 'folder' | 'content';
  snippet?: string;
}

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function SearchResults({ results, query, onClose, isOpen }: SearchResultsProps) {
  const router = useRouter();
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleResultClick = (filename: string) => {
    router.push(`/docs#${filename}`);
    onClose();
  };

  if (!isOpen || !query.trim()) {
    return null;
  }

  return (
    <div
      ref={resultsRef}
      className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-[calc(100vh-200px)] sm:max-h-96 overflow-y-auto z-[101]"
    >
      {results.length === 0 ? (
        <div className="p-4 text-center text-gray-400">
          No results found for &quot;{query}&quot;
        </div>
      ) : (
        <>
          <div className="p-2 border-b border-gray-700 text-xs text-gray-400">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          <div className="py-2">
            {results.map((result, index) => (
              <button
                key={`${result.filename}-${index}`}
                onClick={() => handleResultClick(result.filename)}
                className="w-full text-left px-4 py-3 hover:bg-gray-700 transition-colors duration-150 focus:bg-gray-700 focus:outline-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm truncate">
                        {result.name}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                        {result.folder === 'root' ? 'Root' : result.folder}
                      </span>
                      <span className="text-xs text-blue-400 bg-blue-900/20 px-2 py-0.5 rounded">
                        {result.matchType}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                        ...{result.snippet}...
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

