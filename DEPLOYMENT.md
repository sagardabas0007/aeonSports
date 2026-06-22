# AeonSports Production Deployment Checklist

Complete guide to deploying AeonSports to production on Vercel.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Setup

#### Supabase
- [ ] Create production Supabase project at [supabase.com](https://supabase.com)
- [ ] Run all migrations in production database
- [ ] Enable Realtime for tables: `matches`, `events`, `workflow_executions`
- [ ] Configure RLS policies (currently disabled for development)
- [ ] Copy production credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

#### AI Provider (AI)
- [ ] Create production API key at [console.anthropic.com](https://console.anthropic.com)
- [ ] Set spending limits and monitoring
- [ ] Copy `OPENAI_API_KEY`

#### FIFA API
- [ ] Sign up at [api-sports.io](https://api-sports.io)
- [ ] Subscribe to Football API plan
- [ ] Copy `FIFA_API_KEY`
- [ ] Test API access

#### Base Blockchain
- [ ] Create or import treasury wallet
- [ ] Fund wallet with ETH on Base network
- [ ] Copy `TREASURY_WALLET_PRIVATE_KEY` and `TREASURY_WALLET_ADDRESS`
- [ ] **CRITICAL**: Never commit private key to git
- [ ] Verify wallet on BaseScan

#### Token Launch Platforms
- [ ] Register with Clanker API
- [ ] Register with Flaunch API
- [ ] Copy `CLANKER_API_KEY` and `FLAUNCH_API_KEY`
- [ ] Test API access

#### Upstash Redis (Rate Limiting)
- [ ] Create account at [upstash.com](https://upstash.com)
- [ ] Create Redis database
- [ ] Copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Test connection

#### Sentry (Error Monitoring)
- [ ] Create account at [sentry.io](https://sentry.io)
- [ ] Create new project for AeonSports
- [ ] Copy `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`
- [ ] Copy `SENTRY_AUTH_TOKEN` for source maps
- [ ] Configure alerts and integrations

---

## 🚀 Vercel Deployment

### Step 1: Prepare Repository

```bash
# Ensure all changes are committed
git add .
git commit -m "Production deployment preparation"
git push origin main

# Verify .gitignore includes:
# - .env*
# - .next/
# - node_modules/
# - .vercel/
```

### Step 2: Create Vercel Project

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your Git repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Configure Environment Variables

Add all environment variables in Vercel dashboard:

```bash
# Core Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_SITE_NAME=AeonSports
NEXT_PUBLIC_SITE_DESCRIPTION=AI-powered sports tokenization platform

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# AI
OPENAI_API_KEY=...

# FIFA API
FIFA_API_KEY=...
FIFA_API_BASE_URL=https://v3.football.api-sports.io

# Blockchain
BASE_RPC_URL=https://mainnet.base.org
CHAIN_ID=8453
TREASURY_WALLET_PRIVATE_KEY=...
TREASURY_WALLET_ADDRESS=0xC4D2b2F17A768429bEEdaeD946572F0A48afb7Cd

# Token Platforms
CLANKER_API_URL=https://api.clanker.world
CLANKER_API_KEY=...
FLAUNCH_API_URL=https://api.flaunch.io
FLAUNCH_API_KEY=...

# Rate Limiting
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Error Monitoring
SENTRY_DSN=...
NEXT_PUBLIC_SENTRY_DSN=...
SENTRY_AUTH_TOKEN=...
SENTRY_ORG=your-org
SENTRY_PROJECT=aeonsports

# Security
CRON_SECRET=<generate-random-32-char-string>
INTERNAL_API_SECRET=<generate-random-32-char-string>

# Logging
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

**Generate secure secrets:**
```bash
# On macOS/Linux
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Step 4: Configure Cron Jobs

In Vercel dashboard:
1. Go to "Settings" → "Cron Jobs"
2. Add cron jobs (already configured in `vercel.json`):
   - `/api/cron/sync-matches` - Every minute
   - `/api/cron/process-queue` - Every minute

Set `CRON_SECRET` as Authorization header:
```
Authorization: Bearer <your-cron-secret>
```

### Step 5: Deploy

```bash
# Deploy to production
vercel --prod

# Or let Vercel auto-deploy from GitHub
git push origin main
```

### Step 6: Custom Domain (Optional)

1. Go to "Settings" → "Domains"
2. Add your custom domain
3. Update DNS records as instructed
4. Update `NEXT_PUBLIC_APP_URL` to your domain

---

## ✅ Post-Deployment Verification

### 1. Health Checks

```bash
# Check homepage
curl https://your-domain.vercel.app

# Check API health
curl https://your-domain.vercel.app/api/admin/stats

# Check cron jobs (with auth)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-domain.vercel.app/api/cron/sync-matches
```

### 2. Database Verification

- [ ] Check Supabase dashboard for data
- [ ] Verify tables exist and RLS is configured
- [ ] Test Realtime subscriptions

### 3. Monitoring Setup

- [ ] Verify Sentry is receiving events
- [ ] Check error tracking in Sentry dashboard
- [ ] Set up alerts for critical errors
- [ ] Configure Slack/Discord notifications

### 4. Rate Limiting Test

```bash
# Test rate limiting (should fail after 10 requests)
for i in {1..15}; do
  curl https://your-domain.vercel.app/api/admin/stats
done
```

### 5. Functionality Tests

- [ ] Homepage loads and displays matches
- [ ] Real-time updates work
- [ ] Admin dashboard accessible at `/admin`
- [ ] Matches can be re-analyzed
- [ ] Token launches work
- [ ] Logs are visible
- [ ] Toast notifications appear

---

## 🔒 Security Hardening

### 1. Admin Dashboard Access

The admin dashboard at `/admin` is publicly accessible by design to allow AI trading agents to access match data and token information. No authentication is required.

### 2. Enable Supabase RLS (Optional)

Run in Supabase SQL Editor:

```sql
-- Enable RLS on all tables
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for service role (full access)
CREATE POLICY "Service role has full access" ON matches
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Repeat for all tables
```

### 3. Rotate Secrets

- [ ] Treasury wallet should use hardware wallet or KMS
- [ ] Rotate API keys quarterly
- [ ] Use Vercel's secret management
- [ ] Never log sensitive data

### 4. Configure CORS

Update `next.config.js`:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: process.env.NEXT_PUBLIC_APP_URL },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
      ],
    },
  ];
}
```

---

## 📊 Monitoring & Maintenance

### Daily Checks

- [ ] Check Sentry for new errors
- [ ] Review Vercel analytics
- [ ] Monitor cron job execution
- [ ] Check Supabase database size
- [ ] Review token launch success rate

### Weekly Tasks

- [ ] Review rate limit logs
- [ ] Check API quota usage (AI Provider, FIFA)
- [ ] Audit wallet balance
- [ ] Review failed workflows
- [ ] Clean up old logs (>30 days)

### Monthly Tasks

- [ ] Review security alerts
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review and optimize costs
- [ ] Performance audit

---

## 🐛 Troubleshooting

### Cron Jobs Not Running

1. Check Vercel dashboard → Cron Jobs
2. Verify `CRON_SECRET` is set
3. Check logs in Vercel Functions
4. Verify routes exist: `/api/cron/sync-matches`

### Rate Limiting Issues

1. Check Upstash Redis dashboard
2. Verify environment variables
3. Test Redis connection
4. Review middleware logs

### Token Launch Failures

1. Check Sentry for errors
2. Verify wallet has sufficient ETH
3. Check Clanker/Flaunch API status
4. Review workflow logs in admin dashboard
5. Check Base network status

### Database Connection Issues

1. Verify Supabase project is active
2. Check environment variables
3. Test connection with `getServiceSupabase()`
4. Review Supabase logs

### AI Analysis Failures

1. Check AI API status
2. Verify API key and quota
3. Review prompt in logs
4. Check token limits

---

## 📈 Scaling Considerations

### Optimize Cron Jobs

For high-frequency matches, consider:
- Reduce sync frequency to every 5 minutes
- Implement smart polling (only active matches)
- Use Supabase webhooks for real-time updates

### Database Optimization

- Add indexes for frequently queried fields
- Archive old matches to separate table
- Use Supabase Edge Functions for heavy queries
- Enable connection pooling

### Cost Optimization

- Monitor AI API usage
- Optimize FIFA API calls (cache responses)
- Review Vercel function execution time
- Consider Vercel Pro plan for better pricing

---

## 🎯 Production Ready Checklist

- [ ] All environment variables set in Vercel
- [ ] Cron jobs configured and running
- [ ] Rate limiting active
- [ ] Error monitoring setup (Sentry)
- [ ] Logging configured
- [ ] SEO metadata added
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Security headers enabled
- [ ] Admin authentication (optional)
- [ ] Database RLS enabled (recommended)
- [ ] Custom domain configured (optional)
- [ ] Monitoring alerts setup
- [ ] Backup strategy defined
- [ ] Documentation updated

---

## 🆘 Support

- **Vercel Issues**: [vercel.com/support](https://vercel.com/support)
- **Supabase Issues**: [supabase.com/support](https://supabase.com/support)
- **Sentry Issues**: [sentry.io/support](https://sentry.io/support)

---

**You're ready to launch AeonSports! 🚀**
