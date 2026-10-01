import { IFriend } from '../../models/Friend.model';
import { UserDto } from '../auth/auth.dto';

export interface FriendRequestDto {
  id: string;
  sender: Pick<UserDto, 'id' | 'username' | 'avatarUrl'>;
  receiver: Pick<UserDto, 'id' | 'username' | 'avatarUrl'>;
  status: string;
  createdAt: Date;
}

export interface FriendDto {
  id: string;
  user: Pick<UserDto, 'id' | 'username' | 'avatarUrl'>;
  since: Date;
}
