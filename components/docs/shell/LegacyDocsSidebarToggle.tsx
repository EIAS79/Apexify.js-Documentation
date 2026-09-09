'use client';

import { usePathname } from 'next/navigation';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useSidebar } from '@/contexts/SidebarContext';

export function LegacyDocsSidebarToggle() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  if (pathname !== '/docs') return null;
  return (
    <button
      type="button"
      className="apx-icon-button"
      aria-label="Toggle legacy documentation navigation"
      aria-expanded={sidebarOpen}
      onClick={toggleSidebar}
    >
      <Bars3Icon className="h-5 w-5" aria-hidden />
    </button>
  );
}
