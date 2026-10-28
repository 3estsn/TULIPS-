/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase 設定の取得（localStorage または Vite環境変数）
export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getStoredSupabaseConfig(): SupabaseConfig {
  let url = '';
  let anonKey = '';

  try {
    const savedUrl = localStorage.getItem('tulips_supabase_url');
    const savedKey = localStorage.getItem('tulips_supabase_anon_key');
    if (savedUrl && savedKey) {
      url = savedUrl.trim();
      anonKey = savedKey.trim();
    }
  } catch {}

  // 環境変数からのフォールバック
  if (!url && typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) {
    url = String(import.meta.env.VITE_SUPABASE_URL).trim();
  }
  if (!anonKey && typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) {
    anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY).trim();
  }

  return { url, anonKey };
}

let cachedClient: SupabaseClient | null = null;
let currentConfigKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getStoredSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }

  const key = `${url}:::${anonKey}`;
  if (cachedClient && currentConfigKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfigKey = key;
    return cachedClient;
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err);
    return null;
  }
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    localStorage.setItem('tulips_supabase_url', url.trim());
    localStorage.setItem('tulips_supabase_anon_key', anonKey.trim());
    cachedClient = null;
    currentConfigKey = '';
    // 再度インスタンス作成
    getSupabaseClient();
  } catch (err) {
    console.error('[Supabase] Failed to save config to localStorage:', err);
  }
}

export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem('tulips_supabase_url');
    localStorage.removeItem('tulips_supabase_anon_key');
    cachedClient = null;
    currentConfigKey = '';
  } catch {}
}

// 接続テスト
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase URL または Anon Key が未設定です。設定画面で入力してください。',
    };
  }

  try {
    // subjects テーブルから1件取得を試行
    const { error } = await client.from('subjects').select('id').limit(1);
    if (error) {
      return {
        connected: false,
        message: 'Supabaseへの接続に失敗しました。URL、Anon Key、またはSQLテーブル作成を確認してください。',
        error: error.message,
      };
    }
    return {
      connected: true,
      message: 'Supabaseに接続成功！リアルタイム同期が利用可能です。',
    };
  } catch (err: any) {
    return {
      connected: false,
      message: '通信エラーが発生しました。ネットワーク設定をご確認ください。',
      error: err?.message || String(err),
    };
  }
}

// リアルタイム購読リスナー登録
type RealtimeCallback = (payload: { table: string; eventType: string; new: any; old: any }) => void;
const subscribers = new Set<RealtimeCallback>();
let realtimeChannel: any = null;

export function subscribeToSupabaseRealtime(callback: RealtimeCallback): () => void {
  subscribers.add(callback);
  ensureRealtimeSubscription();

  return () => {
    subscribers.delete(callback);
    if (subscribers.size === 0 && realtimeChannel) {
      realtimeChannel.unsubscribe();
      realtimeChannel = null;
    }
  };
}

function ensureRealtimeSubscription() {
  const client = getSupabaseClient();
  if (!client || realtimeChannel) return;

  try {
    realtimeChannel = client
      .channel('tulips-all-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          subscribers.forEach((cb) => {
            try {
              cb({
                table: payload.table,
                eventType: payload.eventType,
                new: payload.new,
                old: payload.old,
              });
            } catch (e) {
              console.error('[Supabase Realtime] Callback error:', e);
            }
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] Successfully subscribed to public tables.');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[Supabase Realtime] Channel error occurred, will retry.');
        }
      });
  } catch (err) {
    console.warn('[Supabase Realtime] Failed to setup channel:', err);
  }
}
