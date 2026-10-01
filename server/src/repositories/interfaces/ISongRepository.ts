import { ISong } from '../../models/Song.model';

export interface SongQueryOptions {
  q?: string;
  genre?: string;
  sort?: 'trending' | 'newest' | 'oldest';
  cursor?: string;
  limit: number;
}

export interface ISongRepository {
  findById(id: string): Promise<ISong | null>;
  search(options: SongQueryOptions): Promise<ISong[]>;
  findTrending(limit: number): Promise<ISong[]>;
  incrementPlayCount(id: string): Promise<void>;
  findByProviderId(provider: string, providerId: string): Promise<ISong | null>;
  upsertByProvider(data: Partial<ISong>): Promise<ISong>;
  create(data: Partial<ISong>): Promise<ISong>;
  findManyByIds(ids: string[]): Promise<ISong[]>;
  findManyByProviderIds(providerIds: string[]): Promise<ISong[]>;
}
