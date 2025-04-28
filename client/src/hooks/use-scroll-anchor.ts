import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
 
/**
 * Hook to provide intelligent scroll anchoring and restoration
 * 
 * This hook enables:
 * 1. Persisting scroll positions for different sections/components
 * 2. Restoring scroll position when returning to a specific section
 * 3. Supporting URL hash-based scrolling (#section-id)
 * 4. Managing scroll state during data refreshes
 */
export function useScrollAnchor({ 
  sectionId, 
  dependencies = [] 
}: { 
  sectionId: string,
  dependencies?: any[]
}) {
  const [location] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);
  
  const storageKey = `scroll_pos_${sectionId}`;
  
  // Update scroll position in session storage when user scrolls
  const saveScrollPosition = () => {
    if (!containerRef.current) return;
    
    // Store scroll position in session storage
    const scrollInfo = {
      position: containerRef.current.scrollTop,
      timestamp: new Date().getTime(),
      route: location
    };
    sessionStorage.setItem(storageKey, JSON.stringify(scrollInfo));
  };
  
  // Check if section matches URL hash
  useEffect(() => {
    if (location.includes('#')) {
      const hash = location.split('#')[1];
      if (hash === sectionId) {
        // If URL hash matches this section, scroll to it
        setTimeout(() => {
          containerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location, sectionId]);
  
  // Set up IntersectionObserver to track when section is in view
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 } // 10% visibility threshold
    );
    
    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, []);
  
  // Set up scroll event listener
  useEffect(() => {
    if (!containerRef.current) return;
    
    const element = containerRef.current;
    element.addEventListener('scroll', saveScrollPosition, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', saveScrollPosition);
    };
  }, [containerRef.current]);
  
  // Restore scroll position
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Try to restore saved scroll position
    try {
      const savedScrollData = sessionStorage.getItem(storageKey);
      if (savedScrollData) {
        const { position, route } = JSON.parse(savedScrollData);
        
        // Only restore position if we're on the same route
        if (route === location) {
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.scrollTop = position;
            }
          }, 50);
        }
      }
    } catch (error) {
      console.error('Error restoring scroll position:', error);
    }
  }, [location, ...dependencies]);
  
  // Create URL with hash for sharing
  const getAnchorLink = () => {
    const baseUrl = window.location.href.split('#')[0];
    return `${baseUrl}#${sectionId}`;
  };
  
  // Scroll to top of section
  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  };
  
  return {
    containerRef,
    isInView,
    scrollToTop,
    getAnchorLink,
    saveScrollPosition
  };
}