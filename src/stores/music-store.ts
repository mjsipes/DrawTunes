import { create } from 'zustand';
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/database.types";

const DRAWINGS_PER_PAGE = 15;

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

interface MusicState {
  // State
  currentDrawing: Tables<"drawings"> | null;
  recommendations: RecommendationWithSong[];
  allDrawings: Tables<"drawings">[];
  loadingDrawings: boolean;
  hasMoreDrawings: boolean;
  drawingsPage: number;
  currentTrack: iTunesTrack | null;
  backgroundImage: string | null;
  canvasClearFn: (() => void) | null;

  // Actions
  setCurrentDrawing: (drawing: Tables<"drawings"> | null) => void;
  setRecommendations: (recommendations: RecommendationWithSong[]) => void;
  setAllDrawings: (drawings: Tables<"drawings">[] | ((prev: Tables<"drawings">[]) => Tables<"drawings">[])) => void;
  setLoadingDrawings: (loading: boolean) => void;
  setHasMoreDrawings: (hasMore: boolean) => void;
  setDrawingsPage: (page: number) => void;
  setCurrentTrack: (track: iTunesTrack | null) => void;
  setBackgroundImage: (image: string | null) => void;
  registerCanvasClear: (clearFn: () => void) => void;
  
  // Complex actions
  clearCurrentDrawing: () => void;
  playFromRecommendations: (index: number) => void;
  skipToNext: () => void;
  clearBackgroundImage: () => void;
  clearCanvas: () => void;
  loadMoreDrawings: (userId: string) => Promise<void>;
  setCurrentDrawingById: (drawingId: string) => Promise<void>;
}

export const useMusicStore = create<MusicState>((set, get) => ({
  // Initial state
  currentDrawing: null,
  recommendations: [],
  allDrawings: [],
  loadingDrawings: false,
  hasMoreDrawings: true,
  drawingsPage: 0,
  currentTrack: null,
  backgroundImage: null,
  canvasClearFn: null,

  // Simple setters
  setCurrentDrawing: (drawing) => set({ currentDrawing: drawing }),
  setRecommendations: (recommendations) => {
    set({ recommendations });
    // Auto-set first track when recommendations change
    if (recommendations.length > 0) {
      set({ currentTrack: recommendations[0].song.full_track_data });
    } else {
      set({ currentTrack: null });
    }
  },
  setAllDrawings: (drawings) => {
    if (typeof drawings === 'function') {
      set(state => ({ allDrawings: drawings(state.allDrawings) }));
    } else {
      set({ allDrawings: drawings });
    }
  },
  setLoadingDrawings: (loading) => set({ loadingDrawings: loading }),
  setHasMoreDrawings: (hasMore) => set({ hasMoreDrawings: hasMore }),
  setDrawingsPage: (page) => set({ drawingsPage: page }),
  setCurrentTrack: (track) => set({ currentTrack: track }),
  setBackgroundImage: (image) => set({ backgroundImage: image }),
  registerCanvasClear: (clearFn) => set({ canvasClearFn: clearFn }),

  // Complex actions
  clearCurrentDrawing: () => {
    console.log("currentDrawing cleared");
    set({ 
      currentDrawing: null, 
      recommendations: [],
      currentTrack: null 
    });
  },

  playFromRecommendations: (index) => {
    console.log("MusicStore.playFromRecommendations: set current track to index ", index);
    const { recommendations } = get();
    if (recommendations[index]) {
      set({ currentTrack: recommendations[index].song.full_track_data });
    }
  },

  skipToNext: () => {
    console.log("MusicStore.skipToNext:");
    const { currentTrack, recommendations } = get();
    if (!currentTrack || recommendations.length === 0) return;
    
    const currentIndex = recommendations.findIndex(
      rec => rec.song.full_track_data.trackId === currentTrack.trackId
    );
    
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % recommendations.length;
    set({ currentTrack: recommendations[nextIndex].song.full_track_data });
  },

  clearBackgroundImage: () => set({ backgroundImage: null }),

  clearCanvas: () => {
    const { canvasClearFn } = get();
    if (canvasClearFn) {
      canvasClearFn();
    }
  },

  loadMoreDrawings: async (userId: string) => {
    const { loadingDrawings, hasMoreDrawings, drawingsPage, allDrawings } = get();
    if (!userId || loadingDrawings || !hasMoreDrawings) return;

    set({ loadingDrawings: true });
    const supabase = createClient();

    try {
      const { data, error } = await supabase
        .from("drawings")
        .select("*")
        .eq("user_id", userId)
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
          set({ hasMoreDrawings: false });
        }
        
        const newDrawings = drawingsPage === 0 ? data : [...allDrawings, ...data];
        set({ 
          allDrawings: newDrawings,
          drawingsPage: drawingsPage + 1 
        });
      }
    } catch (err) {
      console.error("Error loading drawings:", err);
    } finally {
      set({ loadingDrawings: false });
    }
  },

  setCurrentDrawingById: async (drawingId: string) => {
    console.log("MusicStore.setCurrentDrawingById: finding drawing by ID");
    const { allDrawings, clearCanvas } = get();
    const drawing = allDrawings.find((d) => d.drawing_id === drawingId);
    if (!drawing) return;

    console.log("MusicStore.setCurrentDrawingById: clearing recommendations");
    set({ recommendations: [] });
    
    console.log("MusicStore.setCurrentDrawingById: clear canvas and set background image");
    set({ backgroundImage: drawing.drawing_url });
    clearCanvas();
    
    console.log("MusicStore.setCurrentDrawingById: setCurrentDrawing");
    set({ currentDrawing: drawing });
  },
}));

// Selector hooks for better performance
export const useCurrentTrack = () => useMusicStore(state => state.currentTrack);
export const useRecommendations = () => useMusicStore(state => state.recommendations);
export const useCurrentDrawing = () => useMusicStore(state => state.currentDrawing);
export const useAllDrawings = () => useMusicStore(state => state.allDrawings);
export const useLoadingDrawings = () => useMusicStore(state => state.loadingDrawings);
export const useBackgroundImage = () => useMusicStore(state => state.backgroundImage);

// Individual action selectors (more performant)
export const usePlayFromRecommendations = () => useMusicStore(state => state.playFromRecommendations);
export const useSkipToNext = () => useMusicStore(state => state.skipToNext);
export const useClearCurrentDrawing = () => useMusicStore(state => state.clearCurrentDrawing);
export const useClearBackgroundImage = () => useMusicStore(state => state.clearBackgroundImage);
export const useClearCanvas = () => useMusicStore(state => state.clearCanvas);
export const useRegisterCanvasClear = () => useMusicStore(state => state.registerCanvasClear);
export const useLoadMoreDrawings = () => useMusicStore(state => state.loadMoreDrawings);
export const useSetCurrentDrawingById = () => useMusicStore(state => state.setCurrentDrawingById);

// Action selectors - split into individual calls to avoid infinite loops
export const useMusicActions = () => {
  const playFromRecommendations = useMusicStore(state => state.playFromRecommendations);
  const skipToNext = useMusicStore(state => state.skipToNext);
  const clearCurrentDrawing = useMusicStore(state => state.clearCurrentDrawing);
  const clearBackgroundImage = useMusicStore(state => state.clearBackgroundImage);
  const clearCanvas = useMusicStore(state => state.clearCanvas);
  const registerCanvasClear = useMusicStore(state => state.registerCanvasClear);
  const loadMoreDrawings = useMusicStore(state => state.loadMoreDrawings);
  const setCurrentDrawingById = useMusicStore(state => state.setCurrentDrawingById);
  
  return {
    playFromRecommendations,
    skipToNext,
    clearCurrentDrawing,
    clearBackgroundImage,
    clearCanvas,
    registerCanvasClear,
    loadMoreDrawings,
    setCurrentDrawingById,
  };
};

// Combined selectors for components that need multiple values - split to avoid loops
export const useAudioPlayerData = () => {
  const currentTrack = useMusicStore(state => state.currentTrack);
  const skipToNext = useMusicStore(state => state.skipToNext);
  
  return {
    currentTrack,
    skipToNext,
  };
};

export const useDrawingsData = () => {
  const allDrawings = useMusicStore(state => state.allDrawings);
  const loadingDrawings = useMusicStore(state => state.loadingDrawings);
  const hasMoreDrawings = useMusicStore(state => state.hasMoreDrawings);
  const loadMoreDrawings = useMusicStore(state => state.loadMoreDrawings);
  const setCurrentDrawingById = useMusicStore(state => state.setCurrentDrawingById);
  
  return {
    allDrawings,
    loadingDrawings,
    hasMoreDrawings,
    loadMoreDrawings,
    setCurrentDrawingById,
  };
};