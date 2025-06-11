
import { Card,CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useMusicStore } from "@/stores/music-store";

function AISummarySkeleton() {
  return (
    <Card className="h-[84px] w-[448px] p-2">
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-[95%]" />
        <Skeleton className="h-3.5 w-[88%]" />
        {/* <Skeleton className="h-3.5 w-[82%]" /> */}
      </div>
    </Card>
  );
}

export function AISummary() {
  const currentDrawing = useMusicStore(state => state.currentDrawing)

  if (!currentDrawing) {
    return <AISummarySkeleton />;
  }

  return (
    <ScrollArea className="h-[84px] w-[448px] rounded-xl border p-2 scrollbar-hide bg-card">
      <CardDescription>{currentDrawing?.ai_message}</CardDescription>

      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-card via-card/90 to-transparent pointer-events-none z-10" />
      
      <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-card via-card/90 to-transparent pointer-events-none z-10" />
    </ScrollArea>
  );
}
