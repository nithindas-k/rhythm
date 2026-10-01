export const TOKENS = {
  // Controllers
  AuthController: Symbol('AuthController'),
  UserController: Symbol('UserController'),
  SongController: Symbol('SongController'),
  PlaylistController: Symbol('PlaylistController'),
  FavoriteController: Symbol('FavoriteController'),
  FriendController: Symbol('FriendController'),
  RoomController: Symbol('RoomController'),

  // Services
  AuthService: Symbol('AuthService'),
  UserService: Symbol('UserService'),
  SongService: Symbol('SongService'),
  PlaylistService: Symbol('PlaylistService'),
  FavoriteService: Symbol('FavoriteService'),
  FriendService: Symbol('FriendService'),
  RoomService: Symbol('RoomService'),
  CacheService: Symbol('CacheService'),
  MusicProvider: Symbol('MusicProvider'),

  // Repositories
  UserRepository: Symbol('UserRepository'),
  SongRepository: Symbol('SongRepository'),
  PlaylistRepository: Symbol('PlaylistRepository'),
  FavoriteRepository: Symbol('FavoriteRepository'),
  FriendRepository: Symbol('FriendRepository'),
  RoomRepository: Symbol('RoomRepository'),
} as const;
