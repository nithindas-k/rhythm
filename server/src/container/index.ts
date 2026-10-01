/**
 * DI Container — tsyringe
 *
 * All tokens are Symbol-based to avoid magic strings.
 * Bindings are registered here, grouped by phase.
 * The container is bootstrapped in server.ts before the app starts.
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

import { TOKENS } from './tokens';
export { TOKENS };

// ─── Phase 3: Auth bindings ───────────────────────────────────────────────────

import { UserRepository } from '../repositories/user.repository';
import { FriendRepository } from '../repositories/friend.repository';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { FriendService } from '../services/friend.service';
import { AuthController } from '../controllers/auth.controller';
import { UserController } from '../controllers/user.controller';
import { FriendController } from '../controllers/friend.controller';

// Phase 3: Auth
container.registerSingleton(TOKENS.UserRepository as symbol, UserRepository);
container.registerSingleton(TOKENS.AuthService as symbol, AuthService);
container.registerSingleton(TOKENS.AuthController as symbol, AuthController);

// Phase 4: User, Theme, Friends
container.registerSingleton(TOKENS.FriendRepository as symbol, FriendRepository);
container.registerSingleton(TOKENS.UserService as symbol, UserService);
container.registerSingleton(TOKENS.FriendService as symbol, FriendService);
container.registerSingleton(TOKENS.UserController as symbol, UserController);
container.registerSingleton(TOKENS.FriendController as symbol, FriendController);

// ─── Phase 5: Songs, Playlists, Favorites ──────────────────────────────────────
import { SongRepository } from '../repositories/song.repository';
import { PlaylistRepository } from '../repositories/playlist.repository';
import { FavoriteRepository } from '../repositories/favorite.repository';
import { JioSaavnProvider } from '../services/providers/jiosaavn.provider';
import { SongService } from '../services/song.service';
import { PlaylistService } from '../services/playlist.service';
import { FavoriteService } from '../services/favorite.service';
import { SongController } from '../controllers/song.controller';
import { PlaylistController } from '../controllers/playlist.controller';
import { FavoriteController } from '../controllers/favorite.controller';

// Repositories
container.registerSingleton(TOKENS.SongRepository as symbol, SongRepository);
container.registerSingleton(TOKENS.PlaylistRepository as symbol, PlaylistRepository);
container.registerSingleton(TOKENS.FavoriteRepository as symbol, FavoriteRepository);

// Music Provider — JioSaavn
container.registerSingleton(TOKENS.MusicProvider as symbol, JioSaavnProvider);

// Services
container.registerSingleton(TOKENS.SongService as symbol, SongService);
container.registerSingleton(TOKENS.PlaylistService as symbol, PlaylistService);
container.registerSingleton(TOKENS.FavoriteService as symbol, FavoriteService);

// Controllers
container.registerSingleton(TOKENS.SongController as symbol, SongController);
container.registerSingleton(TOKENS.PlaylistController as symbol, PlaylistController);
container.registerSingleton(TOKENS.FavoriteController as symbol, FavoriteController);

// ─── Phase 6: Rooms & Sockets ─────────────────────────────────────────────────
import { RoomRepository } from '../repositories/room.repository';
import { RoomService } from '../services/room.service';
import { RoomController } from '../controllers/room.controller';

container.registerSingleton(TOKENS.RoomRepository as symbol, RoomRepository);
container.registerSingleton(TOKENS.RoomService as symbol, RoomService);
container.registerSingleton(TOKENS.RoomController as symbol, RoomController);

export { container };
