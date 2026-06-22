import Anthropic from '@anthropic-ai/sdk';
import { getServiceSupabase } from '@/lib/supabase';
import { ApiFootballFixture, ApiFootballPlayerStats } from '@/types/fifa-api';
import { AwardType } from '@/types/database';

/**
 * Input structure for AI analysis
 */
export interface MatchAnalysisInput {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  score: {
    home: number;
    away: number;
  };
  players: PlayerStatistics[];
  matchStatistics?: {
    possession?: { home: number; away: number };
    shotsOnTarget?: { home: number; away: number };
    totalShots?: { home: number; away: number };
    corners?: { home: number; away: number };
    fouls?: { home: number; away: number };
  };
}

export interface PlayerStatistics {
  playerId: number;
  playerName: string;
  team: string;
  position: string;
  minutesPlayed: number;
  rating?: number;
  // Offensive stats
  goals: number;
  assists: number;
  shotsTotal?: number;
  shotsOnTarget?: number;
  keyPasses?: number;
  // Defensive stats
  tackles?: number;
  interceptions?: number;
  blocks?: number;
  clearances?: number;
  // Goalkeeper stats
  saves?: number;
  goalsConceded?: number;
  // Passing stats
  passesTotal?: number;
  passesAccuracy?: string;
  passesKey?: number;
  // Other stats
  duelsWon?: number;
  foulsCommitted?: number;
  foulsDrawn?: number;
  yellowCards?: number;
  redCards?: number;
}

/**
 * Output structure for AI analysis
 */
export interface MatchAnalysisOutput {
  matchId: string;
  mvp: {
    playerId: number;
    playerName: string;
    team: string;
    score: number;
    reasoning: string;
    keyStats: Record<string, any>;
  } | null;
  bestDefender: {
    playerId: number;
    playerName: string;
    team: string;
    score: number;
    reasoning: string;
    keyStats: Record<string, any>;
  } | null;
  mostAssists: {
    playerId: number;
    playerName: string;
    team: string;
    score: number;
    reasoning: string;
    keyStats: Record<string, any>;
  } | null;
  matchSummary: string;
  analysisTimestamp: string;
  modelVersion: string;
}

/**
 * AI Analysis Pipeline Service
 * Production-ready service for analyzing match performance
 */
class AiAnalysisPipelineService {
  private anthropic: Anthropic;
  private readonly MODEL = 'claude-3-5-sonnet-20241022';
  private readonly MAX_RETRIES = 3;
  private readonly TIMEOUT_MS = 30000;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is required for AI analysis');
    }

    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Main analysis pipeline
   * @param input - Match statistics and player data
   * @returns Structured analysis with MVP, Best Defender, Most Assists
   */
  async analyzeMatch(input: MatchAnalysisInput): Promise<MatchAnalysisOutput> {
    console.log(`[AI Pipeline] Starting analysis for match ${input.matchId}`);

    try {
      // Validate input
      this.validateInput(input);

      // Prepare analysis prompt
      const prompt = this.buildAnalysisPrompt(input);

      // Call Claude API with retry logic
      const analysis = await this.callClaudeWithRetry(prompt);

      // Validate and structure output
      const output = this.structureOutput(analysis, input.matchId);

      // Store results in Supabase
      await this.storeAnalysisResults(output, input);

      console.log(`[AI Pipeline] Analysis completed for match ${input.matchId}`);
      return output;
    } catch (error) {
      console.error(`[AI Pipeline] Error analyzing match ${input.matchId}:`, error);
      throw error;
    }
  }

  /**
   * Validate input data
   */
  private validateInput(input: MatchAnalysisInput): void {
    if (!input.matchId) {
      throw new Error('Match ID is required');
    }

    if (!input.players || input.players.length === 0) {
      throw new Error('Player statistics are required');
    }

    if (input.players.length < 10) {
      console.warn(`[AI Pipeline] Warning: Only ${input.players.length} players provided`);
    }
  }

  /**
   * Build analysis prompt for Claude
   */
  private buildAnalysisPrompt(input: MatchAnalysisInput): string {
    return `You are an expert football analyst. Analyze this match and determine the top performers for three awards.

MATCH DETAILS:
${input.homeTeam} ${input.score.home} - ${input.score.away} ${input.awayTeam}

${input.matchStatistics ? `MATCH STATISTICS:
Possession: ${input.matchStatistics.possession?.home}% - ${input.matchStatistics.possession?.away}%
Shots on Target: ${input.matchStatistics.shotsOnTarget?.home} - ${input.matchStatistics.shotsOnTarget?.away}
Total Shots: ${input.matchStatistics.totalShots?.home} - ${input.matchStatistics.totalShots?.away}
` : ''}

PLAYER STATISTICS:
${this.formatPlayerStats(input.players)}

TASK:
Analyze the performance data and identify:
1. **MVP (Most Valuable Player)**: Overall best performer considering all aspects of the game
2. **Best Defender**: Outstanding defensive performance (tackles, interceptions, blocks, clearances, rating)
3. **Most Assists**: Player with the most assists or highest key pass contribution

EVALUATION CRITERIA:
- MVP: Overall impact, rating, goals, assists, key actions, match influence
- Best Defender: Tackles, interceptions, blocks, clearances, duels won, defensive rating
- Most Assists: Assists, key passes, chance creation, pass accuracy

IMPORTANT RULES:
- If no player has assists, look for highest key passes or chance creation
- If defensive stats are minimal, select based on rating and defensive actions
- Score should be 0-100 (higher is better)
- Reasoning should be 3-4 sentences explaining the decision
- Include relevant statistics in keyStats

OUTPUT FORMAT (JSON only, no markdown):
{
  "matchSummary": "2-3 sentence match summary",
  "mvp": {
    "playerId": number,
    "playerName": "string",
    "team": "string",
    "score": number (0-100),
    "reasoning": "3-4 sentence explanation",
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
    "score": number (0-100),
    "reasoning": "3-4 sentence explanation",
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
    "score": number (0-100),
    "reasoning": "3-4 sentence explanation",
    "keyStats": {
      "assists": number,
      "keyPasses": number,
      "passAccuracy": "X%"
    }
  }
}

If no suitable candidate exists for an award, set it to null.
Return ONLY valid JSON, no additional text or markdown.`;
  }

  /**
   * Format player stats for prompt
   */
  private formatPlayerStats(players: PlayerStatistics[]): string {
    return players
      .map((p) => {
        const stats = [];
        stats.push(`Name: ${p.playerName} (${p.team})`);
        stats.push(`Position: ${p.position}`);
        stats.push(`Minutes: ${p.minutesPlayed}`);
        if (p.rating) stats.push(`Rating: ${p.rating}`);
        if (p.goals) stats.push(`Goals: ${p.goals}`);
        if (p.assists) stats.push(`Assists: ${p.assists}`);
        if (p.tackles) stats.push(`Tackles: ${p.tackles}`);
        if (p.interceptions) stats.push(`Interceptions: ${p.interceptions}`);
        if (p.saves) stats.push(`Saves: ${p.saves}`);
        if (p.passesTotal) stats.push(`Passes: ${p.passesTotal} (${p.passesAccuracy || 'N/A'}% acc)`);
        if (p.keyPasses) stats.push(`Key Passes: ${p.keyPasses}`);
        if (p.shotsTotal) stats.push(`Shots: ${p.shotsTotal}/${p.shotsOnTarget}`);
        if (p.blocks) stats.push(`Blocks: ${p.blocks}`);
        if (p.duelsWon) stats.push(`Duels Won: ${p.duelsWon}`);

        return stats.join(', ');
      })
      .join('\n');
  }

  /**
   * Call Claude API with retry logic
   */
  private async callClaudeWithRetry(prompt: string, retries = 0): Promise<any> {
    try {
      const response = await Promise.race([
        this.anthropic.messages.create({
          model: this.MODEL,
          max_tokens: 4096,
          temperature: 0.3, // Lower temperature for more consistent analysis
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        }),
        this.createTimeout(this.TIMEOUT_MS),
      ]);

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Parse JSON response
      const cleanedText = content.text.trim().replace(/```json\n?|\n?```/g, '');
      return JSON.parse(cleanedText);
    } catch (error: any) {
      console.error(`[AI Pipeline] Claude API error (attempt ${retries + 1}):`, error.message);

      if (retries < this.MAX_RETRIES) {
        console.log(`[AI Pipeline] Retrying... (${retries + 1}/${this.MAX_RETRIES})`);
        await this.delay(1000 * (retries + 1)); // Exponential backoff
        return this.callClaudeWithRetry(prompt, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Create timeout promise
   */
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Claude API timeout')), ms);
    });
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Structure the output
   */
  private structureOutput(analysis: any, matchId: string): MatchAnalysisOutput {
    return {
      matchId,
      mvp: analysis.mvp || null,
      bestDefender: analysis.bestDefender || null,
      mostAssists: analysis.mostAssists || null,
      matchSummary: analysis.matchSummary || 'Match analysis completed',
      analysisTimestamp: new Date().toISOString(),
      modelVersion: this.MODEL,
    };
  }

  /**
   * Store analysis results in Supabase
   */
  private async storeAnalysisResults(
    output: MatchAnalysisOutput,
    input: MatchAnalysisInput
  ): Promise<void> {
    const supabase = getServiceSupabase();

    try {
      // Store analysis report
      await supabase.from('analysis_reports').upsert(
        {
          match_id: output.matchId,
          full_analysis: output as any,
          model_version: output.modelVersion,
        },
        { onConflict: 'match_id' }
      );

      // Store match awards
      const awards = [
        { award: output.mvp, type: 'mvp' as AwardType },
        { award: output.bestDefender, type: 'best_defender' as AwardType },
        { award: output.mostAssists, type: 'most_assists' as AwardType },
      ];

      for (const { award, type } of awards) {
        if (!award) continue;

        // Create or update player
        const { data: player } = await supabase
          .from('players')
          .upsert(
            {
              external_id: award.playerId.toString(),
              name: award.playerName,
              team: award.team,
              player_data: {} as any,
            },
            { onConflict: 'external_id' }
          )
          .select()
          .single();

        if (player) {
          // Create match award
          await supabase.from('match_awards').upsert(
            {
              match_id: output.matchId,
              player_id: player.id,
              award_type: type,
              analysis: award.reasoning,
              statistics: award.keyStats as any,
            },
            { onConflict: 'match_id,award_type' }
          );
        }
      }

      console.log(`[AI Pipeline] Results stored in Supabase for match ${output.matchId}`);
    } catch (error) {
      console.error('[AI Pipeline] Error storing results in Supabase:', error);
      throw error;
    }
  }

  /**
   * Convert FIFA API data to pipeline input
   */
  convertFifaDataToInput(
    matchId: string,
    fixture: ApiFootballFixture,
    playerStats: ApiFootballPlayerStats[]
  ): MatchAnalysisInput {
    const players: PlayerStatistics[] = [];

    for (const playerData of playerStats) {
      for (const stat of playerData.statistics) {
        players.push({
          playerId: playerData.player.id,
          playerName: playerData.player.name,
          team: stat.team.name,
          position: stat.games.position,
          minutesPlayed: stat.games.minutes || 0,
          rating: stat.games.rating ? parseFloat(stat.games.rating) : undefined,
          goals: stat.goals.total || 0,
          assists: stat.goals.assists || 0,
          shotsTotal: stat.shots.total || undefined,
          shotsOnTarget: stat.shots.on || undefined,
          keyPasses: stat.passes.key || undefined,
          tackles: stat.tackles.total || undefined,
          interceptions: stat.tackles.interceptions || undefined,
          blocks: stat.tackles.blocks || undefined,
          saves: stat.goals.saves || undefined,
          goalsConceded: stat.goals.conceded || undefined,
          passesTotal: stat.passes.total || undefined,
          passesAccuracy: stat.passes.accuracy || undefined,
          passesKey: stat.passes.key || undefined,
          duelsWon: stat.duels.won || undefined,
          foulsCommitted: stat.fouls.committed || undefined,
          foulsDrawn: stat.fouls.drawn || undefined,
          yellowCards: stat.cards.yellow || 0,
          redCards: stat.cards.red || 0,
        });
      }
    }

    return {
      matchId,
      homeTeam: fixture.teams.home.name,
      awayTeam: fixture.teams.away.name,
      score: {
        home: fixture.goals.home || 0,
        away: fixture.goals.away || 0,
      },
      players: players.filter((p) => p.minutesPlayed > 0), // Only include players who played
    };
  }
}

export const aiAnalysisPipelineService = new AiAnalysisPipelineService();
