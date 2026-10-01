export interface FriendUser {
  id: string;
  username: string;
  avatarUrl?: string;
}

export interface Friend {
  id: string;
  user: FriendUser;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  sender: FriendUser;
  receiver: FriendUser;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}
