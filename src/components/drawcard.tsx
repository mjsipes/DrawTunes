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

import { useMusicActions, useBackgroundImage } from "@/stores/music-store";

export default function DrawCard() {
  const supabase = createClient();
  const { theme } = useTheme();
  const canvasRef = useRef<ReactSketchCanvasRef>(null);
  const [strokeColor, setStrokeColor] = useState("#6C90FF");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canvasColor, setCanvasColor] = useState("#FFFFFF");
  const { clearCurrentDrawing, clearBackgroundImage, registerCanvasClear } = useMusicActions();
  const backgroundImage = useBackgroundImage();

  // console.log("DrawCard render - backgroundImage:", backgroundImage);

  useEffect(() => {
    registerCanvasClear(() => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
      }
    });
  }, [registerCanvasClear]);

  // Update canvas color when theme changes
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
      // Create a new canvas to composite the background and drawing
      const compositeCanvas = document.createElement("canvas");
      const ctx = compositeCanvas.getContext("2d");

      if (!ctx) throw new Error("Could not get canvas context");

      // Set canvas dimensions (match your ReactSketchCanvas dimensions)
      compositeCanvas.width = 400; // Adjust to match your canvas width
      compositeCanvas.height = 256; // Adjust to match your canvas height (h-64 = 256px)

      // Fill with canvas background color
      ctx.fillStyle = canvasColor;
      ctx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);

      // Draw background image if it exists
      if (backgroundImage) {
        const bgImg = new Image();
        bgImg.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          bgImg.onload = () => {
            ctx.drawImage(
              bgImg,
              0,
              0,
              compositeCanvas.width,
              compositeCanvas.height
            );
            resolve(undefined);
          };
          bgImg.onerror = reject;
          bgImg.src = backgroundImage;
        });
      }

      // Export the drawing from ReactSketchCanvas (transparent background)
      const drawingDataUrl = await canvasRef.current.exportImage("png");
      const drawingImg = new Image();

      await new Promise((resolve, reject) => {
        drawingImg.onload = () => {
          // Draw the sketch on top of the background
          ctx.drawImage(
            drawingImg,
            0,
            0,
            compositeCanvas.width,
            compositeCanvas.height
          );
          resolve(undefined);
        };
        drawingImg.onerror = reject;
        drawingImg.src = drawingDataUrl;
      });

      // Convert composite canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        compositeCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, "image/png");
      });

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
              canvasColor={canvasColor}
              backgroundImage={backgroundImage ?? undefined}
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
                    //clear background image
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
            >
              {isLoading ? "Uploading..." : "Get Music Recommendations"}
            </Button>
          </div>

          {error && (
            <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
