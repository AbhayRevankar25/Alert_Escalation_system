const redis = require('../config/redis').getClient();

class RedisHelpers {
  // Safe set operations
  async sadd(key, ...members) {
    try {
      return await redis.sadd(key, ...members);
    } catch (error) {
      console.error(`Error in sadd for key ${key}:`, error);
      return 0;
    }
  }

  async smembers(key) {
    try {
      return await redis.smembers(key);
    } catch (error) {
      console.error(`Error in smembers for key ${key}:`, error);
      return [];
    }
  }

  async srem(key, ...members) {
    try {
      return await redis.srem(key, ...members);
    } catch (error) {
      console.error(`Error in srem for key ${key}:`, error);
      return 0;
    }
  }

  async scard(key) {
    try {
      return await redis.scard(key);
    } catch (error) {
      console.error(`Error in scard for key ${key}:`, error);
      return 0;
    }
  }

  // Safe hash operations
  async hset(key, field, value) {
    try {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      return await redis.hset(key, field, value);
    } catch (error) {
      console.error(`Error in hset for key ${key}, field ${field}:`, error);
      return 0;
    }
  }

  async hsetMultiple(key, data) {
    try {
      const flatData = [];
      for (const [field, value] of Object.entries(data)) {
        flatData.push(field);
        flatData.push(typeof value === 'object' ? JSON.stringify(value) : value.toString());
      }
      return await redis.hset(key, ...flatData);
    } catch (error) {
      console.error(`Error in hsetMultiple for key ${key}:`, error);
      return 0;
    }
  }

  async hgetall(key) {
    try {
      return await redis.hgetall(key);
    } catch (error) {
      console.error(`Error in hgetall for key ${key}:`, error);
      return {};
    }
  }

  // Safe sorted set operations
  async zadd(key, ...args) {
    try {
      return await redis.zadd(key, ...args);
    } catch (error) {
      console.error(`Error in zadd for key ${key}:`, error);
      return 0;
    }
  }

  async zrangebyscore(key, min, max) {
    try {
      return await redis.zrangebyscore(key, min, max);
    } catch (error) {
      console.error(`Error in zrangebyscore for key ${key}:`, error);
      return [];
    }
  }

  async zremrangebyscore(key, min, max) {
    try {
      return await redis.zremrangebyscore(key, min, max);
    } catch (error) {
      console.error(`Error in zremrangebyscore for key ${key}:`, error);
      return 0;
    }
  }

  // Key operations
  async keys(pattern) {
    try {
      return await redis.keys(pattern);
    } catch (error) {
      console.error(`Error in keys for pattern ${pattern}:`, error);
      return [];
    }
  }

  // Test if Redis commands are working
  async testRedisCommands() {
    const testKey = 'test:connection';
    try {
      await this.sadd(testKey, 'test_value');
      const members = await this.smembers(testKey);
      await this.srem(testKey, 'test_value');
      console.log('✅ Redis commands test passed');
      return true;
    } catch (error) {
      console.error('❌ Redis commands test failed:', error);
      return false;
    }
  }

  // Add these methods to the existing RedisHelpers class

    // String operations
    async setex(key, seconds, value) {
    try {
        return await redis.setex(key, seconds, value);
    } catch (error) {
        console.error(`Error in setex for key ${key}:`, error);
        return null;
    }
    }

    async get(key) {
    try {
        return await redis.get(key);
    } catch (error) {
        console.error(`Error in get for key ${key}:`, error);
        return null;
    }
    }

    async incr(key) {
    try {
        return await redis.incr(key);
    } catch (error) {
        console.error(`Error in incr for key ${key}:`, error);
        return 0;
    }
    }

    async del(key) {
    try {
        return await redis.del(key);
    } catch (error) {
        console.error(`Error in del for key ${key}:`, error);
        return 0;
    }
    }
}

module.exports = new RedisHelpers();