import { json } from '@sveltejs/kit';

export async function GET({ platform }) {
  try {
    // Test basic platform access
    const hasDB = !!platform?.env?.DB;

    // Test database query if available
    let dbTest = null;
    if (hasDB) {
      try {
        const result = await platform.env.DB
          .prepare('SELECT COUNT(*) as count FROM subscriptions')
          .first();
        dbTest = result;
      } catch (dbError) {
        dbTest = { error: dbError.message };
      }
    }

    return json({
      status: 'OK',
      hasDB,
      dbTest,
      envKeys: platform?.env ? Object.keys(platform.env) : [],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return json({
      status: 'ERROR',
      error: error.message,
      hasDB: false
    }, { status: 500 });
  }
} 