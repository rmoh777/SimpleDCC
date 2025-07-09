import { json } from '@sveltejs/kit';

export async function POST({ request, cookies, platform }) {
  try {
    // Check admin authentication
    const session = cookies.get('admin_session');
    if (session !== 'authenticated') {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, docketNumber } = await request.json();
    
    if (!userEmail || !docketNumber) {
      return json({ error: 'userEmail and docketNumber are required' }, { status: 400 });
    }

    const startTime = Date.now();
    
    // Mock tier comparison data
    const tiers = [
      {
        name: 'free',
        displayName: 'Free',
        htmlLength: 2500,
        textLength: 800,
        features: [
          'Basic metadata',
          'Filing title & date',
          'Upgrade prompts',
          'Limited content',
          'No AI analysis'
        ],
        limitations: [
          'No AI summaries',
          'No key points extraction',
          'No stakeholder analysis',
          'Frequent upgrade prompts'
        ],
        subject: `New Filing Alert: Docket ${docketNumber} (Upgrade for Full Details)`,
        hasAISummary: false,
        hasUpgradeCTA: true,
        emailFrequency: 'daily',
        maxFilingsPerEmail: 3
      },
      {
        name: 'trial',
        displayName: 'Trial',
        htmlLength: 4200,
        textLength: 1800,
        features: [
          'Full AI summary',
          'Key points extraction',
          'Stakeholder analysis',
          'Regulatory impact',
          'Trial reminder',
          'Immediate notifications'
        ],
        limitations: [
          'Trial expiration reminder',
          'Time-limited access'
        ],
        subject: `Complete Filing Analysis: Docket ${docketNumber} (Trial)`,
        hasAISummary: true,
        hasUpgradeCTA: false,
        emailFrequency: 'immediate',
        maxFilingsPerEmail: 10
      },
      {
        name: 'pro',
        displayName: 'Pro',
        htmlLength: 4500,
        textLength: 2000,
        features: [
          'Full AI summary',
          'Key points extraction',
          'Stakeholder analysis',
          'Regulatory impact',
          'Document analysis',
          'No interruptions',
          'Priority support',
          'Immediate notifications'
        ],
        limitations: [],
        subject: `Complete Filing Analysis: Docket ${docketNumber}`,
        hasAISummary: true,
        hasUpgradeCTA: false,
        emailFrequency: 'immediate',
        maxFilingsPerEmail: 20
      }
    ];

    // Add tier-specific mock content
    const mockFilingContent = {
      free: {
        content: 'Basic filing information available. Upgrade to Pro for full AI analysis and insights.',
        aiSummary: null,
        keyPoints: null
      },
      trial: {
        content: 'This filing addresses important regulatory changes in telecommunications policy...',
        aiSummary: 'The filing proposes significant updates to data privacy requirements, enhanced security protocols, and new compliance standards for telecommunications providers.',
        keyPoints: ['Enhanced security protocols', 'Updated compliance requirements', 'Consumer protection measures']
      },
      pro: {
        content: 'This filing addresses important regulatory changes in telecommunications policy...',
        aiSummary: 'The filing proposes significant updates to data privacy requirements, enhanced security protocols, and new compliance standards for telecommunications providers. The proposed changes would impact service delivery timelines and customer protection measures.',
        keyPoints: ['Enhanced security protocols', 'Updated compliance requirements', 'Consumer protection measures', 'Industry impact assessment', 'Implementation timeline']
      }
    };

    // Generate comparison results
    const comparisonResults = tiers.map(tier => ({
      ...tier,
      contentExample: mockFilingContent[tier.name],
      generatedAt: new Date().toISOString(),
      testEmail: userEmail,
      testDocket: docketNumber
    }));

    const duration = Date.now() - startTime;

    return json({
      success: true,
      userEmail,
      docketNumber,
      duration,
      comparisonDate: new Date().toISOString(),
      tiers: comparisonResults,
      summary: {
        totalTiers: tiers.length,
        featuresComparison: {
          free: tiers[0].features.length,
          trial: tiers[1].features.length,
          pro: tiers[2].features.length
        },
        contentLengthComparison: {
          free: tiers[0].htmlLength,
          trial: tiers[1].htmlLength,
          pro: tiers[2].htmlLength
        },
        keyDifferences: [
          'Free tier lacks AI analysis and has upgrade prompts',
          'Trial tier includes full AI features with trial reminders',
          'Pro tier has complete features without interruptions'
        ]
      },
      recommendations: [
        'Free tier effectively demonstrates value gap to drive upgrades',
        'Trial tier provides full experience to encourage conversion',
        'Pro tier delivers premium experience without distractions'
      ],
      message: `Successfully compared email generation across all ${tiers.length} tiers`,
      note: 'This is a mock tier comparison for testing purposes. In production, this would generate actual emails using the cron-worker templates.'
    });

  } catch (error) {
    console.error('Tier comparison test error:', error);
    return json({ 
      error: 'Internal server error during tier comparison test',
      details: error.message 
    }, { status: 500 });
  }
} 