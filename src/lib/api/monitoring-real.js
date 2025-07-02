// Real API integration replacing mock services
export class MonitoringAPI {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.timeout = options.timeout || 30000;
  }
  
  /**
   * Get comprehensive monitoring statistics
   */
  async getMonitoringStats() {
    try {
      const response = await this.fetch('/api/admin/monitoring/stats');
      return await response.json();
    } catch (error) {
      console.error('Failed to get monitoring stats:', error);
      throw new Error(`Monitoring stats unavailable: ${error.message}`);
    }
  }
  
  /**
   * Get recent system activity
   */
  async getRecentActivity(options = {}) {
    const { limit = 20, component = null, level = null } = options;
    
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit.toString());
    if (component) params.set('component', component);
    if (level) params.set('level', level);
    
    try {
      const response = await this.fetch(`/api/admin/monitoring/activity?${params}`);
      const data = await response.json();
      return data.activities || [];
    } catch (error) {
      console.error('Failed to get recent activity:', error);
      throw new Error(`Activity data unavailable: ${error.message}`);
    }
  }
  
  /**
   * Trigger manual ECFS check
   */
  async triggerManualCheck() {
    try {
      const response = await this.fetch('/api/admin/monitoring/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      return await response.json();
    } catch (error) {
      console.error('Manual check failed:', error);
      throw new Error(`Manual check failed: ${error.message}`);
    }
  }
  
  /**
   * Get AI processing status
   */
  async getAIStatus() {
    try {
      const response = await this.fetch('/api/admin/ai?action=status');
      return await response.json();
    } catch (error) {
      console.error('Failed to get AI status:', error);
      throw new Error(`AI status unavailable: ${error.message}`);
    }
  }
  
  /**
   * Process pending AI filings
   */
  async processPendingAI(options = {}) {
    const { limit = 10, maxConcurrent = 2 } = options;
    
    try {
      const response = await this.fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_pending',
          params: { limit, maxConcurrent }
        })
      });
      
      return await response.json();
    } catch (error) {
      console.error('AI processing failed:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }
  }
  
  /**
   * Get document processing statistics
   */
  async getDocumentStats() {
    try {
      const response = await this.fetch('/api/admin/documents?action=stats');
      return await response.json();
    } catch (error) {
      console.error('Failed to get document stats:', error);
      throw new Error(`Document stats unavailable: ${error.message}`);
    }
  }
  
  /**
   * Get active dockets information
   */
  async getActiveDockets() {
    try {
      const response = await this.fetch('/api/admin/monitoring/dockets');
      return await response.json();
    } catch (error) {
      console.error('Failed to get active dockets:', error);
      throw new Error(`Docket data unavailable: ${error.message}`);
    }
  }
  
  /**
   * Get system logs with filtering
   */
  async getSystemLogs(options = {}) {
    const { page = 1, limit = 50, level = null, component = null, search = null } = options;
    
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', limit.toString());
    if (level) params.set('level', level);
    if (component) params.set('component', component);
    if (search) params.set('search', search);
    
    try {
      const response = await this.fetch(`/api/admin/monitoring/logs?${params}`);
      return await response.json();
    } catch (error) {
      console.error('Failed to get system logs:', error);
      throw new Error(`System logs unavailable: ${error.message}`);
    }
  }
  
  /**
   * Enhanced fetch with error handling and timeout
   */
  async fetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - server may be overloaded');
      }
      
      throw error;
    }
  }
}

// Global API client instance
export const monitoringAPI = new MonitoringAPI();

/**
 * API client with automatic retry logic
 */
export class ResilientMonitoringAPI extends MonitoringAPI {
  constructor(options = {}) {
    super(options);
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }
  
  /**
   * Enhanced fetch with retry logic
   */
  async fetch(url, options = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await super.fetch(url, options);
      } catch (error) {
        lastError = error;
        
        // Don't retry on 4xx errors (client errors)
        if (error.message.includes('HTTP 4')) {
          throw error;
        }
        
        // Don't retry on the last attempt
        if (attempt === this.maxRetries) {
          break;
        }
        
        // Wait before retrying
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * Math.pow(2, attempt))
        );
        
        console.warn(`API request failed (attempt ${attempt + 1}/${this.maxRetries + 1}):`, error);
      }
    }
    
    throw lastError;
  }
}

// Resilient API client for production use
export const resilientAPI = new ResilientMonitoringAPI({
  maxRetries: 3,
  retryDelay: 1000,
  timeout: 30000
}); 