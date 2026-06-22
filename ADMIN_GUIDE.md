# AeonSports Admin Dashboard Guide

Complete guide to the admin dashboard for managing matches, tokens, and monitoring the system.

## Access

Navigate to: `/admin`

## Features

### 1. Dashboard Overview

**URL**: `/admin`

**Features:**
- Total matches count
- Finished matches count
- Total tokens launched
- Pending jobs count
- Quick action links

### 2. Matches Management

**URL**: `/admin/matches`

**Features:**
- View all matches in a table
- Filter by status
- See match details
- **Re-run Analysis**: Trigger AI analysis again
- **Full Workflow**: Queue complete workflow (analysis + token launch)
- View match on public site

**Actions:**
- **Re-analyze**: Runs only AI analysis (`POST /api/matches/analyze-v2`)
- **Full Workflow**: Runs complete pipeline (`POST /api/workflow/trigger`)

**Use Cases:**
- Re-analyze if AI gave wrong results
- Launch tokens for matches that failed
- Test the system with specific matches

### 3. Tokens Management

**URL**: `/admin/tokens`

**Features:**
- View all launched tokens
- See token details (name, symbol, contract, platform)
- Delete tokens
- View on BaseScan
- Manual token launch (coming soon)

**Actions:**
- **Delete**: Removes token from database (doesn't affect blockchain)
- **View on BaseScan**: Opens token contract on block explorer

**Use Cases:**
- Remove test tokens
- Clean up duplicates
- Monitor token launches

### 4. System Logs

**URL**: `/admin/logs`

**Three Log Types:**

#### Jobs
- All queue jobs
- Status (pending, processing, completed, failed)
- Attempts and max attempts
- Error messages
- Created timestamp

#### Events
- All published events
- Event types (match_analyzed, token_launched, etc.)
- Entity information
- Payload data

#### Workflows
- Workflow executions
- Current step
- Status (running, completed, failed)
- Error messages if any

**Use Cases:**
- Debug failed workflows
- Monitor system activity
- Track token launches
- Identify errors

## API Endpoints

### Admin Stats
```bash
GET /api/admin/stats

Response:
{
  "totalMatches": 45,
  "finishedMatches": 20,
  "totalTokens": 120,
  "pendingJobs": 3
}
```

### All Tokens
```bash
GET /api/admin/tokens

Response:
{
  "tokens": [...]
}
```

### Delete Token
```bash
DELETE /api/admin/tokens/{id}

Response:
{
  "success": true,
  "message": "Token deleted"
}
```

### Get Logs
```bash
GET /api/admin/logs?type=jobs

Query params:
- type: "jobs" | "events" | "workflows"

Response:
{
  "logs": [...]
}
```

## UI Components (shadcn/ui)

### Table
Displays data in tabular format with sorting and styling.

### Button
Multiple variants:
- `default` - Primary action
- `destructive` - Delete/dangerous actions
- `outline` - Secondary actions
- `ghost` - Minimal actions

### Badge
Color-coded status indicators:
- Green - Success/completed
- Red - Error/failed
- Blue - Processing/running
- Yellow - Pending/warning

### Dialog
Modal dialogs for confirmations and forms.

## Workflows

### Re-analyze Match

```
Admin clicks "Re-analyze"
    ↓
POST /api/matches/analyze-v2
    ↓
Fetch match data from FIFA API
    ↓
Run AI analysis
    ↓
Store results in Supabase
    ↓
Toast notification
```

### Full Workflow

```
Admin clicks "Full Workflow"
    ↓
POST /api/workflow/trigger
    ↓
Add job to queue
    ↓
Queue processor picks up job
    ↓
Execute complete workflow:
  1. Fetch stats
  2. AI analysis
  3. Launch tokens (×6)
  4. Publish events
    ↓
Toast notification
```

### Delete Token

```
Admin clicks Delete
    ↓
Confirmation dialog
    ↓
Admin confirms
    ↓
DELETE /api/admin/tokens/{id}
    ↓
Remove from database
    ↓
Refresh list
    ↓
Toast notification
```

## Security

### Current Implementation
- **Public Access**: Admin dashboard is publicly accessible at `/admin`
- **By Design**: No authentication required to allow AI trading agents to access data
- **Rate Limiting**: API endpoints are rate-limited (see middleware.ts)
- **Direct Database Access**: Using Supabase service role key for operations

### Security Features

1. **Rate Limiting** (Already Implemented)
   - Admin endpoints: 20 requests/minute
   - API endpoints: 10 requests/minute
   - See `src/middleware.ts` and `src/lib/rate-limit.ts`

2. **Security Headers** (Already Implemented)
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection enabled
   - See `src/middleware.ts` and `next.config.js`

3. **Cron Job Protection** (Already Implemented)
   - Requires CRON_SECRET for authentication
   - See `src/middleware.ts`

4. **Environment Variables**
   - All secrets stored in environment variables
   - Never committed to version control

## Common Tasks

### 1. Re-process Failed Match

```
1. Go to /admin/matches
2. Find the finished match
3. Click "Full Workflow"
4. Wait for completion
5. Check /admin/logs for status
6. View tokens in /admin/tokens
```

### 2. Clean Up Test Tokens

```
1. Go to /admin/tokens
2. Find test tokens
3. Click Delete icon
4. Confirm deletion
5. Token removed from list
```

### 3. Debug Failed Workflow

```
1. Go to /admin/logs
2. Switch to "Workflows" tab
3. Find failed workflow
4. Check error message
5. Check current_step to see where it failed
6. Switch to "Jobs" tab
7. Find corresponding job
8. Check job error for details
```

### 4. Monitor System Health

```
1. Go to /admin (dashboard)
2. Check pending jobs count
3. Go to /admin/logs
4. Switch to "Jobs" tab
5. Look for failed jobs
6. Investigate errors
```

## Tips & Tricks

### 1. Bulk Re-process
To re-process multiple matches, use the API:

```bash
for match_id in $(cat match_ids.txt); do
  curl -X POST http://localhost:3000/api/workflow/trigger \
    -H "Content-Type: application/json" \
    -d "{\"matchId\": \"$match_id\"}"
done
```

### 2. Export Logs
```sql
-- In Supabase SQL Editor
COPY (
  SELECT * FROM jobs
  WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '1 day'
) TO '/tmp/failed_jobs.csv' CSV HEADER;
```

### 3. Monitor in Real-time
Open browser console and run:

```javascript
const ws = new WebSocket('wss://your-supabase-url/realtime/v1/websocket');
ws.onmessage = (event) => console.log(JSON.parse(event.data));
```

### 4. Quick Stats Query
```sql
SELECT
  status,
  COUNT(*) as count
FROM jobs
GROUP BY status;
```

## Keyboard Shortcuts (Future)

- `Ctrl + K` - Quick search
- `R` - Refresh current view
- `N` - New action
- `?` - Show help

## Mobile Support

Admin dashboard is responsive:
- Desktop: Full table view
- Tablet: Scrollable tables
- Mobile: Stacked card view (coming soon)

## Performance

- Paginated results (50 per page)
- Lazy loading
- Cached stats (5 minutes)
- Debounced searches

## Future Features

1. **Analytics Dashboard**
   - Success rate charts
   - Token launch timeline
   - Match processing time graph

2. **Bulk Actions**
   - Select multiple matches
   - Batch re-analyze
   - Bulk delete tokens

3. **Advanced Filters**
   - Date range filter
   - Status filter
   - Platform filter

4. **Export Data**
   - CSV export
   - JSON export
   - API export

5. **Manual Token Launch**
   - Form for token details
   - Platform selection
   - Instant launch

6. **System Settings**
   - Configure cron intervals
   - Set API quotas
   - Manage API keys

---

The admin dashboard is production-ready with comprehensive match management, token control, and system monitoring! 🚀
