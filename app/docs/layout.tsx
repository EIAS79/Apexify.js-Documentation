'use client';

import DocHeader from '@/components/DocHeader';
import { useState } from 'react';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 text-white transition-colors duration-300 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_20%,rgba(236,72,153,0.05),transparent_50%)]" />
      </div>
      
      <DocHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} isMenuOpen={sidebarOpen} />
      {children}
    </div>
  );
}

