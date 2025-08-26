import { Undo, RotateCcw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { ChangeEvent } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import type { ReactSketchCanvasRef } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";

import { useMusicStore } from "@/stores/music-store";
export default function DrawCard() {
  const supabase = createClient();
  const { theme } = useTheme();
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState("#6C90FF");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasColor, setCanvasColor] = useState("#FFFFFF");

  const clearCurrentDrawing = useMusicStore(state => state.clearCurrentDrawing);
  const clearBackgroundImage = useMusicStore(state => state.clearBackgroundImage);
  const registerCanvasClear = useMusicStore(state => state.registerCanvasClear);
  const backgroundImage = useMusicStore(state => state.backgroundImage)

  useEffect(() => {
    registerCanvasClear(() => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });
  }, [registerCanvasClear]);

  useEffect(() => {
    const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    setCanvasColor(isDark ? "oklch(0.205 0 0)" : "#FFFFFF");
  }, [theme]);

  const handleStrokeColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStrokeColor(event.target.value);
  };

  const handleGetRecommendations = async () => {
    if (!canvasRef.current) return;

    setIsLoading(true);
    clearCurrentDrawing();
    setError(null);

    try {
      const dataUrl = await canvasRef.current.exportImage("png");
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Generate a unique filename
      const fileName = `drawing-${Date.now()}.png`;
      const filePath = `drawings/${fileName}`;

      // Upload the blob to Supabase
      const { data, error: uploadError } = await supabase.storage
        .from("drawings")
        .upload(filePath, blob, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("drawings")
        .getPublicUrl(data?.path || "");

      console.log("File uploaded successfully:", publicUrlData?.publicUrl);
    } catch (err: any) {
      console.error("Error uploading drawing:", err);
      setError(err.message || "Failed to upload image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Draw for Music</CardTitle>
        <CardDescription>
          Draw something and we'll recommend Spotify tracks that match your art.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 border-2 border-gray-300 rounded-lg overflow-hidden">
          <ReactSketchCanvas
            ref={canvasRef}
            strokeWidth={4}
            strokeColor={strokeColor}
            canvasColor={canvasColor}
            backgroundImage={backgroundImage ?? undefined}
            exportWithBackgroundImage={true} // 🎉 This does the magic!
            style={{
              border: 'none',
            }}
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center w-full gap-3">
          <div className="flex space-x-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (canvasRef.current) {
                  canvasRef.current.clearCanvas();
                  clearBackgroundImage();
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
            className="w-full sm:w-auto text-center"
          >

            <span>
              {isLoading ? "Uploading..." : "Get Music Recommendations"}
            </span>
          </Button>
        </div>

        {error && (
          <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
        )}
      </CardContent>
    </Card>
  );
}