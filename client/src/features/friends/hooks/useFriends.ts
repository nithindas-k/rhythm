import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendService } from '../../../services/friend.service';
import { QUERY_KEYS } from '../../../constants/queryKeys';
import { toast } from '../../../components/ui/Toast';

export function useFriends() {
  const queryClient = useQueryClient();

  // Queries
  const friendsQuery = useQuery({
    queryKey: QUERY_KEYS.FRIENDS.LIST,
    queryFn: () => friendService.getFriends(),
  });

  const incomingRequestsQuery = useQuery({
    queryKey: QUERY_KEYS.FRIENDS.REQUESTS,
    queryFn: () => friendService.getIncomingRequests(),
  });

  const outgoingRequestsQuery = useQuery({
    queryKey: QUERY_KEYS.FRIENDS.SENT,
    queryFn: () => friendService.getOutgoingRequests(),
  });

  // Mutations
  const sendRequestMutation = useMutation({
    mutationFn: (userId: string) => friendService.sendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS.SENT });
      toast.success('Friend request sent!');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to send friend request';
      toast.error(msg);
    },
  });

  const acceptRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendService.acceptRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS.LIST });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS.REQUESTS });
      toast.success('Friend request accepted!');
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to accept request';
      toast.error(msg);
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendService.rejectRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS.REQUESTS });
      toast.info('Friend request rejected');
    },
    onError: () => toast.error('Failed to reject request'),
  });

  const cancelRequestMutation = useMutation({
    mutationFn: (requestId: string) => friendService.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS.SENT });
      toast.info('Request cancelled');
    },
    onError: () => toast.error('Failed to cancel request'),
  });

  const removeFriendMutation = useMutation({
    mutationFn: (friendshipId: string) => friendService.removeFriend(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FRIENDS.LIST });
      toast.info('Friend removed');
    },
    onError: () => toast.error('Failed to remove friend'),
  });

  return {
    friends: friendsQuery.data ?? [],
    isLoadingFriends: friendsQuery.isLoading,
    incomingRequests: incomingRequestsQuery.data ?? [],
    isLoadingIncoming: incomingRequestsQuery.isLoading,
    outgoingRequests: outgoingRequestsQuery.data ?? [],
    isLoadingOutgoing: outgoingRequestsQuery.isLoading,

    sendRequest: sendRequestMutation.mutate,
    isSendingRequest: sendRequestMutation.isPending,

    acceptRequest: acceptRequestMutation.mutate,
    isAccepting: acceptRequestMutation.isPending,

    rejectRequest: rejectRequestMutation.mutate,
    isRejecting: rejectRequestMutation.isPending,

    cancelRequest: cancelRequestMutation.mutate,
    isCancelling: cancelRequestMutation.isPending,

    removeFriend: removeFriendMutation.mutate,
    isRemoving: removeFriendMutation.isPending,

    refetchFriends: friendsQuery.refetch,
  };
}
