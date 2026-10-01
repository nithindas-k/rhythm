import React from 'react';
import { X, Play, Trash2, Music } from 'lucide-react';
import { usePlayerStore } from '../../store/playerStore';
import { formatTime } from '../../utils/formatTime';
import { Button } from '../ui/Button';

export const QueueDrawer: React.FC = () => {
  const {
    currentSong,
    queue,
    history,
    isPlaying,
    isQueueOpen,
    setQueueOpen,
    removeFromQueue,
    clearQueue,
    playSong,
  } = usePlayerStore();

  if (!isQueueOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-fade-in">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music className="w-5 h-5 text-[var(--primary)]" />
          <h3 className="font-bold text-base text-[var(--foreground)]">Playback Queue</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--surface-elevated)] text-[var(--foreground-muted)]">
            {queue.length} next
          </span>
        </div>

        <div className="flex items-center gap-2">
          {queue.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearQueue}
              className="text-xs text-[var(--foreground-dim)] hover:text-red-400"
              title="Clear all upcoming songs"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
          <button
            onClick={() => setQueueOpen(false)}
            className="p-1.5 rounded-lg text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer"
            title="Close queue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Now Playing */}
        {currentSong && (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-dim)]">
              Now Playing
            </span>
            <div className="mt-2 p-3 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--surface-overlay)] shrink-0 relative">
                {currentSong.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
                    <Music className="w-5 h-5" />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-0.5">
                    <span className="w-1 h-3 bg-[var(--primary)] rounded-full animate-bounce" />
                    <span className="w-1 h-4 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.15s]" />
                    <span className="w-1 h-2 bg-[var(--primary)] rounded-full animate-bounce [animation-delay:0.3s]" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[var(--foreground)] truncate">
                  {currentSong.title}
                </p>
                <p className="text-xs text-[var(--foreground-muted)] truncate">
                  {currentSong.artist}
                </p>
              </div>

              <span className="text-xs text-[var(--foreground-dim)]">
                {formatTime(currentSong.durationMs)}
              </span>
            </div>
          </div>
        )}

        {/* Up Next */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-dim)]">
            Up Next ({queue.length})
          </span>

          {queue.length === 0 ? (
            <div className="mt-4 p-8 text-center rounded-xl border border-dashed border-[var(--border)]">
              <p className="text-sm text-[var(--foreground-dim)]">
                No songs in queue. Add songs from Discover or your Playlists!
              </p>
            </div>
          ) : (
            <div className="mt-2 space-y-1.5">
              {queue.map((song, index) => (
                <div
                  key={`${song.id}-${index}`}
                  className="group p-2 rounded-xl hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border)] transition-all flex items-center gap-3"
                >
                  <span className="text-xs font-mono text-[var(--foreground-dim)] w-4 text-center">
                    {index + 1}
                  </span>

                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--surface-overlay)] shrink-0 relative">
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
                        <Music className="w-4 h-4" />
                      </div>
                    )}
                    <button
                      onClick={() => playSong(song, queue)}
                      className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                      title="Play this now"
                    >
                      <Play className="w-4 h-4 fill-white" />
                    </button>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)] truncate">
                      {song.title}
                    </p>
                    <p className="text-xs text-[var(--foreground-dim)] truncate">
                      {song.artist}
                    </p>
                  </div>

                  <span className="text-xs text-[var(--foreground-dim)]">
                    {formatTime(song.durationMs)}
                  </span>

                  <button
                    onClick={() => removeFromQueue(index)}
                    className="p-1 rounded text-[var(--foreground-dim)] hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove from queue"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recently Played / History */}
        {history.length > 0 && (
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-dim)]">
              Recently Played ({history.length})
            </span>
            <div className="mt-2 space-y-1.5">
              {history
                .slice(-5)
                .reverse()
                .map((song, i) => (
                  <div
                    key={`hist-${song.id}-${i}`}
                    onClick={() => playSong(song)}
                    className="p-2 rounded-xl hover:bg-[var(--surface-hover)] transition-colors flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--surface-overlay)] shrink-0">
                      {song.coverUrl ? (
                        <img
                          src={song.coverUrl}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--foreground-dim)]">
                          <Music className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[var(--foreground)] truncate group-hover:text-[var(--primary)]">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-[var(--foreground-dim)] truncate">
                        {song.artist}
                      </p>
                    </div>
                    <span className="text-[10px] text-[var(--foreground-dim)]">
                      {formatTime(song.durationMs)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
