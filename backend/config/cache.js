import NodeCache from "node-cache";

const MAX_CACHE_SIZE = 100;

class CacheManager {
  constructor() {
    if (!CacheManager.instance) {
      this.cache = new NodeCache({
        stdTTL: 60,
        checkperiod: 120,
        useClones: false,
      });
      this.cache.on("expired", (key) => {
        console.log(`⌛ Cache expired: ${key}`);
      });
      CacheManager.instance = this;
    }
    return CacheManager.instance;
  }

  set(key, value, ttl = 60) {
    const keys = this.cache.keys();
    if (keys.length >= MAX_CACHE_SIZE) {
      this.cache.del(keys[0]);
      console.log(`⚠️ Cache full, evicted: ${keys[0]}`);
    }
    return this.cache.set(key, value, ttl);
  }

  get(key) {
    return this.cache.get(key);
  }

  del(key) {
    return this.cache.del(key);
  }

  flush() {
    this.cache.flushAll();
  }

  stats() {
    return this.cache.getStats();
  }

  has(key) {
    return this.cache.has(key);
  }
}

const cacheInstance = new CacheManager();
Object.freeze(cacheInstance);

export default cacheInstance;
