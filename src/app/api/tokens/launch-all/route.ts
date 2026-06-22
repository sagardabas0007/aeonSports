import { NextRequest, NextResponse } from 'next/server';
import { tokenLaunchPipelineService } from '@/services/token-launch-pipeline.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes for multiple launches

/**
 * POST /api/tokens/launch-all
 * Launch tokens for all awards in a match
 *
 * Body: { matchId: string }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { matchId } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    console.log(`[Launch All] Starting batch launch for match ${matchId}`);

    // Launch all tokens
    const results = await tokenLaunchPipelineService.launchAllMatchTokens(matchId);

    const duration = Date.now() - startTime;

    // Count successes
    const successCount = results.filter((r) => r.success).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokensCreated.length, 0);

    return NextResponse.json({
      success: successCount > 0,
      results,
      summary: {
        totalAwards: results.length,
        successfulLaunches: successCount,
        tokensCreated: totalTokens,
        duration,
      },
    });
  } catch (error: any) {
    console.error('[Launch All] Error:', error);

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to launch tokens',
        duration,
      },
      { status: 500 }
    );
  }
}
