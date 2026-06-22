import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/services/queue.service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/workflow/trigger
 * Manually trigger a match workflow
 */
export async function POST(request: NextRequest) {
  try {
    const { matchId, priority } = await request.json();

    if (!matchId) {
      return NextResponse.json({ error: 'matchId is required' }, { status: 400 });
    }

    console.log(`[Workflow Trigger] Queuing workflow for match ${matchId}`);

    // Add workflow job to queue
    const job = await queueService.addJob(
      'match_workflow',
      { matchId },
      { priority: priority || 10 }
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: 'Workflow job added to queue',
      matchId,
    });
  } catch (error: any) {
    console.error('[Workflow Trigger] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
