import Anthropic from '@openai/api';
import { walletService } from './wallet.service';
import { getServiceSupabase } from '@/lib/supabase';
import axios from 'axios';
import { AwardType, LaunchPlatform } from '@/types/database';

/**
 * Input for token launch
 */
export interface TokenLaunchInput {
  matchId: string;
  playerName: string;
  category: 'MVP' | 'Best Defender' | 'Most Assists';
}

/**
 * Generated token metadata
 */
export interface TokenMetadata {
  tokenName: string;
  tokenSymbol: string;
  description: string;
  playerName: string;
  category: string;
  matchInfo: {
    homeTeam: string;
    awayTeam: string;
    score: string;
    date: string;
  };
}

/**
 * Token launch result for a single platform
 */
export interface PlatformLaunchResult {
  success: boolean;
  platform: LaunchPlatform;
  contractAddress?: string;
  transactionHash?: string;
  error?: string;
  launchedAt?: string;
}

/**
 * Complete token launch output
 */
export interface TokenLaunchOutput {
  success: boolean;
  metadata: TokenMetadata;
  clanker: PlatformLaunchResult;
  flaunch: PlatformLaunchResult;
  tokensCreated: string[]; // Array of token IDs in Supabase
}

/**
 * Token Launch Pipeline Service
 * Complete service for generating and launching player tokens
 */
class TokenLaunchPipelineService {
  private anthropic: Anthropic;
  private readonly MODEL = 'gpt-4';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }
    this.anthropic = new Anthropic({ apiKey });
  }

  /**
   * Main pipeline: Generate metadata → Launch on platforms → Store in Supabase
   */
  async launchToken(input: TokenLaunchInput): Promise<TokenLaunchOutput> {
    console.log(`[Token Launch] Starting pipeline for ${input.playerName} (${input.category})`);

    try {
      // Step 1: Get match and award data
      const { match, award, player } = await this.getMatchData(input);

      // Step 2: Generate token metadata with AI
      console.log('[Token Launch] Generating token metadata...');
      const metadata = await this.generateTokenMetadata(input, match, award);

      // Step 3: Launch on both platforms in parallel
      console.log('[Token Launch] Launching on Clanker and Flaunch...');
      const [clankerResult, flaunchResult] = await Promise.all([
        this.launchOnClanker(metadata),
        this.launchOnFlaunch(metadata),
      ]);

      // Step 4: Store results in Supabase
      console.log('[Token Launch] Storing results in Supabase...');
      const tokensCreated = await this.storeTokens(
        input.matchId,
        award.id,
        metadata,
        clankerResult,
        flaunchResult
      );

      const output: TokenLaunchOutput = {
        success: clankerResult.success || flaunchResult.success,
        metadata,
        clanker: clankerResult,
        flaunch: flaunchResult,
        tokensCreated,
      };

      console.log(
        `[Token Launch] Pipeline completed. Tokens created: ${tokensCreated.length}`
      );
      return output;
    } catch (error: any) {
      console.error('[Token Launch] Pipeline error:', error);
      throw error;
    }
  }

  /**
   * Get match, award, and player data from Supabase
   */
  private async getMatchData(input: TokenLaunchInput) {
    const supabase = getServiceSupabase();

    // Get match
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', input.matchId)
      .single();

    if (matchError || !match) {
      throw new Error('Match not found');
    }

    // Convert category to award type
    const awardType = this.categoryToAwardType(input.category);

    // Get award with player details
    const { data: awards, error: awardsError } = await supabase
      .from('match_awards')
      .select(
        `
        *,
        player:players(*)
      `
      )
      .eq('match_id', input.matchId)
      .eq('award_type', awardType);

    if (awardsError || !awards || awards.length === 0) {
      throw new Error(`Award not found for category: ${input.category}`);
    }

    const award = awards[0];
    const player = award.player;

    // Verify player name matches
    if (player.name.toLowerCase() !== input.playerName.toLowerCase()) {
      throw new Error(
        `Player name mismatch. Expected: ${player.name}, Got: ${input.playerName}`
      );
    }

    return { match, award, player };
  }

  /**
   * Generate token metadata using Claude AI
   */
  private async generateTokenMetadata(
    input: TokenLaunchInput,
    match: any,
    award: any
  ): Promise<TokenMetadata> {
    const prompt = `Generate token metadata for a sports performance token.

PLAYER INFORMATION:
Name: ${input.playerName}
Award: ${input.category}
Team: ${award.player.team}

MATCH INFORMATION:
${match.home_team} ${match.home_score} - ${match.away_score} ${match.away_team}
Date: ${new Date(match.match_date).toLocaleDateString()}
League: ${match.league}

PERFORMANCE ANALYSIS:
${award.analysis}

KEY STATISTICS:
${JSON.stringify(award.statistics, null, 2)}

TASK:
Generate compelling token metadata that will attract traders and collectors.

Requirements:
1. Token Name: "${input.playerName} - ${input.category}" format
2. Token Symbol: Creative 3-6 character ticker (use player initials + award abbreviation)
3. Description: Exciting 2-3 sentence description highlighting the achievement and why this token is valuable

Return ONLY a JSON object:
{
  "tokenName": "string",
  "tokenSymbol": "string (3-6 chars, uppercase)",
  "description": "string (2-3 sentences)"
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: this.MODEL,
        max_tokens: 512,
        temperature: 0.7, // Higher for creative token descriptions
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response from Claude');
      }

      const result = JSON.parse(content.text.trim().replace(/```json\n?|\n?```/g, ''));

      return {
        tokenName: result.tokenName,
        tokenSymbol: result.tokenSymbol.toUpperCase(),
        description: result.description,
        playerName: input.playerName,
        category: input.category,
        matchInfo: {
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          score: `${match.home_score}-${match.away_score}`,
          date: match.match_date,
        },
      };
    } catch (error) {
      console.error('[Token Launch] Error generating metadata:', error);

      // Fallback to simple generation
      return this.generateFallbackMetadata(input, match, award);
    }
  }

  /**
   * Fallback metadata generation if AI fails
   */
  private generateFallbackMetadata(input: TokenLaunchInput, match: any, award: any): TokenMetadata {
    const symbolMap = {
      MVP: 'MVP',
      'Best Defender': 'DEF',
      'Most Assists': 'AST',
    };

    const initials = input.playerName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();

    return {
      tokenName: `${input.playerName} - ${input.category}`,
      tokenSymbol: `${initials}${symbolMap[input.category as keyof typeof symbolMap]}`,
      description: `${input.playerName} earned ${input.category} in ${match.home_team} vs ${match.away_team}. This token represents their outstanding performance in this match.`,
      playerName: input.playerName,
      category: input.category,
      matchInfo: {
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        score: `${match.home_score}-${match.away_score}`,
        date: match.match_date,
      },
    };
  }

  /**
   * Launch token on Clanker
   */
  private async launchOnClanker(metadata: TokenMetadata): Promise<PlatformLaunchResult> {
    try {
      const clankerApiUrl = process.env.CLANKER_API_URL || 'https://api.clanker.world';
      const clankerApiKey = process.env.CLANKER_API_KEY;

      if (!clankerApiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('CLANKER_API_KEY not configured');
      }

      const wallet = walletService.getWallet();

      const tokenData = {
        name: metadata.tokenName,
        symbol: metadata.tokenSymbol,
        description: metadata.description,
        deployer: wallet.address,
        metadata: {
          playerName: metadata.playerName,
          category: metadata.category,
          match: metadata.matchInfo,
          platform: 'AeonSports',
        },
      };

      // Sign the deployment request
      const signature = await wallet.signMessage(JSON.stringify(tokenData));

      const response = await axios.post(
        `${clankerApiUrl}/deploy`,
        {
          ...tokenData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${clankerApiKey}`,
          },
          timeout: 60000, // 60 second timeout
        }
      );

      return {
        success: true,
        platform: 'clanker',
        contractAddress: response.data.contractAddress,
        transactionHash: response.data.transactionHash,
        launchedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[Token Launch] Clanker error:', error.message);

      // Development mode: return mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Token Launch] Using mock Clanker data (development mode)');
        return {
          success: true,
          platform: 'clanker',
          contractAddress: `0x${Math.random().toString(16).substring(2, 42).padEnd(40, '0')}`,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66).padEnd(64, '0')}`,
          launchedAt: new Date().toISOString(),
        };
      }

      return {
        success: false,
        platform: 'clanker',
        error: error.message,
      };
    }
  }

  /**
   * Launch token on Flaunch
   */
  private async launchOnFlaunch(metadata: TokenMetadata): Promise<PlatformLaunchResult> {
    try {
      const flaunchApiUrl = process.env.FLAUNCH_API_URL || 'https://api.flaunch.io';
      const flaunchApiKey = process.env.FLAUNCH_API_KEY;

      if (!flaunchApiKey && process.env.NODE_ENV !== 'development') {
        throw new Error('FLAUNCH_API_KEY not configured');
      }

      const wallet = walletService.getWallet();

      const tokenData = {
        name: metadata.tokenName,
        symbol: metadata.tokenSymbol,
        description: metadata.description,
        creator: wallet.address,
        initialSupply: '1000000000', // 1 billion tokens
        metadata: {
          playerName: metadata.playerName,
          category: metadata.category,
          match: metadata.matchInfo,
          platform: 'AeonSports',
        },
      };

      const message = `Launch token: ${metadata.tokenName} (${metadata.tokenSymbol})`;
      const signature = await wallet.signMessage(message);

      const response = await axios.post(
        `${flaunchApiUrl}/launch`,
        {
          ...tokenData,
          signature,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': flaunchApiKey,
          },
          timeout: 60000,
        }
      );

      return {
        success: true,
        platform: 'flaunch',
        contractAddress: response.data.token.address,
        transactionHash: response.data.transaction.hash,
        launchedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      console.error('[Token Launch] Flaunch error:', error.message);

      // Development mode: return mock data
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Token Launch] Using mock Flaunch data (development mode)');
        return {
          success: true,
          platform: 'flaunch',
          contractAddress: `0x${Math.random().toString(16).substring(2, 42).padEnd(40, '0')}`,
          transactionHash: `0x${Math.random().toString(16).substring(2, 66).padEnd(64, '0')}`,
          launchedAt: new Date().toISOString(),
        };
      }

      return {
        success: false,
        platform: 'flaunch',
        error: error.message,
      };
    }
  }

  /**
   * Store token records in Supabase
   */
  private async storeTokens(
    matchId: string,
    awardId: string,
    metadata: TokenMetadata,
    clankerResult: PlatformLaunchResult,
    flaunchResult: PlatformLaunchResult
  ): Promise<string[]> {
    const supabase = getServiceSupabase();
    const tokenIds: string[] = [];

    // Store Clanker token
    if (clankerResult.success && clankerResult.contractAddress) {
      const { data, error } = await supabase
        .from('tokens')
        .insert({
          award_id: awardId,
          token_name: metadata.tokenName,
          token_symbol: metadata.tokenSymbol,
          contract_address: clankerResult.contractAddress,
          launch_platform: 'clanker',
          description: metadata.description,
          token_metadata: metadata as any,
          transaction_hash: clankerResult.transactionHash,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Token Launch] Error storing Clanker token:', error);
      } else if (data) {
        tokenIds.push(data.id);
        console.log(`[Token Launch] Clanker token stored: ${data.id}`);
      }
    }

    // Store Flaunch token
    if (flaunchResult.success && flaunchResult.contractAddress) {
      const { data, error } = await supabase
        .from('tokens')
        .insert({
          award_id: awardId,
          token_name: metadata.tokenName,
          token_symbol: metadata.tokenSymbol,
          contract_address: flaunchResult.contractAddress,
          launch_platform: 'flaunch',
          description: metadata.description,
          token_metadata: metadata as any,
          transaction_hash: flaunchResult.transactionHash,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[Token Launch] Error storing Flaunch token:', error);
      } else if (data) {
        tokenIds.push(data.id);
        console.log(`[Token Launch] Flaunch token stored: ${data.id}`);
      }
    }

    return tokenIds;
  }

  /**
   * Convert category string to award type
   */
  private categoryToAwardType(category: string): AwardType {
    const map: Record<string, AwardType> = {
      MVP: 'mvp',
      'Best Defender': 'best_defender',
      'Most Assists': 'most_assists',
    };

    return map[category] || 'mvp';
  }

  /**
   * Batch launch tokens for all awards in a match
   */
  async launchAllMatchTokens(matchId: string): Promise<TokenLaunchOutput[]> {
    const supabase = getServiceSupabase();

    // Get all awards for the match
    const { data: awards } = await supabase
      .from('match_awards')
      .select(
        `
        *,
        player:players(*)
      `
      )
      .eq('match_id', matchId);

    if (!awards || awards.length === 0) {
      throw new Error('No awards found for match');
    }

    const results: TokenLaunchOutput[] = [];

    for (const award of awards) {
      const category = this.awardTypeToCategory(award.award_type);
      const input: TokenLaunchInput = {
        matchId,
        playerName: award.player.name,
        category,
      };

      try {
        const result = await this.launchToken(input);
        results.push(result);
      } catch (error) {
        console.error(`[Token Launch] Error launching token for ${award.player.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Convert award type to category string
   */
  private awardTypeToCategory(awardType: AwardType): 'MVP' | 'Best Defender' | 'Most Assists' {
    const map: Record<AwardType, 'MVP' | 'Best Defender' | 'Most Assists'> = {
      mvp: 'MVP',
      best_defender: 'Best Defender',
      most_assists: 'Most Assists',
    };

    return map[awardType];
  }
}

export const tokenLaunchPipelineService = new TokenLaunchPipelineService();
