import { queueService, Job } from './queue.service';
import { workflowService } from './workflow.service';

/**
 * Job Processor Service
 * Processes jobs from the queue
 */
class JobProcessorService {
  private isProcessing = false;

  /**
   * Process all pending jobs
   */
  async processJobs(): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      console.log('[Job Processor] Already processing jobs');
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let processed = 0;
    let succeeded = 0;
    let failed = 0;

    try {
      console.log('[Job Processor] Starting job processing');

      // Process jobs until queue is empty
      while (true) {
        const job = await queueService.getNextJob();

        if (!job) {
          break; // No more jobs
        }

        processed++;

        try {
          await this.processJob(job);
          succeeded++;
        } catch (error: any) {
          console.error(`[Job Processor] Job ${job.id} failed:`, error);
          await queueService.failJob(job.id, error.message);
          failed++;
        }
      }

      console.log(
        `[Job Processor] Completed. Processed: ${processed}, Succeeded: ${succeeded}, Failed: ${failed}`
      );
    } finally {
      this.isProcessing = false;
    }

    return { processed, succeeded, failed };
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    console.log(`[Job Processor] Processing job ${job.id} (${job.type})`);

    let result: any;

    switch (job.type) {
      case 'match_workflow':
        result = await this.processMatchWorkflow(job);
        break;

      case 'match_analysis':
        result = await this.processMatchAnalysis(job);
        break;

      case 'token_launch':
        result = await this.processTokenLaunch(job);
        break;

      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await queueService.completeJob(job.id, result);
  }

  /**
   * Process match workflow job
   */
  private async processMatchWorkflow(job: Job): Promise<any> {
    const { matchId } = job.payload;

    if (!matchId) {
      throw new Error('matchId is required in payload');
    }

    const workflow = await workflowService.executeMatchWorkflow(matchId);

    return {
      workflowId: workflow.id,
      status: workflow.status,
      stepsCompleted: workflow.steps_completed,
    };
  }

  /**
   * Process match analysis job
   */
  private async processMatchAnalysis(job: Job): Promise<any> {
    // Individual analysis job (if needed separately)
    throw new Error('Not implemented: Use match_workflow instead');
  }

  /**
   * Process token launch job
   */
  private async processTokenLaunch(job: Job): Promise<any> {
    // Individual token launch job (if needed separately)
    throw new Error('Not implemented: Use match_workflow instead');
  }
}

export const jobProcessorService = new JobProcessorService();
