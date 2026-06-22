import { getServiceSupabase } from '@/lib/supabase';
import { fifaApiService } from './fifa-api.service';
import { aiAnalysisPipelineService } from './ai-analysis-pipeline.service';
import { tokenLaunchPipelineService } from './token-launch-pipeline.service';
import { eventService } from './event.service';

export interface WorkflowExecution {
  id: string;
  match_id: string;
  status: string;
  current_step: string;
  steps_completed: string[];
  error?: string;
  started_at: string;
  completed_at?: string;
}

/**
 * Workflow Service
 * Orchestrates the complete match analysis and token launch workflow
 */
class WorkflowService {
  /**
   * Execute complete workflow for a finished match
   */
  async executeMatchWorkflow(matchId: string): Promise<WorkflowExecution> {
    console.log(`[Workflow] Starting workflow for match ${matchId}`);

    // Create workflow execution record
    const workflowId = await this.createWorkflowExecution(matchId);

    try {
      // Step 1: Fetch match stats
      await this.updateWorkflowStep(workflowId, 'fetch_stats');
      const matchStats = await this.fetchMatchStats(matchId);

      // Step 2: Run AI analysis
      await this.updateWorkflowStep(workflowId, 'ai_analysis');
      const analysis = await this.runAiAnalysis(matchId, matchStats);

      // Step 3: Launch tokens for each award
      await this.updateWorkflowStep(workflowId, 'launch_tokens');
      const tokenResults = await this.launchTokens(matchId, analysis);

      // Step 4: Publish events
      await this.updateWorkflowStep(workflowId, 'publish_events');
      await this.publishEvents(matchId, analysis, tokenResults);

      // Mark workflow as completed
      await this.completeWorkflow(workflowId);

      console.log(`[Workflow] Completed workflow for match ${matchId}`);

      return await this.getWorkflowExecution(workflowId);
    } catch (error: any) {
      console.error(`[Workflow] Error in workflow for match ${matchId}:`, error);
      await this.failWorkflow(workflowId, error.message);
      throw error;
    }
  }

  /**
   * Step 1: Fetch match statistics
   */
  private async fetchMatchStats(matchId: string) {
    console.log(`[Workflow] Fetching match stats for ${matchId}`);

    const supabase = getServiceSupabase();

    const { data: match, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !match) {
      throw new Error('Match not found');
    }

    if (match.status !== 'finished') {
      throw new Error('Match is not finished');
    }

    const fixtureId = parseInt(match.external_id);
    const { fixture, players, statistics } = await fifaApiService.getCompleteMatchData(
      fixtureId
    );

    return { fixture, players, statistics };
  }

  /**
   * Step 2: Run AI analysis
   */
  private async runAiAnalysis(matchId: string, matchStats: any) {
    console.log(`[Workflow] Running AI analysis for ${matchId}`);

    const input = aiAnalysisPipelineService.convertFifaDataToInput(
      matchId,
      matchStats.fixture,
      matchStats.players
    );

    const analysis = await aiAnalysisPipelineService.analyzeMatch(input);

    // Publish analysis event
    await eventService.publishEvent({
      eventType: 'match_analyzed',
      entityType: 'match',
      entityId: matchId,
      payload: {
        matchId,
        mvp: analysis.mvp?.playerName,
        bestDefender: analysis.bestDefender?.playerName,
        mostAssists: analysis.mostAssists?.playerName,
      },
    });

    return analysis;
  }

  /**
   * Step 3: Launch tokens for MVP, Best Defender, Most Assists
   */
  private async launchTokens(matchId: string, analysis: any) {
    console.log(`[Workflow] Launching tokens for ${matchId}`);

    const results = [];

    // Launch MVP token
    if (analysis.mvp) {
      try {
        const mvpResult = await tokenLaunchPipelineService.launchToken({
          matchId,
          playerName: analysis.mvp.playerName,
          category: 'MVP',
        });
        results.push({ category: 'MVP', result: mvpResult });
      } catch (error: any) {
        console.error('[Workflow] Error launching MVP token:', error);
        results.push({ category: 'MVP', error: error.message });
      }
    }

    // Launch Best Defender token
    if (analysis.bestDefender) {
      try {
        const defenderResult = await tokenLaunchPipelineService.launchToken({
          matchId,
          playerName: analysis.bestDefender.playerName,
          category: 'Best Defender',
        });
        results.push({ category: 'Best Defender', result: defenderResult });
      } catch (error: any) {
        console.error('[Workflow] Error launching Best Defender token:', error);
        results.push({ category: 'Best Defender', error: error.message });
      }
    }

    // Launch Most Assists token
    if (analysis.mostAssists) {
      try {
        const assistsResult = await tokenLaunchPipelineService.launchToken({
          matchId,
          playerName: analysis.mostAssists.playerName,
          category: 'Most Assists',
        });
        results.push({ category: 'Most Assists', result: assistsResult });
      } catch (error: any) {
        console.error('[Workflow] Error launching Most Assists token:', error);
        results.push({ category: 'Most Assists', error: error.message });
      }
    }

    return results;
  }

  /**
   * Step 4: Publish events to frontend
   */
  private async publishEvents(matchId: string, analysis: any, tokenResults: any[]) {
    console.log(`[Workflow] Publishing events for ${matchId}`);

    // Publish token launch events
    for (const result of tokenResults) {
      if (result.result?.tokensCreated) {
        for (const tokenId of result.result.tokensCreated) {
          await eventService.publishEvent({
            eventType: 'token_launched',
            entityType: 'token',
            entityId: tokenId,
            payload: {
              matchId,
              tokenId,
              category: result.category,
              metadata: result.result.metadata,
            },
          });
        }
      }
    }

    // Publish workflow completed event
    await eventService.publishEvent({
      eventType: 'workflow_completed',
      entityType: 'match',
      entityId: matchId,
      payload: {
        matchId,
        tokensLaunched: tokenResults.filter((r) => r.result).length,
        analysisCompleted: true,
      },
    });
  }

  /**
   * Create workflow execution record
   */
  private async createWorkflowExecution(matchId: string): Promise<string> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('workflow_executions')
      .insert({
        match_id: matchId,
        status: 'running',
        current_step: 'starting',
        steps_completed: [],
      })
      .select('id')
      .single();

    if (error) {
      throw new Error('Failed to create workflow execution');
    }

    return data.id;
  }

  /**
   * Update workflow step
   */
  private async updateWorkflowStep(workflowId: string, step: string): Promise<void> {
    const supabase = getServiceSupabase();

    const { data: workflow } = await supabase
      .from('workflow_executions')
      .select('steps_completed')
      .eq('id', workflowId)
      .single();

    const stepsCompleted = workflow?.steps_completed || [];
    if (workflow?.current_step) {
      stepsCompleted.push(workflow.current_step);
    }

    await supabase
      .from('workflow_executions')
      .update({
        current_step: step,
        steps_completed: stepsCompleted,
      })
      .eq('id', workflowId);
  }

  /**
   * Complete workflow
   */
  private async completeWorkflow(workflowId: string): Promise<void> {
    const supabase = getServiceSupabase();

    await supabase
      .from('workflow_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', workflowId);
  }

  /**
   * Fail workflow
   */
  private async failWorkflow(workflowId: string, error: string): Promise<void> {
    const supabase = getServiceSupabase();

    await supabase
      .from('workflow_executions')
      .update({
        status: 'failed',
        error,
        completed_at: new Date().toISOString(),
      })
      .eq('id', workflowId);
  }

  /**
   * Get workflow execution
   */
  private async getWorkflowExecution(workflowId: string): Promise<WorkflowExecution> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (error) {
      throw error;
    }

    return data as WorkflowExecution;
  }
}

export const workflowService = new WorkflowService();
