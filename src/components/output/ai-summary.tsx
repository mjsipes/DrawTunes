import { useCurrentDrawing } from "@/hooks/useMusicData";
import { Card, CardContent, CardDescription } from "@/components/ui/card";

export function AISummary() {
  const currentDrawing = useCurrentDrawing();
  const ai_message = currentDrawing?.ai_message ?? "";
  console.log("ai_message: ", ai_message);
  return (
    <>
      <Card>
        <CardContent>
          <CardDescription>{ai_message}</CardDescription>
        </CardContent>
      </Card>
    </>
  );
}
