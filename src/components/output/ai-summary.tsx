import { useMusic } from "@/contexts/CurrentDrawingContext";
import { CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

function AISummarySkeleton() {
  return (
    <ScrollArea className="h-[84px] w-[448px] rounded-xl border shadow-sm p-2 scrollbar-hide bg-card">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[95%]" />
        <Skeleton className="h-3.5 w-[88%]" />
        <Skeleton className="h-3.5 w-[82%]" />
      </div>
    </ScrollArea>
  );
}

export function AISummary() {
  const { currentDrawing } = useMusic();

  // console.log("AISummary render - currentDrawing:", currentDrawing);

  if (!currentDrawing) {
    return <AISummarySkeleton />;
  }

  return (
    <ScrollArea className="h-[84px] w-[448px] rounded-xl border shadow-sm p-2 scrollbar-hide bg-card">
      <CardDescription>{currentDrawing?.ai_message}</CardDescription>
    </ScrollArea>
  );
}
