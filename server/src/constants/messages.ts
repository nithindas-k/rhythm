export const MESSAGES = {
  // Generic
  SUCCESS: 'Success',
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation failed',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  TOO_MANY_REQUESTS: 'Too many requests, please try again later',

  // Auth
  AUTH: {
    REGISTERED: 'Account created successfully',
    LOGGED_IN: 'Logged in successfully',
    LOGGED_OUT: 'Logged out successfully',
    REFRESHED: 'Access token refreshed',
    INVALID_CREDENTIALS: 'Invalid username/email or password',
    EMAIL_TAKEN: 'Email is already in use',
    USERNAME_TAKEN: 'Username is already taken',
    INVALID_TOKEN: 'Invalid or expired token',
    GOOGLE_AUTH_FAILED: 'Google authentication failed',
  },

  // User
  USER: {
    NOT_FOUND: 'User not found',
    PROFILE_UPDATED: 'Profile updated successfully',
    THEME_UPDATED: 'Theme preference updated',
    ACCOUNT_DELETED: 'Account deleted successfully',
  },

  // Song
  SONG: {
    NOT_FOUND: 'Song not found',
    PLAY_COUNTED: 'Play count updated',
  },

  // Playlist
  PLAYLIST: {
    NOT_FOUND: 'Playlist not found',
    CREATED: 'Playlist created successfully',
    UPDATED: 'Playlist updated successfully',
    DELETED: 'Playlist deleted successfully',
    TRACK_ADDED: 'Song added to playlist',
    TRACK_REMOVED: 'Song removed from playlist',
    TRACKS_REORDERED: 'Playlist reordered',
    DUPLICATE_TRACK: 'Song is already in the playlist',
    NAME_TAKEN: 'A playlist with this name already exists',
  },

  // Favorites
  FAVORITE: {
    ADDED: 'Added to favorites',
    REMOVED: 'Removed from favorites',
    ALREADY_EXISTS: 'Song is already in favorites',
    NOT_FOUND: 'Song is not in your favorites',
  },

  // Friends
  FRIEND: {
    NOT_FOUND: 'Friend relationship not found',
    REQUEST_SENT: 'Friend request sent',
    REQUEST_ACCEPTED: 'Friend request accepted',
    REQUEST_REJECTED: 'Friend request rejected',
    REQUEST_CANCELLED: 'Friend request cancelled',
    REMOVED: 'Friend removed',
    ALREADY_FRIENDS: 'You are already friends',
    REQUEST_ALREADY_SENT: 'Friend request already sent',
    CANNOT_ADD_SELF: 'You cannot send a friend request to yourself',
  },

  // Room
  ROOM: {
    NOT_FOUND: 'Room not found',
    CREATED: 'Room created successfully',
    ENDED: 'Room ended',
    INVITE_SENT: 'Invite sent',
    CONTROL_GRANTED: 'Control granted',
    CONTROL_REVOKED: 'Control revoked',
    HOST_TRANSFERRED: 'Host transferred successfully',
    NOT_HOST: 'Only the host can perform this action',
    MEMBER_NOT_FOUND: 'Member not found in room',
    COUPLES_FULL: 'Couples room can only have 2 members',
  },

  // Health
  HEALTH: {
    OK: 'All systems operational',
    DEGRADED: 'Service is degraded',
  },
} as const;
