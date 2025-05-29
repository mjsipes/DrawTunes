import { useEffect, useRef } from "react";
import { Image } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusic, getRelativeTime } from "@/contexts/CurrentDrawingContext";
import { cn } from "@/lib/utils";

interface DrawingItemProps {
  drawing: any;
  isCurrentDrawing: boolean;
  onSelect: (drawingId: string) => void;
}

function DrawingItem({
  drawing,
  isCurrentDrawing,
  onSelect,
}: DrawingItemProps) {
  return (
    <SidebarMenuItem>
      <button
        onClick={() => onSelect(drawing.drawing_id)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md p-2 text-left text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isCurrentDrawing &&
            "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
        )}
      >
        <div className="w-8 h-8 rounded-sm overflow-hidden flex-shrink-0 bg-muted flex items-center justify-center">
          {drawing.drawing_url ? (
            <img
              src={drawing.drawing_url}
              alt="Drawing thumbnail"
              className="w-full h-full object-cover"
            />
          ) : (
            <Image size={16} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {drawing.created_at
              ? getRelativeTime(drawing.created_at)
              : "Unknown time"}
          </p>
        </div>
      </button>
    </SidebarMenuItem>
  );
}

function DrawingsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <SidebarMenuItem key={`skeleton-${index}`}>
          <div className="flex w-full items-center gap-3 rounded-md p-2">
            <Skeleton className="w-8 h-8 rounded-sm" />
            <div className="flex-1 min-w-0">
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </SidebarMenuItem>
      ))}
    </>
  );
}

export function AppSidebar() {
  const {
    allDrawings,
    currentDrawing,
    loadingDrawings,
    hasMoreDrawings,
    loadMoreDrawings,
    setCurrentDrawingById,
  } = useMusic();

  const scrollRef = useRef<HTMLDivElement>(null);

  // Infinite scroll handler
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const threshold = 100; // Load more when 100px from bottom

      if (
        scrollTop + clientHeight >= scrollHeight - threshold &&
        hasMoreDrawings &&
        !loadingDrawings
      ) {
        loadMoreDrawings();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll);
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [hasMoreDrawings, loadingDrawings, loadMoreDrawings]);

  return (
    <Sidebar>
      <SidebarContent ref={scrollRef} className="overflow-y-auto">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-2 py-4">
            DrawTunes
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allDrawings.map((drawing) => (
                <DrawingItem
                  key={drawing.id}
                  drawing={drawing}
                  isCurrentDrawing={currentDrawing?.id === drawing.id}
                  onSelect={setCurrentDrawingById}
                />
              ))}
              {loadingDrawings && <DrawingsSkeleton />}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2">
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
