import Anthropic from '@anthropic-ai/sdk';
import { ApiFootballFixture, ApiFootballPlayerStats } from '@/types/fifa-api';
import { MatchAnalysis, PlayerAnalysis, TokenMetadata } from '@/types/ai-analysis';
import { AwardType } from '@/types/database';

class AiAnalysisService {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required');
    }

    this.anthropic = new Anthropic({
      apiKey,
    });
  }

  /**
   * Analyze match and determine award winners
   */
  async analyzeMatch(
    fixture: ApiFootballFixture,
    players: ApiFootballPlayerStats[]
  ): Promise<MatchAnalysis> {
    const prompt = this.buildAnalysisPrompt(fixture, players);

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const analysisResult = JSON.parse(content.text);

      return {
        matchId: fixture.fixture.id,
        matchSummary: analysisResult.matchSummary,
        mvp: analysisResult.mvp,
        bestDefender: analysisResult.bestDefender,
        mostAssists: analysisResult.mostAssists,
        analysisTimestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error analyzing match with Claude:', error);
      throw error;
    }
  }

  /**
   * Generate token metadata for a player award
   */
  async generateTokenMetadata(
    playerAnalysis: PlayerAnalysis,
    fixture: ApiFootballFixture
  ): Promise<TokenMetadata> {
    const awardLabels: Record<AwardType, string> = {
      mvp: 'MVP',
      best_defender: 'Best Defender',
      most_assists: 'Most Assists',
    };

    const awardLabel = awardLabels[playerAnalysis.awardType];
    const tokenSymbol = this.generateTokenSymbol(playerAnalysis.playerName, playerAnalysis.awardType);

    const prompt = `Generate a compelling token description for a sports performance token.

Player: ${playerAnalysis.playerName}
Team: ${playerAnalysis.team}
Award: ${awardLabel}
Match: ${fixture.teams.home.name} vs ${fixture.teams.away.name}
Score: ${fixture.goals.home}-${fixture.goals.away}

Performance Analysis:
${playerAnalysis.analysis}

Key Statistics:
${JSON.stringify(playerAnalysis.keyStats, null, 2)}

Generate a concise, exciting 2-3 sentence token description that highlights the player's achievement and makes this token appealing to traders. Return ONLY a JSON object with this structure:
{
  "description": "your token description here"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'gpt-4',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const result = JSON.parse(content.text);

      return {
        playerName: playerAnalysis.playerName,
        awardType: playerAnalysis.awardType,
        tokenName: `${playerAnalysis.playerName} - ${awardLabel}`,
        tokenSymbol,
        description: result.description,
        matchInfo: {
          homeTeam: fixture.teams.home.name,
          awayTeam: fixture.teams.away.name,
          score: `${fixture.goals.home}-${fixture.goals.away}`,
          date: fixture.fixture.date,
        },
      };
    } catch (error) {
      console.error('Error generating token metadata:', error);
      throw error;
    }
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(
    fixture: ApiFootballFixture,
    players: ApiFootballPlayerStats[]
  ): string {
    return `You are an expert football analyst. Analyze this match and determine the top performers for three awards: MVP, Best Defender, and Most Assists.

Match Details:
${fixture.teams.home.name} ${fixture.goals.home} - ${fixture.goals.away} ${fixture.teams.away.name}
Date: ${fixture.fixture.date}
League: ${fixture.league.name}
Status: ${fixture.fixture.status.long}

Player Statistics:
${JSON.stringify(players, null, 2)}

Based on the statistics and match context, identify:
1. MVP (Most Valuable Player) - Overall best performer considering all aspects
2. Best Defender - Outstanding defensive performance (tackles, interceptions, blocks, rating)
3. Most Assists - Player with the most assists or key passes

For each award, provide:
- Player ID and name
- Team name
- A detailed 3-4 sentence analysis explaining why they earned this award
- A performance score (0-100)
- Key statistics that support the decision

Return your analysis in this exact JSON format:
{
  "matchSummary": "2-3 sentence summary of the match",
  "mvp": {
    "playerId": number,
    "playerName": "string",
    "team": "string",
    "awardType": "mvp",
    "analysis": "detailed explanation",
    "score": number,
    "keyStats": {
      "rating": "X.X",
      "goals": number,
      "assists": number,
      "other relevant stats": value
    }
  },
  "bestDefender": {
    "playerId": number,
    "playerName": "string",
    "team": "string",
    "awardType": "best_defender",
    "analysis": "detailed explanation",
    "score": number,
    "keyStats": {
      "rating": "X.X",
      "tackles": number,
      "interceptions": number,
      "blocks": number
    }
  },
  "mostAssists": {
    "playerId": number,
    "playerName": "string",
    "team": "string",
    "awardType": "most_assists",
    "analysis": "detailed explanation",
    "score": number,
    "keyStats": {
      "assists": number,
      "keyPasses": number,
      "passAccuracy": "X%"
    }
  }
}

If there are no clear candidates for an award (e.g., no assists in the match), set that award to null.
Return ONLY the JSON, no additional text.`;
  }

  /**
   * Generate a token symbol from player name and award type
   */
  private generateTokenSymbol(playerName: string, awardType: AwardType): string {
    // Extract initials or first few letters
    const nameParts = playerName.split(' ');
    let symbol = '';

    if (nameParts.length >= 2) {
      // Use initials for multi-part names
      symbol = nameParts
        .slice(0, 2)
        .map((part) => part[0])
        .join('');
    } else {
      // Use first 3 letters for single names
      symbol = playerName.substring(0, 3);
    }

    // Add award suffix
    const suffixes: Record<AwardType, string> = {
      mvp: 'MVP',
      best_defender: 'DEF',
      most_assists: 'AST',
    };

    return `${symbol.toUpperCase()}${suffixes[awardType]}`;
  }
}

export const aiAnalysisService = new AiAnalysisService();
