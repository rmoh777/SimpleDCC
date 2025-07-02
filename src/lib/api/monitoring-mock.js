// Mock API service for development - will be replaced in A5
export class MonitoringMockAPI {
  constructor() {
    this.mockData = {
      systemHealth: 'healthy',
      lastUpdate: Date.now()
    };
  }
  
  async getMonitoringStats() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      systemHealth: this.mockData.systemHealth,
      activeJobs: Math.floor(Math.random() * 5),
      lastCheck: Date.now() - Math.floor(Math.random() * 3600000),
      totalFilings: 156 + Math.floor(Math.random() * 10),
      activeDockets: 8,
      stats: {
        pendingFilings: Math.floor(Math.random() * 20),
        processedToday: 45 + Math.floor(Math.random() * 15),
        errorRate: Math.floor(Math.random() * 5)
      }
    };
  }
  
  async getRecentActivity(limit = 10) {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const activities = [
      {
        id: 1,
        message: 'ECFS check completed for docket 23-108',
        component: 'ecfs',
        level: 'info',
        created_at: Date.now() - 1800000
      },
      {
        id: 2,
        message: 'AI processing completed for 3 new filings',
        component: 'ai',
        level: 'info',
        created_at: Date.now() - 3600000
      },
      {
        id: 3,
        message: 'Daily digest sent to 24 subscribers',
        component: 'email',
        level: 'info',
        created_at: Date.now() - 7200000
      },
      {
        id: 4,
        message: 'Rate limit warning from ECFS API',
        component: 'ecfs',
        level: 'warning',
        created_at: Date.now() - 10800000
      },
      {
        id: 5,
        message: 'Database backup completed successfully',
        component: 'storage',
        level: 'info',
        created_at: Date.now() - 14400000
      }
    ];
    
    return activities.slice(0, limit);
  }
  
  async triggerManualCheck() {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.mockData.lastUpdate = Date.now();
    
    return {
      success: true,
      message: 'Manual ECFS check completed',
      newFilings: Math.floor(Math.random() * 5),
      checkedDockets: 8
    };
  }
}

// Export singleton instance
export const monitoringAPI = new MonitoringMockAPI(); 