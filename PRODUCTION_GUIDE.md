# AeonSports Production Operations Guide

Quick reference for common production operations and troubleshooting.

---

## 🚀 Quick Deploy Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>

# Roll back to previous deployment
vercel rollback <deployment-url>
```

---

## 🔑 Environment Variables Quick Reference

### Required for Deployment
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
FIFA_API_KEY=...
TREASURY_WALLET_PRIVATE_KEY=...
CRON_SECRET=...
```

### Optional (Recommended)
```bash
UPSTASH_REDIS_REST_URL=...        # Rate limiting
UPSTASH_REDIS_REST_TOKEN=...      # Rate limiting
SENTRY_DSN=...                     # Error monitoring
NEXT_PUBLIC_SENTRY_DSN=...         # Client-side errors
```

---

## 📊 Monitoring Dashboards

### Vercel Dashboard
- **URL**: https://vercel.com/dashboard
- **Check**: Deployments, Analytics, Logs, Cron Jobs

### Sentry Dashboard
- **URL**: https://sentry.io/organizations/your-org/issues/
- **Check**: Errors, Performance, Releases

### Supabase Dashboard
- **URL**: https://supabase.com/dashboard/project/_
- **Check**: Database, API, Realtime, Logs

### Upstash Dashboard
- **URL**: https://console.upstash.com
- **Check**: Redis usage, Rate limit metrics

---

## 🔍 Common Troubleshooting

### 1. Cron Jobs Not Running

**Symptoms**: Matches not syncing, queue not processing

**Solutions**:
```bash
# Check cron job status in Vercel dashboard
# Manually trigger:
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/sync-matches

# Check logs:
vercel logs --follow
```

### 2. Token Launch Failing

**Symptoms**: Tokens not launching, workflow stuck

**Check**:
1. Admin dashboard → Logs → Workflows (check error messages)
2. Wallet balance on BaseScan
3. Clanker/Flaunch API status
4. Sentry for detailed errors

**Fix**:
```bash
# Re-run workflow from admin dashboard
# Or via API:
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"matchId": "12345"}' \
  https://your-app.vercel.app/api/workflow/trigger
```

### 3. Database Connection Issues

**Symptoms**: 500 errors, data not loading

**Check**:
1. Supabase dashboard → Database → Connection pooler
2. Verify environment variables in Vercel
3. Check Supabase logs

**Fix**:
- Restart Supabase connection pooler
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check database CPU/memory usage

### 4. Rate Limiting Blocking Users

**Symptoms**: 429 errors, users can't access API

**Solutions**:
```bash
# Temporarily disable (remove Upstash env vars)
# Or increase limits in src/lib/rate-limit.ts

# Check current limits:
# - API: 10 req/min
# - Admin: 20 req/min
# - Token Launch: 5 req/hour
# - AI Analysis: 10 req/min
```

### 5. AI Analysis Timeout

**Symptoms**: Analysis stuck at "Processing", timeouts

**Check**:
1. AI API status
2. API quota and limits
3. Match data quality (incomplete data)

**Fix**:
- Increase timeout in `src/services/ai-analysis-pipeline.service.ts`
- Verify match has sufficient data
- Re-run analysis from admin dashboard

---

## 🛠️ Manual Operations

### Re-analyze a Match
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"matchId": "12345"}' \
  https://your-app.vercel.app/api/matches/analyze-v2
```

### Trigger Full Workflow
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"matchId": "12345"}' \
  https://your-app.vercel.app/api/workflow/trigger
```

### Get Admin Stats
```bash
curl https://your-app.vercel.app/api/admin/stats
```

### Delete Token
```bash
curl -X DELETE \
  https://your-app.vercel.app/api/admin/tokens/<token-id>
```

---

## 📈 Performance Optimization

### Database Queries

**Add indexes for slow queries**:
```sql
-- Index for match lookups
CREATE INDEX idx_matches_fifa_id ON matches(fifa_match_id);
CREATE INDEX idx_matches_status ON matches(status);

-- Index for token lookups
CREATE INDEX idx_tokens_match ON tokens(match_id);
CREATE INDEX idx_tokens_platform ON tokens(platform);

-- Index for jobs
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created ON jobs(created_at DESC);
```

### Caching Strategy

```typescript
// Add caching for frequently accessed data
// Example in src/app/api/admin/stats/route.ts
import { unstable_cache } from 'next/cache';

const getStats = unstable_cache(
  async () => {
    // Fetch stats
  },
  ['admin-stats'],
  { revalidate: 60 } // Cache for 60 seconds
);
```

### Optimize Images

```bash
# Add image optimization in next.config.js
# Already configured with AVIF/WebP support
```

---

## 🔒 Security Operations

### Rotate API Keys

**When**: Quarterly or if compromised

**Steps**:
1. Generate new keys in respective platforms
2. Update in Vercel environment variables
3. Trigger new deployment
4. Verify functionality
5. Revoke old keys

### Audit Security

```bash
# Check for exposed secrets
git log --all --full-history -- "*.env*"

# Run security audit
npm audit

# Check dependencies
npm outdated
```

### Review Access Logs

```sql
-- In Supabase, check recent activity
SELECT * FROM events
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- Check failed jobs
SELECT * FROM jobs
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '1 day';
```

---

## 💰 Cost Management

### Monitor Spending

| Service | Monitor | Alert At |
|---------|---------|----------|
| Vercel | Function executions | 1M/month |
| AI Provider | API requests | 100K tokens/day |
| Supabase | Database size | 500MB |
| Upstash | Redis commands | 10K/day |
| FIFA API | API calls | 10K/month |

### Optimize Costs

**Reduce AI Provider usage**:
- Cache analysis results
- Only analyze finished matches
- Batch similar requests

**Reduce FIFA API calls**:
- Cache match data
- Sync only active matches
- Use webhooks if available

**Optimize Vercel**:
- Reduce cron frequency
- Optimize function duration
- Use edge functions where possible

---

## 📊 Health Check Script

```bash
#!/bin/bash
# health-check.sh

APP_URL="https://your-app.vercel.app"

echo "Checking AeonSports health..."

# Homepage
curl -f $APP_URL > /dev/null && echo "✓ Homepage" || echo "✗ Homepage"

# API
curl -f $APP_URL/api/admin/stats > /dev/null && echo "✓ API" || echo "✗ API"

# Database (check if Supabase returns data)
RESPONSE=$(curl -s $APP_URL/api/admin/stats)
if [[ $RESPONSE == *"totalMatches"* ]]; then
  echo "✓ Database"
else
  echo "✗ Database"
fi

echo "Health check complete"
```

---

## 🚨 Emergency Procedures

### Site Down

1. Check Vercel status: https://www.vercel-status.com/
2. Check Supabase status: https://status.supabase.com/
3. Review recent deployments in Vercel
4. Roll back if needed: `vercel rollback`
5. Check Sentry for errors

### Database Emergency

1. Backup database immediately (Supabase → Database → Backup)
2. Check query performance (Supabase → Database → Query Performance)
3. Terminate long-running queries if needed
4. Scale database if CPU/memory maxed out

### Security Breach

1. Rotate all API keys immediately
2. Review access logs in Supabase
3. Check Sentry for suspicious activity
4. Update `TREASURY_WALLET_PRIVATE_KEY` and transfer funds
5. Review code for vulnerabilities
6. Increase rate limiting if needed

---

## 📞 Support Contacts

- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.com
- **AI Provider Support**: support@anthropic.com
- **Sentry Support**: support@sentry.io

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Sentry Documentation](https://docs.sentry.io)
- [Base Network Documentation](https://docs.base.org)

---

**For complete deployment guide, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
