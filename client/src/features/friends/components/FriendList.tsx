import React from 'react';
import { Users } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { FriendCard } from './FriendCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';

export interface FriendListProps {
  onInviteToRoom?: (userId: string) => void;
}

export const FriendList: React.FC<FriendListProps> = ({ onInviteToRoom }) => {
  const { friends, isLoadingFriends, removeFriend } = useFriends();

  if (isLoadingFriends) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-[var(--border)]"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="w-32 h-4" />
                <Skeleton className="w-20 h-3" />
              </div>
            </div>
            <Skeleton className="w-16 h-8 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-7 h-7 text-[var(--foreground-muted)]" />}
        title="No friends yet"
        description="Search for usernames above and send a friend request to start listening together!"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {friends.map((friend) => (
        <FriendCard
          key={friend.id}
          friend={friend}
          onRemove={removeFriend}
          onInvite={onInviteToRoom}
        />
      ))}
    </div>
  );
};
