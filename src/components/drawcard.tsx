import { Undo, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DrawCard() {
  const canvasRef = useRef(null);
  const [strokeColor, setStrokeColor] = useState("#6C90FF");
  const handleStrokeColorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setStrokeColor(event.target.value);
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
              className="w-full h-full"
            />
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => canvasRef.current.clearCanvas()}
            >
              <RotateCcw />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => canvasRef.current.undo()}
            >
              <Undo />
            </Button>
            <div className="relative h-8 w-8 overflow-hidden rounded-2xl border">
              <input
                type="color"
                value={strokeColor}
                onChange={handleStrokeColorChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <div
                className="h-full w-full"
                style={{ backgroundColor: strokeColor }}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline">Get Music Recommendations</Button>
        </CardFooter>
      </Card>
    </>
  );
}
