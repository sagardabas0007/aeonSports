# AeonSports

AI-Powered Sports Tokenization Platform that transforms real-world player performance into tradable on-chain assets.

## Overview

AeonSports automatically analyzes FIFA matches and launches player-specific tokens immediately after a match concludes. Using AI analysis, the platform identifies standout performers (MVP, Best Defender, Most Assists) and creates tokens representing those players on the Base blockchain through Clanker and Flaunch launch platforms.

## Features

- **Real-time Match Tracking**: Monitor live, upcoming, and finished FIFA matches
- **AI-Powered Analysis**: AI analyzes player performance and determines award winners
- **Automatic Token Launches**: Seamlessly deploy tokens to Clanker and Flaunch on Base network
- **Beautiful UI**: Clean, fast, and optimized interface for token discovery and analytics
- **Real-time Updates**: Supabase Realtime for instant data synchronization

## Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL) with Realtime
- **AI**: AI API (AI Provider)
- **Blockchain**: Base Network, ethers.js
- **Data Source**: API-Football
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- AI API key
- API-Football API key
- Base network wallet with private key

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/sagardabas0007/aeonSports.git
cd aeonSports
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.local.example` to `.env.local`:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider AI
OPENAI_API_KEY=your_anthropic_key

# FIFA API
FIFA_API_KEY=your_api_football_key

# Base Network
BASE_RPC_URL=https://mainnet.base.org

# Treasury Wallet
TREASURY_WALLET_PRIVATE_KEY=your_private_key
TREASURY_WALLET_ADDRESS=0xC4D2b2F17A768429bEEdaeD946572F0A48afb7Cd

# Token Launch Platforms
CLANKER_API_KEY=your_clanker_key
FLAUNCH_API_KEY=your_flaunch_key
```

4. **Set up Supabase database**

Run the migration in your Supabase SQL editor:

```bash
cat supabase/migrations/20240101000000_initial_schema.sql
```

Copy and execute the SQL in your Supabase project's SQL Editor.

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

### Matches

- `GET /api/matches` - Get all matches
  - Query params: `status` (live, upcoming, finished), `sync` (true/false)
- `GET /api/matches/[id]` - Get match details with awards and tokens
- `POST /api/matches/analyze` - Analyze a finished match
  - Body: `{ matchId: string }`
- `POST /api/matches/process` - Analyze match and launch tokens
  - Body: `{ matchId: string }`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Routes (Next.js)                    │
│  /api/matches, /api/matches/analyze, /api/matches/process  │
└─────────────────────────────────────────────────────────────┘
                            │
           ┌────────────────┼────────────────┐
           ▼                ▼                ▼
    ┌──────────┐    ┌──────────────┐   ┌──────────┐
    │  FIFA    │    │   AI   │   │ Supabase │
    │   API    │    │  (Analysis)   │   │   DB     │
    └──────────┘    └──────────────┘   └──────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │ Token Launch     │
                  │ Clanker + Flaunch│
                  └──────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Base Blockchain │
                  └──────────────────┘
```

## User Flow

1. FIFA match is detected and synced to database
2. Match data is continuously tracked
3. When match finishes, user triggers analysis
4. AI analyzes player performance
5. Winners are selected (MVP, Best Defender, Most Assists)
6. Token metadata is generated for each winner
7. Tokens are launched through Clanker and Flaunch
8. Contract addresses are stored in database
9. Frontend updates automatically
10. Users can view and discover newly launched player tokens

## Database Schema

### Matches
- Stores match information from FIFA API
- Status: live, upcoming, finished

### Players
- Player information and statistics

### Match Awards
- Links matches to players with award types
- Stores AI analysis for each award

### Tokens
- Launched token information
- Contract addresses, platform, metadata

### Analysis Reports
- Full AI analysis reports for matches

## Deployment

### Deploy to Vercel

1. Push your code to GitHub

2. Connect your repository to Vercel

3. Configure environment variables in Vercel dashboard

4. Deploy

```bash
vercel deploy --prod
```

### Environment Variables for Production

Ensure all required environment variables are set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `FIFA_API_KEY`
- `TREASURY_WALLET_PRIVATE_KEY`
- `BASE_RPC_URL`
- `CLANKER_API_KEY` (optional)
- `FLAUNCH_API_KEY` (optional)

## Security Notes

- **Never commit private keys** to version control
- Use environment variables for all sensitive data
- Treasury wallet private key should only be accessible to server-side code
- Enable Row Level Security (RLS) on Supabase tables
- Use service role key only in server-side code

## Development Workflow

### Testing Match Analysis

1. Sync matches: Click "Sync Matches" on homepage
2. Wait for a match to finish
3. Navigate to match detail page
4. Trigger analysis through API:

```bash
curl -X POST http://localhost:3000/api/matches/analyze \
  -H "Content-Type: application/json" \
  -d '{"matchId": "your-match-id"}'
```

### Testing Token Launch

```bash
curl -X POST http://localhost:3000/api/matches/process \
  -H "Content-Type: application/json" \
  -d '{"matchId": "your-match-id"}'
```

## Future Enhancements

- Support for multiple sports (NBA, NFL, UFC, Cricket, F1, Esports)
- Advanced analytics dashboard
- Trading interface integration
- Token price tracking
- Social features and community
- Mobile app

## Configuration

### Treasury Wallet
- Address: `0xC4D2b2F17A768429bEEdaeD946572F0A48afb7Cd`
- Network: Base
- Used for: Token launches, transaction signing

## API Keys Required

1. **Supabase**: Create project at [supabase.com](https://supabase.com)
2. **AI Provider**: Get API key at [console.anthropic.com](https://console.anthropic.com)
3. **API-Football**: Register at [api-sports.io](https://api-sports.io)
4. **Clanker/Flaunch**: Contact platforms for API access

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---

Built with Claude Code by AI Provider
