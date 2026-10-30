/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from 'react';
import type { RealtimePostgresChangesPayload, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../infrastructure/supabase.ts';

export type RealtimeChangeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface UseSupabaseRealtimeOptions<T extends { [key: string]: any } = { [key: string]: any }> {
  table?: string;
  event?: RealtimeChangeEvent;
  schema?: string;
  filter?: string;
  enabled?: boolean;
  onInsert?: (payload: { new: T; old: Partial<T> }) => void;
  onUpdate?: (payload: { new: T; old: T }) => void;
  onDelete?: (payload: { old: T }) => void;
  onChange?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export type RealtimeSubscriptionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'SUBSCRIBED'
  | 'TIMED_OUT'
  | 'CLOSED'
  | 'CHANNEL_ERROR';

export interface UseSupabaseRealtimeResult<T extends { [key: string]: any } = { [key: string]: any }> {
  isConnected: boolean;
  status: RealtimeSubscriptionStatus;
  lastEvent: RealtimePostgresChangesPayload<T> | null;
  error: string | null;
  client: SupabaseClient | null;
}

/**
 * Custom hook to automatically subscribe to Supabase Realtime changes for a specific table or query.
 * Works seamlessly with zero URL input required (uses embedded project credentials).
 *
 * Usage examples:
 * 1) Simple table subscription:
 *    useSupabaseRealtime('study_records', (payload) => {
 *      console.log('Record changed:', payload);
 *      refreshData();
 *    });
 *
 * 2) Options object subscription:
 *    const { isConnected, lastEvent } = useSupabaseRealtime<StudyRecord>({
 *      table: 'study_records',
 *      event: '*',
 *      onChange: (payload) => refreshData(),
 *    });
 */
export function useSupabaseRealtime<T extends { [key: string]: any } = { [key: string]: any }>(
  tableOrOptions?: string | UseSupabaseRealtimeOptions<T>,
  callback?: (payload: RealtimePostgresChangesPayload<T>) => void
): UseSupabaseRealtimeResult<T> {
  const options: UseSupabaseRealtimeOptions<T> =
    typeof tableOrOptions === 'string'
      ? { table: tableOrOptions, onChange: callback }
      : tableOrOptions || {};

  const {
    table,
    event = '*',
    schema = 'public',
    filter,
    enabled = true,
    onInsert,
    onUpdate,
    onDelete,
    onChange,
  } = options;

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [status, setStatus] = useState<RealtimeSubscriptionStatus>('CONNECTING');
  const [lastEvent, setLastEvent] = useState<RealtimePostgresChangesPayload<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [client, setClient] = useState<SupabaseClient | null>(() => getSupabaseClient());

  // Use refs for callbacks to avoid re-subscribing on every parent render
  const callbacksRef = useRef({ onInsert, onUpdate, onDelete, onChange });
  useEffect(() => {
    callbacksRef.current = { onInsert, onUpdate, onDelete, onChange };
  }, [onInsert, onUpdate, onDelete, onChange]);

  useEffect(() => {
    if (!enabled) {
      setStatus('DISCONNECTED');
      setIsConnected(false);
      return;
    }

    const currentClient = getSupabaseClient();
    setClient(currentClient);

    if (!currentClient) {
      setStatus('DISCONNECTED');
      setIsConnected(false);
      setError('Supabase client is not initialized.');
      return;
    }

    const channelName = `realtime:${table || 'all'}:${Math.random().toString(36).slice(2, 9)}`;
    const channel = currentClient.channel(channelName);

    const changesConfig: any = {
      event,
      schema,
    };
    if (table) {
      changesConfig.table = table;
    }
    if (filter) {
      changesConfig.filter = filter;
    }

    (channel as any).on(
      'postgres_changes',
      changesConfig,
      (payload: RealtimePostgresChangesPayload<T>) => {
        setLastEvent(payload);

        // Call generic change handler
        if (callbacksRef.current.onChange) {
          try {
            callbacksRef.current.onChange(payload);
          } catch (err) {
            console.error('[useSupabaseRealtime] onChange error:', err);
          }
        }

        // Call specific event handlers
        if (payload.eventType === 'INSERT' && callbacksRef.current.onInsert) {
          try {
            callbacksRef.current.onInsert({ new: payload.new as T, old: payload.old as Partial<T> });
          } catch (err) {
            console.error('[useSupabaseRealtime] onInsert error:', err);
          }
        } else if (payload.eventType === 'UPDATE' && callbacksRef.current.onUpdate) {
          try {
            callbacksRef.current.onUpdate({ new: payload.new as T, old: payload.old as T });
          } catch (err) {
            console.error('[useSupabaseRealtime] onUpdate error:', err);
          }
        } else if (payload.eventType === 'DELETE' && callbacksRef.current.onDelete) {
          try {
            callbacksRef.current.onDelete({ old: payload.old as T });
          } catch (err) {
            console.error('[useSupabaseRealtime] onDelete error:', err);
          }
        }
      }
    );

    setStatus('CONNECTING');

    channel.subscribe((subStatus, err) => {
      if (err) {
        console.warn(`[useSupabaseRealtime] Subscription error on table ${table || '*'}:`, err);
        setError(err.message || 'Subscription failed');
      }

      if (subStatus === 'SUBSCRIBED') {
        setIsConnected(true);
        setStatus('SUBSCRIBED');
        setError(null);
      } else if (subStatus === 'TIMED_OUT') {
        setIsConnected(false);
        setStatus('TIMED_OUT');
      } else if (subStatus === 'CLOSED') {
        setIsConnected(false);
        setStatus('CLOSED');
      } else if (subStatus === 'CHANNEL_ERROR') {
        setIsConnected(false);
        setStatus('CHANNEL_ERROR');
      }
    });

    return () => {
      try {
        currentClient.removeChannel(channel);
      } catch (e) {
        channel.unsubscribe();
      }
    };
  }, [table, event, schema, filter, enabled]);

  return {
    isConnected,
    status,
    lastEvent,
    error,
    client,
  };
}
