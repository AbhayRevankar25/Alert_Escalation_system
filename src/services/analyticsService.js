const redisHelpers = require('../utils/redisHelpers');
const alertService = require('./alertService');

class AnalyticsService {
  constructor() {
    this.DAILY_STATS_KEY = 'analytics:daily:';
  }

  // Record daily statistics
  async recordDailyStats() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const stats = await alertService.getAlertStats();
      
      const dailyData = {
        date: today,
        total: stats.total,
        critical: stats.bySeverity.CRITICAL,
        warning: stats.bySeverity.WARNING,
        info: stats.bySeverity.INFO,
        escalated: stats.byStatus.ESCALATED,
        autoClosed: stats.byStatus.AUTO_CLOSED,
        resolved: stats.byStatus.RESOLVED,
        timestamp: new Date().toISOString()
      };

      await redisHelpers.hsetMultiple(`${this.DAILY_STATS_KEY}${today}`, dailyData);
      
      // Keep only last 30 days of data
      await this.cleanupOldStats();
      
      return dailyData;
    } catch (error) {
      console.error('Error recording daily stats:', error);
    }
  }

  async cleanupOldStats() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allStatsKeys = await redisHelpers.keys(`${this.DAILY_STATS_KEY}*`);
      
      for (const key of allStatsKeys) {
        const dateStr = key.replace(this.DAILY_STATS_KEY, '');
        const keyDate = new Date(dateStr);
        
        if (keyDate < thirtyDaysAgo) {
          await redisHelpers.del(key);
        }
      }
    } catch (error) {
      console.error('Error cleaning up old stats:', error);
    }
  }

  // Get time series data for trends
  async getTimeSeriesData(days = 7) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const timeSeries = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dailyData = await redisHelpers.hgetall(`${this.DAILY_STATS_KEY}${dateStr}`);
        
        if (Object.keys(dailyData).length > 0) {
          timeSeries.push({
            date: dateStr,
            total: parseInt(dailyData.total) || 0,
            critical: parseInt(dailyData.critical) || 0,
            warning: parseInt(dailyData.warning) || 0,
            info: parseInt(dailyData.info) || 0,
            escalated: parseInt(dailyData.escalated) || 0,
            autoClosed: parseInt(dailyData.autoClosed) || 0,
            resolved: parseInt(dailyData.resolved) || 0
          });
        } else {
          // Add zero data for missing days
          timeSeries.push({
            date: dateStr,
            total: 0,
            critical: 0,
            warning: 0,
            info: 0,
            escalated: 0,
            autoClosed: 0,
            resolved: 0
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return timeSeries;
    } catch (error) {
      console.error('Error getting time series data:', error);
      return [];
    }
  }

  // Get alert trends and insights
  async getAlertInsights() {
    try {
      const timeSeries = await this.getTimeSeriesData(7);
      const currentStats = await alertService.getAlertStats();
      
      if (timeSeries.length < 2) {
        return {
          trend: 'stable',
          message: 'Insufficient data for trend analysis'
        };
      }

      const today = timeSeries[timeSeries.length - 1];
      const yesterday = timeSeries[timeSeries.length - 2];

      const totalChange = today.total - yesterday.total;
      const criticalChange = today.critical - yesterday.critical;
      
      let trend = 'stable';
      if (totalChange > 5) trend = 'increasing';
      if (totalChange < -5) trend = 'decreasing';

      return {
        trend,
        totalChange,
        criticalChange,
        currentTotal: currentStats.total,
        currentCritical: currentStats.bySeverity.CRITICAL,
        period: '7 days'
      };
    } catch (error) {
      console.error('Error getting alert insights:', error);
      return { trend: 'unknown', message: 'Error analyzing trends' };
    }
  }

  // Add this method to AnalyticsService class
    async generateSampleTrendData() {
        try {
            console.log('📊 Generating sample trend data for dashboard...');
            
            const today = new Date();
            const timeSeries = [];
            
            // Generate 7 days of sample data
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                
                // Random but realistic data
                const total = Math.floor(Math.random() * 50) + 10;
                const critical = Math.floor(total * 0.3);
                const warning = Math.floor(total * 0.4);
                const info = total - critical - warning;
                
                const dailyData = {
                    date: dateStr,
                    total: total,
                    critical: critical,
                    warning: warning,
                    info: info,
                    escalated: Math.floor(critical * 0.7),
                    autoClosed: Math.floor(total * 0.2),
                    resolved: Math.floor(total * 0.3)
                };
                
                await redisHelpers.hsetMultiple(`${this.DAILY_STATS_KEY}${dateStr}`, dailyData);
                timeSeries.push(dailyData);
            }
            
            console.log('✅ Sample trend data generated successfully');
            return timeSeries;
        } catch (error) {
            console.error('Error generating sample trend data:', error);
            return [];
        }
    }
}

module.exports = new AnalyticsService();