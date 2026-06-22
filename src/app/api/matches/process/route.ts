import { NextRequest, NextResponse } from 'next/server';
import { fifaApiService } from '@/services/fifa-api.service';
import { aiAnalysisPipelineService } from '@/services/ai-analysis-pipeline.service';
import { tokenLaunchService } from '@/services/token-launch.service';
import { getServiceSupabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/matches/process
 * Complete workflow: Analyze match + Launch tokens
 */
export async function POST(request: NextRequest) {
  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // Get match from database
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    if (match.status !== 'finished') {
      return NextResponse.json(
        { error: 'Can only process finished matches' },
        { status: 400 }
      );
    }

    // Fetch complete match data from FIFA API
    const fixtureId = parseInt(match.external_id);
    const { fixture, players } = await fifaApiService.getCompleteMatchData(fixtureId);

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    // Convert to pipeline input and analyze match with AI
    console.log('Analyzing match...');
    const pipelineInput = aiAnalysisPipelineService.convertFifaDataToInput(
      matchId,
      fixture,
      players
    );
    const analysis = await aiAnalysisPipelineService.analyzeMatch(pipelineInput);

    // Analysis already stored in Supabase by pipeline
    // Process awards and launch tokens
    const awards = [analysis.mvp, analysis.bestDefender, analysis.mostAssists].filter(
      Boolean
    );

    const launchedTokens: any[] = [];

    for (const award of awards) {
      if (!award) continue;

      // Get the match award that was created by the pipeline
      const { data: matchAward } = await supabase
        .from('match_awards')
        .select('*')
        .eq('match_id', matchId)
        .eq('player_id', (
          await supabase
            .from('players')
            .select('id')
            .eq('external_id', award.playerId.toString())
            .single()
        ).data?.id)
        .single();

      if (!matchAward) {
        console.warn(`Match award not found for player ${award.playerName}`);
        continue;
      }

      // Generate token metadata (using old service for now)
      console.log(`Generating token metadata for ${award.playerName}...`);
      const { aiAnalysisService } = await import('@/services/ai-analysis.service');
      const tokenMetadata = await aiAnalysisService.generateTokenMetadata(
        {
          ...award,
          awardType: matchAward.award_type,
          analysis: award.reasoning,
        },
        fixture
      );

      // Launch tokens on both platforms
      console.log(`Launching tokens for ${award.playerName}...`);
      const { clanker, flaunch } = await tokenLaunchService.launchOnBothPlatforms(
        tokenMetadata
      );

      // Store token records
      const tokens = [];

      if (clanker.success && clanker.contractAddress) {
        const { data: token } = await supabase
          .from('tokens')
          .insert({
            award_id: matchAward.id,
            token_name: tokenMetadata.tokenName,
            token_symbol: tokenMetadata.tokenSymbol,
            contract_address: clanker.contractAddress,
            launch_platform: 'clanker',
            description: tokenMetadata.description,
            token_metadata: tokenMetadata as any,
            transaction_hash: clanker.transactionHash,
          })
          .select()
          .single();

        if (token) tokens.push(token);
      }

      if (flaunch.success && flaunch.contractAddress) {
        const { data: token } = await supabase
          .from('tokens')
          .insert({
            award_id: matchAward.id,
            token_name: tokenMetadata.tokenName,
            token_symbol: tokenMetadata.tokenSymbol,
            contract_address: flaunch.contractAddress,
            launch_platform: 'flaunch',
            description: tokenMetadata.description,
            token_metadata: tokenMetadata as any,
            transaction_hash: flaunch.transactionHash,
          })
          .select()
          .single();

        if (token) tokens.push(token);
      }

      launchedTokens.push({
        award: award.awardType,
        player: award.playerName,
        tokens,
        clankerResult: clanker,
        flaunchResult: flaunch,
      });
    }

    return NextResponse.json({
      success: true,
      analysis,
      launchedTokens,
    });
  } catch (error: any) {
    console.error('Error processing match:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process match' },
      { status: 500 }
    );
  }
}
