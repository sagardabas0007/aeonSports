# AeonSports Match Polling Service

Complete guide to the automated match syncing and analysis system.

## Overview

The polling service automatically:
1. Fetches FIFA match data every minute
2. Updates match scores and statuses in Supabase
3. Detects when matches finish
4. **Automatically triggers AI analysis and token launches** for finished matches

## Architecture

```
Vercel Cron (every 1 minute)
    │
    ▼
GET /api/cron/sync-matches
    │
    ▼
MatchSyncService.syncMatches()
    │
    ├─► Fetch live matches from FIFA API
    ├─► Fetch upcoming matches
    ├─► Fetch finished matches
    │
    ▼
Upsert to Supabase (matches table)
    │
    ▼
Detect status changes
    │
    ▼
Match finished? ─[YES]─► Trigger Analysis Workflow
    │                         │
    │                         ├─► AI Analysis (Claude)
    │                         ├─► Token Generation
    │                         └─► Token Launch (Clanker + Flaunch)
    │
   [NO]─► Continue
```

## Files

### Core Service
**`src/services/match-sync.service.ts`**
- Main polling logic
- Match status detection
- Automatic analysis trigger

### Cron Endpoint
**`src/app/api/cron/sync-matches/route.ts`**
- Called by Vercel Cron every minute
- Secured with `CRON_SECRET`
- Executes sync workflow

### Manual Trigger
**`src/app/api/admin/trigger-sync/route.ts`**
- Manual sync for testing
- Admin-only endpoint

## Setup

### 1. Environment Variables

Add to `.env.local`:

```env
# Cron Security
CRON_SECRET=your-random-secret-here
INTERNAL_API_SECRET=your-internal-secret-here

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 2. Vercel Cron Configuration

The cron is configured in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-matches",
      "schedule": "* * * * *"
    }
  ]
}
```

Schedule: `* * * * *` = Every minute

### 3. Deploy to Vercel

```bash
vercel deploy --prod
```

Vercel will automatically:
- Detect the cron configuration
- Set up the scheduled job
- Call your endpoint every minute

### 4. Set Environment Variables in Vercel

Go to Project Settings > Environment Variables and add:
- `CRON_SECRET`
- `INTERNAL_API_SECRET`
- `NEXT_PUBLIC_APP_URL`

## Testing

### Local Testing

You can't test Vercel Cron locally, but you can test the sync logic:

```bash
# Start your dev server
npm run dev

# In another terminal, trigger a manual sync:
curl -X POST http://localhost:3000/api/admin/trigger-sync
```

### Production Testing

After deploying to Vercel:

1. **View Cron Logs**:
   - Go to Vercel Dashboard
   - Select your project
   - Go to "Logs" tab
   - Filter by `/api/cron/sync-matches`

2. **Manual Trigger** (with cron secret):
```bash
curl -X GET https://your-app.vercel.app/api/cron/sync-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## How It Works

### 1. Match Syncing

Every minute, the service:
```typescript
// Fetch from FIFA API
const [live, upcoming, finished] = await Promise.all([
  fifaApiService.getLiveFixtures(),
  fifaApiService.getUpcomingFixtures(),
  fifaApiService.getFinishedFixtures(),
]);

// Upsert to database
await supabase.from('matches').upsert(matchData);
```

### 2. Status Change Detection

```typescript
// Check if status changed
if (existingMatch.status !== newStatus) {
  statusChanges.push({
    matchId: existingMatch.id,
    oldStatus: existingMatch.status,
    newStatus: newStatus,
  });
}
```

### 3. Automatic Analysis Trigger

```typescript
// If match just finished, trigger analysis
if (newStatus === 'finished' && oldStatus !== 'finished') {
  await triggerMatchAnalysis(matchId);
}
```

The analysis trigger calls:
```
POST /api/matches/process
{
  "matchId": "uuid-here"
}
```

This API endpoint:
1. Fetches complete match data
2. Runs AI analysis with Claude
3. Determines MVP, Best Defender, Most Assists
4. Generates token metadata
5. Launches tokens on Clanker and Flaunch
6. Stores everything in Supabase

## Match Status Mapping

FIFA API status codes are mapped to our status:

| FIFA Status | AeonSports Status |
|-------------|-------------------|
| FT, AET, PEN | finished |
| LIVE, 1H, HT, 2H, ET | live |
| NS, TBD, SUSP | upcoming |

## Error Handling

The service includes comprehensive error handling:

```typescript
// Service-level try-catch
try {
  await syncMatches();
} catch (error) {
  console.error('[MatchSync] Error:', error);
  // Continue polling on next interval
}

// Individual match errors don't stop the sync
for (const fixture of allMatches) {
  try {
    await processMatch(fixture);
  } catch (error) {
    console.error(`Error processing match ${fixture.id}:`, error);
    // Continue to next match
  }
}
```

## Monitoring

### View Logs in Vercel

1. Go to your project dashboard
2. Click "Logs"
3. Search for `[MatchSync]` or `[Cron]`

### Key Log Messages

```
[Cron] Starting match sync...
[MatchSync] Fetched 45 matches from API
[MatchSync] Status change detected: 12345 live -> finished
[MatchSync] Match 12345 finished. Triggering analysis...
[MatchSync] Analysis triggered successfully for match uuid-123
[MatchSync] Launched tokens: 6
[Cron] Sync completed in 2341ms
```

## Performance

- **Average sync time**: 1-3 seconds
- **API calls per sync**: 3 (live, upcoming, finished)
- **Database operations**: ~50 upserts per sync
- **Analysis trigger**: Only on status change to finished

## Scaling Considerations

### Current (every 1 minute)
- Works well for development and moderate traffic
- ~1,440 syncs per day
- ~4,320 FIFA API calls per day

### Production Optimizations

1. **Increase interval for upcoming matches**:
```typescript
// Only sync upcoming matches every 10 minutes
if (Date.now() % 600000 < 60000) {
  await fetchUpcoming();
}
```

2. **Separate cron jobs**:
   - Live matches: every 30 seconds
   - Finished matches: every 1 minute
   - Upcoming matches: every 10 minutes

3. **Rate limiting**:
```typescript
// Add rate limiter
import { Ratelimit } from '@upstash/ratelimit';
```

## Troubleshooting

### Cron not running

**Check**:
1. Vercel dashboard shows the cron is active
2. `CRON_SECRET` is set in environment variables
3. Logs show authentication errors

**Solution**:
- Redeploy the project
- Verify `vercel.json` is committed

### Analysis not triggering

**Check**:
1. `INTERNAL_API_SECRET` is set
2. `NEXT_PUBLIC_APP_URL` points to correct URL
3. Logs show the analysis API call

**Solution**:
```bash
# Test the analysis endpoint directly
curl -X POST https://your-app.vercel.app/api/matches/process \
  -H "Content-Type: application/json" \
  -H "x-internal-secret: YOUR_SECRET" \
  -d '{"matchId": "your-match-id"}'
```

### Too many API calls

**Check**:
- FIFA API quota
- Number of matches being synced

**Solution**:
- Implement caching
- Filter by specific leagues
- Increase polling interval

## Security

### Authentication

All cron endpoints require authentication:

```typescript
const authHeader = request.headers.get('authorization');
if (authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Secrets

- `CRON_SECRET`: Used by Vercel to authenticate cron calls
- `INTERNAL_API_SECRET`: Used for internal API-to-API calls
- Never expose these in client code

## Alternative: Self-Hosted Cron

If not using Vercel, set up a cron job:

```bash
# In your server's crontab
* * * * * curl -X GET https://your-app.com/api/cron/sync-matches \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Or use services like:
- Cron-job.org
- EasyCron
- GitHub Actions (with scheduled workflows)

---

The polling service is now fully automated and will handle match updates and trigger analysis workflows automatically!
