import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/AuthProvider";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import type { Tables } from "@/lib/supabase/database.types";
import {useRecommendations} from "@/hooks/use-recommendations"
import {useCurrentDrawing} from "@/hooks/use-current-drawing"
import { useInitialDrawings } from "@/hooks/use-initial-drawings"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================


interface iTunesTrack {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  previewUrl?: string;
  artworkUrl30?: string;
  artworkUrl60?: string;
  artworkUrl100?: string;
  trackViewUrl?: string;
}

export interface RecommendationWithSong {
  id: string;
  drawing_id: string | null;
  song: {
    id: string;
    full_track_data: iTunesTrack;
    last_updated: string | null;
  };
}

interface MusicContextType {
  // Current drawing state
  currentDrawing: Tables<"drawings"> | null;
  clearCurrentDrawing: () => void;

  // Recommendations
  recommendations: RecommendationWithSong[];

  // Drawings list
  allDrawings: Tables<"drawings">[];
  loadingDrawings: boolean;
  hasMoreDrawings: boolean;
  loadMoreDrawings: () => Promise<void>;
  setCurrentDrawingById: (drawingId: string) => Promise<void>;

  // Audio controls
  play_from_recomendations: (songIndex: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  skipToNext: () => void;
  currentTrack: iTunesTrack | null;
  currentSongIndex: number | null;
  isPlaying: boolean;


  // Canvas & background
  backgroundImage: string | null;
  clearBackgroundImage: () => void;
  clearCanvas: () => void;
  registerCanvasClear: (clearFn: () => void) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DRAWINGS_PER_PAGE = 15;

// ============================================================================
// CONTEXT SETUP
// ============================================================================

const MusicContext = createContext<MusicContextType | undefined>(undefined);

// ============================================================================
// MAIN PROVIDER COMPONENT
// ============================================================================

export function MusicProvider({ children }: { children: ReactNode }) {
  const user = useAuth();
  const supabase = createClient();

  // ========================================
  // STATE DECLARATIONS
  // ========================================

  // Drawing state
  const [currentDrawing, setCurrentDrawing] = useState<Tables<"drawings"> | null>(null);
  const [allDrawings, setAllDrawings] = useState<Tables<"drawings">[]>([]);
  const [loadingDrawings, setLoadingDrawings] = useState(false);
  const [hasMoreDrawings, setHasMoreDrawings] = useState(true);
  const [drawingsPage, setDrawingsPage] = useState(0);

  // Recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationWithSong[]>([]);

  // Audio state
  const [currentSongIndex, setCurrentSongIndex] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // This runs every render, even if nothing changed, so maybe should useMemo

  const [currentTrack, setCurrentTrack] = useState<iTunesTrack | null>(null);

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);


  // Canvas & background state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [canvasClearFn, setCanvasClearFn] = useState<(() => void) | null>(null);


  // ========================================
  // AUDIO UTILITY FUNCTIONS
  // ========================================

  useEffect(() => {
    console.log("ContextProvider.useEffect(currentSongIndex): set current track to current song index")
    const newTrack =
      currentSongIndex === null || !recommendations[currentSongIndex] ?
        null : recommendations[currentSongIndex].song.full_track_data;

    setCurrentTrack(newTrack);
    setIsPlaying(true);
  }, [currentSongIndex]);


  useEffect(() => {
    console.log("ContextProvider.useEffect( recommendations): set current song index to 0");
    setCurrentSongIndex(0);
    const newTrack =
      currentSongIndex === null || !recommendations[currentSongIndex] ?
        null : recommendations[currentSongIndex].song.full_track_data;

    setCurrentTrack(newTrack);
    setIsPlaying(true);
  }, [recommendations])

  const play_from_recomendations = (index: number) => {
    console.log("ContextProvider.play_from_recomendations: setCurrentSongIndex to ", index)
    setCurrentSongIndex(index);
    // console.log("ContextProvider.play_from_recomendations: play() ")
    // play();
  }


  const play = () => {
    console.log("ContextProvider.play:");
    setIsPlaying(true);
  };
  const pause = useCallback(() => {
    console.log("ContextProvider.pause:");
    setIsPlaying(false);
  }, []);
  const togglePlayPause = () => {
    console.log("ContextProvider.togglePlayPause:");
    setIsPlaying(!isPlaying);
  };

  const skipToNext = useCallback(() => {
    console.log("ContextProvider.skipToNext:");
    setCurrentSongIndex(prev =>
      prev !== null ? (prev + 1) % recommendations.length : 0
    );
  }, [recommendations.length]);


  const clearCurrentDrawing = () => {
    console.log("currentDrawing cleared");
    setCurrentDrawing(null);
    setRecommendations([]);
  };

  const loadMoreDrawings = useCallback(async () => {
    if (!user?.id || loadingDrawings || !hasMoreDrawings) return;

    setLoadingDrawings(true);

    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(
          drawingsPage * DRAWINGS_PER_PAGE,
          (drawingsPage + 1) * DRAWINGS_PER_PAGE - 1
        );

      if (error) {
        console.error("Error fetching drawings:", error);
        return;
      }

      if (data) {
        if (data.length < DRAWINGS_PER_PAGE) {
          setHasMoreDrawings(false);
        }

        setAllDrawings((prev) => drawingsPage === 0 ? data : [...prev, ...data]);
        setDrawingsPage((prev) => prev + 1);
      }
    } catch (err) {
      console.error("Error loading drawings:", err);
    } finally {
      setLoadingDrawings(false);
    }
  }, [user?.id, loadingDrawings, hasMoreDrawings, drawingsPage, supabase]);

  const setCurrentDrawingById = useCallback(
    async (drawingId: string) => {
      console.log("ContextProvider.setCurrentDrawingById: finding drawing by ID");
      const drawing = allDrawings.find((d) => d.drawing_id === drawingId);
      if (!drawing) return;

      // clearAudioState();
      console.log("ContextProvider.setCurrentDrawingById: clearing recomendations");
      setRecommendations([]);
      console.log("ContextProvider.setCurrentDrawingById: clear canvas and set background image");
      setBackgroundImage(drawing.drawing_url);
      clearCanvas();
      console.log("ContextProvider.setCurrentDrawingById: setCurrentDrawing");
      setCurrentDrawing(drawing);
    },
    [allDrawings]
  );

  // Canvas functions
  const registerCanvasClear = useCallback((clearFn: () => void) => {
    setCanvasClearFn(() => clearFn);
  }, []);

  const clearCanvas = useCallback(() => {
    if (canvasClearFn) {
      canvasClearFn();
    }
  }, [canvasClearFn]);

  const clearBackgroundImage = () => {
    setBackgroundImage(null);
  };

  // ========================================
  // EFFECTS
  // ========================================

  // Load initial drawings when user changes
  useEffect(() => {
    if (user?.id) {
      setAllDrawings([]);
      setDrawingsPage(0);
      setHasMoreDrawings(true);
      loadMoreDrawings();
    }
  }, [user?.id]);

  useInitialDrawings(user, setAllDrawings, setDrawingsPage, setHasMoreDrawings, loadMoreDrawings);
  useCurrentDrawing(user, setCurrentDrawing, setAllDrawings);
  useRecommendations(currentDrawing, setRecommendations);

  // ========================================
  // CONTEXT VALUE
  // ========================================


  const contextValue: MusicContextType = {
    // Current drawing
    currentDrawing,
    clearCurrentDrawing,

    // Recommendations
    recommendations,

    // Drawings list
    allDrawings,
    loadingDrawings,
    hasMoreDrawings,
    loadMoreDrawings,
    setCurrentDrawingById,

    // Audio controls
    // audioState,
    play,
    play_from_recomendations,
    skipToNext,
    currentTrack,
    currentSongIndex,
    isPlaying,
    togglePlayPause,
    pause,

    // Canvas & background
    backgroundImage,
    clearCanvas,
    registerCanvasClear,
    clearBackgroundImage,
  };

  return (
    <MusicContext.Provider value={contextValue}>
      {children}
    </MusicContext.Provider>
  );
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error("useMusic must be used within a MusicProvider");
  }
  return context;
}