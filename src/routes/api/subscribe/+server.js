import { json } from '@sveltejs/kit';

export async function POST({ request, platform }) {
  try {
    const { email, docket_number } = await request.json();

    // Validate email
    if (!email || !email.includes('@') || !email.includes('.')) {
      return json({ 
        success: false, 
        message: 'Invalid email address' 
      }, { status: 400 });
    }

    // Validate docket number format (XX-XXX)
    if (!docket_number || !/^\d{2}-\d+$/.test(docket_number)) {
      return json({ 
        success: false, 
        message: 'Invalid docket number format (expected: XX-XXX)' 
      }, { status: 400 });
    }

    if (!platform?.env?.DB) {
      return json({
        success: false,
        message: 'Database not available'
      }, { status: 500 });
    }

    const db = platform.env.DB;

    // Insert subscription
    await db.prepare(`
      INSERT INTO subscriptions (email, docket_number, created_at)
      VALUES (?, ?, ?)
    `).bind(email.toLowerCase().trim(), docket_number.trim(), Math.floor(Date.now() / 1000)).run();

    return json({ 
      success: true, 
      message: `Successfully subscribed to docket ${docket_number}` 
    });
    
  } catch (error) {
    console.error('Subscribe API error:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      return json({ 
        success: false, 
        message: 'Already subscribed to this docket' 
      }, { status: 400 });
    }
    
    return json({ 
      success: false, 
      message: 'Failed to subscribe: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}

export async function DELETE({ request, platform }) {
  try {
    const { id } = await request.json();

    if (!id) {
      return json({
        success: false,
        message: 'Subscription ID required'
      }, { status: 400 });
    }

    if (!platform?.env?.DB) {
      return json({
        success: false,
        message: 'Database not available'
      }, { status: 500 });
    }

    const db = platform.env.DB;
    const result = await db.prepare('DELETE FROM subscriptions WHERE id = ?').bind(id).run();

    if (result.changes === 0) {
      return json({
        success: false,
        message: 'Subscription not found'
      }, { status: 404 });
    }

    return json({ 
      success: true, 
      message: 'Subscription removed successfully' 
    });
    
  } catch (error) {
    console.error('Delete subscription error:', error);
    return json({ 
      success: false, 
      message: 'Failed to remove subscription: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
} 