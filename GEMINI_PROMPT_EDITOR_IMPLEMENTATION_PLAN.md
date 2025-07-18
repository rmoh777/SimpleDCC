# Gemini Prompt Editor & Admin Reorganization Implementation Plan

**Date**: July 15, 2025  
**Status**: Ready for Implementation  
**Priority**: High - Enables immediate prompt customization without code changes

---

## **1. Project Overview**

### **Current Problem**
- Gemini AI prompts are hardcoded in `buildEnhancedPrompt()` functions
- Duplicate code in both main app and cron-worker
- Requires code changes and deployment to modify prompts
- No ability to A/B test or quickly iterate on prompt effectiveness

### **Proposed Solution**
- Database-driven prompt management system
- Admin interface for real-time prompt editing
- Reorganized admin panel with database-viewer style navigation
- Foundation for future multi-persona prompt system

---

## **2. Database Schema Implementation**

### **Migration File: `migrations/014_ai_prompt_templates.sql`**
```sql
-- AI Prompt Templates Table
CREATE TABLE ai_prompt_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT 'default',
  description TEXT,
  template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for active prompt lookups
CREATE INDEX idx_ai_prompt_templates_active ON ai_prompt_templates(is_active, updated_at);

-- Insert current hardcoded prompt as baseline
INSERT INTO ai_prompt_templates (name, description, template, is_active) VALUES (
  'default',
  'Default regulatory intelligence prompt for FCC filing analysis',
  'Analyze this FCC filing and provide a comprehensive regulatory intelligence summary:

FILING METADATA:
- ID: {{FILING_ID}}
- Docket: {{DOCKET_NUMBER}}
- Title: {{FILING_TITLE}}
- Author/Filer: {{FILING_AUTHOR}}
- Filing Type: {{FILING_TYPE}}
- Date: {{FILING_DATE}}
- Organization: {{FILING_ORGANIZATION}}

{{DOCUMENT_CONTENT_SECTION}}

Please provide a structured analysis in the following format:

SUMMARY:
[2-3 sentence executive summary of the filing''s purpose and key message]

KEY_POINTS:
- [Most important regulatory point]
- [Second most important point]  
- [Third most important point]
{{DOCUMENT_KEY_POINTS}}

STAKEHOLDERS:
- Primary: [Who filed this and why]
- Affected: [Who this impacts]
- Opposing: [Any opposing viewpoints mentioned]

REGULATORY_IMPACT:
- Scope: [Broad/narrow impact]
- Timeline: [Immediate/future implications]
- Precedent: [Sets new precedent or follows existing]

{{DOCUMENT_ANALYSIS_SECTION}}

CONFIDENCE: [High/Medium/Low - based on available information]

Focus on regulatory implications, policy impacts, and strategic insights that would be valuable to telecommunications attorneys, policy analysts, and business strategists.',
  1
);

-- Log successful migration
INSERT INTO system_logs (level, category, message, metadata) VALUES (
  'INFO',
  'migration',
  'AI prompt templates system initialized',
  '{"migration": "014_ai_prompt_templates", "templates_created": 1}'
);
```

---

## **3. Code Refactoring**

### **A. Main App: `src/lib/ai/gemini-enhanced.js`**

#### **Current Function Replacement**
```javascript
/**
 * Build enhanced prompt using database template
 */
async function buildEnhancedPrompt(filing, documentTexts, db) {
  try {
    // Get active prompt template from database
    const promptResult = await db.prepare(`
      SELECT template, name FROM ai_prompt_templates 
      WHERE is_active = 1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();
    
    const promptTemplate = promptResult?.template || getHardcodedFallback();
    
    console.log(`🤖 Using prompt template: ${promptResult?.name || 'hardcoded_fallback'}`);
    
    // Process template with filing data
    return processPromptTemplate(promptTemplate, filing, documentTexts);
    
  } catch (error) {
    console.error('❌ Error loading prompt template, using fallback:', error);
    return processPromptTemplate(getHardcodedFallback(), filing, documentTexts);
  }
}

/**
 * Process template variables with actual filing data
 */
function processPromptTemplate(template, filing, documentTexts) {
  const hasDocuments = documentTexts.length > 0;
  
  // Replace template variables
  let processedPrompt = template
    .replace('{{FILING_ID}}', filing.id)
    .replace('{{DOCKET_NUMBER}}', filing.docket_number)
    .replace('{{FILING_TITLE}}', filing.title)
    .replace('{{FILING_AUTHOR}}', filing.author)
    .replace('{{FILING_TYPE}}', filing.filing_type)
    .replace('{{FILING_DATE}}', filing.date_received)
    .replace('{{FILING_ORGANIZATION}}', filing.submitter_info?.organization || 'Not specified');
  
  // Handle document content sections
  if (hasDocuments) {
    const documentContent = documentTexts.map((text, index) => `
Document ${index + 1}:
${text.substring(0, 8000)}${text.length > 8000 ? '\n... [truncated]' : ''}
`).join('\n');
    
    processedPrompt = processedPrompt
      .replace('{{DOCUMENT_CONTENT_SECTION}}', `
DOCUMENT CONTENT ANALYSIS:
The following document content was extracted and should be analyzed for key insights:

${documentContent}`)
      .replace('{{DOCUMENT_KEY_POINTS}}', '- [Additional points from document analysis]')
      .replace('{{DOCUMENT_ANALYSIS_SECTION}}', `
DOCUMENT_ANALYSIS:
- Content Type: [Technical/legal/policy analysis]
- Key Arguments: [Main arguments presented]
- Supporting Data: [Statistics or evidence provided]
- Attachments: [Technical reports, studies, etc.]`);
  } else {
    processedPrompt = processedPrompt
      .replace('{{DOCUMENT_CONTENT_SECTION}}', 'NOTE: No documents were available for content analysis. Base summary on filing metadata only.')
      .replace('{{DOCUMENT_KEY_POINTS}}', '')
      .replace('{{DOCUMENT_ANALYSIS_SECTION}}', '');
  }
  
  return processedPrompt;
}

/**
 * Hardcoded fallback prompt (current implementation)
 */
function getHardcodedFallback() {
  return `[CURRENT_HARDCODED_PROMPT_PRESERVED_AS_FALLBACK]`;
}
```

#### **Function Signature Updates**
```javascript
// Update generateEnhancedSummary to pass db parameter
export async function generateEnhancedSummary(filing, documentTexts = [], passedEnv, db) {
  // ... existing code ...
  
  // Updated call
  const prompt = await buildEnhancedPrompt(filing, documentTexts, db);
  
  // ... rest of function unchanged ...
}
```

### **B. Cron Worker: `cron-worker/src/lib/ai/gemini-enhanced.js`**

**Apply identical changes** with environment-appropriate database access:
```javascript
// Same functions as above, but using worker's db access pattern
const prompt = await buildEnhancedPrompt(filing, documentText, env.DB);
```

### **C. Update All Callers**

**Files to update:**
- `src/lib/storage/filing-storage-enhanced.js`
- `cron-worker/src/lib/storage/filing-storage-enhanced.js`
- Any test files calling `generateEnhancedSummary`

**Pass database parameter:**
```javascript
// Example update
const aiResult = await generateEnhancedSummary(filing, documentTexts, env, db);
```

---

## **4. Admin Interface Implementation**

### **A. New Page: `src/routes/admin/ai/+layout.svelte`**
```svelte
<script>
  import { page } from '$app/stores';
</script>

<div class="ai-management-layout">
  <nav class="sidebar">
    <h3>🤖 AI Management</h3>
    <ul>
      <li>
        <a href="/admin/ai/prompts" class:active={$page.url.pathname === '/admin/ai/prompts'}>
          📝 Gemini Prompts
        </a>
      </li>
      <li>
        <a href="/admin/ai/monitoring" class:active={$page.url.pathname === '/admin/ai/monitoring'}>
          📊 AI Monitoring
        </a>
      </li>
    </ul>
  </nav>
  
  <main class="content">
    <slot />
  </main>
</div>

<style>
  /* Match database-viewer styling */
  .ai-management-layout {
    display: flex;
    height: 100vh;
  }
  
  .sidebar {
    width: 250px;
    background: #f8f9fa;
    border-right: 1px solid #e9ecef;
    padding: 1rem;
  }
  
  .content {
    flex: 1;
    padding: 1rem;
    overflow-y: auto;
  }
  
  .active {
    background: #007bff;
    color: white;
    border-radius: 4px;
  }
</style>
```

### **B. Prompt Editor: `src/routes/admin/ai/prompts/+page.svelte`**
```svelte
<script>
  import { onMount } from 'svelte';
  import LoadingSpinner from '$lib/components/ui/LoadingSpinner.svelte';
  
  let promptData = null;
  let loading = true;
  let saving = false;
  let message = '';
  let editedTemplate = '';
  
  onMount(async () => {
    await loadPrompt();
  });
  
  async function loadPrompt() {
    try {
      loading = true;
      const response = await fetch('/api/admin/ai/prompts');
      if (response.ok) {
        promptData = await response.json();
        editedTemplate = promptData.template;
      } else {
        message = 'Failed to load prompt';
      }
    } catch (error) {
      message = 'Error loading prompt: ' + error.message;
    } finally {
      loading = false;
    }
  }
  
  async function savePrompt() {
    try {
      saving = true;
      const response = await fetch('/api/admin/ai/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          template: editedTemplate,
          description: 'Updated via admin interface'
        })
      });
      
      if (response.ok) {
        message = 'Prompt saved successfully!';
        await loadPrompt(); // Reload to get updated timestamp
      } else {
        const error = await response.json();
        message = 'Save failed: ' + error.error;
      }
    } catch (error) {
      message = 'Error saving: ' + error.message;
    } finally {
      saving = false;
    }
  }
  
  function resetToDefault() {
    if (confirm('Reset to default prompt? This will lose all custom changes.')) {
      editedTemplate = promptData.template;
    }
  }
</script>

<div class="prompt-editor">
  <div class="header">
    <h1>🤖 Gemini AI Prompt Editor</h1>
    <p>Edit the prompt template used for FCC filing analysis</p>
  </div>
  
  {#if loading}
    <LoadingSpinner />
  {:else}
    <div class="editor-container">
      <div class="template-info">
        <h3>Current Template: {promptData.name}</h3>
        <p>Last updated: {new Date(promptData.updated_at).toLocaleString()}</p>
        <p>Characters: {editedTemplate.length}</p>
      </div>
      
      <div class="template-variables">
        <h4>Available Variables:</h4>
        <div class="variables-grid">
          <span class="variable">{{FILING_ID}}</span>
          <span class="variable">{{DOCKET_NUMBER}}</span>
          <span class="variable">{{FILING_TITLE}}</span>
          <span class="variable">{{FILING_AUTHOR}}</span>
          <span class="variable">{{FILING_TYPE}}</span>
          <span class="variable">{{FILING_DATE}}</span>
          <span class="variable">{{FILING_ORGANIZATION}}</span>
          <span class="variable">{{DOCUMENT_CONTENT_SECTION}}</span>
          <span class="variable">{{DOCUMENT_KEY_POINTS}}</span>
          <span class="variable">{{DOCUMENT_ANALYSIS_SECTION}}</span>
        </div>
      </div>
      
      <div class="editor-section">
        <label for="template">Prompt Template:</label>
        <textarea 
          id="template"
          bind:value={editedTemplate}
          rows="25"
          class="template-editor"
          placeholder="Enter your Gemini prompt template..."
        ></textarea>
      </div>
      
      <div class="actions">
        <button 
          class="btn btn-primary" 
          on:click={savePrompt} 
          disabled={saving || !editedTemplate.trim()}
        >
          {saving ? 'Saving...' : 'Save Prompt'}
        </button>
        
        <button 
          class="btn btn-secondary" 
          on:click={resetToDefault}
          disabled={saving}
        >
          Reset to Default
        </button>
        
        <button 
          class="btn btn-outline" 
          on:click={loadPrompt}
          disabled={saving}
        >
          Reload
        </button>
      </div>
      
      {#if message}
        <div class="message" class:success={message.includes('success')} class:error={!message.includes('success')}>
          {message}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .prompt-editor {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    margin-bottom: 2rem;
  }
  
  .template-info {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
  
  .template-variables {
    margin-bottom: 1rem;
  }
  
  .variables-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 0.5rem;
    margin-top: 0.5rem;
  }
  
  .variable {
    background: #e9ecef;
    padding: 0.25rem 0.5rem;
    border-radius: 3px;
    font-family: monospace;
    font-size: 0.875rem;
  }
  
  .template-editor {
    width: 100%;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.4;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    resize: vertical;
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
  }
  
  .btn {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
  }
  
  .btn-primary {
    background: #007bff;
    color: white;
  }
  
  .btn-secondary {
    background: #6c757d;
    color: white;
  }
  
  .btn-outline {
    background: transparent;
    border: 1px solid #007bff;
    color: #007bff;
  }
  
  .btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .message {
    margin-top: 1rem;
    padding: 0.75rem;
    border-radius: 4px;
  }
  
  .message.success {
    background: #d4edda;
    color: #155724;
    border: 1px solid #c3e6cb;
  }
  
  .message.error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
</style>
```

### **C. API Endpoint: `src/routes/api/admin/ai/prompts/+server.js`**
```javascript
import { json } from '@sveltejs/kit';
import { db } from '$lib/db.js';

// GET - Fetch current active prompt
export async function GET({ cookies }) {
  try {
    // Admin authentication check
    const adminSession = cookies.get('admin_session');
    if (!adminSession) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get active prompt
    const prompt = await db.prepare(`
      SELECT id, name, description, template, created_at, updated_at
      FROM ai_prompt_templates 
      WHERE is_active = 1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).first();
    
    if (!prompt) {
      return json({ error: 'No active prompt found' }, { status: 404 });
    }
    
    return json(prompt);
    
  } catch (error) {
    console.error('Error fetching prompt:', error);
    return json({ error: 'Failed to fetch prompt' }, { status: 500 });
  }
}

// POST - Update prompt template
export async function POST({ request, cookies }) {
  try {
    // Admin authentication check
    const adminSession = cookies.get('admin_session');
    if (!adminSession) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { template, description } = await request.json();
    
    if (!template || template.trim().length === 0) {
      return json({ error: 'Template cannot be empty' }, { status: 400 });
    }
    
    // Begin transaction
    await db.exec('BEGIN TRANSACTION');
    
    try {
      // Deactivate current prompt
      await db.prepare(`
        UPDATE ai_prompt_templates 
        SET is_active = 0 
        WHERE is_active = 1
      `).run();
      
      // Insert new prompt
      const result = await db.prepare(`
        INSERT INTO ai_prompt_templates (name, description, template, is_active, updated_at)
        VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
      `).bind(
        'default',
        description || 'Updated via admin interface',
        template
      ).run();
      
      // Log the change
      await db.prepare(`
        INSERT INTO system_logs (level, category, message, metadata)
        VALUES ('INFO', 'admin', 'Gemini prompt template updated', ?)
      `).bind(JSON.stringify({
        prompt_id: result.lastRowId,
        template_length: template.length,
        updated_via: 'admin_interface'
      })).run();
      
      await db.exec('COMMIT');
      
      return json({ 
        success: true, 
        message: 'Prompt updated successfully',
        prompt_id: result.lastRowId
      });
      
    } catch (error) {
      await db.exec('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    console.error('Error updating prompt:', error);
    return json({ error: 'Failed to update prompt' }, { status: 500 });
  }
}
```

---

## **5. Admin Navigation Reorganization**

### **Update: `src/routes/admin/+layout.svelte`**

**Reorganize the navigation to match database-viewer style:**
```svelte
<script>
  import { page } from '$app/stores';
  
  const navigationSections = [
    {
      title: "🗃️ Database Management",
      items: [
        { href: "/admin/database-viewer", label: "Database Viewer", desc: "View and manage data" },
        { href: "/admin/database/migrate", label: "Schema Migration", desc: "Database migrations" },
        { href: "/admin/database/fix-ai-columns", label: "Data Fixes", desc: "Repair data issues" }
      ]
    },
    {
      title: "🤖 AI Management",
      items: [
        { href: "/admin/ai/prompts", label: "Gemini Prompts", desc: "Edit AI prompt templates" },
        { href: "/admin/monitoring/ai", label: "AI Monitoring", desc: "AI processing metrics" }
      ]
    },
    {
      title: "📬 Notification System", 
      items: [
        { href: "/admin/monitoring/notifications", label: "Queue Management", desc: "Email notification queue" },
        { href: "/admin/email-preview", label: "Email Preview", desc: "Preview email templates" },
        { href: "/admin/test-emails", label: "Test Emails", desc: "Send test notifications" }
      ]
    },
    {
      title: "🔍 Monitoring & Testing",
      items: [
        { href: "/admin/status", label: "System Status", desc: "Overall system health" },
        { href: "/admin/monitoring", label: "System Monitoring", desc: "Real-time metrics" },
        { href: "/admin/manual-production-test", label: "Manual Production Test", desc: "Test production pipeline" },
        { href: "/admin/test-cron-worker", label: "Cron Worker Test", desc: "Test worker functions" },
        { href: "/admin/test-enhanced-ecfs", label: "Enhanced ECFS Test", desc: "Test ECFS integration" }
      ]
    },
    {
      title: "👥 User Management",
      items: [
        { href: "/admin/subscriptions", label: "Subscriptions", desc: "Manage user subscriptions" }
      ]
    },
    {
      title: "🔧 Development Tools",
      items: [
        { href: "/admin/smart-detection", label: "Smart Detection", desc: "Filing detection settings" }
      ]
    }
  ];
</script>

<div class="admin-layout">
  <nav class="admin-sidebar">
    <div class="admin-header">
      <h2>📊 Admin Dashboard</h2>
      <p>SimpleDCC Management</p>
    </div>
    
    {#each navigationSections as section}
      <div class="nav-section">
        <h3>{section.title}</h3>
        <ul>
          {#each section.items as item}
            <li>
              <a 
                href={item.href} 
                class:active={$page.url.pathname === item.href}
              >
                <div class="nav-item">
                  <div class="nav-label">{item.label}</div>
                  <div class="nav-desc">{item.desc}</div>
                </div>
              </a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </nav>
  
  <main class="admin-content">
    <slot />
  </main>
</div>

<style>
  /* Match database-viewer styling exactly */
  .admin-layout {
    display: flex;
    height: 100vh;
    background: #fff;
  }
  
  .admin-sidebar {
    width: 280px;
    background: #f8f9fa;
    border-right: 1px solid #e9ecef;
    overflow-y: auto;
    padding: 1rem;
  }
  
  .admin-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .admin-header h2 {
    margin: 0;
    color: #343a40;
    font-size: 1.25rem;
  }
  
  .admin-header p {
    margin: 0.25rem 0 0 0;
    color: #6c757d;
    font-size: 0.875rem;
  }
  
  .nav-section {
    margin-bottom: 1.5rem;
  }
  
  .nav-section h3 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #495057;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .nav-section ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .nav-section li {
    margin-bottom: 0.25rem;
  }
  
  .nav-section a {
    display: block;
    padding: 0.5rem 0.75rem;
    text-decoration: none;
    color: #495057;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .nav-section a:hover {
    background: #e9ecef;
  }
  
  .nav-section a.active {
    background: #007bff;
    color: white;
  }
  
  .nav-item {
    display: flex;
    flex-direction: column;
  }
  
  .nav-label {
    font-weight: 500;
    font-size: 0.875rem;
  }
  
  .nav-desc {
    font-size: 0.75rem;
    opacity: 0.75;
    margin-top: 0.125rem;
  }
  
  .admin-content {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }
</style>
```

---

## **6. Testing Strategy**

### **A. Migration Testing**
```bash
# Test migration locally
npm run dev
# Navigate to /admin/database/migrate
# Run migration 014_ai_prompt_templates.sql
# Verify table creation and default data
```

### **B. Prompt Editor Testing**
1. **Load Test**: Navigate to `/admin/ai/prompts`
2. **Edit Test**: Modify prompt template, save changes
3. **Validation Test**: Try saving empty prompt (should fail)
4. **Reset Test**: Use reset to default functionality
5. **Variables Test**: Verify template variables are displayed

### **C. Integration Testing**
1. **Manual Production Test**: Use existing `/admin/manual-production-test`
2. **Verify Custom Prompt**: Check that custom prompt is used in AI processing
3. **Fallback Test**: Temporarily break database, verify hardcoded fallback works

---

## **7. Future Enhancements Roadmap**

### **Phase 2: Multi-Persona Support**
- Add `persona` field to prompt templates
- User-selectable personas per docket subscription
- Persona-specific prompt libraries

### **Phase 3: Advanced Features**
- Prompt version history and rollback
- A/B testing framework
- Prompt performance analytics
- Template variable validation

### **Phase 4: AI Optimization**
- Context-aware prompt selection
- Dynamic prompt generation
- Persona learning and optimization

---

## **8. Implementation Checklist**

### **Database**
- [ ] Create migration `014_ai_prompt_templates.sql`
- [ ] Test migration locally
- [ ] Run migration in production

### **Code Changes**
- [ ] Update `src/lib/ai/gemini-enhanced.js`
- [ ] Update `cron-worker/src/lib/ai/gemini-enhanced.js`
- [ ] Update all function callers to pass `db` parameter
- [ ] Add error handling and fallbacks

### **Admin Interface**
- [ ] Create `/admin/ai/+layout.svelte`
- [ ] Create `/admin/ai/prompts/+page.svelte`
- [ ] Create `/admin/ai/prompts/+server.js`
- [ ] Update main admin layout navigation

### **Testing**
- [ ] Test prompt editor functionality
- [ ] Test custom prompt in AI processing
- [ ] Test fallback mechanisms
- [ ] Verify admin navigation reorganization

### **Documentation**
- [ ] Update admin user guide
- [ ] Document template variable system
- [ ] Create prompt editing best practices

---

## **9. Risk Assessment & Mitigation**

### **Low Risk**
- **Fallback System**: Hardcoded prompt preserved as backup
- **Database Independence**: System continues working if database fails
- **Gradual Rollout**: Can be deployed without immediate migration

### **Mitigation Strategies**
- Comprehensive error handling in prompt loading
- Database transaction safety for prompt updates
- Admin authentication for sensitive operations
- Logging for all prompt changes

---

**Ready for implementation tomorrow - all architectural decisions made and detailed implementation plan complete.** 