import { NextRequest, NextResponse } from 'next/server';
import { matchSyncService } from '@/services/match-sync.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/trigger-sync
 * Manual trigger for match sync (for testing and admin use)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Admin] Manual sync triggered');

    const result = await matchSyncService.manualSync();

    return NextResponse.json({
      success: result.success,
      message: 'Match sync completed',
      matchesProcessed: result.matchesProcessed,
      statusChanges: result.statusChanges,
      finishedMatches: result.statusChanges.filter(
        (c) => c.newStatus === 'finished'
      ),
    });
  } catch (error: any) {
    console.error('[Admin] Error during manual sync:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
