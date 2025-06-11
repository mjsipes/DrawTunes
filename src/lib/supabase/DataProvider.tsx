// components/DataProvider.tsx
import { useInitialDrawings } from "@/hooks/use-initial-drawings";
import { useCurrentDrawing } from "@/hooks/use-current-drawing";
import { useRecommendations } from "@/hooks/use-recommendations";

interface DataProviderProps {
  children: React.ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
  // Initialize all the data loading hooks
  useInitialDrawings();
  useCurrentDrawing();
  useRecommendations();

  return <>{children}</>;
}