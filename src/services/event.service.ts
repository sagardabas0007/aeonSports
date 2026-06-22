import { getServiceSupabase } from '@/lib/supabase';

export interface Event {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  payload: any;
  published: boolean;
  created_at: string;
}

export interface EventInput {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: any;
}

/**
 * Event Service
 * Publishes events for frontend consumption via Supabase Realtime
 */
class EventService {
  /**
   * Publish an event
   */
  async publishEvent(input: EventInput): Promise<Event> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('events')
      .insert({
        event_type: input.eventType,
        entity_type: input.entityType,
        entity_id: input.entityId,
        payload: input.payload,
        published: true,
      })
      .select()
      .single();

    if (error) {
      console.error('[Events] Error publishing event:', error);
      throw error;
    }

    console.log(`[Events] Published: ${input.eventType} for ${input.entityType}:${input.entityId}`);

    return data as Event;
  }

  /**
   * Get recent events
   */
  async getRecentEvents(limit: number = 50): Promise<Event[]> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Events] Error getting recent events:', error);
      return [];
    }

    return data as Event[];
  }

  /**
   * Get events for a specific entity
   */
  async getEntityEvents(entityType: string, entityId: string): Promise<Event[]> {
    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Events] Error getting entity events:', error);
      return [];
    }

    return data as Event[];
  }

  /**
   * Clean up old events
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    const supabase = getServiceSupabase();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const { data, error } = await supabase
      .from('events')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('[Events] Error cleaning up events:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`[Events] Cleaned up ${count} old events`);
    return count;
  }
}

export const eventService = new EventService();
