import { SongDto } from '../../dtos/song/song.dto';
import { SongSearchDto } from '../../validators/song.validator';

export interface ISongService {
  search(dto: SongSearchDto): Promise<{ songs: SongDto[]; nextCursor: string | null; hasNextPage: boolean }>;
  getById(id: string): Promise<SongDto>;
  getTrending(limit: number): Promise<SongDto[]>;
  recordPlay(id: string): Promise<void>;
}
