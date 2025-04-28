import React, { forwardRef, ReactNode, useRef, useEffect } from "react";
import { useScrollAnchor } from "@/hooks/use-scroll-anchor";
import { Link2, MoveUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

export interface ScrollAnchorSectionProps {
  id: string;
  title?: string;
  className?: string;
  children: ReactNode;
  dependencies?: any[];
  showControls?: boolean;
  maxHeight?: string;
  minHeight?: string;
}

/**
 * ScrollAnchorSection - A component that wraps content with scroll anchoring capabilities
 * 
 * This component provides:
 * 1. A container with preserved scroll position
 * 2. Optional max height with scrolling
 * 3. "Back to top" and "Copy link" buttons for navigation
 * 4. URL hash-based deep linking (#section-id)
 */
const ScrollAnchorSection = forwardRef<HTMLDivElement, ScrollAnchorSectionProps>(
  (
    {
      id,
      title,
      children,
      className = "",
      dependencies = [],
      showControls = true,
      maxHeight = "auto",
      minHeight = "0",
    },
    ref
  ) => {
    const { containerRef, scrollToTop, getAnchorLink, isInView } =
      useScrollAnchor({
        sectionId: id,
        dependencies,
      });
      
    const { toast } = useToast();
    const sectionScrollPos = useRef<number>(0);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const isRestoringScroll = useRef<boolean>(false);
    const scrollCheckIntervalRef = useRef<number | null>(null);
    
    // Handle copying anchor link to clipboard
    const copyAnchorLink = () => {
      navigator.clipboard.writeText(getAnchorLink());
      toast({
        title: "Link copied",
        description: "Link to this section has been copied to clipboard",
        duration: 2000,
      });
    };
    
    // Save the scroll position of this section
    const saveScrollPosition = () => {
      if (contentRef.current && !isRestoringScroll.current) {
        const currentPos = contentRef.current.scrollTop;
        if (currentPos !== sectionScrollPos.current) {
          sectionScrollPos.current = currentPos;
          
          // Save to sessionStorage for persistence
          try {
            sessionStorage.setItem(`scroll_${id}`, currentPos.toString());
          } catch (e) {
            // Fallback to memory if sessionStorage fails
          }
        }
      }
    };
    
    // Restore the scroll position
    const restoreScrollPosition = () => {
      if (!contentRef.current || isRestoringScroll.current) return;
      
      isRestoringScroll.current = true;
      
      // Get saved position from sessionStorage first
      let savedPos = 0;
      try {
        const storedPos = sessionStorage.getItem(`scroll_${id}`);
        if (storedPos) {
          savedPos = parseInt(storedPos, 10);
        }
      } catch (e) {
        // Fallback to memory
      }
      
      // If no sessionStorage value, use memory
      if (savedPos === 0) {
        savedPos = sectionScrollPos.current;
      }
      
      // Apply the scroll position if significant
      if (savedPos > 10) {
        contentRef.current.scrollTop = savedPos;
        
        // Verify the restoration after a short delay
        setTimeout(() => {
          if (contentRef.current && Math.abs(contentRef.current.scrollTop - savedPos) > 5) {
            contentRef.current.scrollTop = savedPos;
          }
          
          // Reset restoration flag
          setTimeout(() => {
            isRestoringScroll.current = false;
          }, 50);
        }, 50);
      } else {
        isRestoringScroll.current = false;
      }
    };
    
    // Setup scroll position persistence
    useEffect(() => {
      // Initialize contentRef with the containerRef element
      contentRef.current = containerRef.current;
      
      if (contentRef.current) {
        // Set data-scroll-id for the ScrollMemory component
        contentRef.current.setAttribute('data-scroll-id', `section-${id}`);
        
        // Try to restore initial position
        setTimeout(restoreScrollPosition, 100);
        
        // Add scroll event listener
        contentRef.current.addEventListener('scroll', saveScrollPosition, { passive: true });
        
        // Start periodic check for scroll position to handle data refreshes
        scrollCheckIntervalRef.current = window.setInterval(() => {
          if (contentRef.current && !isRestoringScroll.current) {
            const currentPos = contentRef.current.scrollTop;
            const savedPos = sectionScrollPos.current;
            
            // If we've lost our scroll position (common during data refresh)
            if (savedPos > 10 && currentPos < 5 && Math.abs(currentPos - savedPos) > 10) {
              restoreScrollPosition();
            }
          }
        }, 250);
        
        // Cleanup
        return () => {
          if (contentRef.current) {
            contentRef.current.removeEventListener('scroll', saveScrollPosition);
          }
          
          if (scrollCheckIntervalRef.current) {
            clearInterval(scrollCheckIntervalRef.current);
          }
        };
      }
    }, [id, containerRef]);
    
    // Handle ref merging to support both our internal ref and forwarded ref
    const combinedRefs = (element: HTMLDivElement | null) => {
      // Set our internal ref
      contentRef.current = element;
      
      // Handle the containerRef from useScrollAnchor - safe, non-TypeScript-error approach
      if (containerRef && typeof containerRef === 'object' && 'current' in containerRef) {
        // Instead of direct assignment which can cause TypeScript errors,
        // we use Object.defineProperty to bypass readonly protection
        Object.defineProperty(containerRef, 'current', {
          value: element,
          writable: true,
          configurable: true
        });
      }
      
      // Forward ref if provided
      if (ref) {
        if (typeof ref === 'function') {
          ref(element);
        } else if (ref && typeof ref === 'object' && 'current' in ref) {
          // Use the same approach for the forwarded ref to avoid TypeScript errors
          Object.defineProperty(ref, 'current', {
            value: element,
            writable: true,
            configurable: true
          });
        }
      }
    };

    return (
      <section
        id={id}
        className={cn(
          "relative border border-border rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden",
          className
        )}
      >
        {title && (
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <h2 className="text-lg font-semibold">{title}</h2>
            {showControls && (
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyAnchorLink}
                        className="h-8 w-8"
                      >
                        <Link2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy link to section</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
          </div>
        )}
        
        <div
          ref={combinedRefs}
          className={cn(
            "overflow-auto relative scroll-container",
            maxHeight !== "auto" && "scroll-auto"
          )}
          style={{ maxHeight, minHeight }}
          data-scroll-id={`section-${id}`}
        >
          {children}
          
          {showControls && maxHeight !== "auto" && (
            <div className="absolute bottom-4 right-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="secondary"
                      onClick={scrollToTop}
                      className="h-8 w-8 rounded-full shadow-md opacity-80 hover:opacity-100"
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scroll to top</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </section>
    );
  }
);

ScrollAnchorSection.displayName = "ScrollAnchorSection";

export default ScrollAnchorSection;