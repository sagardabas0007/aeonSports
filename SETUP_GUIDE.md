# AeonSports Setup Guide

Complete step-by-step guide to get AeonSports running locally and in production.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] AI API account
- [ ] API-Football subscription
- [ ] Base network wallet

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/sagardabas0007/aeonSports.git
cd aeonSports

# Install dependencies
npm install
```

## Step 2: Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in project details
4. Wait for project to be provisioned

### Run Database Migration

1. Go to your Supabase dashboard
2. Click "SQL Editor" in the sidebar
3. Open `supabase/migrations/20240101000000_initial_schema.sql` from your local repo
4. Copy the entire SQL content
5. Paste into Supabase SQL Editor
6. Click "Run"

### Get Supabase Keys

1. Go to Project Settings > API
2. Copy the following:
   - Project URL
   - `anon` `public` key
   - `service_role` key (keep secret!)

## Step 3: Get API Keys

### AI API Key

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new API key
5. Copy the key (you won't see it again!)

### API-Football Key

1. Visit [api-sports.io](https://api-sports.io)
2. Create an account
3. Subscribe to a plan (free tier available)
4. Go to Dashboard > API Access
5. Copy your API key

### Optional: Clanker & Flaunch API Keys

Contact the respective platforms for API access:
- Clanker: Check their documentation
- Flaunch: Check their documentation

## Step 4: Set Up Wallet

### Create or Use Existing Wallet

1. Use MetaMask or another wallet
2. Switch to Base network
3. Fund with some ETH for gas fees
4. Export private key (keep secure!)

### Treasury Wallet Address

Your treasury wallet is: `0xC4D2b2F17A768429bEEdaeD946572F0A48afb7Cd`

Make sure you have the private key for this address or update to your own address.

## Step 5: Configure Environment Variables

Create `.env.local` file:

```bash
cp .env.local.example .env.local
```

Fill in your values in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# AI Provider AI Configuration
OPENAI_API_KEY=sk-ant-api03-xxxxx

# FIFA API Configuration
FIFA_API_KEY=xxxxx

# Base Network Configuration
BASE_RPC_URL=https://mainnet.base.org

# Treasury Wallet Configuration
TREASURY_WALLET_PRIVATE_KEY=0xyour_private_key_here
TREASURY_WALLET_ADDRESS=0xC4D2b2F17A768429bEEdaeD946572F0A48afb7Cd

# Token Launch Platform APIs (Optional for MVP)
CLANKER_API_URL=https://api.clanker.world
CLANKER_API_KEY=xxxxx

FLAUNCH_API_URL=https://api.flaunch.io
FLAUNCH_API_KEY=xxxxx

NODE_ENV=development
```

## Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Step 7: Test the System

### Test Match Sync

1. Click "Sync Matches" button on homepage
2. Wait for matches to load
3. Check all three categories: Live, Upcoming, Finished

### Test Match Analysis

Use API endpoint:

```bash
curl -X POST http://localhost:3000/api/matches/analyze \
  -H "Content-Type: application/json" \
  -d '{"matchId": "YOUR_MATCH_ID"}'
```

Replace `YOUR_MATCH_ID` with an actual match ID from your database.

### Test Complete Workflow

```bash
curl -X POST http://localhost:3000/api/matches/process \
  -H "Content-Type: application/json" \
  -d '{"matchId": "YOUR_MATCH_ID"}'
```

This will:
1. Analyze the match
2. Generate token metadata
3. Launch tokens (or return mock data if APIs not configured)
4. Store everything in database

## Step 8: Verify Results

1. Go to match detail page: `http://localhost:3000/matches/YOUR_MATCH_ID`
2. Check for:
   - Match score
   - MVP award
   - Best Defender award
   - Most Assists award
   - Launched tokens with contract addresses

## Production Deployment

### Deploy to Vercel

1. Push code to GitHub:

```bash
git add .
git commit -m "Initial AeonSports setup"
git push origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables (same as `.env.local`)
6. Click "Deploy"

### Set Environment Variables in Vercel

1. Go to Project Settings > Environment Variables
2. Add all variables from your `.env.local`
3. Make sure to mark sensitive keys as "Secret"
4. Redeploy if needed

### Post-Deployment Checks

1. Visit your production URL
2. Test match sync
3. Verify database connection
4. Check API endpoints
5. Test a full match processing workflow

## Troubleshooting

### Common Issues

**Issue**: Supabase connection error
- **Solution**: Check that all Supabase keys are correct
- **Solution**: Verify database is running

**Issue**: FIFA API returning no matches
- **Solution**: Check API key is valid
- **Solution**: Verify you have API credits remaining

**Issue**: AI API error
- **Solution**: Verify AI API key
- **Solution**: Check API usage limits

**Issue**: Token launch fails
- **Solution**: In development, mock data is returned if APIs not configured
- **Solution**: For production, ensure Clanker/Flaunch API keys are set

**Issue**: Wallet transaction fails
- **Solution**: Ensure wallet has enough ETH for gas
- **Solution**: Check private key is correct
- **Solution**: Verify Base RPC URL is accessible

### Debug Mode

Enable detailed logging:

```typescript
// In any service file, add:
console.log('Debug info:', debugData);
```

Check browser console and terminal logs.

## Security Reminders

- Never commit `.env.local` to git
- Never share your private key
- Never expose service role key to client
- Keep all API keys secure
- Use environment variables for secrets

## Next Steps

After setup:

1. Monitor first few match processing workflows
2. Check token launches on BaseScan
3. Verify data accuracy
4. Set up monitoring and alerts
5. Consider adding additional sports

## Support

If you encounter issues:

1. Check the logs (browser console, terminal)
2. Review this guide
3. Check `ARCHITECTURE.md` for system details
4. Open an issue on GitHub

---

You're now ready to use AeonSports! 🚀
