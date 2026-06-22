import { NextRequest, NextResponse } from 'next/server';
import { queueService } from '@/services/queue.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/workflow/status/[jobId]
 * Get status of a workflow job
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const job = await queueService.getJob(params.jobId);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      job: {
        id: job.id,
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.max_attempts,
        result: job.result,
        error: job.error,
        createdAt: job.created_at,
        startedAt: job.started_at,
        completedAt: job.completed_at,
      },
    });
  } catch (error: any) {
    console.error('[Workflow Status] Error:', error);

    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }
}
