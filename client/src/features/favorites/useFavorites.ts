import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { favoriteService } from '../../services/favorite.service';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { toast } from '../../components/ui/Toast';

export function useFavorites(cursor?: string, limit = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.FAVORITES.ALL,
    queryFn: () => favoriteService.getFavorites(cursor, limit),
    staleTime: 60 * 1000,
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (songId: string) => favoriteService.addFavorite(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FAVORITES.ALL });
      toast.success('Added to your Liked Songs');
    },
    onError: () => {
      toast.error('Failed to add to Liked Songs');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (songId: string) => favoriteService.removeFavorite(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FAVORITES.ALL });
      toast.info('Removed from your Liked Songs');
    },
    onError: () => {
      toast.error('Failed to remove from Liked Songs');
    },
  });

  const toggle = (songId: string, isCurrentlyFavorited: boolean) => {
    if (isCurrentlyFavorited) {
      removeMutation.mutate(songId);
    } else {
      addMutation.mutate(songId);
    }
  };

  return {
    toggle,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}
