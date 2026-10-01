import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socketService } from '../services/socket.service';
import { SOCKET_EVENTS } from '../constants/socketEvents';
import { useRoomStore } from '../store/roomStore';
import { useAuthStore } from '../store/authStore';
import { usePlayerStore } from '../store/playerStore';
import { useRoomAudioSync } from '../hooks/useRoomAudioSync';
import { RoomHeader } from '../features/room/components/RoomHeader';
import { RoomPlayer } from '../features/room/components/RoomPlayer';
import { RoomSidebar } from '../features/room/components/RoomSidebar';
import { RoomReactions } from '../features/room/components/RoomReactions';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { toast } from '../components/ui/Toast';
import { roomService } from '../services/room.service';
import { ROUTES } from '../constants/routes';
import type { Room, RoomMember, PlaybackState, RoomQueueItem } from '../types/room.types';

export const RoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const roomCode = (code || '').toUpperCase();

  const { user } = useAuthStore();
  const { pause: pauseSoloPlayer } = usePlayerStore();

  const {
    isInRoom,
    setRoom,
    updatePlaybackState,
    addMember,
    removeMember,
    setHost,
    setQueue,
    setWaitingForMember,
    resetRoom,
  } = useRoomStore();

  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [isJoining, setIsJoining] = useState(true);

  // Track whether we've already explicitly left so cleanup doesn't send a second ROOM_LEAVE
  const hasLeftRef = useRef(false);

  // Stop any solo audio when entering synchronized room
  useEffect(() => {
    pauseSoloPlayer();
  }, [pauseSoloPlayer]);

  // Hook for audio playback synchronization
  const {
    currentPositionMs,
    durationMs,
    isPlaying,
    localVolume,
    setLocalVolume,
    isLocalMuted,
    toggleLocalMute,
    togglePlay,
    handleSeek,
    handleUnlockAudio,
    needsUserInteraction,
    waitingForMember,
    canControl,
  } = useRoomAudioSync(roomCode);

  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Initial room fetch via REST + real-time Socket connection
  useEffect(() => {
    if (!roomCode) return;

    let isCancelled = false;

    // 1. Initial REST fetch for instant UI state
    roomService
      .getByCode(roomCode)
      .then((roomData) => {
        if (!isCancelled && roomData) {
          setRoom(roomData, userRef.current?.id || '');
          if (roomData.playbackState) updatePlaybackState(roomData.playbackState);
          setIsJoining(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          const msg =
            (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            'Room not found or no longer active';
          toast.error(msg);
          setIsJoining(false);
          navigate(ROUTES.HOME);
        }
      });

    // 2. Real-time socket setup
    const socket = socketService.connect();

    const handleRoomJoined = (data: {
      room: Room;
      playbackState: PlaybackState;
      members: RoomMember[];
    }) => {
      if (isCancelled) return;
      setRoom(data.room, userRef.current?.id || '');
      if (data.playbackState) updatePlaybackState(data.playbackState);
      setIsJoining(false);
    };

    const handleMemberJoined = (data: { member: RoomMember }) => {
      if (isCancelled) return;
      if (data.member && data.member.userId !== userRef.current?.id) {
        addMember(data.member);
        toast.info(`${data.member.username || 'A friend'} joined the session`);
      }
    };

    const handleMemberLeft = (data: { userId: string }) => {
      if (isCancelled) return;
      removeMember(data.userId);
    };

    const handleHostChanged = (data: { newHostId: string }) => {
      if (isCancelled) return;
      setHost(data.newHostId, userRef.current?.id || '');
      toast.info('Session host has transferred');
    };

    const handleRoomEnded = (data: { reason?: string }) => {
      if (isCancelled) return;
      toast.info(data.reason || 'Session ended');
      resetRoom();
      navigate(ROUTES.HOME);
    };

    const handlePlaybackState = (state: PlaybackState) => {
      if (isCancelled) return;
      updatePlaybackState(state);
    };

    const handleQueueUpdated = (data: { queue: RoomQueueItem[] }) => {
      if (isCancelled) return;
      setQueue(data.queue || []);
    };

    const handleRoomError = (data: { message?: string }) => {
      if (isCancelled) return;
      toast.error(data.message || 'Room error occurred');
      setIsJoining(false);
    };

    const handleWaitingForMember = (data: { username?: string; isWaiting: boolean }) => {
      if (isCancelled) return;
      setWaitingForMember(data.isWaiting ? data.username || 'A listener' : null);
    };

    socket.on(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
    socket.on(SOCKET_EVENTS.ROOM_MEMBER_JOINED, handleMemberJoined);
    socket.on(SOCKET_EVENTS.ROOM_MEMBER_LEFT, handleMemberLeft);
    socket.on(SOCKET_EVENTS.ROOM_HOST_CHANGED, handleHostChanged);
    socket.on(SOCKET_EVENTS.ROOM_ENDED, handleRoomEnded);
    socket.on(SOCKET_EVENTS.PLAYBACK_STATE, handlePlaybackState);
    socket.on(SOCKET_EVENTS.QUEUE_UPDATED, handleQueueUpdated);
    socket.on(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
    socket.on(SOCKET_EVENTS.ROOM_WAITING_FOR_MEMBER, handleWaitingForMember);

    // Join room via socket
    socketService.joinRoom(roomCode);

    return () => {
      isCancelled = true;
      socket.off(SOCKET_EVENTS.ROOM_JOINED, handleRoomJoined);
      socket.off(SOCKET_EVENTS.ROOM_MEMBER_JOINED, handleMemberJoined);
      socket.off(SOCKET_EVENTS.ROOM_MEMBER_LEFT, handleMemberLeft);
      socket.off(SOCKET_EVENTS.ROOM_HOST_CHANGED, handleHostChanged);
      socket.off(SOCKET_EVENTS.ROOM_ENDED, handleRoomEnded);
      socket.off(SOCKET_EVENTS.PLAYBACK_STATE, handlePlaybackState);
      socket.off(SOCKET_EVENTS.QUEUE_UPDATED, handleQueueUpdated);
      socket.off(SOCKET_EVENTS.ROOM_ERROR, handleRoomError);
      socket.off(SOCKET_EVENTS.ROOM_WAITING_FOR_MEMBER, handleWaitingForMember);
    };
  }, [
    roomCode,
    setRoom,
    updatePlaybackState,
    addMember,
    removeMember,
    setHost,
    setQueue,
    setWaitingForMember,
    resetRoom,
    navigate,
  ]);

  const handleConfirmLeave = useCallback(() => {
    hasLeftRef.current = true;
    socketService.leaveRoom(roomCode);
    resetRoom();
    setLeaveConfirmOpen(false);
    navigate(ROUTES.HOME);
  }, [roomCode, resetRoom, navigate]);

  return (
    <div className="min-h-screen w-full bg-[#09090b] text-zinc-100 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-6xl flex flex-col gap-5 animate-fade-in relative pb-10">

        {/* Connecting Loading Overlay */}
        {isJoining && !isInRoom && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-10 h-10 rounded-full border-2 border-zinc-400 border-t-transparent animate-spin" />
            <div>
              <h3 className="font-semibold text-base text-zinc-100">
                Connecting to Session {roomCode}...
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Calibrating sync engine and loading session state
              </p>
            </div>
          </div>
        )}

        {/* Top Room Navigation Bar */}
        <RoomHeader onLeaveRoom={() => setLeaveConfirmOpen(true)} />

        {/* Main Room Content Grid with Matching Proportions and Alignments */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
          {/* Left Column: iOS Style Music Player (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-7 flex flex-col">
            <RoomPlayer
              currentPositionMs={currentPositionMs}
              durationMs={durationMs}
              isPlaying={isPlaying}
              localVolume={localVolume}
              setLocalVolume={setLocalVolume}
              isLocalMuted={isLocalMuted}
              toggleLocalMute={toggleLocalMute}
              togglePlay={togglePlay}
              handleSeek={handleSeek}
              canControl={canControl}
              roomCode={roomCode}
              waitingForMember={waitingForMember}
              needsUserInteraction={needsUserInteraction}
              onUnlockAudio={handleUnlockAudio}
            />
          </div>

          {/* Right Column: Unified iOS Segmented Sidebar (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-5 flex flex-col">
            <RoomSidebar roomCode={roomCode} />
          </div>
        </div>

        {/* Floating Reaction Pill (Centered symmetrically below both cards) */}
        <div className="flex justify-center pt-2">
          <RoomReactions roomCode={roomCode} />
        </div>

        {/* Safety Leave Dialog */}
        <ConfirmDialog
          isOpen={leaveConfirmOpen}
          onClose={() => setLeaveConfirmOpen(false)}
          onConfirm={handleConfirmLeave}
          title="Leave Room?"
          description="Are you sure you want to leave this synchronized session? Your playback will stop."
          confirmLabel="Leave Session"
          isDestructive
        />
      </div>
    </div>
  );
};
