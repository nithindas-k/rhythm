import { describe, it, expect } from 'vitest';
import { paginate, parseLimit, buildCursorFilter } from '../../src/utils/paginationHelper';

describe('paginationHelper', () => {
  describe('parseLimit', () => {
    it('should clamp limit between 1 and MAX_LIMIT', () => {
      expect(parseLimit(0)).toBe(20);
      expect(parseLimit(-5)).toBe(20);
      expect(parseLimit(10)).toBe(10);
      expect(parseLimit(500)).toBe(100);
      expect(parseLimit('25')).toBe(25);
    });
  });

  describe('paginate', () => {
    it('should trim items to requested limit and return nextCursor when hasNextPage', () => {
      const items = [
        { _id: '1', title: 'Track 1' },
        { _id: '2', title: 'Track 2' },
        { _id: '3', title: 'Track 3' },
      ];

      const result = paginate(items, 2, '_id');
      expect(result.items.length).toBe(2);
      expect(result.hasNextPage).toBe(true);
      expect(result.nextCursor).toBe('2');
    });

    it('should return all items and null nextCursor when no next page', () => {
      const items = [
        { _id: '1', title: 'Track 1' },
        { _id: '2', title: 'Track 2' },
      ];

      const result = paginate(items, 5, '_id');
      expect(result.items.length).toBe(2);
      expect(result.hasNextPage).toBe(false);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe('buildCursorFilter', () => {
    it('should return empty filter if cursor not provided', () => {
      expect(buildCursorFilter()).toEqual({});
    });

    it('should return $lt query for descending sort', () => {
      const filter = buildCursorFilter('cursor123', '_id', -1);
      expect(filter).toEqual({ _id: { $lt: 'cursor123' } });
    });
  });
});
