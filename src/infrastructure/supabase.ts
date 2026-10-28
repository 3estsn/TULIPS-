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

export async function syncSupabaseConfigFromServer(): Promise<boolean> {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data?.supabaseUrl && data?.supabaseAnonKey) {
        const current = getStoredSupabaseConfig();
        if (current.url !== data.supabaseUrl || current.anonKey !== data.supabaseAnonKey) {
          saveSupabaseConfig(data.supabaseUrl, data.supabaseAnonKey, false);
          return true;
        }
      }
    }
  } catch {}
  return false;
}

export function saveSupabaseConfig(url: string, anonKey: string, syncToServer = true): void {
  try {
    localStorage.setItem('tulips_supabase_url', url.trim());
    localStorage.setItem('tulips_supabase_anon_key', anonKey.trim());
    cachedClient = null;
    currentConfigKey = '';
    // 再度インスタンス作成
    getSupabaseClient();

    if (syncToServer) {
      fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supabaseUrl: url.trim(), supabaseAnonKey: anonKey.trim() }),
      }).catch(() => {});
    }
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
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabaseUrl: '', supabaseAnonKey: '' }),
    }).catch(() => {});
  } catch {}
}

// 接続テスト
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  message: string;
  error?: string;
}> {
  const config = getStoredSupabaseConfig();
  const client = getSupabaseClient();
  if (!client || !config.url || !config.anonKey) {
    return {
      connected: false,
      message: 'Supabase URL または Anon Key が未設定です。設定画面で入力してください。',
    };
  }

  // URLの事前バリデーション（自サーバーURLを指定してしまうミスを検出）
  const urlLower = config.url.toLowerCase();
  if (
    urlLower.includes('163.44.') ||
    urlLower.includes('localhost:3001') ||
    urlLower.includes('localhost:3000') ||
    urlLower.startsWith('http://163.')
  ) {
    return {
      connected: false,
      message:
        '【URLの入力間違い】指定されたURLはConoHaサーバー自身のURLです。ここにはSupabaseのダッシュボードに表示されている「Project URL (例: https://abcdefg.supabase.co)」を入力してください。',
      error: 'Invalid Supabase Project URL: ConoHa server URL detected instead of Supabase URL',
    };
  }

  try {
    // subjects テーブルから1件取得を試行
    const { error } = await client.from('subjects').select('id').limit(1);
    if (error) {
      let friendlyMessage = 'Supabaseへの接続に失敗しました。';
      const rawError = error.message || '';

      if (rawError.includes('<!doctype') || rawError.includes('<html') || rawError.includes('<head>')) {
        friendlyMessage =
          '【URLの入力間違い】APIの代わりにアプリ自身のHTMLが返却されました。URLにConoHaサーバーのURLが指定されています。Supabaseダッシュボード（Project Settings > API）の「https://[プロジェクトID].supabase.co」を入力してください。';
      } else if (rawError.includes('relation "public.subjects" does not exist') || rawError.includes('does not exist')) {
        friendlyMessage =
          '【テーブル未作成】Supabaseへの通信は成功しましたが、テーブルがまだ作成されていません。Supabaseの「SQL Editor」でテーブル作成SQLを実行してください。';
      } else if (rawError.includes('JWT') || rawError.includes('apikey') || rawError.includes('apiKey') || rawError.includes('Invalid API key')) {
        friendlyMessage =
          '【Anon Keyのエラー】APIキーが無効です。Supabaseの「Project Settings > API」にある「anon public」キーを正しくコピーしてください。';
      } else {
        friendlyMessage = `Supabaseエラー: ${rawError}`;
      }

      return {
        connected: false,
        message: friendlyMessage,
        error: rawError.length > 120 ? rawError.slice(0, 120) + '...' : rawError,
      };
    }
    return {
      connected: true,
      message: 'Supabaseに接続成功！リアルタイム同期が利用可能です。',
    };
  } catch (err: any) {
    const rawError = err?.message || String(err);
    let friendlyMessage = '通信エラーが発生しました。ネットワーク設定をご確認ください。';
    if (rawError.includes('<!doctype') || rawError.includes('<html')) {
      friendlyMessage =
        '【URLの入力間違い】WebサーバーのHTMLが返却されました。URLがConoHaサーバーのURLになっていないかご確認ください。';
    }
    return {
      connected: false,
      message: friendlyMessage,
      error: rawError.length > 120 ? rawError.slice(0, 120) + '...' : rawError,
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
