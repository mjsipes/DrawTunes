// components/MusicDataProvider.tsx
import { useInitialDrawings } from "@/hooks/use-initial-drawings";
import { useCurrentDrawing } from "@/hooks/use-current-drawing";
import { useRecommendations } from "@/hooks/use-recommendations";

interface MusicDataProviderProps {
  children: React.ReactNode;
}

export function MusicDataProvider({ children }: MusicDataProviderProps) {
  // Initialize all the data loading hooks
  useInitialDrawings();
  useCurrentDrawing();
  useRecommendations();

  return <>{children}</>;
}