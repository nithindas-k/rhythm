import mongoose from 'mongoose';
import { env } from '../config/env';
import { Song } from '../models/Song.model';
import { logger } from './logger';

const SEED_SONGS = [
  {
    title: 'Midnight City Lights',
    artist: 'Lofi Dreamer',
    album: 'Urban Nights',
    genre: 'Lo-Fi',
    durationMs: 185000,
    coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-1',
    playCount: 1420,
  },
  {
    title: 'Summer Breeze',
    artist: 'Acoustic Vibes',
    album: 'Sunny Days',
    genre: 'Acoustic',
    durationMs: 210000,
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-2',
    playCount: 980,
  },
  {
    title: 'Neon Horizon',
    artist: 'Synthwave Pulse',
    album: 'Retro Future',
    genre: 'Electronic',
    durationMs: 240000,
    coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-3',
    playCount: 2310,
  },
  {
    title: 'Chasing Shadows',
    artist: 'The Velvet Echoes',
    album: 'Midnight Whispers',
    genre: 'Indie Rock',
    durationMs: 195000,
    coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-4',
    playCount: 760,
  },
  {
    title: 'Starlight Reverie',
    artist: 'Astral Harmony',
    album: 'Cosmic Journey',
    genre: 'Ambient',
    durationMs: 230000,
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-5',
    playCount: 1650,
  },
  {
    title: 'Golden Hour Groove',
    artist: 'Funk Collective',
    album: 'Soulful Waves',
    genre: 'Funk',
    durationMs: 205000,
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-6',
    playCount: 1890,
  },
  {
    title: 'Rainy Cafe',
    artist: 'Coffee Beats',
    album: 'Study Session',
    genre: 'Lo-Fi',
    durationMs: 175000,
    coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-7',
    playCount: 3120,
  },
  {
    title: 'Cybernetic Pulse',
    artist: 'Future Bass Lab',
    album: 'Binary Dreams',
    genre: 'Electronic',
    durationMs: 220000,
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&auto=format&fit=crop&q=80',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    provider: 's3' as const,
    providerId: 'seed-song-8',
    playCount: 890,
  },
];

async function seed() {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('Connected to MongoDB for seeding');

    for (const songData of SEED_SONGS) {
      await Song.findOneAndUpdate(
        { provider: songData.provider, providerId: songData.providerId },
        { $set: songData },
        { upsert: true, new: true }
      );
    }

    logger.info(`Seeded ${SEED_SONGS.length} sample songs successfully`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, 'Song seeding failed');
    process.exit(1);
  }
}

seed();
