import { describe, expect, test, beforeEach } from 'bun:test';
import { SimpleCache } from '../src/utils/cache';

describe('SimpleCache', () => {
  let cache: SimpleCache;

  beforeEach(() => {
    cache = new SimpleCache();
  });

  test('set and get should work', () => {
    cache.set('key1', 'value1', 60);
    expect(cache.get('key1')).toBe('value1');
  });

  test('get should return null for non-existent key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('get should return null for expired key', async () => {
    cache.set('expired', 'value', -1); // Instant expiry
    expect(cache.get('expired')).toBeNull();
  });

  test('delete should remove key', () => {
    cache.set('key1', 'value1', 60);
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  test('deleteByPattern should remove keys matching regex', () => {
    cache.set('keep_1', 'val', 60);
    cache.set('delete_1', 'val', 60);
    cache.set('delete_2', 'val', 60);
    cache.set('keep_2', 'val', 60);

    cache.deleteByPattern(/^delete_/);

    expect(cache.get('keep_1')).toBe('val');
    expect(cache.get('keep_2')).toBe('val');
    expect(cache.get('delete_1')).toBeNull();
    expect(cache.get('delete_2')).toBeNull();
  });

  test('deleteByPattern should handle complex patterns', () => {
    cache.set('user_123_stats', 'val', 60);
    cache.set('user_456_stats', 'val', 60);
    cache.set('guild_123_stats', 'val', 60);

    // Delete all user stats
    cache.deleteByPattern(/^user_\d+_stats$/);

    expect(cache.get('user_123_stats')).toBeNull();
    expect(cache.get('user_456_stats')).toBeNull();
    expect(cache.get('guild_123_stats')).toBe('val');
  });

  test('getOrFetch should return cached value', async () => {
    cache.set('key', 'cached', 60);
    const fetchFn = async () => 'fetched';
    const result = await cache.getOrFetch('key', fetchFn, 60);
    expect(result).toBe('cached');
  });

  test('getOrFetch should fetch and cache if missing', async () => {
    const fetchFn = async () => 'fetched';
    const result = await cache.getOrFetch('new_key', fetchFn, 60);
    expect(result).toBe('fetched');
    expect(cache.get('new_key')).toBe('fetched');
  });

  test('getOrFetch should coalesce requests', async () => {
    let callCount = 0;
    const fetchFn = async () => {
      callCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'fetched';
    };

    const p1 = cache.getOrFetch('coalesce', fetchFn, 60);
    const p2 = cache.getOrFetch('coalesce', fetchFn, 60);

    const [r1, r2] = await Promise.all([p1, p2]);

    expect(r1).toBe('fetched');
    expect(r2).toBe('fetched');
    expect(callCount).toBe(1);
  });
});
