// Interface that B3 will implement for stats data
export interface MonitoringStats {
  systemHealth: 'healthy' | 'warning' | 'error';
  activeJobs: number;
  lastCheck: number;
  totalFilings: number;
  activeDockets: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: number;
  message: string;
  time: number;
}

export interface ECFSStats {
  lastCheck: number;
  totalRequests: number;
  failedRequests: number;
  averageResponseTime: number;
}

export interface AIProcessingStats {
  totalProcessed: number;
  successRate: number;
  averageProcessingTime: number;
  pendingJobs: number;
}

export interface SystemLog {
  id: number;
  level: 'info' | 'warning' | 'error';
  message: string;
  component: string;
  timestamp: number;
  details?: string;
}

// API endpoints that B3 will implement
export interface MonitoringAPI {
  '/api/admin/monitoring/stats': () => Promise<MonitoringStats>;
  '/api/admin/monitoring/ecfs/stats': () => Promise<ECFSStats>;
  '/api/admin/monitoring/ai/stats': () => Promise<AIProcessingStats>;
  '/api/admin/monitoring/logs': (filters?: LogFilters) => Promise<SystemLog[]>;
  '/api/admin/monitoring/trigger': (action: string) => Promise<{ success: boolean; message: string }>;
}

export interface LogFilters {
  level?: 'info' | 'warning' | 'error';
  component?: string;
  since?: number;
  limit?: number;
} 