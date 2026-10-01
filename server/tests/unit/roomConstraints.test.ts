import { describe, it, expect } from 'vitest';
import { ROOM_LIMITS } from '../../src/constants/limits';
import { createRoomSchema, socketJoinRoomSchema } from '../../src/validators/room.validator';

describe('Room Constraints & Validation', () => {
  it('should enforce couples mode limit of 2 and party mode of 50', () => {
    expect(ROOM_LIMITS.COUPLES_MAX_MEMBERS).toBe(2);
    expect(ROOM_LIMITS.PARTY_MAX_MEMBERS).toBe(50);
    expect(ROOM_LIMITS.CODE_LENGTH).toBe(6);
  });

  it('should validate room creation input schema', () => {
    const validCouples = createRoomSchema.safeParse({ type: 'couples' });
    expect(validCouples.success).toBe(true);

    const validParty = createRoomSchema.safeParse({ type: 'party' });
    expect(validParty.success).toBe(true);

    const invalidType = createRoomSchema.safeParse({ type: 'solo' });
    expect(invalidType.success).toBe(false);
  });

  it('should validate 6-character room code on socket join', () => {
    const valid = socketJoinRoomSchema.safeParse({ roomCode: 'ABC123' });
    expect(valid.success).toBe(true);

    const tooShort = socketJoinRoomSchema.safeParse({ roomCode: 'AB12' });
    expect(tooShort.success).toBe(false);

    const tooLong = socketJoinRoomSchema.safeParse({ roomCode: 'ABC1234' });
    expect(tooLong.success).toBe(false);
  });
});
