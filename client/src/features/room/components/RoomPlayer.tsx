import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Music,
  Lock,
  Volume2,
  VolumeX,
  Loader2,
  Plus,
} from 'lucide-react';
import { useRoomStore } from '../../../store/roomStore';
import { formatTime } from '../../../utils/formatTime';
import { ProgressSlider } from '../../../components/player/ProgressSlider';
import { SongPickerModal } from './SongPickerModal';
import { socketService } from '../../../services/socket.service';
import { AudioWaveEffect } from './AudioWaveEffect';

interface RoomPlayerProps {
  currentPositionMs: number;
  durationMs: number;
  isPlaying: boolean;
  localVolume: number;
  setLocalVolume: (vol: number) => void;
  isLocalMuted: boolean;
  toggleLocalMute: () => void;
  togglePlay: () => void;
  handleSeek: (positionMs: number) => void;
  canControl: boolean;
  roomCode: string;
  waitingForMember?: string | null;
  needsUserInteraction?: boolean;
  onUnlockAudio?: () => void;
}

export const RoomPlayer: React.FC<RoomPlayerProps> = ({
  currentPositionMs,
  durationMs,
  isPlaying,
  localVolume,
  setLocalVolume,
  isLocalMuted,
  toggleLocalMute,
  togglePlay,
  handleSeek,
  canControl,
  roomCode,
  waitingForMember = null,
  needsUserInteraction = false,
  onUnlockAudio,
}) => {
  const { currentSong, queue } = useRoomStore();
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  const effectiveDurationMs = currentSong?.durationMs || durationMs || 0;

  const handleNextTrack = () => {
    if (!canControl) return;
    if (queue.length > 0) {
      const nextSong = queue[0];
      socketService.changeSong(roomCode, nextSong.songId);
      socketService.removeFromQueue(roomCode, nextSong.songId);
    }
  };

  const handlePrevTrack = () => {
    if (!canControl) return;
    handleSeek(0);
  };

  return (
    <div className="relative rounded-2xl border border-zinc-800/80 bg-zinc-950 p-5 sm:p-6 shadow-sm flex flex-col h-full w-full min-h-[480px] transition-all">
      {/* Top action row */}
      <div className="w-full flex items-center justify-between pb-3.5 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">
            {currentSong ? (isPlaying ? 'Now Playing' : 'Playback Paused') : 'Audio Player'}
          </span>
        </div>

        {currentSong && (
          <button
            onClick={() => setSongPickerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-850 active:scale-95 border border-zinc-800 text-xs font-medium text-zinc-200 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Change Song</span>
          </button>
        )}
      </div>

      {/* Autoplay Gate Warning Banner */}
      {needsUserInteraction && (
        <div className="w-full max-w-sm mx-auto p-3 mt-3 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 shadow-sm shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <Volume2 className="w-4 h-4 text-zinc-400 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">Audio is blocked</p>
              <p className="text-[10px] text-zinc-500 truncate">Tap button to enable sound</p>
            </div>
          </div>
          <button
            onClick={onUnlockAudio}
            className="px-3 py-1 rounded-md bg-zinc-100 text-zinc-950 text-xs font-medium hover:bg-white active:scale-95 transition-all shrink-0 cursor-pointer"
          >
            Enable
          </button>
        </div>
      )}

      {/* Buffering Indicator */}
      {waitingForMember && (
        <div className="w-full max-w-sm mx-auto px-4 py-2 mt-3 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center gap-2.5 text-xs font-medium shadow-sm shrink-0">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400 shrink-0" />
          <span>Buffering for <strong className="text-zinc-200 font-semibold">{waitingForMember}</strong>...</span>
        </div>
      )}

      {/* Main Content Area - Perfectly Centered */}
      <div className="flex-1 flex flex-col items-center justify-center w-full py-4 min-h-0">
        {currentSong ? (
          <div className="w-full max-w-[460px] mx-auto flex flex-col items-center gap-4 sm:gap-5">
            {/* Album Artwork */}
            <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shadow-md shrink-0">
              {currentSong.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Music className="w-12 h-12" />
                </div>
              )}
            </div>

            {/* Song Info */}
            <div className="text-center w-full space-y-1 px-2">
              <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 tracking-tight truncate">
                {currentSong.title}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 truncate">
                {currentSong.artist}
              </p>
              {currentSong.album && (
                <p className="text-[11px] text-zinc-500 truncate pt-0.5">
                  {currentSong.album}
                </p>
              )}
            </div>

            {/* Scrubber Progress Bar */}
            <div className="w-full space-y-1 pt-1">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono text-zinc-400 w-10 text-right shrink-0">
                  {formatTime(currentPositionMs, true)}
                </span>
                <div className="flex-1">
                  <ProgressSlider
                    currentMs={currentPositionMs}
                    durationMs={effectiveDurationMs}
                    onSeek={canControl ? handleSeek : () => {}}
                    className={!canControl ? 'opacity-70 pointer-events-none' : ''}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 w-10 text-left shrink-0">
                  {formatTime(effectiveDurationMs, true)}
                </span>
              </div>

              {!canControl && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-500 pt-0.5">
                  <Lock className="w-3 h-3" />
                  <span>Host controls playback</span>
                </div>
              )}
            </div>

            {/* Playback Controls Bar: Waveform (Left) | Hero Controls (Dead Center) | Volume (Right) */}
            <div className="relative w-full flex items-center justify-center pt-1 min-h-[56px]">
              {/* Left: Synchronized Audio Wave Visualizer - Pinned to Left Margin */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                <AudioWaveEffect isPlaying={isPlaying} />
              </div>

              {/* Center: Play / Pause Hero & Skip Buttons - Guaranteed Exact 50% Center */}
              <div className="flex items-center justify-center gap-5 sm:gap-6">
                {/* Skip Back */}
                <button
                  onClick={handlePrevTrack}
                  disabled={!canControl}
                  className="w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                  title={canControl ? 'Restart track' : 'Controlled by host'}
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                {/* Play / Pause Hero Button */}
                <button
                  onClick={togglePlay}
                  disabled={!canControl}
                  className="w-14 h-14 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center hover:bg-white active:scale-95 transition-all shadow-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-bold"
                  title={canControl ? (isPlaying ? 'Pause' : 'Play') : 'Controlled by host'}
                >
                  {!canControl ? (
                    <Lock className="w-5 h-5 text-zinc-700" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  )}
                </button>

                {/* Skip Forward */}
                <button
                  onClick={handleNextTrack}
                  disabled={!canControl || queue.length === 0}
                  className="w-10 h-10 rounded-full text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
                  title={canControl ? 'Next from queue' : 'Controlled by host'}
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </div>

              {/* Right: Audio Volume - Pinned to Right Margin */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <button
                  onClick={toggleLocalMute}
                  className="text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer shrink-0"
                  title={isLocalMuted ? 'Unmute' : 'Mute'}
                >
                  {isLocalMuted || localVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isLocalMuted ? 0 : localVolume}
                  onChange={(e) => {
                    if (isLocalMuted) toggleLocalMute();
                    setLocalVolume(parseFloat(e.target.value));
                  }}
                  className="w-16 sm:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                  title={`Volume: ${Math.round((isLocalMuted ? 0 : localVolume) * 100)}%`}
                />
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - Perfectly Centered Vertically and Horizontally */
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-sm mx-auto space-y-3.5">
            <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 shadow-inner">
              <Music className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-zinc-100 tracking-tight">No Song Playing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs">
                Select a track to start playback in this room.
              </p>
            </div>
            <button
              onClick={() => setSongPickerOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-100 text-zinc-950 text-xs font-semibold hover:bg-white active:scale-95 transition-all shadow cursor-pointer mt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Pick a Song</span>
            </button>
          </div>
        )}
      </div>

      {/* Song Picker Modal */}
      <SongPickerModal
        isOpen={songPickerOpen}
        onClose={() => setSongPickerOpen(false)}
        roomCode={roomCode}
      />
    </div>
  );
};
