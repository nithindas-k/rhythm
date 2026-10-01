import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, UserPlus, Loader2 } from 'lucide-react';
import { useDebounce } from '../../../hooks/useDebounce';
import { friendService } from '../../../services/friend.service';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Avatar } from '../../../components/ui/Avatar';
import { useFriends } from '../hooks/useFriends';

export const FriendSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 350);
  const { sendRequest, isSendingRequest, friends, outgoingRequests } = useFriends();

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ['users', 'search', debouncedQuery],
    queryFn: () => friendService.searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length > 1,
  });

  const existingFriendIds = new Set(friends.map((f) => f.user.id));
  const pendingSentIds = new Set(outgoingRequests.map((r) => r.receiver.id));

  return (
    <div className="flex flex-col gap-4">
      <Input
        placeholder="Search users by username or email..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        icon={<Search className="w-4 h-4" />}
      />

      {/* Results Dropdown / Panel */}
      {debouncedQuery.trim().length > 1 && (
        <div className="flex flex-col gap-2 p-2 rounded-2xl glass-panel border border-[var(--border)] max-h-72 overflow-y-auto animate-in fade-in duration-200">
          {isLoading ? (
            <div className="flex items-center justify-center p-6 text-[var(--foreground-muted)] text-xs gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
              Searching users...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--foreground-muted)]">
              No users found matching &quot;{debouncedQuery}&quot;
            </div>
          ) : (
            searchResults.map((user) => {
              const isFriend = existingFriendIds.has(user.id);
              const isPending = pendingSentIds.has(user.id);

              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                    <span className="text-sm font-semibold text-[var(--foreground)]">
                      {user.username}
                    </span>
                  </div>

                  {isFriend ? (
                    <span className="text-xs font-semibold text-[var(--primary)] px-3 py-1 rounded-full bg-[var(--primary)]/10">
                      Friend
                    </span>
                  ) : isPending ? (
                    <span className="text-xs font-semibold text-[var(--foreground-muted)] px-3 py-1 rounded-full bg-[var(--surface-elevated)] border border-[var(--border)]">
                      Requested
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => sendRequest(user.id)}
                      disabled={isSendingRequest}
                      className="gap-1.5 text-xs py-1.5 px-3"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Add
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
