import React, { useState } from 'react';
import { UserMinus, Radio } from 'lucide-react';
import type { Friend } from '../../../types/friend.types';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { ConfirmDialog } from '../../../components/common/ConfirmDialog';

export interface FriendCardProps {
  friend: Friend;
  onRemove: (id: string) => void;
  onInvite?: (userId: string) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  onRemove,
  onInvite,
}) => {
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between p-4 rounded-2xl glass-panel border border-[var(--border)] hover:border-[var(--border-hover)] transition-all duration-200 group">
        <div className="flex items-center gap-3.5">
          <Avatar src={friend.user.avatarUrl} name={friend.user.username} size="md" />
          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
              {friend.user.username}
            </h4>
            <p className="text-xs text-[var(--foreground-dim)]">
              Friends since {new Date(friend.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onInvite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onInvite(friend.user.id)}
              className="gap-1.5 text-xs font-semibold hover:border-[var(--primary)]"
            >
              <Radio className="w-3.5 h-3.5 text-[var(--primary)]" />
              Invite
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowRemoveConfirm(true)}
            className="text-[var(--foreground-dim)] hover:text-red-400 hover:bg-red-500/10"
            title="Remove Friend"
          >
            <UserMinus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showRemoveConfirm}
        onClose={() => setShowRemoveConfirm(false)}
        onConfirm={() => {
          setShowRemoveConfirm(false);
          onRemove(friend.id);
        }}
        title={`Remove ${friend.user.username}?`}
        description="Are you sure you want to remove this user from your friends list? You will need to send a new friend request to reconnect."
        confirmLabel="Remove"
        isDestructive
      />
    </>
  );
};
