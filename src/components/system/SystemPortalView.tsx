/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Database,
  Radio,
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Server,
  Users,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  DEFAULT_SUPABASE_URL,
  DEFAULT_SUPABASE_ANON_KEY,
} from '../../infrastructure/supabase.ts';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime.ts';

export const SystemPortalView: React.FC = () => {
  const { currentUser, refreshData } = useApp();
  const initialSupabase = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState<string>(initialSupabase.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(initialSupabase.anonKey);
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [supabaseStatusDetail, setSupabaseStatusDetail] = useState<string>('');
  const [isSqlOpen, setIsSqlOpen] = useState<boolean>(true);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [serverHealth, setServerHealth] = useState<any>(null);

  // useSupabaseRealtime カスタムフックによる study_records の購読状態監視
  const {
    isConnected: isRealtimeHookConnected,
    status: realtimeHookStatus,
    lastEvent: realtimeLastEvent,
  } = useSupabaseRealtime('study_records', () => {
    refreshData();
  });

  const runSupabaseTest = async (urlToTest?: string, keyToTest?: string) => {
    if (urlToTest !== undefined && keyToTest !== undefined) {
      saveSupabaseConfig(urlToTest, keyToTest);
    }
    setSupabaseStatus('checking');
    try {
      const res = await testSupabaseConnection();
      if (res.connected) {
        setSupabaseStatus('connected');
        setSupabaseStatusDetail(res.message);
      } else {
        setSupabaseStatus('error');
        setSupabaseStatusDetail(res.error ? `${res.message} (${res.error})` : res.message);
      }
    } catch (err: any) {
      setSupabaseStatus('error');
      setSupabaseStatusDetail(err?.message || '接続エラーが発生しました。');
    }
  };

  const handleResetToDefault = () => {
    setSupabaseUrl(DEFAULT_SUPABASE_URL);
    setSupabaseAnonKey(DEFAULT_SUPABASE_ANON_KEY);
    saveSupabaseConfig(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
    runSupabaseTest(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  };

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
      runSupabaseTest();
    } else {
      setSupabaseStatus('idle');
      setSupabaseStatusDetail('SupabaseのURLとAnon Keyを入力して接続テストを行ってください。');
    }

    // ConoHaサーバーヘルスチェック取得
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setServerHealth(data))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 md:pb-8 text-xs sm:text-sm">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              System Administrator Portal
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              システム管理・同期テスト
            </h1>
          </div>
        </div>
        <div className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 self-start sm:self-auto">
          管理者: {currentUser?.name || 'システム管理者'} ({currentUser?.email})
        </div>
      </div>

      {/* Supabase リアルタイム同期テスト欄 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Supabase リアルタイム同期 & 接続テスト
            </h2>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
              supabaseStatus === 'connected' || isRealtimeHookConnected
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : supabaseStatus === 'checking'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : supabaseStatus === 'error'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {(supabaseStatus === 'connected' || isRealtimeHookConnected) && '● 自動接続完了 (Realtime同期中)'}
            {supabaseStatus === 'checking' && '接続テスト中...'}
            {supabaseStatus === 'error' && '接続エラー'}
            {supabaseStatus === 'idle' && !isRealtimeHookConnected && '○ 未設定'}
          </span>
        </div>

        {/* 自動リンク告知メッセージ */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-900 dark:text-emerald-200 flex items-start space-x-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">
              【URL入力不要】既定のSupabaseプロジェクトに自動リンクされています
            </p>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              全端末で起動時に自動的に設定が読み込まれ、<code>useSupabaseRealtime</code> フックにより
              <code>study_records</code>, <code>regular_test_tasks</code>, <code>student_tasks</code>, <code>users</code>
              の変更がURLを入力せずとも即座にリアルタイム同期されます。
            </p>
          </div>
        </div>

        {/* useSupabaseRealtime リアルタイム受信モニター */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-2xl border border-zinc-200 dark:border-zinc-700/60 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
              <span className={`w-2 h-2 rounded-full ${isRealtimeHookConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>useSupabaseRealtime('study_records') 状態:</span>
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
              ステータス: {realtimeHookStatus}
            </span>
          </div>
          {realtimeLastEvent ? (
            <div className="text-[11px] font-mono bg-zinc-900 text-emerald-400 p-2.5 rounded-xl overflow-x-auto">
              [最新受信イベント] {realtimeLastEvent.eventType} on {realtimeLastEvent.table} ({new Date().toLocaleTimeString()})
            </div>
          ) : (
            <div className="text-[11px] text-zinc-400 dark:text-zinc-500">
              テーブル変更のイベント待機中... 生徒側で学習記録を保存するとここに即時通知されます。
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Supabase Anon Key（公開APIキー）
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-hidden"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => runSupabaseTest(supabaseUrl, supabaseAnonKey)}
            disabled={supabaseStatus === 'checking'}
            className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-xs shadow-md hover:opacity-90 cursor-pointer flex items-center space-x-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus === 'checking' ? 'animate-spin' : ''}`} />
            <span>手動接続テストを実行</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-4 py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-semibold text-xs border border-zinc-200 dark:border-zinc-700 cursor-pointer transition-colors"
          >
            既定のURL/キー設定に戻す
          </button>
        </div>

        {supabaseStatusDetail && (
          <div
            className={`p-3 rounded-xl text-xs flex items-start space-x-2 ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : supabaseStatus === 'error'
                ? 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {supabaseStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <p className="font-semibold">{supabaseStatusDetail}</p>
            </div>
          </div>
        )}
      </div>

      {/* サーバー環境ステータス */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <Server className="w-5 h-5 text-indigo-500" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            バックエンドサーバー稼働状況 (ConoHa VPS)
          </h2>
        </div>

        {serverHealth ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-400 block mb-1 font-medium">サーバーソフトウェア</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{serverHealth.server}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-400 block mb-1 font-medium">稼働時間 (Uptime)</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">{Math.floor(serverHealth.uptimeSeconds / 60)} 分</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-400 block mb-1 font-medium">データ保存先</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-[11px]">{serverHealth.dataDirectory}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/60 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-400 block mb-1 font-medium">Firebaseプロジェクト</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 font-mono text-[11px]">{serverHealth.firebaseProject}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-zinc-400 py-4 text-center">サーバー情報を取得中...</div>
        )}
      </div>

      {/* データベース初期化・全データ削除 */}
      <div className="bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2.5 border-b border-rose-100 dark:border-rose-950 pb-3">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            データ完全リセット（登録アカウント・学習記録の削除）
          </h2>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          現在登録されているすべてのアカウント情報、学習記録、計画データを完全に削除し、システムを初期状態に戻します。
        </p>

        <button
          type="button"
          onClick={async () => {
            if (!window.confirm('本当にすべての登録データ・アカウントを削除して初期化しますか？この操作は元に戻せません。')) return;
            try {
              const res = await fetch('/api/admin/reset-db', { method: 'POST' });
              if (res.ok) {
                localStorage.clear();
                localStorage.setItem('tulips_logged_out', 'true');
                alert('すべてのデータを完全に削除・初期化しました。ログイン画面に戻ります。');
                window.location.reload();
              } else {
                alert('初期化に失敗しました。');
              }
            } catch (err) {
              alert('通信エラーが発生しました。');
            }
          }}
          className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          全データを削除して初期化する
        </button>
      </div>
    </div>
  );
};
