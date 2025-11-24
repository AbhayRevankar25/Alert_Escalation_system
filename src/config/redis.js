const Redis = require('ioredis');

class RedisConfig {
  constructor() {
    try {
      this.redis = new Redis({
        host: 'localhost',
        port: 6379,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        // Memurai uses same default port as Redis
      });
      
      this.redis.on('connect', () => {
        console.log('✅ Connected to Memurai/Redis');
      });
      
      this.redis.on('error', (err) => {
        console.error('❌ Memurai/Redis connection error:', err);
      });
      
      this.redis.on('ready', () => {
        console.log('✅ Memurai/Redis is ready');
      });
      
    } catch (error) {
      console.error('❌ Failed to create Redis client:', error);
      throw error;
    }
  }

  getClient() {
    return this.redis;
  }

  // Test connection and commands
  async testConnection() {
    try {
      await this.redis.ping();
      console.log('✅ Redis connection test passed');
      return true;
    } catch (error) {
      console.error('❌ Redis connection test failed:', error);
      return false;
    }
  }
}

module.exports = new RedisConfig();