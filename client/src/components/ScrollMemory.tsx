import { useEffect, useRef } from 'react';

/**
 * Component to preserve scroll position during re-renders and data refreshes
 * This helps prevent the page from jumping back to the top when data updates
 * 
 * Note: This component should be placed at the root level of your application
 * to ensure all data refreshes maintain the user's scroll position.
 */
export default function ScrollMemory() {
  const scrollPositions = useRef<Map<string, number>>(new Map());
  const lastKnownScrollY = useRef<number>(0);
  const isRestoringScroll = useRef<boolean>(false);
  const scrollWatchTimerId = useRef<number | null>(null);
  const scrollTimerRef = useRef<number | null>(null);

  // Save scroll positions with debounce
  const saveScrollPositions = () => {
    // Don't save position if we're in the process of restoring
    if (isRestoringScroll.current) return;
    
    // Debounce scroll events
    if (scrollTimerRef.current !== null) {
      window.clearTimeout(scrollTimerRef.current);
    }
    
    scrollTimerRef.current = window.setTimeout(() => {
      // Main window scroll position
      lastKnownScrollY.current = window.scrollY;
      scrollPositions.current.set('window', window.scrollY);
      
      // Also save to sessionStorage for persistence
      try {
        sessionStorage.setItem('scrollY', window.scrollY.toString());
      } catch (e) {
        console.error('Failed to save to sessionStorage', e);
      }
      
      // Find all scrollable elements and save their positions
      document.querySelectorAll('[data-scroll-id]').forEach(element => {
        const scrollId = element.getAttribute('data-scroll-id');
        if (scrollId && element instanceof HTMLElement) {
          scrollPositions.current.set(scrollId, element.scrollTop);
          
          // Also save to sessionStorage
          try {
            sessionStorage.setItem(`scroll_${scrollId}`, element.scrollTop.toString());
          } catch (e) {
            // Fallback to memory if sessionStorage fails
          }
        }
      });
      
      scrollTimerRef.current = null;
    }, 150);
  };

  // Force restore scroll positions
  const forceRestoreScrollPositions = () => {
    // Prevent recursive calls
    if (isRestoringScroll.current) return;
    
    isRestoringScroll.current = true;
    
    // Try to get stored values in order of preference
    let scrollY = 0;
    
    // 1. Try sessionStorage (most reliable across page loads)
    try {
      const storedScrollY = sessionStorage.getItem('scrollY');
      if (storedScrollY) {
        scrollY = parseInt(storedScrollY, 10);
      }
    } catch (e) {
      // Fallback to memory store if sessionStorage fails
    }
    
    // 2. Fallback to memory store
    if (scrollY === 0) {
      scrollY = scrollPositions.current.get('window') || 0;
    }
    
    // 3. Fallback to last known value
    if (scrollY === 0) {
      scrollY = lastKnownScrollY.current;
    }
    
    // Only restore if we have a significant scroll position and it's changed
    if (scrollY > 10 && Math.abs(window.scrollY - scrollY) > 5) {
      // Use immediate scroll without smooth behavior for data refreshes
      window.scrollTo({
        top: scrollY,
        behavior: 'auto'
      });
      
      // Check if our restore worked, if not, try again with a delay
      setTimeout(() => {
        if (Math.abs(window.scrollY - scrollY) > 5) {
          window.scrollTo(0, scrollY);
        }
      }, 50);
    }
    
    // Restore all scrollable elements
    document.querySelectorAll('[data-scroll-id]').forEach(element => {
      const scrollId = element.getAttribute('data-scroll-id');
      if (scrollId && element instanceof HTMLElement) {
        let elementScrollTop = 0;
        
        // Try sessionStorage first
        try {
          const storedPos = sessionStorage.getItem(`scroll_${scrollId}`);
          if (storedPos) {
            elementScrollTop = parseInt(storedPos, 10);
          }
        } catch (e) {
          // Fallback to memory store
        }
        
        // Fallback to memory store
        if (elementScrollTop === 0) {
          elementScrollTop = scrollPositions.current.get(scrollId) || 0;
        }
        
        // Only set if we have a real value and it's changed
        if (elementScrollTop > 0 && Math.abs(element.scrollTop - elementScrollTop) > 5) {
          element.scrollTop = elementScrollTop;
        }
      }
    });
    
    // Reset flag after restoration
    setTimeout(() => {
      isRestoringScroll.current = false;
    }, 100);
  };

  // Start a watchdog timer to continuously check if scroll position was lost
  const startScrollWatchdog = () => {
    if (scrollWatchTimerId.current !== null) {
      window.clearInterval(scrollWatchTimerId.current);
    }
    
    // Check every 200ms if scroll position needs to be restored
    scrollWatchTimerId.current = window.setInterval(() => {
      const currentScrollY = window.scrollY;
      const savedScrollY = lastKnownScrollY.current;
      
      // Only restore if:
      // 1. We had a significant scroll position (> 10px)
      // 2. Current position is close to top (within 10px)
      // 3. We're not already restoring
      // 4. The difference is significant (> 20px)
      if (
        savedScrollY > 10 && 
        currentScrollY < 10 && 
        !isRestoringScroll.current &&
        Math.abs(currentScrollY - savedScrollY) > 20
      ) {
        forceRestoreScrollPositions();
      }
    }, 200);
  };

  // Monitor DOM mutations to restore scroll when components re-render
  useEffect(() => {
    // Set up mutation observer to detect when components re-render
    const observer = new MutationObserver((mutations) => {
      // Completely disable automatic scroll restoration
      // This was causing the scrolling issue
      return;
      
      /*
      if (isRestoringScroll.current) return;
      
      // If elements are added or changed, restore scroll positions
      const shouldRestore = mutations.some(mutation => 
        (mutation.type === 'childList' && 
         (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) ||
        (mutation.type === 'attributes' && 
         (mutation.attributeName === 'class' || mutation.attributeName === 'style'))
      );
      
      if (shouldRestore) {
        // Use a small delay to allow the DOM to settle
        setTimeout(forceRestoreScrollPositions, 10);
      }
      */
    });
    
    // Start observing the entire document with specific filters
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-scroll-id'] 
    });
    
    // Start the watchdog timer
    startScrollWatchdog();
    
    // Set up scroll event listener to save positions
    window.addEventListener('scroll', saveScrollPositions, { passive: true });
    
    // Save on other relevant events
    window.addEventListener('resize', saveScrollPositions, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        forceRestoreScrollPositions();
      }
    });
    
    // Special handling for React Query data fetching
    window.addEventListener('focus', forceRestoreScrollPositions);
    
    // Initialize scroll position
    saveScrollPositions();
    
    // Add event listeners for scrollable elements and handle new ones
    const setupScrollableElements = () => {
      document.querySelectorAll('[data-scroll-id]').forEach(element => {
        // Check if we already set up the listener
        if (!element.hasAttribute('data-scroll-listener-added')) {
          element.addEventListener('scroll', saveScrollPositions, { passive: true });
          element.setAttribute('data-scroll-listener-added', 'true');
        }
      });
    };
    
    // Initial setup
    setupScrollableElements();
    
    // Periodically check for new scrollable elements
    const elementsInterval = setInterval(setupScrollableElements, 1000);
    
    // Try to restore on initial load and when coming back to the page
    setTimeout(forceRestoreScrollPositions, 50);
    setTimeout(forceRestoreScrollPositions, 300);
    setTimeout(forceRestoreScrollPositions, 1000);
    
    return () => {
      // Clean up
      observer.disconnect();
      
      // Remove all event listeners
      window.removeEventListener('scroll', saveScrollPositions);
      window.removeEventListener('resize', saveScrollPositions);
      document.removeEventListener('visibilitychange', forceRestoreScrollPositions);
      window.removeEventListener('focus', forceRestoreScrollPositions);
      
      if (scrollWatchTimerId.current !== null) {
        clearInterval(scrollWatchTimerId.current);
      }
      
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
      
      clearInterval(elementsInterval);
      
      // Remove event listeners from scrollable elements
      document.querySelectorAll('[data-scroll-id]').forEach(element => {
        element.removeEventListener('scroll', saveScrollPositions);
        element.removeAttribute('data-scroll-listener-added');
      });
    };
  }, []);

  // This component doesn't render anything
  return null;
}