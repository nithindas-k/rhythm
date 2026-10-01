import React from 'react';
import { Check, X } from 'lucide-react';
import { useFriends } from '../hooks/useFriends';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';

export const FriendRequests: React.FC = () => {
  const {
    incomingRequests,
    outgoingRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    isAccepting,
    isRejecting,
    isCancelling,
  } = useFriends();

  if (incomingRequests.length === 0 && outgoingRequests.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Incoming Requests */}
      {incomingRequests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-2">
            Friend Requests
            <span className="w-5 h-5 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)] text-[10px] font-black flex items-center justify-center">
              {incomingRequests.length}
            </span>
          </h3>

          <div className="flex flex-col gap-2">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 rounded-2xl glass-panel border border-[var(--border)]"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={req.sender.avatarUrl}
                    name={req.sender.username}
                    size="sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--foreground)]">
                      {req.sender.username}
                    </h4>
                    <p className="text-xs text-[var(--foreground-dim)]">
                      Wants to be friends
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => acceptRequest(req.id)}
                    disabled={isAccepting}
                    className="p-2 h-auto"
                    title="Accept"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => rejectRequest(req.id)}
                    disabled={isRejecting}
                    className="p-2 h-auto text-[var(--foreground-dim)] hover:text-red-400"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outgoing Requests */}
      {outgoingRequests.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
            Sent Requests ({outgoingRequests.length})
          </h3>

          <div className="flex flex-col gap-2">
            {outgoingRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3.5 rounded-2xl glass-panel border border-[var(--border)] opacity-80"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={req.receiver.avatarUrl}
                    name={req.receiver.username}
                    size="sm"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-[var(--foreground)]">
                      {req.receiver.username}
                    </h4>
                    <p className="text-xs text-[var(--foreground-dim)]">
                      Request pending
                    </p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cancelRequest(req.id)}
                  disabled={isCancelling}
                  className="text-xs py-1 px-3"
                >
                  Cancel
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
