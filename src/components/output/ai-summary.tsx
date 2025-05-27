import { useCurrentDrawing } from "@/contexts/CurrentDrawingContext";
import { CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

function AISummarySkeleton() {
  return (
    <ScrollArea className="h-[102px] w-[448px] rounded-xl border shadow-sm p-2 scrollbar-hide">
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
  const { currentDrawing } = useCurrentDrawing();
  const ai_message = currentDrawing?.ai_message ?? "";

  console.log("AISummary render - currentDrawing:", currentDrawing);
  console.log("AISummary render - ai_message:", ai_message);
  console.log(
    "AISummary render - should show skeleton:",
    !currentDrawing || !ai_message
  );

  if (!currentDrawing || !ai_message) {
    console.log("AISummary: Showing skeleton");
    return <AISummarySkeleton />;
  }

  console.log("AISummary: Showing content");
  return (
    <ScrollArea className="h-[102px] w-[448px] rounded-xl border shadow-sm p-2 scrollbar-hide">
      <CardDescription className="text-sm">{ai_message}</CardDescription>
    </ScrollArea>
  );
}
