'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SidebarContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpenState] = useState(false);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpenState(true);
      } else {
        setSidebarOpenState(false);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const setSidebarOpen = (open: boolean) => {
    setSidebarOpenState(open);
  };

  const toggleSidebar = () => {
    setSidebarOpenState(prev => !prev);
  };

  return (
    <SidebarContext.Provider value={{ sidebarOpen, setSidebarOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}
