import React, { useState } from 'react';
import { Plus, ListMusic, Check } from 'lucide-react';
import { Dialog } from '../ui/Dialog';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { usePlaylists, usePlaylistMutations } from '../../features/playlists/usePlaylists';
import type { Song } from '../../types/song.types';

interface AddToPlaylistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

export const AddToPlaylistDialog: React.FC<AddToPlaylistDialogProps> = ({
  isOpen,
  onClose,
  song,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const { data: playlistData, isLoading } = usePlaylists();
  const { addTrack, createPlaylist } = usePlaylistMutations();

  if (!song) return null;

  const playlists = playlistData?.playlists || [];

  const handleAddToPlaylist = async (playlistId: string) => {
    await addTrack.mutateAsync({ playlistId, songId: song.id });
    onClose();
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl = await createPlaylist.mutateAsync({
      name: newPlaylistName.trim(),
    });
    await addTrack.mutateAsync({ playlistId: newPl.id, songId: song.id });
    setNewPlaylistName('');
    setIsCreating(false);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Add to Playlist"
      description={`Add "${song.title}" to one of your playlists`}
    >
      <div className="space-y-4 pt-2">
        {/* New Playlist Form */}
        {isCreating ? (
          <form onSubmit={handleCreateAndAdd} className="space-y-3 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--foreground)]">New Playlist Name</p>
            <Input
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="e.g. Chill Vibes, Workout Beats"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={createPlaylist.isPending || addTrack.isPending}
                disabled={!newPlaylistName.trim()}
              >
                Create & Add
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-dashed"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-4 h-4 text-[var(--primary)]" />
            Create New Playlist
          </Button>
        )}

        {/* Existing Playlists */}
        <div className="max-h-60 overflow-y-auto space-y-1">
          {isLoading ? (
            <div className="py-6 text-center text-xs text-[var(--foreground-dim)]">
              Loading playlists...
            </div>
          ) : playlists.length === 0 ? (
            <div className="py-4 text-center text-xs text-[var(--foreground-dim)]">
              No playlists found. Create one above!
            </div>
          ) : (
            playlists.map((playlist) => {
              const alreadyInPlaylist = playlist.tracks?.some((t) => t.songId === song.id);

              return (
                <button
                  key={playlist.id}
                  onClick={() => !alreadyInPlaylist && handleAddToPlaylist(playlist.id)}
                  disabled={alreadyInPlaylist || addTrack.isPending}
                  className="w-full p-2.5 rounded-xl hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-all flex items-center justify-between group text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--foreground-dim)] group-hover:text-[var(--primary)]">
                      <ListMusic className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {playlist.name}
                      </p>
                      <p className="text-[11px] text-[var(--foreground-dim)]">
                        {playlist.trackCount || 0} songs
                      </p>
                    </div>
                  </div>

                  {alreadyInPlaylist ? (
                    <span className="flex items-center gap-1 text-xs text-[var(--primary)] font-medium">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--primary)] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Add +
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </Dialog>
  );
};
