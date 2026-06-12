'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface LoadingContextType {
  isLoading: boolean;
  setLoading: (state: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setLoading: () => {},
});

export function useLoading() {
  return useContext(LoadingContext);
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPathRef = useRef(pathname);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setLoading = useCallback((state: boolean) => {
    setIsLoading(state);
  }, []);

  // Intercept clicks on internal links to detect navigation START
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleClick = (e: MouseEvent) => {
      // Walk up the DOM to find the closest anchor tag
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== 'A') {
        target = target.parentElement;
      }
      if (!target) return;

      const anchor = target as HTMLAnchorElement;
      const href = anchor.getAttribute('href');

      // Skip external links, hash links, mailto, tel, etc.
      if (!href) return;
      if (href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (href.startsWith('#')) return;
      // Skip if cmd/ctrl/shift/alt-click (new tab, etc.)
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      // Skip if target="_blank" or download
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      // This is an internal navigation via Next.js <Link>
      const targetPath = href.split('?')[0].split('#')[0];
      if (targetPath === currentPathRef.current) return; // same page

      setIsLoading(true);
    };

    // Use capture phase to catch the event before Next.js processes it
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  // Also intercept programmatic router.push() via history patching
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      const url = args[2];
      if (url && typeof url === 'string') {
        const targetPath = url.split('?')[0].split('#')[0];
        if (targetPath !== currentPathRef.current) {
          setTimeout(() => {
            setIsLoading(true);
          }, 0);
        }
      }
      return originalPushState.apply(this, args);
    };

    window.history.replaceState = function (...args) {
      return originalReplaceState.apply(this, args);
    };

    const handlePopState = () => {
      setTimeout(() => {
        setIsLoading(true);
      }, 0);
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // When pathname or searchParams change, navigation is complete → hide loader
  useEffect(() => {
    currentPathRef.current = pathname;
    setIsLoading(false);

    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }
  }, [pathname, searchParams]);

  return (
    <LoadingContext.Provider value={{ isLoading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}
