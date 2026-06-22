import { NextRequest, NextResponse } from 'next/server';
import { tokenLaunchPipelineService } from '@/services/token-launch-pipeline.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/tokens/launch
 * Launch a player token for a specific award
 *
 * Body: {
 *   matchId: string,
 *   playerName: string,
 *   category: "MVP" | "Best Defender" | "Most Assists"
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { matchId, playerName, category } = body;

    // Validation
    if (!matchId || !playerName || !category) {
      return NextResponse.json(
        { error: 'matchId, playerName, and category are required' },
        { status: 400 }
      );
    }

    const validCategories = ['MVP', 'Best Defender', 'Most Assists'];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`[Token Launch API] Request: ${playerName} - ${category}`);

    // Launch token through pipeline
    const result = await tokenLaunchPipelineService.launchToken({
      matchId,
      playerName,
      category,
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: result.success,
      metadata: result.metadata,
      platforms: {
        clanker: result.clanker,
        flaunch: result.flaunch,
      },
      tokensCreated: result.tokensCreated,
      duration,
    });
  } catch (error: any) {
    console.error('[Token Launch API] Error:', error);

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to launch token',
        duration,
      },
      { status: 500 }
    );
  }
}
