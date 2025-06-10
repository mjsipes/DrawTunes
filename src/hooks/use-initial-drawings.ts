import { useEffect } from 'react';

export function useInitialDrawings(
  user: { id: string } | null,
  setAllDrawings: (drawings: any[]) => void,
  setDrawingsPage: (page: number) => void,
  setHasMoreDrawings: (hasMore: boolean) => void,
  loadMoreDrawings: () => void
) {
  useEffect(() => {
    if (user?.id) {
      setAllDrawings([]);
      setDrawingsPage(0);
      setHasMoreDrawings(true);
      loadMoreDrawings();
    }
  }, [user?.id]);
}