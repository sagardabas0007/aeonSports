import { NextRequest, NextResponse } from 'next/server';
import { jobProcessorService } from '@/services/job-processor.service';
import { queueService } from '@/services/queue.service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * GET /api/cron/process-queue
 * Process pending jobs in the queue
 * Called by Vercel Cron every minute
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authorization
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'dev-secret';

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Cron:Queue] Starting queue processing');
    const startTime = Date.now();

    // Process all pending jobs
    const result = await jobProcessorService.processJobs();

    const duration = Date.now() - startTime;

    console.log(`[Cron:Queue] Completed in ${duration}ms`);
    console.log(`[Cron:Queue] Stats:`, result);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      duration,
      ...result,
    });
  } catch (error: any) {
    console.error('[Cron:Queue] Error:', error);

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
 * POST /api/cron/process-queue
 * Alternative method
 */
export async function POST(request: NextRequest) {
  return GET(request);
}
