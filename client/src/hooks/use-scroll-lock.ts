import { useEffect, useRef } from 'react';

/**
 * An improved scroll lock implementation that preserves scroll position
 * during re-renders and data refreshes using multiple techniques
 * 
 * This hook uses:
 * 1. Session storage for persistence
 * 2. Mutation observers to detect DOM changes
 * 3. Watchdog timers to prevent scroll resets
 * 4. Debounced event handling for performance
 */
export function useScrollLock() {
  const lastKnownScrollY = useRef<number>(0);
  const isRestoringScroll = useRef<boolean>(false);
  const scrollTimerRef = useRef<number | null>(null);
  const preventNextScrollResetRef = useRef<boolean>(false);
  
  useEffect(() => {
    // Save scroll position with debounce
    const saveScrollPosition = () => {
      // Don't save if we're in the process of restoring
      if (isRestoringScroll.current) return;
      
      // Debounce scroll saves for performance
      if (scrollTimerRef.current !== null) {
        window.clearTimeout(scrollTimerRef.current);
      }
      
      scrollTimerRef.current = window.setTimeout(() => {
        const currentScrollY = window.scrollY;
        
        // Only save if significantly different
        if (Math.abs(currentScrollY - lastKnownScrollY.current) > 5) {
          lastKnownScrollY.current = currentScrollY;
          
          // Save to sessionStorage for cross-page persistence
          try {
            sessionStorage.setItem('global_scroll_y', currentScrollY.toString());
          } catch (e) {
            // Fallback to memory if sessionStorage fails
            console.warn('Failed to save scroll position to sessionStorage');
          }
        }
        
        scrollTimerRef.current = null;
      }, 100);
    };
    
    // Force restore scroll position
    const forceRestoreScroll = () => {
      // Prevent recursive calls
      if (isRestoringScroll.current) return;
      
      isRestoringScroll.current = true;
      
      // Get the target scroll position
      let targetScrollY = 0;
      
      // Try sessionStorage first
      try {
        const storedY = sessionStorage.getItem('global_scroll_y');
        if (storedY) {
          targetScrollY = parseInt(storedY, 10);
        }
      } catch (e) {
        // Fallback to memory
      }
      
      // If no sessionStorage value, use memory
      if (targetScrollY === 0) {
        targetScrollY = lastKnownScrollY.current;
      }
      
      // Only restore if we have a significant scroll position that's changed
      if (targetScrollY > 10 && Math.abs(window.scrollY - targetScrollY) > 5) {
        // Immediate scroll with no animation for data refreshes
        window.scrollTo({
          top: targetScrollY,
          behavior: 'auto'
        });
        
        // Double-check after a short delay to ensure it worked
        setTimeout(() => {
          if (Math.abs(window.scrollY - targetScrollY) > 5) {
            window.scrollTo(0, targetScrollY);
          }
          
          // Reset flag after successful restore
          setTimeout(() => {
            isRestoringScroll.current = false;
          }, 50);
        }, 50);
      } else {
        // If no significant restore needed, just reset the flag
        isRestoringScroll.current = false;
      }
    };
    
    // Handle DOM mutations that might cause scroll resets
    const handleMutations = (mutations: MutationRecord[]) => {
      // Skip if already restoring
      if (isRestoringScroll.current) return;
      
      // Only consider significant DOM changes
      const significantChanges = mutations.some(mutation => 
        (mutation.type === 'childList' && 
         (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) ||
        (mutation.type === 'attributes' && 
         ['style', 'class'].includes(mutation.attributeName || ''))
      );
      
      if (significantChanges) {
        // If we're near the top, don't restore (likely intentional navigation)
        if (window.scrollY < 5 && !preventNextScrollResetRef.current) {
          return;
        }
        
        // Small delay to let the DOM settle
        setTimeout(forceRestoreScroll, 10);
      }
    };
    
    // Setup MutationObserver for the entire document
    const mutationObserver = new MutationObserver(handleMutations);
    
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'] 
    });
    
    // Save scroll position on user scroll
    window.addEventListener('scroll', saveScrollPosition, { passive: true });
    
    // Handle various events that might affect scroll
    window.addEventListener('resize', saveScrollPosition);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        forceRestoreScroll();
      }
    });
    
    // For React Query or other data fetching libraries
    window.addEventListener('focus', forceRestoreScroll);
    
    // Try to restore on initial load
    setTimeout(() => {
      // A short delay to let initial rendering complete
      try {
        const storedY = sessionStorage.getItem('global_scroll_y');
        if (storedY) {
          const targetY = parseInt(storedY, 10);
          if (targetY > 5) {
            window.scrollTo(0, targetY);
          }
        }
      } catch (e) {
        // Ignore sessionStorage errors
      }
    }, 100);
    
    // Add hooks into route changes for SPA navigation
    // This helps with React Router, Wouter, etc.
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    // Before navigation, save current position
    history.pushState = function() {
      saveScrollPosition();
      // Set flag to prevent the next scroll reset
      preventNextScrollResetRef.current = true;
      setTimeout(() => {
        preventNextScrollResetRef.current = false;
      }, 100);
      return originalPushState.apply(this, arguments as any);
    };
    
    history.replaceState = function() {
      saveScrollPosition();
      return originalReplaceState.apply(this, arguments as any);
    };
    
    // Check periodically to catch any missed resets
    const watchdogInterval = setInterval(() => {
      const currentY = window.scrollY;
      const savedY = lastKnownScrollY.current;
      
      // If we've suddenly lost significant scroll position
      if (savedY > 10 && currentY < 5 && !isRestoringScroll.current) {
        forceRestoreScroll();
      }
    }, 250);
    
    // Save current position periodically
    const autoSaveInterval = setInterval(() => {
      if (!isRestoringScroll.current && window.scrollY > 0) {
        lastKnownScrollY.current = window.scrollY;
      }
    }, 2000);
    
    // Cleanup all handlers and observers
    return () => {
      window.removeEventListener('scroll', saveScrollPosition);
      window.removeEventListener('resize', saveScrollPosition);
      document.removeEventListener('visibilitychange', forceRestoreScroll);
      window.removeEventListener('focus', forceRestoreScroll);
      
      // Restore original history methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      
      // Clear all timers
      if (scrollTimerRef.current !== null) {
        clearTimeout(scrollTimerRef.current);
      }
      
      clearInterval(watchdogInterval);
      clearInterval(autoSaveInterval);
      
      mutationObserver.disconnect();
    };
  }, []);
}