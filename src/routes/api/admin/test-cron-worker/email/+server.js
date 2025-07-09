import { json } from '@sveltejs/kit';

export async function POST({ request, cookies }) {
  try {
    // Check admin authentication
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, userTier, docketNumber } = await request.json();
    
    if (!userEmail || !userTier || !docketNumber) {
      return json({ error: 'userEmail, userTier, and docketNumber are required' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Mock email generation based on tier
    const mockEmailData = {
      free: {
        subject: `New Filing Alert: Docket ${docketNumber} (Upgrade for Full Details)`,
        tierFeatures: ['Basic metadata', 'Upgrade prompts', 'Limited content'],
        htmlLength: 2500,
        textLength: 800,
        hasAISummary: false,
        hasUpgradeCTA: true
      },
      trial: {
        subject: `Complete Filing Analysis: Docket ${docketNumber} (Trial)`,
        tierFeatures: ['Full AI summary', 'Key points', 'Trial reminder', 'Stakeholder analysis'],
        htmlLength: 4200,
        textLength: 1800,
        hasAISummary: true,
        hasUpgradeCTA: false
      },
      pro: {
        subject: `Complete Filing Analysis: Docket ${docketNumber}`,
        tierFeatures: ['Full AI summary', 'Key points', 'Stakeholder analysis', 'Regulatory impact', 'No interruptions'],
        htmlLength: 4500,
        textLength: 2000,
        hasAISummary: true,
        hasUpgradeCTA: false
      }
    };

    const emailResult = mockEmailData[userTier] || mockEmailData.free;
    const duration = Date.now() - startTime;

    return json({
      success: true,
      userEmail,
      userTier,
      docketNumber,
      duration,
      subject: emailResult.subject,
      htmlLength: emailResult.htmlLength,
      textLength: emailResult.textLength,
      tierFeatures: emailResult.tierFeatures,
      hasAISummary: emailResult.hasAISummary,
      hasUpgradeCTA: emailResult.hasUpgradeCTA,
      message: `Successfully generated ${userTier} tier email for ${userEmail}`,
      note: 'This is mock email generation for testing purposes. In production, this would use the actual email templates.'
    });

  } catch (error) {
    console.error('Email test error:', error);
    return json({ 
      error: 'Internal server error during email test',
      details: error.message 
    }, { status: 500 });
  }
} 