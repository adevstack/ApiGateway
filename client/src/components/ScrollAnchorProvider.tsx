import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';

// Define types for scroll positions
interface ScrollPosition {
  id: string;
  position: number;
  timestamp: number;
}

interface ScrollAnchorContextType {
  registerAnchor: (id: string) => void;
  unregisterAnchor: (id: string) => void;
  setScrollPosition: (id: string, position: number) => void;
  getScrollPosition: (id: string) => number | null;
  scrollToAnchor: (id: string) => void;
  currentHash: string | null;
}

// Create context with default values
const ScrollAnchorContext = createContext<ScrollAnchorContextType>({
  registerAnchor: () => {},
  unregisterAnchor: () => {},
  setScrollPosition: () => {},
  getScrollPosition: () => null,
  scrollToAnchor: () => {},
  currentHash: null
});

// Hook to use scroll anchor context
export const useScrollAnchorContext = () => useContext(ScrollAnchorContext);

interface ScrollAnchorProviderProps {
  children: ReactNode;
}

export function ScrollAnchorProvider({ children }: ScrollAnchorProviderProps) {
  const [location] = useLocation();
  const [registeredAnchors, setRegisteredAnchors] = useState<Set<string>>(new Set());
  const [scrollPositions, setScrollPositions] = useState<Map<string, ScrollPosition>>(new Map());
  const [currentHash, setCurrentHash] = useState<string | null>(null);
  
  // Handle hash changes - disabled automatic scrolling
  useEffect(() => {
    const checkHash = () => {
      if (window.location.hash) {
        const hash = window.location.hash.slice(1);
        setCurrentHash(hash);
        
        // Disabled automatic scrolling to prevent issues
        // setTimeout(() => {
        //   scrollToAnchor(hash);
        // }, 100);
      } else {
        setCurrentHash(null);
      }
    };
    
    // Initial check
    checkHash();
    
    // Listen for hash changes
    window.addEventListener('hashchange', checkHash);
    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, [location]);
  
  // Load saved scroll positions from session storage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('scroll_positions');
      if (saved) {
        const positions = JSON.parse(saved);
        const positionsMap = new Map();
        
        // Convert to Map
        Object.keys(positions).forEach(id => {
          positionsMap.set(id, positions[id]);
        });
        
        setScrollPositions(positionsMap);
      }
    } catch (error) {
      console.error('Error loading scroll positions:', error);
    }
  }, []);
  
  // Save scroll positions to session storage
  useEffect(() => {
    if (scrollPositions.size > 0) {
      const positions: Record<string, ScrollPosition> = {};
      
      // Convert Map to object for storage
      scrollPositions.forEach((position, id) => {
        positions[id] = position;
      });
      
      sessionStorage.setItem('scroll_positions', JSON.stringify(positions));
    }
  }, [scrollPositions]);
  
  // Register a new anchor
  const registerAnchor = (id: string) => {
    setRegisteredAnchors(prev => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };
  
  // Unregister an anchor
  const unregisterAnchor = (id: string) => {
    setRegisteredAnchors(prev => {
      const updated = new Set(prev);
      updated.delete(id);
      return updated;
    });
  };
  
  // Set scroll position for an anchor
  const setScrollPosition = (id: string, position: number) => {
    setScrollPositions(prev => {
      const updated = new Map(prev);
      updated.set(id, {
        id,
        position,
        timestamp: Date.now()
      });
      return updated;
    });
  };
  
  // Get scroll position for an anchor
  const getScrollPosition = (id: string): number | null => {
    const position = scrollPositions.get(id);
    return position ? position.position : null;
  };
  
  // Scroll to a specific anchor
  const scrollToAnchor = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const contextValue: ScrollAnchorContextType = {
    registerAnchor,
    unregisterAnchor,
    setScrollPosition,
    getScrollPosition,
    scrollToAnchor,
    currentHash
  };
  
  return (
    <ScrollAnchorContext.Provider value={contextValue}>
      {children}
    </ScrollAnchorContext.Provider>
  );
}