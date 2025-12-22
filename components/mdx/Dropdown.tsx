'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DropdownProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Dropdown({ title, children, defaultOpen = false }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="my-4 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800 hover:bg-gray-750 transition-colors text-left"
      >
        <span className="font-medium text-white">{title}</span>
        {isOpen ? (
          <ChevronDownIcon className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronRightIcon className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-3 bg-gray-900 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
}


