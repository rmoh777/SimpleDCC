// TypeScript interfaces for filing storage system

export interface FilingStorageStats {
  total: number;
  recent24h: number;
  recent7d: number;
  byStatus: Record<string, number>;
  byDocket: Record<string, number>;
  avgPerDay: number;
  lastUpdated: number;
}

export interface StorageOperation {
  newFilings: number;
  duplicates: number;
  errors: number;
  totalProcessed: number;
  duration?: number;
}

export interface BatchProcessingResult {
  totalDockets: number;
  totalNewFilings: number;
  totalDuplicates: number;
  totalErrors: number;
  successfulDockets: number;
  failedDockets: number;
  processingTime?: number;
}

export interface FilingData {
  id: string;
  docket_number: string;
  title: string;
  author: string;
  filing_type: string;
  date_received: string;
  filing_url: string;
  documents?: any[];
  raw_data: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  ai_summary?: string;
  created_at?: number;
  processed_at?: number;
}

export interface StorageValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface StorageMetrics {
  totalOperations: number;
  totalNewFilings: number;
  totalDuplicates: number;
  totalErrors: number;
  successRate: number;
  deduplicationRate: number;
}

export interface StorageSummary {
  totalDockets: number;
  totalFilings: number;
  successfulDockets: number;
  failedDockets: number;
  details: Record<string, {
    newFilings: number;
    duplicates: number;
    errors: number;
  }>;
}

export interface BatchProcessorOptions {
  batchSize?: number;
  maxConcurrent?: number;
  delayBetweenBatches?: number;
}

export interface CleanupResult {
  deleted: number;
  message: string;
}

export interface DocketStatistics {
  newFilings?: number;
  lastChecked?: number;
} 