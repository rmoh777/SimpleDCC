// TypeScript interfaces for ECFS integration database schema

export interface Filing {
  id: string;
  docket_number: string;
  title: string;
  author: string;
  filing_type: string;
  date_received: string;
  filing_url: string;
  documents?: string; // JSON string
  raw_data?: string; // JSON string
  ai_summary?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  processed_at?: number;
}

export interface ActiveDocket {
  docket_number: string;
  last_checked: number;
  total_filings: number;
  subscribers_count: number;
  status: 'active' | 'paused' | 'error';
  error_count: number;
  created_at: number;
  updated_at: number;
}

export interface SystemLog {
  id: number;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  component: 'ecfs' | 'ai' | 'email' | 'cron';
  details?: string; // JSON string
  docket_number?: string;
  filing_id?: string;
  created_at: number;
}

export interface NotificationQueue {
  id: number;
  user_email: string;
  docket_number: string;
  filing_ids: string; // JSON array
  digest_type: 'daily' | 'weekly' | 'immediate';
  status: 'pending' | 'sent' | 'failed';
  scheduled_for: number;
  sent_at?: number;
  error_message?: string;
  created_at: number;
}

// Phase 2 Card 1: User accounts interface
export interface User {
  id: number;
  email: string;
  user_tier: 'free' | 'pro' | 'trial';
  trial_expires_at?: number;
  stripe_customer_id?: string;
  grace_period_until?: number;
  created_at: number;
}

// Phase 2 Card 1: User notification tracking for deduplication
export interface UserNotification {
  id: number;
  user_id: number;
  filing_id: string;
  notification_type: 'daily' | 'weekly' | 'immediate';
  sent_at: number;
}

// Enhanced subscription interface with user account linking
export interface EnhancedSubscription {
  id: number;
  email: string;
  docket_number: string;
  frequency: 'daily' | 'weekly' | 'immediate';
  last_notified: number;
  created_at: number;
  user_id?: number; // Phase 2 Card 1: Link to users table
}

// Enhanced notification queue processing interface
export interface NotificationQueueItem extends NotificationQueue {
  user?: User; // Join with user data for processing
  filings?: Filing[]; // Related filings for this notification
}

// Monitoring stats interface for A3 dashboard integration
export interface MonitoringStats {
  systemHealth: 'healthy' | 'warning' | 'error';
  activeJobs: number;
  lastCheck: number;
  totalFilings: number;
  activeDockets: number;
  recentLogs: SystemLog[];
  errorRate: number;
  processingQueue: number;
}

// Database response types
export interface DatabaseResult {
  success: boolean;
  changes?: number;
  meta?: any;
}

export interface DatabaseBatch {
  results: DatabaseResult[];
  success: boolean;
  meta?: any;
}

// Parsed document metadata
export interface DocumentMetadata {
  id: string;
  title: string;
  url?: string;
  type?: string;
  size?: number;
  pages?: number;
}

// Raw FCC filing data structure
export interface FCCFilingRaw {
  id: string;
  docket_number: string;
  title: string;
  author: string;
  filing_type: string;
  date_received: string;
  filing_url: string;
  documents?: DocumentMetadata[];
  [key: string]: any; // Allow additional fields from FCC API
} 