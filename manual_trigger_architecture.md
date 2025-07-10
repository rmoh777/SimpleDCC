# SimpleDCC Manual Trigger Architecture

## Overview
SimpleDCC's manual trigger system provides on-demand execution of the FCC docket monitoring pipeline through a secure HTTP endpoint. This system allows administrators to test and debug the full processing pipeline outside of the scheduled cron execution.

## Architecture Components

### Security Layer
- **Endpoint**: `POST /manual-trigger`
- **Authentication**: Requires `X-Admin-Secret` header matching `env.CRON_SECRET`
- **Access Control**: Admin-only access with request logging
- **Rate Limiting**: Built-in protection against abuse

### Behavioral Differences: Manual vs Production Mode

#### Manual Mode (via /manual-trigger)
- **Schema Validation**: Performs database schema check before processing
- **Single Docket**: Processes only docket `02-10` for consistent testing
- **Filing Limit**: Retrieves maximum 2 filings per docket
- **Enhanced Logging**: Detailed step-by-step execution logs
- **Response Format**: Comprehensive JSON with processing details

#### Production Mode (via scheduled cron)
- **All Dockets**: Processes all active dockets in database
- **Smart Limits**: Dynamic limits (10-50 filings) based on docket activity
- **Standard Logging**: Essential logging for performance
- **Background Processing**: Fire-and-forget execution

## Pipeline Flow

### 1. Security & Validation
```
Request → Auth Check → Schema Validation (manual only) → Execution
```

### 2. Data Retrieval
```
Active Dockets → Subscription Filtering → ECFS API Integration
```

### 3. Processing Pipeline
```
Raw Filings → Jina Document Processing → Gemini AI Analysis → Enhanced Storage
```

### 4. Notification System
```
Processed Data → Queue Generation → Email Notifications → User Delivery
```

### 5. Response Generation
```
Execution Results → JSON Formatting → Client Response
```

## Usage Examples

### Local Development
```bash
# Start local development worker
npm run dev:worker

# Test manual trigger
curl -X POST "http://localhost:8787/manual-trigger" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_dev_secret" \
  -d '{"docket":"02-10"}'
```

### Production Testing
```bash
# Test production worker
curl -X POST "https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev/manual-trigger" \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: your_production_secret" \
  -d '{"docket":"02-10"}'
```

## Response Format

### Successful Execution
```json
{
  "success": true,
  "mode": "manual",
  "docket": "02-10",
  "timestamp": "2024-01-15T10:30:00Z",
  "processing": {
    "dockets_processed": 1,
    "filings_retrieved": 2,
    "documents_processed": 5,
    "ai_analyses_generated": 2,
    "notifications_queued": 3
  },
  "details": {
    "ecfs_api_calls": 1,
    "jina_extractions": 5,
    "gemini_analyses": 2,
    "database_operations": 15
  },
  "execution_time_ms": 8500
}
```

### Error Response
```json
{
  "success": false,
  "error": "Authentication failed",
  "timestamp": "2024-01-15T10:30:00Z",
  "mode": "manual"
}
```

## Security Implementation

### Authentication Flow
1. Extract `X-Admin-Secret` header from request
2. Compare with `env.CRON_SECRET` environment variable
3. Reject unauthorized requests with 401 status
4. Log all access attempts (successful and failed)

### Environment Variables
- `CRON_SECRET`: Master secret for manual trigger access
- `ECFS_API_KEY`: FCC ECFS API authentication
- `JINA_API_KEY`: Document processing service
- `GEMINI_API_KEY`: AI analysis service

## Monitoring & Logging

### Execution Metrics
- **Processing Time**: Total execution duration
- **API Calls**: Count of external service requests
- **Database Operations**: Number of database transactions
- **Success/Failure Rates**: Reliability tracking

### Log Structure
```
[TIMESTAMP] [LEVEL] [COMPONENT] Message
[2024-01-15T10:30:00Z] [INFO] [MANUAL_TRIGGER] Request received from IP
[2024-01-15T10:30:01Z] [INFO] [ECFS_CLIENT] Fetching filings for docket 02-10
[2024-01-15T10:30:03Z] [INFO] [JINA_PROCESSOR] Processing document batch
[2024-01-15T10:30:05Z] [INFO] [GEMINI_AI] Generating analysis for filing
[2024-01-15T10:30:07Z] [INFO] [NOTIFICATION_QUEUE] Queuing notifications
```

## Production Configuration

### Worker Details
- **URL**: `https://simpledcc-cron-worker.fcc-monitor-11-42.workers.dev/`
- **Database**: `simple-docketcc-db`
- **Cron Schedule**: Every 30 minutes
- **Manual Trigger**: Limited to docket `02-10` with 2 filings

### Performance Characteristics
- **Execution Time**: 5-15 seconds typical
- **Memory Usage**: ~50MB peak
- **API Rate Limits**: Respected across all services
- **Concurrent Requests**: Single execution model

## Troubleshooting

### Common Issues

#### Authentication Failures
- **Symptom**: 401 Unauthorized response
- **Solution**: Verify `X-Admin-Secret` header matches `CRON_SECRET`
- **Check**: Environment variable configuration in Cloudflare Dashboard

#### API Key Issues
- **Symptom**: Service-specific errors in logs
- **Solution**: Validate API keys in environment variables
- **Check**: ECFS_API_KEY, JINA_API_KEY, GEMINI_API_KEY

#### Database Connection Issues
- **Symptom**: Database operation failures
- **Solution**: Verify database binding in wrangler.toml
- **Check**: Database health and connection parameters

### Debug Commands

```bash
# Check worker logs
wrangler tail simpledcc-cron-worker

# Test database connectivity
curl -X POST "https://worker-url/health-check" \
  -H "X-Admin-Secret: secret"

# Validate API keys
curl -X POST "https://worker-url/api-test" \
  -H "X-Admin-Secret: secret"
```

## Development Workflow

### Local Testing
1. Start development worker: `npm run dev:worker`
2. Test manual trigger with local endpoint
3. Verify logs and response format
4. Deploy to production when stable

### Production Deployment
1. Update worker code: `wrangler deploy`
2. Verify environment variables in Cloudflare Dashboard
3. Test manual trigger with production endpoint
4. Monitor execution logs and metrics

## Future Enhancements

### Planned Features
- **Multi-docket Testing**: Support for testing multiple dockets
- **Selective Processing**: Choose specific pipeline components
- **Performance Profiling**: Detailed timing breakdown
- **Historical Comparison**: Compare execution across time periods

### Monitoring Improvements
- **Real-time Dashboards**: Live execution monitoring
- **Alert System**: Automated failure notifications
- **Performance Metrics**: Detailed analytics and trends
- **Health Checks**: Automated system validation 