import { NextRequest, NextResponse } from 'next/server';
import { matchSyncService } from '@/services/match-sync.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Max execution time for Vercel

/**
 * GET /api/cron/sync-matches
 * Cron endpoint to sync matches every minute
 *
 * This endpoint should be called by:
 * 1. Vercel Cron (in production)
 * 2. External cron service (alternative)
 * 3. Manual trigger for testing
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron] Starting match sync...');
    const startTime = Date.now();

    // Run the sync
    const result = await matchSyncService.manualSync();

    const duration = Date.now() - startTime;

    console.log(`[Cron] Sync completed in ${duration}ms`);
    console.log(`[Cron] Matches processed: ${result.matchesProcessed}`);
    console.log(`[Cron] Status changes: ${result.statusChanges.length}`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      matchesProcessed: result.matchesProcessed,
      statusChanges: result.statusChanges,
    });
  } catch (error: any) {
    console.error('[Cron] Error during sync:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cron/sync-matches
 * Alternative method for triggering sync
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
