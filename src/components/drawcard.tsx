import { Undo, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import type { ChangeEvent } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import type { ReactSketchCanvasRef } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSupabaseUploadCanvas } from "@/hooks/use-supabase-upload-canvas";

export default function DrawCard() {
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState("#6C90FF");
  const [isLoading, setIsLoading] = useState(false);

  const { isUploading, error, uploadedPath, uploadCanvasImage, getPublicUrl } =
    useSupabaseUploadCanvas({
      bucketName: "drawings",
      path: "drawings",
    });

  const handleStrokeColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStrokeColor(event.target.value);
  };
  const handleGetRecommendations = async () => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    try {
      // 1. Export canvas as a PNG data URL
      const dataUrl = await canvasRef.current.exportImage("png");

      // 2. Convert data URL to a Blob
      const fetchResponse = await fetch(dataUrl);
      const blob = await fetchResponse.blob();

      // 3. Generate a unique filename
      const fileName = `drawing-${Date.now()}.png`;

      // 4. Upload the blob to Supabase
      const filePath = await uploadCanvasImage(blob, fileName);

      // 5. If upload successful, you can proceed with calling your recommendation API
      if (filePath) {
        // Get the public URL
        const publicUrl = getPublicUrl(filePath);

        // TODO: Call your music recommendation API with the publicUrl
        console.log("File uploaded successfully:", publicUrl);

        // You would call your API here
        // const response = await fetch('/api/recommendations', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify({ imageUrl: publicUrl }),
        // });
        // const recommendations = await response.json();
      }
    } catch (err) {
      console.error("Error uploading drawing:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Draw for Music</CardTitle>
          <CardDescription>
            Draw something and we'll recommend Spotify tracks that match your
            art.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64">
            <ReactSketchCanvas
              ref={canvasRef}
              strokeWidth={4}
              strokeColor={strokeColor}
              canvasColor="white"
            />
          </div>
          <div className="flex justify-between items-center w-full">
            <div className="flex space-x-2 items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (canvasRef.current) {
                    canvasRef.current.clearCanvas();
                  }
                }}
              >
                <RotateCcw />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (canvasRef.current) {
                    canvasRef.current.undo();
                  }
                }}
              >
                <Undo />
              </Button>
              <div className="relative h-8 w-8 rounded-2xl overflow-hidden border">
                <input
                  type="color"
                  value={strokeColor}
                  onChange={handleStrokeColorChange}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
                <div
                  className="h-full w-full"
                  style={{ backgroundColor: strokeColor }}
                />
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleGetRecommendations}
              disabled={isLoading}
            >
              {isLoading || isUploading
                ? "Uploading..."
                : "Get Music Recommendations"}
            </Button>
          </div>
        </CardContent>
        {/* <CardFooter className="flex justify-center"></CardFooter> */}
      </Card>
    </>
  );
}
