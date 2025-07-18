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

/**
 * Generate sample data for DocketCC templates
 */
export function generateDocketCCSampleData() {
  return {
    userEmail: 'user@example.com',
    filing: {
      id: 'sample-filing-1',
      docket_number: '23-108',
      title: 'Comments on Broadband Infrastructure Deployment and Rural Connectivity Enhancement',
      author: 'National Telecommunications Association',
      filing_type: 'comment',
      date_received: new Date(Date.now() - 86400000).toISOString(),
      filing_url: 'https://www.fcc.gov/ecfs/filing/sample1',
      ai_summary: 'The filing argues for streamlined permitting processes to accelerate broadband deployment in underserved areas. Key recommendations include standardizing municipal approval timelines and reducing regulatory barriers for infrastructure projects. The document emphasizes the economic benefits of improved connectivity and proposes specific regulatory reforms to facilitate faster deployment timelines.',
      ai_key_points: ['Streamlined permitting processes', 'Municipal approval standardization', 'Regulatory barrier reduction', 'Broadband deployment acceleration', 'Economic benefits analysis']
    },
    options: {
      brandName: 'DocketCC',
      supportEmail: 'support@simpledcc.com',
      unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
    }
  };
}

/**
 * Generate sample data for Daily Digest template
 */
export function generateDailyDigestSampleData() {
  return {
    userEmail: 'user@example.com',
    filings: [
      {
        id: '1.07079E+13',
        docket_number: '03-123',
        title: 'FCC Order on TRS Fund Requirements',
        author: 'Consumer and Governmental Affairs Bureau',
        filing_type: 'ORDER',
        date_received: '2025-07-07T17:00:00.000Z',
        filing_url: 'https://www.fcc.gov/ecfs/filing/10707869810147',
        ai_summary: `This FCC Order (DA 25-578A1) sets the funding requirements and contribution factors for the Interstate Telecommunications Relay Services (TRS) Fund for the 2025-26 fiscal year. The order adjusts projected demand for several TRS services (VRS and IP CTS) based on an analysis of provider projections, resulting in a slightly reduced net funding requirement of $1,479,568,862 compared to the previous year. This adjustment affects carrier contribution factors for both internet-based and non-internet-based TRS.`,
        ai_key_points: `Establishment of the $1,479,568,862 net funding requirement for the Interstate TRS Fund for fiscal year 2025-26., Revised contribution factors: 0.00025 for non-Internet-based TRS and 0.02086 for Internet-based TRS, reflecting adjustments to projected demand for VRS and IP CTS., Adjustment of projected demand for VRS and IP CTS based on the determination that some provider projections were overly optimistic, leading to lower funding requirements for these services., Approval of $10,000,000 in funding for the National Deaf-Blind Equipment Distribution Program (NDBEDP).`,
        raw_data: {},
        status: 'completed'
      },
      {
        id: '1.07026E+13',
        docket_number: '03-123',
        title: 'Oklahoma TRS FCC Report 2025.pdf',
        author: 'OTA - OKLAHOMA TELEPHONE ASSOCATION',
        filing_type: 'REPORT',
        date_received: '2025-07-02T21:00:29.567Z',
        filing_url: 'https://www.fcc.gov/ecfs/filing/10702579615285',
        ai_summary: `The Oklahoma Telephone Association (OTA) submitted a report to the FCC detailing Telecommunications Relay Service (TRS) consumer complaints handled by Hamilton Relay in Oklahoma from June 1, 2024, to May 31, 2025. The report indicates a relatively low number of complaints, most of which involved customers attempting to reach non-TRS services, and all were resolved within the FCC's required timeframe. The filing fulfills OTA's regulatory obligation under Section 64.604(c)(ii) of the FCC's rules.`,
        ai_key_points: `Compliance with FCC TRS Reporting Requirements, Effective Complaint Resolution, Nature of Complaints: misdirected calls, Lack of Major TRS Issues.`,
        raw_data: {},
        status: 'completed'
      },
       {
        id: '1.07163E+12',
        docket_number: '02-6',
        title: 'USAC FCC FORM 471 APPLICATION - Calvary Chapel',
        author: 'Calvary Chapel Christian School',
        filing_type: 'WAIVER',
        date_received: '2025-07-17T15:00:29.895Z',
        filing_url: 'https://www.fcc.gov/ecfs/filing/1071631225764',
        ai_summary: `Calvary Chapel Christian School (CCCS) filed a waiver request (FCC Form 471, Application #251043301) with the Universal Service Administrative Company (USAC) for E-rate funding in Funding Year 2025. The application seeks $8,640 in funding for a 1 Gbps fiber optic internet connection from DQE Communications LLC, representing a 90% discount on a total pre-discount cost of $9,600. The filing is a renewal application for services previously received.`,
        ai_key_points: `E-rate Funding Request, Renewal Application, High Discount Rate, Specific Service Provider.`,
        raw_data: {},
        status: 'completed'
      }
    ],
    options: {
      brandName: 'DocketCC',
      supportEmail: 'support@simpledcc.com',
      unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
    }
  };
}

/**
 * Generate sample data for Seed Digest (Welcome) template
 */
export function generateSeedDigestSampleData() {
  /** @type {FilingData} */
  const filing = {
    id: '1.07079E+13',
    docket_number: '03-123',
    title: 'FCC Order on TRS Fund Requirements',
    author: 'Consumer and Governmental Affairs Bureau',
    filing_type: 'ORDER',
    date_received: '2025-07-07T17:00:00.000Z',
    filing_url: 'https://www.fcc.gov/ecfs/filing/10707869810147',
    ai_summary: `This FCC Order (DA 25-578A1) sets the funding requirements and contribution factors for the Interstate Telecommunications Relay Services (TRS) Fund for the 2025-26 fiscal year. The order adjusts projected demand for several TRS services (VRS and IP CTS) based on an analysis of provider projections, resulting in a slightly reduced net funding requirement of $1,479,568,862 compared to the previous year. This adjustment affects carrier contribution factors for both internet-based and non-internet-based TRS.`,
    ai_key_points: `Establishment of the $1,479,568,862 net funding requirement for the Interstate TRS Fund for fiscal year 2025-26., Revised contribution factors: 0.00025 for non-Internet-based TRS and 0.02086 for Internet-based TRS, reflecting adjustments to projected demand for VRS and IP CTS., Adjustment of projected demand for VRS and IP CTS based on the determination that some provider projections were overly optimistic, leading to lower funding requirements for these services., Approval of $10,000,000 in funding for the National Deaf-Blind Equipment Distribution Program (NDBEDP).`,
    raw_data: {},
    status: 'completed'
  };

  return {
    userEmail: 'user@example.com',
    filing,
    options: {
      brandName: 'DocketCC',
      supportEmail: 'support@simpledcc.com',
      unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
    }
  };
} 

/**
 * Generate sample data for Welcome Email template (initial confirmation)
 */
export function generateWelcomeEmailSampleData() {
  return {
    userEmail: 'user@example.com',
    docketNumber: '23-108',
    options: {
      brandName: 'DocketCC',
      supportEmail: 'support@simpledcc.com',
      unsubscribeBaseUrl: 'https://simpledcc.pages.dev'
    }
  };
} 