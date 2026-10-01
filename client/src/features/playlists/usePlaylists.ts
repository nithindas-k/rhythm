import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  playlistService,
  type CreatePlaylistInput,
  type UpdatePlaylistInput,
} from '../../services/playlist.service';
import { QUERY_KEYS } from '../../constants/queryKeys';
import { toast } from '../../components/ui/Toast';

export function usePlaylists(cursor?: string, limit = 50) {
  return useQuery({
    queryKey: QUERY_KEYS.PLAYLISTS.ALL,
    queryFn: () => playlistService.getPlaylists(cursor, limit),
    staleTime: 60 * 1000,
  });
}

export function usePlaylist(id?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PLAYLISTS.DETAIL(id || ''),
    queryFn: () => (id ? playlistService.getById(id) : null),
    enabled: Boolean(id),
  });
}

export function usePlaylistMutations() {
  const queryClient = useQueryClient();

  const createPlaylist = useMutation({
    mutationFn: (data: CreatePlaylistInput) => playlistService.create(data),
    onSuccess: (newPlaylist) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.ALL });
      toast.success(`Playlist "${newPlaylist.name}" created!`);
    },
    onError: () => {
      toast.error('Failed to create playlist');
    },
  });

  const updatePlaylist = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlaylistInput }) =>
      playlistService.update(id, data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.DETAIL(updated.id) });
      toast.success('Playlist updated');
    },
    onError: () => {
      toast.error('Failed to update playlist');
    },
  });

  const deletePlaylist = useMutation({
    mutationFn: (id: string) => playlistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.ALL });
      toast.info('Playlist deleted');
    },
    onError: () => {
      toast.error('Failed to delete playlist');
    },
  });

  const addTrack = useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      playlistService.addTrack(playlistId, songId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.DETAIL(updated.id) });
      toast.success('Song added to playlist');
    },
    onError: () => {
      toast.error('Failed to add song to playlist');
    },
  });

  const removeTrack = useMutation({
    mutationFn: ({ playlistId, songId }: { playlistId: string; songId: string }) =>
      playlistService.removeTrack(playlistId, songId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PLAYLISTS.DETAIL(variables.playlistId),
      });
      toast.info('Song removed from playlist');
    },
    onError: () => {
      toast.error('Failed to remove song from playlist');
    },
  });

  const reorderTracks = useMutation({
    mutationFn: ({ playlistId, songIds }: { playlistId: string; songIds: string[] }) =>
      playlistService.reorderTracks(playlistId, songIds),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PLAYLISTS.DETAIL(updated.id) });
    },
    onError: () => {
      toast.error('Failed to reorder tracks');
    },
  });

  return {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addTrack,
    removeTrack,
    reorderTracks,
  };
}
