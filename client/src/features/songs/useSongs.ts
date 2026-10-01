import { useQuery } from '@tanstack/react-query';
import { songService, type SongSearchParams } from '../../services/song.service';
import { QUERY_KEYS } from '../../constants/queryKeys';

export function useTrendingSongs(limit = 10) {
  return useQuery({
    queryKey: QUERY_KEYS.SONGS.TRENDING,
    queryFn: () => songService.getTrending(limit),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearchSongs(params: SongSearchParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.SONGS.SEARCH(params as Record<string, unknown>),
    queryFn: () => songService.search(params),
    staleTime: 60 * 1000,
  });
}

export function useSongDetail(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SONGS.DETAIL(id),
    queryFn: () => songService.getById(id),
    enabled: Boolean(id),
  });
}
