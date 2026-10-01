import { ISong } from '../models/Song.model';
import { IPlaylist } from '../models/Playlist.model';
import { IFavorite } from '../models/Favorite.model';
import { SongDto, PlaylistDto, FavoriteDto } from '../dtos/song/song.dto';

export function toSongDto(song: ISong): SongDto {
  return {
    id: song._id.toString(),
    title: song.title,
    artist: song.artist,
    album: song.album,
    genre: song.genre,
    durationMs: song.durationMs,
    coverUrl: song.coverUrl,
    audioUrl: song.audioUrl,
    previewUrl: song.previewUrl,
    permaUrl: song.permaUrl,
    providerId: song.providerId,
    provider: song.provider,
    playCount: song.playCount,
  };
}


export function toPlaylistDto(playlist: IPlaylist): PlaylistDto {
  return {
    id: playlist._id.toString(),
    ownerId: playlist.ownerId.toString(),
    name: playlist.name,
    description: playlist.description,
    coverUrl: playlist.coverUrl,
    isPublic: playlist.isPublic,
    trackCount: playlist.trackCount,
    tracks: playlist.tracks.map((t) => ({
      songId: t.songId.toString(),
      position: t.position,
      addedAt: t.addedAt,
    })),
    createdAt: playlist.createdAt,
  };
}

export function toFavoriteDto(favorite: IFavorite & { songId: ISong }): FavoriteDto {
  return {
    id: favorite._id.toString(),
    song: toSongDto(favorite.songId),
    createdAt: favorite.createdAt,
  };
}
