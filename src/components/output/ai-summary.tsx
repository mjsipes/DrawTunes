import { useCurrentDrawing } from "@/hooks/useMusicData";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function AISummary() {
  const currentDrawing = useCurrentDrawing();
  const ai_message = currentDrawing?.ai_message ?? "";
  console.log("ai_message: ", ai_message);
  return (
    <>
      <ScrollArea className="h-[102px] w-[448px] rounded-xl border shadow-sm p-2 scrollbar-hide">
        <CardDescription>
          {ai_message} and more text here nd more text here nd more text here nd
          more text here nd more text here nd more text here
        </CardDescription>
      </ScrollArea>
    </>
  );
}
