-- Add missing AI enhancement columns to filings table
ALTER TABLE filings ADD COLUMN ai_enhanced INTEGER DEFAULT 0;
ALTER TABLE filings ADD COLUMN ai_key_points TEXT;
ALTER TABLE filings ADD COLUMN ai_stakeholders TEXT;
ALTER TABLE filings ADD COLUMN ai_regulatory_impact TEXT;
ALTER TABLE filings ADD COLUMN ai_document_analysis TEXT;
ALTER TABLE filings ADD COLUMN ai_confidence TEXT;
ALTER TABLE filings ADD COLUMN documents_processed INTEGER DEFAULT 0; 