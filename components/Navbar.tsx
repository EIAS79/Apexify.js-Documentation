'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/gallery', label: 'Gallery' },
    { href: '/docs#Getting-Started', label: 'Documentation' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 pt-2 sm:pt-4 px-2 sm:px-4 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20 px-2 sm:px-3 md:px-6 lg:px-8 bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 rounded-lg sm:rounded-xl md:rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-10 flex-1 min-w-0">
            <Link href="/" className="flex items-center group flex-shrink-0">
              <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-blue-300 group-hover:via-purple-300 group-hover:to-cyan-300 transition-all duration-300">
                Apexify.js
              </span>
            </Link>
            <div className="flex items-center space-x-2">
              {navLinks.map((link) => {
                const linkPath = link.href.split('#')[0];
                const isActive = pathname === linkPath;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs sm:text-sm md:text-base font-semibold transition-all duration-300 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-lg whitespace-nowrap ${
                      isActive
                        ? 'text-white bg-blue-600/30 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                        : 'text-gray-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
            <a
              href="https://github.com/EIAS79/apexify.js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-all duration-200 p-1.5 sm:p-2 md:p-3 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/50 flex-shrink-0"
              aria-label="GitHub"
            >
              <svg className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
            </a>
            <a
              href="https://www.npmjs.com/package/apexify.js"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-300 hover:text-white transition-all duration-200 p-1.5 sm:p-2 md:p-3 rounded-xl hover:bg-slate-800/70 border border-transparent hover:border-slate-700/50 flex-shrink-0"
              aria-label="npm"
            >
              <svg className="h-5 w-5 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-7 lg:w-7" fill="currentColor" viewBox="0 0 24 24">
                <path d="M0 7.334v8h6.666v1.332H12v-1.332h12v-8H0zm6.666 6.666H5.334v-4H3.999v4H1.335V8.667h5.331v5.333zm4 0v1.336H8.001V8.667h5.334v5.332h-2.669v-.001zm12.001 0h-1.33v-4h-1.337v4h-1.335v-4h-1.33v4h-2.671V8.667h8.003v5.333z" />
              </svg>
            </a>
            <Link
              href="/docs#Getting-Started"
              className="hidden sm:inline-flex items-center gap-1.5 md:gap-2 px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs sm:text-sm md:text-base font-bold rounded-lg md:rounded-xl transition-all duration-300 shadow-xl shadow-blue-500/40 hover:shadow-blue-500/60 hover:scale-105 whitespace-nowrap"
            >
              <span className="hidden md:inline">Get Started</span>
              <span className="md:hidden">Docs</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
