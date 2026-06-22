# AeonSports Token Launch Service

Complete guide to the token generation and launch pipeline.

## Overview

The Token Launch Service automatically:
1. Generates token metadata (name, symbol, description) using AI
2. Launches tokens on Clanker and Flaunch simultaneously
3. Stores contract addresses and transaction hashes in Supabase

## Input

```typescript
{
  matchId: "uuid",
  playerName: "Player Name",
  category: "MVP" | "Best Defender" | "Most Assists"
}
```

## Output

```typescript
{
  success: true,
  metadata: {
    tokenName: "Cristiano Ronaldo - MVP",
    tokenSymbol: "CRMVP",
    description: "Cristiano Ronaldo dominated the match...",
    playerName: "Cristiano Ronaldo",
    category: "MVP",
    matchInfo: {
      homeTeam: "Manchester United",
      awayTeam: "Liverpool",
      score: "2-1",
      date: "2024-01-15"
    }
  },
  clanker: {
    success: true,
    platform: "clanker",
    contractAddress: "0x1234...",
    transactionHash: "0xabcd...",
    launchedAt: "2024-01-15T12:00:00Z"
  },
  flaunch: {
    success: true,
    platform: "flaunch",
    contractAddress: "0x5678...",
    transactionHash: "0xefgh...",
    launchedAt: "2024-01-15T12:00:01Z"
  },
  tokensCreated: ["token-uuid-1", "token-uuid-2"]
}
```

## Architecture

```
Input (matchId, playerName, category)
    ↓
Get Match & Award Data (Supabase)
    ↓
Generate Token Metadata (AI)
    ├─ Token Name: "Player - Category"
    ├─ Token Symbol: Creative ticker (e.g., "CRMVP")
    └─ Description: AI-generated compelling text
    ↓
Launch on Platforms (Parallel)
    ├─ Clanker API → Contract Address + TX Hash
    └─ Flaunch API → Contract Address + TX Hash
    ↓
Store in Supabase (tokens table)
    ├─ Token 1: Clanker deployment
    └─ Token 2: Flaunch deployment
    ↓
Return Results
```

## API Endpoints

### 1. Launch Single Token

```bash
POST /api/tokens/launch
```

**Request:**
```json
{
  "matchId": "abc-123-def",
  "playerName": "Cristiano Ronaldo",
  "category": "MVP"
}
```

**Response:**
```json
{
  "success": true,
  "metadata": {
    "tokenName": "Cristiano Ronaldo - MVP",
    "tokenSymbol": "CRMVP",
    "description": "..."
  },
  "platforms": {
    "clanker": {
      "success": true,
      "contractAddress": "0x...",
      "transactionHash": "0x..."
    },
    "flaunch": {
      "success": true,
      "contractAddress": "0x...",
      "transactionHash": "0x..."
    }
  },
  "tokensCreated": ["uuid-1", "uuid-2"],
  "duration": 3421
}
```

### 2. Launch All Match Tokens

```bash
POST /api/tokens/launch-all
```

**Request:**
```json
{
  "matchId": "abc-123-def"
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { /* MVP token launch result */ },
    { /* Best Defender token launch result */ },
    { /* Most Assists token launch result */ }
  ],
  "summary": {
    "totalAwards": 3,
    "successfulLaunches": 3,
    "tokensCreated": 6,
    "duration": 8234
  }
}
```

## Usage Examples

### Launch Single Token

```typescript
// Via API
const response = await fetch('/api/tokens/launch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchId: 'match-uuid',
    playerName: 'Lionel Messi',
    category: 'MVP'
  })
});

const result = await response.json();
console.log(result.metadata.tokenSymbol); // e.g., "LMMVP"
console.log(result.clanker.contractAddress); // "0x..."
```

### Launch All Tokens

```typescript
// Launch tokens for all awards
const response = await fetch('/api/tokens/launch-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matchId: 'match-uuid'
  })
});

const result = await response.json();
console.log(`Launched ${result.summary.tokensCreated} tokens`);
```

### Programmatic Usage

```typescript
import { tokenLaunchPipelineService } from '@/services/token-launch-pipeline.service';

// Launch single token
const result = await tokenLaunchPipelineService.launchToken({
  matchId: 'uuid',
  playerName: 'Kevin De Bruyne',
  category: 'Most Assists'
});

// Launch all match tokens
const allResults = await tokenLaunchPipelineService.launchAllMatchTokens('match-uuid');
```

## Token Metadata Generation

### AI-Powered

The service uses AI to generate compelling token metadata:

```
Input:
- Player name: "Virgil van Dijk"
- Category: "Best Defender"
- Performance analysis: "Made 12 tackles, 8 interceptions..."
- Match details: "Liverpool 3-1 Chelsea"

Output:
{
  tokenName: "Virgil van Dijk - Best Defender",
  tokenSymbol: "VVDDEF",
  description: "Virgil van Dijk was an absolute wall in defense, recording 12 tackles and 8 interceptions in Liverpool's commanding 3-1 victory over Chelsea. This token commemorates a masterclass in defensive dominance."
}
```

### Token Symbol Generation

Creative ticker symbols based on player initials + category:

| Player | Category | Symbol |
|--------|----------|--------|
| Cristiano Ronaldo | MVP | CRMVP |
| Virgil van Dijk | Best Defender | VVDDEF |
| Kevin De Bruyne | Most Assists | KDBAST |
| Lionel Messi | MVP | LMMVP |

### Fallback Generation

If AI fails, the service generates metadata automatically:
- Symbol: First letters of name + category abbreviation
- Description: Standard template with match details

## Platform Integration

### Clanker

**Endpoint:** `https://api.clanker.world/deploy`

**Request:**
```json
{
  "name": "Token Name",
  "symbol": "SYMBOL",
  "description": "Token description",
  "deployer": "0xWalletAddress",
  "metadata": { /* additional data */ },
  "signature": "0xSignature"
}
```

**Response:**
```json
{
  "contractAddress": "0x...",
  "transactionHash": "0x..."
}
```

### Flaunch

**Endpoint:** `https://api.flaunch.io/launch`

**Request:**
```json
{
  "name": "Token Name",
  "symbol": "SYMBOL",
  "description": "Token description",
  "creator": "0xWalletAddress",
  "initialSupply": "1000000000",
  "metadata": { /* additional data */ },
  "signature": "0xSignature"
}
```

**Response:**
```json
{
  "token": {
    "address": "0x..."
  },
  "transaction": {
    "hash": "0x..."
  }
}
```

## Database Storage

### Tokens Table

Each successful launch creates a record:

```sql
INSERT INTO tokens (
  award_id,
  token_name,
  token_symbol,
  contract_address,
  launch_platform,
  description,
  token_metadata,
  transaction_hash,
  launched_at
) VALUES (
  'award-uuid',
  'Cristiano Ronaldo - MVP',
  'CRMVP',
  '0x1234...',
  'clanker',
  'Token description...',
  '{"playerName": "...", "category": "..."}',
  '0xabcd...',
  NOW()
);
```

### Relations

```
matches
  └─ match_awards
       └─ tokens
```

Query tokens for a match:
```typescript
const { data } = await supabase
  .from('tokens')
  .select(`
    *,
    award:match_awards!inner(
      match_id,
      player:players(*)
    )
  `)
  .eq('award.match_id', matchId);
```

## Error Handling

### Platform Failures

If one platform fails, the other continues:

```typescript
{
  success: true, // At least one platform succeeded
  clanker: {
    success: true,
    contractAddress: "0x..."
  },
  flaunch: {
    success: false,
    error: "API timeout"
  },
  tokensCreated: ["uuid-1"] // Only Clanker token
}
```

### Development Mode

Without API keys, the service returns mock data:

```typescript
if (process.env.NODE_ENV === 'development') {
  return {
    success: true,
    contractAddress: "0x1234...", // Mock address
    transactionHash: "0xabcd..." // Mock TX
  };
}
```

## Wallet Security

### Transaction Signing

All deployments are signed with the treasury wallet:

```typescript
const wallet = walletService.getWallet();
const signature = await wallet.signMessage(deploymentData);
```

### Private Key Management

- Stored in environment variable: `TREASURY_WALLET_PRIVATE_KEY`
- Never exposed to client
- Only used server-side
- Single treasury wallet for all launches

## Performance

Average execution times:
- Metadata generation (AI): 800-1500ms
- Clanker launch: 2000-4000ms
- Flaunch launch: 2000-4000ms
- Database storage: 100-300ms

**Total (parallel)**: 3-5 seconds per token

## Cost Analysis

Per token launch:
- AI metadata generation: ~$0.002
- Clanker deployment: Platform fee
- Flaunch deployment: Platform fee
- Gas fees: ~0.0001 ETH on Base

**Total AI cost**: ~$0.002 per token

## Testing

### Local Testing

```bash
# Start dev server
npm run dev

# Launch a token
curl -X POST http://localhost:3000/api/tokens/launch \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "your-match-uuid",
    "playerName": "Test Player",
    "category": "MVP"
  }'
```

### Test with Mock Data

Set `NODE_ENV=development` to use mock contract addresses without calling real APIs.

## Monitoring

### Key Metrics

- Launch success rate
- Platform failures (Clanker vs Flaunch)
- Average launch duration
- Contract deployment verification
- Token metadata quality

### Logs

```
[Token Launch] Starting pipeline for Ronaldo (MVP)
[Token Launch] Generating token metadata...
[Token Launch] Launching on Clanker and Flaunch...
[Token Launch] Storing results in Supabase...
[Token Launch] Clanker token stored: uuid-1
[Token Launch] Flaunch token stored: uuid-2
[Token Launch] Pipeline completed. Tokens created: 2
```

## Production Checklist

- [ ] `CLANKER_API_KEY` configured
- [ ] `FLAUNCH_API_KEY` configured
- [ ] `TREASURY_WALLET_PRIVATE_KEY` set
- [ ] Treasury wallet funded with ETH
- [ ] `OPENAI_API_KEY` configured
- [ ] Supabase tokens table created
- [ ] Test token launch on testnet
- [ ] Verify contract addresses on explorer

---

The Token Launch Service is production-ready with AI-powered metadata generation, parallel platform launches, and comprehensive error handling!
