import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface MusicLoadingContextType {
  isLoadingRecommendations: boolean;
  startLoadingRecommendations: () => void;
  stopLoadingRecommendations: () => void;
}

const MusicLoadingContext = createContext<MusicLoadingContextType | undefined>(
  undefined
);

export function MusicLoadingProvider({ children }: { children: ReactNode }) {
  const [isLoadingRecommendations, setIsLoadingRecommendations] =
    useState(false);

  const startLoadingRecommendations = () => {
    console.log("startLoadingRecommendations");
    setIsLoadingRecommendations(true);
  };

  const stopLoadingRecommendations = () => {
    console.log("stopLoadingRecommendations");
    setIsLoadingRecommendations(false);
  };

  return (
    <MusicLoadingContext.Provider
      value={{
        isLoadingRecommendations,
        startLoadingRecommendations,
        stopLoadingRecommendations,
      }}
    >
      {children}
    </MusicLoadingContext.Provider>
  );
}

export function useMusicLoading() {
  const context = useContext(MusicLoadingContext);
  if (context === undefined) {
    throw new Error(
      "useMusicLoading must be used within a MusicLoadingProvider"
    );
  }
  return context;
}
