# AeonSports Architecture Documentation

## System Overview

AeonSports is a full-stack application that bridges real-world sports performance data with blockchain tokenization through AI analysis.

## Core Components

### 1. Frontend Layer

**Technology**: Next.js 15 (App Router), React 19, TypeScript

**Components**:
- `app/page.tsx` - Homepage with match listings
- `app/matches/[id]/page.tsx` - Match detail page
- `components/match-card.tsx` - Match display component
- `components/token-card.tsx` - Token display component
- `components/ui/*` - shadcn/ui components

**Responsibilities**:
- Display matches by status (live, upcoming, finished)
- Show match details with scores and statistics
- Display player awards (MVP, Best Defender, Most Assists)
- Show launched tokens with contract addresses
- Real-time updates via Supabase Realtime

### 2. API Layer

**Technology**: Next.js API Routes (App Router)

**Endpoints**:

```
GET  /api/matches
POST /api/matches/analyze
POST /api/matches/process
GET  /api/matches/[id]
```

**Responsibilities**:
- Fetch and sync match data from FIFA API
- Trigger AI analysis
- Orchestrate token launches
- Query database for frontend

### 3. Service Layer

**Services**:

#### FIFA API Service (`services/fifa-api.service.ts`)
- Fetches live, upcoming, and finished matches
- Retrieves player statistics
- Gets match details and statistics

#### AI Analysis Service (`services/ai-analysis.service.ts`)
- Analyzes match performance using AI API
- Determines award winners (MVP, Best Defender, Most Assists)
- Generates token metadata and descriptions
- Returns structured analysis reports

#### Token Launch Service (`services/token-launch.service.ts`)
- Launches tokens on Clanker platform
- Launches tokens on Flaunch platform
- Handles transaction signing
- Verifies token deployment

#### Wallet Service (`services/wallet.service.ts`)
- Manages treasury wallet
- Signs transactions
- Interacts with Base network

### 4. Database Layer

**Technology**: Supabase (PostgreSQL)

**Tables**:

```sql
matches
├── id (uuid, primary key)
├── external_id (varchar, unique)
├── home_team, away_team (varchar)
├── home_score, away_score (integer)
├── status (varchar)
├── match_date (timestamptz)
└── match_data (jsonb)

players
├── id (uuid, primary key)
├── external_id (varchar, unique)
├── name (varchar)
├── team (varchar)
└── player_data (jsonb)

match_awards
├── id (uuid, primary key)
├── match_id (uuid, foreign key)
├── player_id (uuid, foreign key)
├── award_type (varchar)
├── analysis (text)
└── statistics (jsonb)

tokens
├── id (uuid, primary key)
├── award_id (uuid, foreign key)
├── token_name (varchar)
├── token_symbol (varchar)
├── contract_address (varchar, unique)
├── launch_platform (varchar)
└── description (text)

analysis_reports
├── id (uuid, primary key)
├── match_id (uuid, foreign key)
└── full_analysis (jsonb)
```

**Features**:
- Row Level Security (RLS) enabled
- Public read access
- Server-side writes via service role key
- Realtime subscriptions for live updates

### 5. External Integrations

#### API-Football
- **Purpose**: Match data source
- **Endpoints Used**:
  - `/fixtures` - Get matches by status
  - `/fixtures/players` - Get player statistics
  - `/fixtures/statistics` - Get match statistics

#### AI API (AI Provider)
- **Purpose**: AI analysis
- **Model**: gpt-4
- **Use Cases**:
  - Player performance analysis
  - Award winner determination
  - Token description generation

#### Clanker
- **Purpose**: Token launch platform
- **Network**: Base
- **Integration**: API-based deployment

#### Flaunch
- **Purpose**: Token launch platform
- **Network**: Base
- **Integration**: API-based deployment

#### Base Network
- **Purpose**: Blockchain for token deployment
- **RPC**: https://mainnet.base.org
- **Chain ID**: 8453

## Data Flow

### Match Processing Workflow

```
1. FIFA Match Finishes
   │
   ▼
2. User Triggers Processing (/api/matches/process)
   │
   ▼
3. Fetch Match Data (FIFA API)
   ├── Fixture details
   ├── Player statistics
   └── Match statistics
   │
   ▼
4. AI Analysis (AI API)
   ├── Analyze player performance
   ├── Determine MVP
   ├── Determine Best Defender
   └── Determine Most Assists
   │
   ▼
5. Store Results (Supabase)
   ├── Create/update players
   ├── Create match awards
   └── Store analysis report
   │
   ▼
6. Generate Token Metadata (AI API)
   └── For each award winner
   │
   ▼
7. Launch Tokens (Clanker + Flaunch)
   ├── Sign transaction with treasury wallet
   ├── Deploy to Clanker
   └── Deploy to Flaunch
   │
   ▼
8. Store Token Records (Supabase)
   └── Contract addresses, tx hashes
   │
   ▼
9. Frontend Updates (Realtime)
   └── Display new tokens
```

## Security Architecture

### Secrets Management
- Environment variables for all sensitive data
- Private key stored securely, never logged
- Service role key used only server-side
- API keys in environment variables

### Authentication & Authorization
- Supabase RLS for database security
- Public read access for match/token data
- Server-side writes via service role
- No user authentication (public platform)

### Transaction Security
- Server-side signing only
- Treasury wallet controlled by environment
- Transaction verification before storage

## Scalability Considerations

### Current Implementation
- Next.js API routes handle requests
- Supabase handles database scaling
- Vercel handles frontend scaling

### Future Optimizations
- Queue system for match processing (Bull, BullMQ)
- Caching layer (Redis) for match data
- Background workers for token launches
- Rate limiting on API endpoints
- Webhook-based match updates

## Error Handling

### API Level
- Try-catch blocks for all async operations
- Proper HTTP status codes
- Error messages in JSON responses

### Service Level
- Service-specific error handling
- Fallback to mock data in development
- Detailed error logging

### Frontend Level
- Loading states for async operations
- Error boundaries for React components
- User-friendly error messages

## Monitoring & Logging

### Current Logging
- Console logs for debugging
- Error logs for failures

### Recommended Additions
- Structured logging (Pino, Winston)
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Database query monitoring (Supabase Dashboard)

## Testing Strategy

### Unit Tests
- Service functions
- Utility functions
- Component logic

### Integration Tests
- API endpoints
- Database operations
- External API calls

### E2E Tests
- User workflows
- Match processing flow
- Token launch flow

## Deployment

### Vercel Deployment
- Automatic builds on push
- Environment variables via dashboard
- Edge functions for API routes
- Global CDN for static assets

### Database Migrations
- Manual SQL execution in Supabase
- Version controlled migration files
- Rollback strategy with backups

## Performance Optimization

### Frontend
- React Server Components for static content
- Client components for interactive features
- Image optimization with Next.js Image
- Code splitting with dynamic imports

### Backend
- Database indexes on frequently queried columns
- Parallel API calls where possible
- Response caching for static data

### Database
- Indexes on foreign keys
- JSONB for flexible data storage
- Efficient query patterns

## Future Architecture Enhancements

### Microservices
- Separate match sync service
- Dedicated AI analysis service
- Token launch worker service

### Event-Driven Architecture
- Event bus for match status changes
- Pub/sub for real-time updates
- Queue-based processing

### Multi-Sport Support
- Sport-specific analysis modules
- Configurable award types
- Sport-agnostic database schema

### Advanced Features
- Token price tracking integration
- Trading interface
- Analytics dashboard
- Mobile application

---

This architecture is designed to be maintainable, scalable, and secure while providing a solid foundation for future enhancements.
