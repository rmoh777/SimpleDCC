import { json } from '@sveltejs/kit';
import { getActiveDockets } from '$lib/database/db-operations.js';

export async function GET({ platform, cookies }) {
  try {
    // Verify admin authentication
    const adminSession = cookies.get('admin_session');
    if (adminSession !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const db = platform.env.DB;
    
    // Get active dockets with enhanced stats
    const dockets = await getActiveDockets(db);
    
    // Enhance each docket with recent activity stats
    const enhancedDockets = await Promise.all(
      dockets.map(async (docket) => {
        try {
          // Get recent filing count for this docket
          const recentFilingsResult = await db.prepare(`
            SELECT COUNT(*) as recentCount
            FROM filings 
            WHERE docket_number = ? AND created_at > ?
          `).bind(docket.docket_number, Date.now() - 86400000).first();
          
          // Get pending AI processing count
          const pendingResult = await db.prepare(`
            SELECT COUNT(*) as pendingCount
            FROM filings 
            WHERE docket_number = ? AND status = 'pending'
          `).bind(docket.docket_number).first();
          
          return {
            ...docket,
            recentFilings24h: recentFilingsResult?.recentCount || 0,
            pendingProcessing: pendingResult?.pendingCount || 0,
            healthStatus: determineHealthStatus(docket),
            lastCheckFormatted: formatLastCheck(docket.last_checked)
          };
          
        } catch (error) {
          console.error(`Error enhancing docket ${docket.docket_number}:`, error);
          return {
            ...docket,
            recentFilings24h: 0,
            pendingProcessing: 0,
            healthStatus: 'unknown',
            lastCheckFormatted: 'Unknown'
          };
        }
      })
    );
    
    // Sort by priority (most subscribers first, then by recent activity)
    enhancedDockets.sort((a, b) => {
      if (a.subscribers_count !== b.subscribers_count) {
        return b.subscribers_count - a.subscribers_count;
      }
      return b.last_checked - a.last_checked;
    });
    
    return json({
      dockets: enhancedDockets,
      total: enhancedDockets.length,
      summary: {
        active: enhancedDockets.filter(d => d.status === 'active').length,
        paused: enhancedDockets.filter(d => d.status === 'paused').length,
        errors: enhancedDockets.filter(d => d.status === 'error').length,
        totalSubscribers: enhancedDockets.reduce((sum, d) => sum + d.subscribers_count, 0)
      }
    });
    
  } catch (error) {
    console.error('Error getting dockets:', error);
    return json({ 
      error: 'Failed to retrieve dockets',
      details: error.message 
    }, { status: 500 });
  }
}

// Helper functions
function determineHealthStatus(docket) {
  const now = Date.now();
  const lastCheck = docket.last_checked;
  const errorCount = docket.error_count || 0;
  
  // Error status if too many consecutive errors
  if (errorCount >= 3) return 'error';
  
  // Warning if not checked recently (more than 4 hours)
  if (now - lastCheck > 4 * 60 * 60 * 1000) return 'warning';
  
  // Warning if has errors but not too many
  if (errorCount > 0) return 'warning';
  
  return 'healthy';
}

function formatLastCheck(timestamp) {
  if (!timestamp || timestamp === 0) return 'Never';
  
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
} 