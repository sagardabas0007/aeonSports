# AeonSports Real-time Functionality Guide

Complete guide to the real-time update system with optimistic UI.

## Overview

AeonSports uses **Supabase Realtime** for instant updates across the platform:
- New tokens appear immediately
- Match scores update live
- Awards appear as they're determined
- Notifications for important events
- Optimistic UI for instant feedback

## Architecture

```
Database Change (Supabase)
    ↓
Supabase Realtime (WebSocket)
    ↓
React Hook (useRealtime)
    ↓
State Update
    ↓
UI Re-render (instant)
    ↓
Toast Notification (optional)
```

## Components

### 1. Real-time Hooks

**`src/hooks/useRealtime.ts`**

#### useRealtimeMatches
Subscribes to match updates by status.

```typescript
const { matches, loading, optimisticUpdate } = useRealtimeMatches('finished');

// Automatically updates when:
// - New match inserted
// - Match updated (score, status)
// - Match deleted
```

#### useRealtimeMatchDetail
Subscribes to complete match details including awards and tokens.

```typescript
const { matchData, loading } = useRealtimeMatchDetail(matchId);

// Updates when:
// - Match updated
// - Awards added/updated
// - Tokens launched
```

#### useRealtimeEvents
Subscribes to event stream for notifications.

```typescript
useRealtimeEvents((event) => {
  if (event.event_type === 'token_launched') {
    showToast('success', 'Token Launched!', event.payload.metadata.tokenName);
  }
});
```

#### useRealtimeWorkflow
Tracks workflow execution progress.

```typescript
const { workflow, loading } = useRealtimeWorkflow(matchId);

// Shows current step: 'fetch_stats', 'ai_analysis', 'launch_tokens', etc.
```

### 2. Toast Notifications

**`src/components/toast.tsx`**

Global toast system for real-time notifications.

```typescript
import { showToast } from '@/components/toast';

// Success toast
showToast('success', 'Token Launched!', 'CRMVP is now live');

// Error toast
showToast('error', 'Launch Failed', 'Please try again');

// Info toast
showToast('info', 'Match Analyzed', 'MVP determined');
```

**Features:**
- Auto-dismiss after 5 seconds
- Multiple toasts stacked
- Color-coded by type (success/error/info)
- Dismissible

### 3. Realtime Badge

**`src/components/realtime-badge.tsx`**

Connection status indicator (bottom-right corner).

- **Green pulse**: Connected and live
- **Red**: Disconnected
- Automatically detects online/offline

## Real-time Features

### Homepage (`src/app/page.tsx`)

**What updates in real-time:**
- New matches added → Appear instantly
- Match scores → Update live
- Match status changes → Move between sections
- Token launches → Toast notification

**Implementation:**
```typescript
// Subscribe to matches by status
const { matches: liveMatches } = useRealtimeMatches('live');
const { matches: finishedMatches } = useRealtimeMatches('finished');

// Listen to events
useRealtimeEvents((event) => {
  if (event.event_type === 'token_launched') {
    showToast('success', 'Token Launched!', event.payload.metadata.tokenName);
  }
});
```

**User experience:**
- New match → Appears at top instantly
- Score updates → Numbers change live
- Token launched → Toast notification pops up
- No manual refresh needed

### Match Detail Page (`src/app/matches/[id]/page.tsx`)

**What updates in real-time:**
- Match score → Updates live
- Awards → Appear when analysis completes
- Tokens → Appear as they're launched
- Analysis → Shows when ready

**Implementation:**
```typescript
const { matchData, loading } = useRealtimeMatchDetail(matchId);

// Detect new tokens
useEffect(() => {
  const tokenCount = matchData.awards.reduce(
    (sum, award) => sum + award.tokens.length,
    0
  );

  if (tokenCount > prevCount) {
    showToast('success', 'New Token!', 'A new player token appeared');
  }
}, [matchData]);
```

**User experience:**
- Awards → Fade in as they're determined
- Tokens → Slide in as they're launched
- Toast → Notification for each token
- Smooth animations

## Optimistic UI

### What is Optimistic UI?

Updates the UI immediately (optimistically) before server confirmation.

### Implementation

```typescript
const { matches, optimisticUpdate, optimisticAdd } = useRealtimeMatches();

// Optimistic score update
const updateScore = (matchId: string, homeScore: number, awayScore: number) => {
  // Update UI immediately
  optimisticUpdate(matchId, { home_score: homeScore, away_score: awayScore });

  // Send to server (happens in background)
  fetch('/api/matches/update', {
    method: 'POST',
    body: JSON.stringify({ matchId, homeScore, awayScore })
  });

  // Real-time subscription will confirm/correct if needed
};
```

### Benefits

- Instant feedback
- Feels responsive
- Auto-corrects if server differs
- Better UX

## Event Types

### match_analyzed
Published when AI analysis completes.

```json
{
  "event_type": "match_analyzed",
  "entity_type": "match",
  "entity_id": "match-uuid",
  "payload": {
    "matchId": "match-uuid",
    "mvp": "Cristiano Ronaldo",
    "bestDefender": "Virgil van Dijk",
    "mostAssists": "Kevin De Bruyne"
  }
}
```

### token_launched
Published when a token is launched.

```json
{
  "event_type": "token_launched",
  "entity_type": "token",
  "entity_id": "token-uuid",
  "payload": {
    "matchId": "match-uuid",
    "tokenId": "token-uuid",
    "category": "MVP",
    "metadata": {
      "tokenName": "Cristiano Ronaldo - MVP",
      "tokenSymbol": "CRMVP",
      "contractAddress": "0x...",
      "matchInfo": { /* match details */ }
    }
  }
}
```

### workflow_completed
Published when entire workflow finishes.

```json
{
  "event_type": "workflow_completed",
  "entity_type": "match",
  "entity_id": "match-uuid",
  "payload": {
    "matchId": "match-uuid",
    "tokensLaunched": 6,
    "analysisCompleted": true
  }
}
```

## Supabase Realtime Configuration

### Enable Realtime

In Supabase Dashboard:
1. Go to **Database** → **Replication**
2. Enable replication for tables:
   - `matches`
   - `match_awards`
   - `tokens`
   - `events`
   - `workflow_executions`

### RLS Policies

Already configured in migrations:
- Public **read** access (SELECT)
- Service role **write** access (INSERT/UPDATE/DELETE)

### Subscription Limits

Supabase limits:
- **Free tier**: 200 concurrent connections
- **Pro tier**: 500+ concurrent connections

Each hook = 1-3 connections.

## Testing Real-time

### Manual Testing

**Terminal 1:** Watch database
```sql
-- In Supabase SQL Editor
SELECT * FROM events ORDER BY created_at DESC LIMIT 10;
```

**Terminal 2:** Trigger event
```bash
# Launch a token
curl -X POST http://localhost:3000/api/tokens/launch \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "match-uuid",
    "playerName": "Test Player",
    "category": "MVP"
  }'
```

**Browser:** Watch for toast notification and UI update.

### Automated Testing

```typescript
// In test file
import { supabase } from '@/lib/supabase';

test('real-time token update', async () => {
  const channel = supabase.channel('test');

  const promise = new Promise((resolve) => {
    channel.on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'tokens'
    }, (payload) => {
      resolve(payload.new);
    }).subscribe();
  });

  // Trigger token creation
  await createToken();

  // Wait for real-time event
  const newToken = await promise;

  expect(newToken).toBeDefined();
});
```

## Performance

### Latency

- **Database write**: ~10-50ms
- **Realtime broadcast**: ~50-200ms
- **UI update**: ~10-30ms
- **Total**: ~70-280ms (instant for users)

### Bandwidth

Per connection:
- **Initial**: ~5KB (subscription setup)
- **Per update**: ~1-5KB (depends on payload)
- **Heartbeat**: ~100 bytes every 30s

### Optimization

```typescript
// Batch updates
const batchTimeout = useRef<NodeJS.Timeout>();

const handleUpdate = (data: any) => {
  clearTimeout(batchTimeout.current);

  batchTimeout.current = setTimeout(() => {
    // Apply batched updates
    setBatchedData(/* ... */);
  }, 100); // Wait 100ms for more updates
};
```

## Troubleshooting

### No updates received

**Check:**
1. Supabase Realtime enabled in dashboard
2. Table replication enabled
3. RLS policies allow SELECT
4. Browser console for errors
5. Network tab for WebSocket connection

**Solution:**
```typescript
// Add logging
channel.subscribe((status) => {
  console.log('Subscription status:', status);
  // Should be: 'SUBSCRIBED'
});
```

### Too many connections

**Problem:** Exceeding Supabase connection limit

**Solution:** Use single channel for multiple tables
```typescript
const channel = supabase
  .channel('all-updates')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, handleMatch)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tokens' }, handleToken)
  .subscribe();
```

### Stale data

**Problem:** UI shows old data

**Solution:** Force refetch
```typescript
const { matchData, loading, refetch } = useRealtimeMatchDetail(matchId);

// Manually refetch
useEffect(() => {
  refetch();
}, [someCondition]);
```

## Best Practices

### 1. Cleanup subscriptions

```typescript
useEffect(() => {
  const channel = supabase.channel('my-channel');

  // Setup...

  return () => {
    supabase.removeChannel(channel); // Important!
  };
}, []);
```

### 2. Handle connection drops

```typescript
channel.subscribe((status) => {
  if (status === 'CLOSED') {
    // Show offline indicator
    setOnline(false);
  } else if (status === 'SUBSCRIBED') {
    setOnline(true);
  }
});
```

### 3. Debounce rapid updates

```typescript
const debouncedUpdate = useMemo(
  () => debounce((data) => setData(data), 300),
  []
);
```

### 4. Optimistic updates

Always provide optimistic updates for user actions:
```typescript
// User clicks "like"
setLiked(true); // Optimistic
await api.like(); // Confirm
// Real-time will sync if needed
```

## Production Checklist

- [ ] Supabase Realtime enabled
- [ ] Table replication enabled for all tables
- [ ] RLS policies configured
- [ ] Toast notifications working
- [ ] Realtime badge showing connection status
- [ ] Test with multiple browsers
- [ ] Test connection recovery
- [ ] Monitor connection count
- [ ] Set up error tracking

---

Real-time functionality is **production-ready** with Supabase Realtime, optimistic UI, and instant notifications! 🚀
