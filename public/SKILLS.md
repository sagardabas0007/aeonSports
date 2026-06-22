# AeonSports Agent Skill

**Purpose**: Trade player tokens launched after FIFA matches on the AeonSports platform.

---

## Available Data

Each token contains:

- **Player Name**
- **Match Information**
- **Award Category**:
  - MVP
  - Best Defender
  - Most Assists
- **Match Statistics**
- **AI Generated Analysis**

---

## Trading Rules

### MVP Tokens

**Confidence Score Calculation**:
- Goal = +25
- Assist = +15
- Match Winner = +20
- Man of the Match = +40

**Buy Threshold**: Score > 70

**Example**:
```
Player: Messi
Goals: 2 (50 points)
Assists: 1 (15 points)
Match Winner: Yes (20 points)
Total: 85 points → BUY
```

### Best Defender Tokens

**Confidence Score Calculation**:
- Clean Sheet = +25
- Interception = +5
- Tackle Won = +3
- Blocks = +3

**Buy Threshold**: Score > 60

**Example**:
```
Player: Van Dijk
Clean Sheet: Yes (25 points)
Interceptions: 5 (25 points)
Tackles Won: 8 (24 points)
Total: 74 points → BUY
```

### Most Assists Tokens

**Confidence Score Calculation**:
- Assist = +20
- Key Pass = +5
- Chance Created = +3

**Buy Threshold**: Score > 65

**Example**:
```
Player: De Bruyne
Assists: 3 (60 points)
Key Passes: 4 (20 points)
Chances Created: 5 (15 points)
Total: 95 points → BUY
```

---

## Risk Management

### Position Sizing
- **Maximum Position Size**: 2% of portfolio per token
- **Maximum Exposure**: 10% of portfolio across all player tokens

### Exit Rules
- **Stop Loss**: -20% (exit if token drops 20% from entry)
- **Take Profit**: +50% (exit if token gains 50% from entry)

**Example**:
```
Portfolio: $10,000
Max per position: $200 (2%)
Max total exposure: $1,000 (10%)
Max positions: 5 tokens

Entry: $100
Stop Loss: $80 (-20%)
Take Profit: $150 (+50%)
```

---

## API Endpoints

### Base URL
```
https://aeonsports.vercel.app
```

### 1. Get All Matches
```http
GET /api/matches
```

**Response**:
```json
{
  "matches": [
    {
      "id": "123",
      "fifa_match_id": "456",
      "home_team": "Real Madrid",
      "away_team": "Barcelona",
      "home_score": 2,
      "away_score": 1,
      "status": "finished",
      "match_date": "2025-01-15T20:00:00Z"
    }
  ]
}
```

### 2. Get All Tokens
```http
GET /api/tokens
```

**Response**:
```json
{
  "tokens": [
    {
      "id": "1",
      "match_id": "123",
      "player_name": "Lionel Messi",
      "token_name": "MESSI-MVP-456",
      "token_symbol": "MVP-MESSI",
      "award_type": "mvp",
      "contract_address": "0x1234...",
      "platform": "clanker",
      "launched_at": "2025-01-15T22:00:00Z"
    }
  ]
}
```

### 3. Get Token by Symbol
```http
GET /api/token/{symbol}
```

**Example**: `GET /api/token/MVP-MESSI`

**Response**:
```json
{
  "token": {
    "id": "1",
    "player_name": "Lionel Messi",
    "token_symbol": "MVP-MESSI",
    "award_type": "mvp",
    "contract_address": "0x1234...",
    "metadata": {
      "player_stats": {
        "goals": 2,
        "assists": 1
      }
    }
  }
}
```

### 4. Get Match Analysis
```http
GET /api/analysis/{matchId}
```

**Example**: `GET /api/analysis/123`

**Response**:
```json
{
  "analysis": {
    "match_id": "123",
    "mvp": {
      "player_name": "Lionel Messi",
      "rationale": "Scored 2 goals and provided 1 assist in winning effort",
      "stats": {
        "goals": 2,
        "assists": 1,
        "rating": 9.5
      }
    },
    "best_defender": {
      "player_name": "Virgil van Dijk",
      "rationale": "Kept clean sheet with 8 tackles and 5 interceptions",
      "stats": {
        "tackles": 8,
        "interceptions": 5,
        "blocks": 3,
        "clean_sheet": true
      }
    },
    "most_assists": {
      "player_name": "Kevin De Bruyne",
      "rationale": "3 assists with 4 key passes created",
      "stats": {
        "assists": 3,
        "key_passes": 4,
        "chances_created": 5
      }
    }
  }
}
```

---

## Agent Instructions

### 1. Monitor New Matches
```
Poll GET /api/matches every minute
Filter matches with status = "finished"
Identify new finished matches
```

### 2. Fetch Analysis
```
For each new finished match:
GET /api/analysis/{matchId}
Extract player stats for MVP, Best Defender, Most Assists
```

### 3. Calculate Confidence Scores

**For MVP Token**:
```python
score = (goals * 25) + (assists * 15) + (match_winner * 20) + (man_of_match * 40)
if score > 70:
    buy_signal = True
```

**For Best Defender Token**:
```python
score = (clean_sheet * 25) + (interceptions * 5) + (tackles * 3) + (blocks * 3)
if score > 60:
    buy_signal = True
```

**For Most Assists Token**:
```python
score = (assists * 20) + (key_passes * 5) + (chances_created * 3)
if score > 65:
    buy_signal = True
```

### 4. Check Risk Limits
```
current_exposure = sum(all_position_values)
portfolio_value = get_portfolio_value()

if current_exposure < (portfolio_value * 0.10):
    can_trade = True
else:
    can_trade = False
```

### 5. Execute Trade
```
If buy_signal AND can_trade:
    position_size = portfolio_value * 0.02
    GET /api/token/{symbol} to get contract_address
    Execute buy on DEX using contract_address
    Set stop_loss = entry_price * 0.80
    Set take_profit = entry_price * 1.50
```

### 6. Monitor Positions
```
For each open position:
    current_price = get_token_price(contract_address)
    
    if current_price <= stop_loss:
        execute_sell()
    
    if current_price >= take_profit:
        execute_sell()
```

---

## Example Trading Flow

### Step 1: Discover Finished Match
```http
GET /api/matches
→ Match 123: Real Madrid 2-1 Barcelona (finished)
```

### Step 2: Get Analysis
```http
GET /api/analysis/123
→ MVP: Messi (2 goals, 1 assist)
→ Best Defender: Van Dijk (clean sheet, 8 tackles, 5 interceptions)
→ Most Assists: De Bruyne (3 assists, 4 key passes)
```

### Step 3: Calculate Scores
```
MVP Score = (2 * 25) + (1 * 15) + 20 + 40 = 125 ✓ > 70
Defender Score = 25 + (5 * 5) + (8 * 3) + 0 = 74 ✓ > 60
Assists Score = (3 * 20) + (4 * 5) + 0 = 80 ✓ > 65
```

### Step 4: Check Risk Limits
```
Portfolio: $10,000
Current Exposure: $400 (4%)
Can add: 3 positions (max $600 more)
```

### Step 5: Get Tokens
```http
GET /api/tokens
→ Find MVP-MESSI, DEF-VANDIJK, AST-KDB
→ Get contract addresses
```

### Step 6: Execute Trades
```
Buy MVP-MESSI: $200
Buy DEF-VANDIJK: $200
Buy AST-KDB: $200
Total Exposure: $1,000 (10%) ✓
```

### Step 7: Set Exit Orders
```
For each position:
Stop Loss: -20%
Take Profit: +50%
```

---

## Code Example (Python)

```python
import requests
import time

BASE_URL = "https://aeonsports.vercel.app"
PORTFOLIO_VALUE = 10000
MAX_POSITION_SIZE = 0.02
MAX_EXPOSURE = 0.10

def calculate_mvp_score(stats):
    score = (
        stats.get('goals', 0) * 25 +
        stats.get('assists', 0) * 15 +
        (20 if stats.get('match_winner') else 0) +
        (40 if stats.get('man_of_match') else 0)
    )
    return score

def calculate_defender_score(stats):
    score = (
        (25 if stats.get('clean_sheet') else 0) +
        stats.get('interceptions', 0) * 5 +
        stats.get('tackles', 0) * 3 +
        stats.get('blocks', 0) * 3
    )
    return score

def calculate_assists_score(stats):
    score = (
        stats.get('assists', 0) * 20 +
        stats.get('key_passes', 0) * 5 +
        stats.get('chances_created', 0) * 3
    )
    return score

def get_finished_matches():
    response = requests.get(f"{BASE_URL}/api/matches")
    matches = response.json().get('matches', [])
    return [m for m in matches if m['status'] == 'finished']

def get_analysis(match_id):
    response = requests.get(f"{BASE_URL}/api/analysis/{match_id}")
    return response.json().get('analysis', {})

def should_buy_mvp(analysis):
    mvp = analysis.get('mvp', {})
    stats = mvp.get('stats', {})
    score = calculate_mvp_score(stats)
    return score > 70

def should_buy_defender(analysis):
    defender = analysis.get('best_defender', {})
    stats = defender.get('stats', {})
    score = calculate_defender_score(stats)
    return score > 60

def should_buy_assists(analysis):
    assists = analysis.get('most_assists', {})
    stats = assists.get('stats', {})
    score = calculate_assists_score(stats)
    return score > 65

# Main trading loop
while True:
    matches = get_finished_matches()
    
    for match in matches:
        analysis = get_analysis(match['id'])
        
        # Check each award category
        if should_buy_mvp(analysis):
            print(f"BUY Signal: MVP token for {analysis['mvp']['player_name']}")
            # Execute trade logic here
        
        if should_buy_defender(analysis):
            print(f"BUY Signal: Defender token for {analysis['best_defender']['player_name']}")
            # Execute trade logic here
        
        if should_buy_assists(analysis):
            print(f"BUY Signal: Assists token for {analysis['most_assists']['player_name']}")
            # Execute trade logic here
    
    time.sleep(60)  # Check every minute
```

---

## Important Notes

1. **Real-time Monitoring**: Poll `/api/matches` every minute for new finished matches
2. **Token Availability**: Tokens are launched ~30 minutes after match finishes
3. **Contract Addresses**: Always get from API, never hardcode
4. **Risk Management**: Strictly follow position sizing and exposure limits
5. **Slippage**: Account for 1-2% slippage on DEX trades
6. **Gas Fees**: Factor in Base network gas fees (usually <$0.01)

---

## Support

- **API Base URL**: https://aeonsports.vercel.app
- **Network**: Base Mainnet (Chain ID: 8453)
- **Token Standard**: ERC-20

---

**Trade responsibly. Always follow risk management rules. Past performance doesn't guarantee future results.**
