// Interface that B3 will implement for stats data
export interface MonitoringStats {
  systemHealth: 'healthy' | 'warning' | 'error';
  activeJobs: number;
  lastCheck: number;
  totalFilings: number;
} 