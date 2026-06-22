import { getServiceSupabase } from '@/lib/supabase';

export type JobType = 'match_analysis' | 'token_launch' | 'match_workflow';
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  priority: number;
  payload: any;
  result?: any;
  error?: string;
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Queue Service
 * Database-backed job queue for serverless environments
 */
class QueueService {
  /**
   * Add a job to the queue
   */
  async addJob(
    type: JobType,
    payload: any,
    options: {
      priority?: number;
      maxAttempts?: number;
      scheduledFor?: Date;
    } = {}
  ): Promise<Job> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        type,
        payload,
        priority: options.priority || 0,
        max_attempts: options.maxAttempts || 3,
        scheduled_for: options.scheduledFor?.toISOString() || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Queue] Error adding job:', error);
      throw error;
    }

    console.log(`[Queue] Job added: ${data.id} (${type})`);
    return data as Job;
  }

  /**
   * Get next job to process
   */
  async getNextJob(): Promise<Job | null> {
    const supabase = getServiceSupabase();

    // Find pending jobs that are scheduled and haven't exceeded max attempts
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error) {
      console.error('[Queue] Error getting next job:', error);
      throw error;
    }

    if (!jobs || jobs.length === 0) {
      return null;
    }

    const job = jobs[0];

    // Mark as processing
    const { data: updatedJob, error: updateError } = await supabase
      .from('jobs')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      })
      .eq('id', job.id)
      .eq('status', 'pending') // Ensure it's still pending (prevent race conditions)
      .select()
      .single();

    if (updateError || !updatedJob) {
      // Another worker might have claimed it
      return this.getNextJob();
    }

    console.log(`[Queue] Processing job: ${updatedJob.id} (${updatedJob.type})`);
    return updatedJob as Job;
  }

  /**
   * Mark job as completed
   */
  async completeJob(jobId: string, result: any): Promise<void> {
    const supabase = getServiceSupabase();

    const { error } = await supabase
      .from('jobs')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);

    if (error) {
      console.error('[Queue] Error completing job:', error);
      throw error;
    }

    console.log(`[Queue] Job completed: ${jobId}`);
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: string, error: string, retry: boolean = true): Promise<void> {
    const supabase = getServiceSupabase();

    // Get current job
    const { data: job } = await supabase.from('jobs').select('*').eq('id', jobId).single();

    if (!job) return;

    const shouldRetry = retry && job.attempts < job.max_attempts;

    const { error: updateError } = await supabase
      .from('jobs')
      .update({
        status: shouldRetry ? 'retrying' : 'failed',
        error,
        ...(shouldRetry
          ? {
              // Retry with exponential backoff
              scheduled_for: new Date(
                Date.now() + Math.pow(2, job.attempts) * 60000
              ).toISOString(),
            }
          : { completed_at: new Date().toISOString() }),
      })
      .eq('id', jobId);

    if (updateError) {
      console.error('[Queue] Error failing job:', updateError);
      throw updateError;
    }

    if (shouldRetry) {
      console.log(`[Queue] Job ${jobId} will retry (attempt ${job.attempts + 1}/${job.max_attempts})`);
      // Reset to pending for retry
      await supabase.from('jobs').update({ status: 'pending' }).eq('id', jobId);
    } else {
      console.log(`[Queue] Job failed: ${jobId}`);
    }
  }

  /**
   * Get job status
   */
  async getJob(jobId: string): Promise<Job | null> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase.from('jobs').select('*').eq('id', jobId).single();

    if (error) {
      console.error('[Queue] Error getting job:', error);
      return null;
    }

    return data as Job;
  }

  /**
   * Get all jobs for a match
   */
  async getMatchJobs(matchId: string): Promise<Job[]> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .contains('payload', { matchId })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Queue] Error getting match jobs:', error);
      return [];
    }

    return data as Job[];
  }

  /**
   * Clean up old completed jobs
   */
  async cleanup(olderThanDays: number = 7): Promise<number> {
    const supabase = getServiceSupabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .in('status', ['completed', 'failed'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[Queue] Error cleaning up jobs:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`[Queue] Cleaned up ${count} old jobs`);
    return count;
  }
}

export const queueService = new QueueService();
