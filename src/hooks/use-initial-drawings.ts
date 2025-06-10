// use-initial-drawings.ts
import { useEffect } from 'react';
import { useAuth } from "@/lib/supabase/AuthProvider";
import { useMusicStore } from "@/stores/music-store";

export function useInitialDrawings() {
  const user = useAuth();
  const setAllDrawings = useMusicStore(state => state.setAllDrawings);
  const setDrawingsPage = useMusicStore(state => state.setDrawingsPage);
  const setHasMoreDrawings = useMusicStore(state => state.setHasMoreDrawings);
  const loadMoreDrawings = useMusicStore(state => state.loadMoreDrawings);

  useEffect(() => {
    if (user?.id) {
      setAllDrawings([]);
      setDrawingsPage(0);
      setHasMoreDrawings(true);
      loadMoreDrawings(user.id);
    }
  }, [user?.id, setAllDrawings, setDrawingsPage, setHasMoreDrawings, loadMoreDrawings]);
}