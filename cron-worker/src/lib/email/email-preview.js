// Email preview functionality for testing and admin review

export function generateEmailPreview(emailData, type = 'daily-digest') {
  const { html, text, subject } = emailData;
  
  return {
    subject,
    html: addPreviewStyles(html),
    text,
    metadata: {
      type,
      generatedAt: new Date().toISOString(),
      previewMode: true
    }
  };
}

function addPreviewStyles(html) {
  // Add preview banner for development/testing
  const previewBanner = `
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; padding: 12px; margin-bottom: 20px; border-radius: 6px; text-align: center;">
      <strong style="color: #dc2626;">📧 EMAIL PREVIEW MODE</strong>
      <p style="margin: 4px 0 0 0; font-size: 14px; color: #7f1d1d;">
        This is a preview of the email template. In production, this banner will not appear.
      </p>
    </div>
  `;
  
  // Insert banner after opening body tag
  return html.replace(/<body[^>]*>/, match => match + previewBanner);
}

/**
 * Generate sample data for email template testing
 */
export function generateSampleEmailData() {
  return {
    userEmail: 'user@example.com',
    filings: [
      {
        id: 'sample-filing-1',
        docket_number: '23-108',
        title: 'Comments on Broadband Infrastructure Deployment',
        author: 'National Telecommunications Association',
        filing_type: 'comment',
        date_received: new Date(Date.now() - 86400000).toISOString(),
        filing_url: 'https://www.fcc.gov/ecfs/filing/sample1',
        ai_summary: 'The filing argues for streamlined permitting processes to accelerate broadband deployment in underserved areas. Key recommendations include standardizing municipal approval timelines and reducing regulatory barriers for infrastructure projects.'
      },
      {
        id: 'sample-filing-2',
        docket_number: '23-108',
        title: 'Reply Comments on Rural Connectivity Standards',
        author: 'Rural Internet Service Providers Coalition',
        filing_type: 'reply_comment',
        date_received: new Date(Date.now() - 172800000).toISOString(),
        filing_url: 'https://www.fcc.gov/ecfs/filing/sample2',
        ai_summary: 'This reply supports flexible speed requirements for rural areas while emphasizing the need for reliable service over maximum speeds. The filing proposes tiered service standards based on geographic and economic factors.'
      },
      {
        id: 'sample-filing-3',
        docket_number: '24-001',
        title: 'Petition for Emergency Relief from Spectrum Interference',
        author: 'Regional Broadcasting Company',
        filing_type: 'petition',
        date_received: new Date(Date.now() - 259200000).toISOString(),
        filing_url: 'https://www.fcc.gov/ecfs/filing/sample3',
        ai_summary: null // No AI summary for this filing
      }
    ],
    options: {
      brandName: 'SimpleDCC',
      supportEmail: 'support@simpledcc.com',
      unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
    }
  };
} 