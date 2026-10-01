import React, { useState } from 'react';
import {
  ListMusic,
  Plus,
  Play,
  Trash2,
  ArrowLeft,
  Globe,
  Lock,
} from 'lucide-react';
import {
  usePlaylists,
  usePlaylist,
  usePlaylistMutations,
} from '../features/playlists/usePlaylists';
import { SongList } from '../features/songs/SongList';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { usePlayerStore } from '../store/playerStore';
import { formatTime } from '../utils/formatTime';
import type { Song } from '../types/song.types';

export const PlaylistsPage: React.FC = () => {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // New playlist form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data: playlistsData, isLoading: isPlaylistsLoading } = usePlaylists();
  const { data: activePlaylist, isLoading: isPlaylistLoading } = usePlaylist(
    selectedPlaylistId || undefined
  );

  const { createPlaylist, deletePlaylist, removeTrack } = usePlaylistMutations();
  const { playSong } = usePlayerStore();

  const playlists = playlistsData?.playlists || [];

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPl = await createPlaylist.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
    });

    setName('');
    setDescription('');
    setIsPublic(false);
    setCreateDialogOpen(false);
    setSelectedPlaylistId(newPl.id);
  };

  const handleDeletePlaylist = async () => {
    if (!selectedPlaylistId) return;
    await deletePlaylist.mutateAsync(selectedPlaylistId);
    setSelectedPlaylistId(null);
    setDeleteConfirmOpen(false);
  };

  const handleRemoveTrack = async (songId: string) => {
    if (!selectedPlaylistId) return;
    await removeTrack.mutateAsync({ playlistId: selectedPlaylistId, songId });
  };

  // Convert Playlist tracks to Song[]
  const playlistSongs: Song[] =
    activePlaylist?.tracks?.map((t) => t.song).filter((s): s is Song => Boolean(s)) || [];

  const totalDurationMs = playlistSongs.reduce(
    (acc, s) => acc + (s.durationMs || 0),
    0
  );

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* ── View 1: Detailed Playlist View ── */}
      {selectedPlaylistId && activePlaylist ? (
        <div className="space-y-8">
          {/* Back button */}
          <button
            onClick={() => setSelectedPlaylistId(null)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Playlists
          </button>

          {/* Playlist Hero */}
          <div className="relative rounded-3xl p-6 md:p-10 overflow-hidden bg-gradient-to-br from-[var(--surface-overlay)] via-[var(--surface)] to-[var(--surface-elevated)] border border-[var(--border)] shadow-xl flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8">
            <div className="w-40 h-40 md:w-52 md:h-52 rounded-2xl bg-gradient-to-br from-indigo-500 via-[var(--primary)] to-cyan-500 flex items-center justify-center text-white shadow-2xl shrink-0 glow-primary">
              <ListMusic className="w-20 h-20 fill-white" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-2 text-xs uppercase font-extrabold tracking-widest text-[var(--primary)]">
                <span>Playlist</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  {activePlaylist.isPublic ? (
                    <>
                      <Globe className="w-3.5 h-3.5" /> Public
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" /> Private
                    </>
                  )}
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[var(--foreground)]">
                {activePlaylist.name}
              </h1>

              {activePlaylist.description && (
                <p className="text-sm text-[var(--foreground-muted)]">
                  {activePlaylist.description}
                </p>
              )}

              <p className="text-xs md:text-sm text-[var(--foreground-muted)] flex items-center justify-center md:justify-start gap-2">
                <span>{playlistSongs.length} tracks</span>
                {totalDurationMs > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatTime(totalDurationMs)}</span>
                  </>
                )}
              </p>

              {/* Action buttons */}
              <div className="pt-4 flex items-center justify-center md:justify-start gap-4">
                {playlistSongs.length > 0 && (
                  <button
                    onClick={handlePlayAll}
                    className="w-14 h-14 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl glow-primary cursor-pointer"
                    title="Play all tracks in playlist"
                  >
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  </button>
                )}

                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Playlist
                </Button>
              </div>
            </div>
          </div>

          {/* Song list in playlist */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              Tracklist
            </h2>

            <SongList
              songs={playlistSongs}
              isLoading={isPlaylistLoading}
              emptyMessage="This playlist is currently empty. Go to Discover and use 'Add to Playlist' on any song!"
              onRemoveFromPlaylist={handleRemoveTrack}
            />
          </section>

          {/* Delete Confirmation */}
          <ConfirmDialog
            isOpen={deleteConfirmOpen}
            onClose={() => setDeleteConfirmOpen(false)}
            onConfirm={handleDeletePlaylist}
            title="Delete Playlist"
            description={`Are you sure you want to delete "${activePlaylist.name}"? This action cannot be undone.`}
            confirmLabel="Delete"
            isDestructive
            isLoading={deletePlaylist.isPending}
          />
        </div>
      ) : (
        /* ── View 2: All Playlists Grid ── */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                Your Playlists
              </h1>
              <p className="text-xs md:text-sm text-[var(--foreground-muted)] mt-1">
                Create and curate personalized mixes for solo or synced listening.
              </p>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 shadow-lg glow-primary-sm"
            >
              <Plus className="w-4 h-4" />
              New Playlist
            </Button>
          </div>

          {/* Playlists Grid */}
          {isPlaylistsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[var(--surface-elevated)] animate-pulse aspect-square"
                />
              ))}
            </div>
          ) : playlists.length === 0 ? (
            <div className="p-16 text-center rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface)]/30 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[var(--surface-elevated)] flex items-center justify-center mx-auto text-[var(--foreground-dim)]">
                <ListMusic className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">
                  Create your first playlist
                </h3>
                <p className="text-sm text-[var(--foreground-muted)] mt-1 max-w-sm mx-auto">
                  It's easy! We'll help you organize your favorite tracks.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Playlist
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {playlists.map((playlist) => (
                <div
                  key={playlist.id}
                  onClick={() => setSelectedPlaylistId(playlist.id)}
                  className="group p-3.5 rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-300 flex flex-col cursor-pointer hover:shadow-xl hover:-translate-y-1"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-[var(--surface-elevated)] to-[var(--surface-overlay)] flex items-center justify-center shadow-md">
                    {playlist.coverUrl ? (
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[var(--foreground-dim)] group-hover:text-[var(--primary)] transition-colors">
                        <ListMusic className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold text-sm text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                      {playlist.name}
                    </h3>
                    <p className="text-xs text-[var(--foreground-muted)] truncate mt-0.5">
                      {playlist.trackCount || 0} songs
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      <Dialog
        isOpen={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title="Create New Playlist"
        description="Curate a list of songs to stream anytime"
      >
        <form onSubmit={handleCreatePlaylist} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-[var(--foreground-muted)]">
              Playlist Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Late Night Drives"
              className="mt-1"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--foreground-muted)]">
              Description (Optional)
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this mix..."
              className="mt-1"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="rounded accent-[var(--primary)] cursor-pointer"
            />
            <label
              htmlFor="isPublic"
              className="text-xs text-[var(--foreground)] cursor-pointer select-none"
            >
              Make this playlist public to friends
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createPlaylist.isPending}
              disabled={!name.trim()}
            >
              Create Playlist
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
