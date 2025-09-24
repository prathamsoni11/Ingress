/**
 * Cache Service
 * Enterprise-grade in-memory cache for improving API performance
 *
 * Features:
 * - Automatic expiration with TTL
 * - Memory usage monitoring
 * - Cache statistics and analytics
 * - Configurable cleanup intervals
 *
 * @author Pratham Soni
 * @version 1.0.0
 */

// In-memory cache storage
const cache = {};

// Cache configuration
const CACHE_CONFIG = {
  DEFAULT_TTL: 24 * 60 * 60, // 24 hours in seconds
  CLEANUP_INTERVAL: 60 * 60 * 1000, // 1 hour in milliseconds
  MAX_ENTRIES: 10000, // Maximum cache entries
};

const cacheService = {
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined
   */
  get: (key) => {
    const item = cache[key];
    if (!item) return undefined;

    // Check if expired
    if (Date.now() > item.expiry) {
      delete cache[key];
      return undefined;
    }

    console.log(`[Cache] Hit for key: ${key}`);
    return item.value;
  },

  /**
   * Set value in cache with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 24 hours)
   */
  set: (key, value, ttlSeconds = CACHE_CONFIG.DEFAULT_TTL) => {
    // Check cache size limit
    if (Object.keys(cache).length >= CACHE_CONFIG.MAX_ENTRIES) {
      console.log("[Cache] Maximum entries reached, clearing expired entries");
      cacheService.cleanupExpired();
    }
    const expiry = Date.now() + ttlSeconds * 1000;
    cache[key] = {
      value: value,
      expiry: expiry,
      createdAt: new Date().toISOString(),
    };

    console.log(`[Cache] Set key: ${key}, expires in ${ttlSeconds}s`);

    // Auto-cleanup expired items
    setTimeout(() => {
      if (cache[key] && Date.now() > cache[key].expiry) {
        delete cache[key];
        console.log(`[Cache] Expired and removed key: ${key}`);
      }
    }, ttlSeconds * 1000);
  },

  /**
   * Delete specific key from cache
   * @param {string} key - Cache key to delete
   */
  delete: (key) => {
    if (cache[key]) {
      delete cache[key];
      console.log(`[Cache] Deleted key: ${key}`);
      return true;
    }
    return false;
  },

  /**
   * Clear all cache entries
   */
  clear: () => {
    const keyCount = Object.keys(cache).length;
    Object.keys(cache).forEach((key) => delete cache[key]);
    console.log(`[Cache] Cleared ${keyCount} entries`);
  },

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats: () => {
    const entries = Object.entries(cache);
    const now = Date.now();

    return {
      totalEntries: entries.length,
      activeEntries: entries.filter(([, item]) => now <= item.expiry).length,
      expiredEntries: entries.filter(([, item]) => now > item.expiry).length,
      memoryUsage: JSON.stringify(cache).length + " bytes",
      entries: entries.map(([key, item]) => ({
        key,
        expired: now > item.expiry,
        createdAt: item.createdAt,
        expiresAt: new Date(item.expiry).toISOString(),
      })),
    };
  },

  /**
   * Check if key exists in cache (and not expired)
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and not expired
   */
  has: (key) => {
    const item = cache[key];
    if (!item) return false;

    if (Date.now() > item.expiry) {
      delete cache[key];
      return false;
    }

    return true;
  },

  /**
   * Get or set pattern - if key exists return it, otherwise compute and cache
   * @param {string} key - Cache key
   * @param {function} computeFn - Function to compute value if not cached
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {any} Cached or computed value
   */
  getOrSet: async (key, computeFn, ttlSeconds = CACHE_CONFIG.DEFAULT_TTL) => {
    const cached = cacheService.get(key);
    if (cached !== undefined) {
      return cached;
    }

    console.log(`[Cache] Miss for key: ${key}, computing...`);
    const value = await computeFn();
    cacheService.set(key, value, ttlSeconds);
    return value;
  },

  /**
   * Clean up expired entries manually
   * @returns {number} Number of entries cleaned up
   */
  cleanupExpired: () => {
    const now = Date.now();
    let cleanedCount = 0;

    Object.keys(cache).forEach((key) => {
      if (cache[key] && now > cache[key].expiry) {
        delete cache[key];
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.log(`[Cache] Cleaned up ${cleanedCount} expired entries`);
    }

    return cleanedCount;
  },
};

module.exports = cacheService;
