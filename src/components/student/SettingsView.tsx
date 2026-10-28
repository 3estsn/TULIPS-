/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Palette,
  Sun,
  Moon,
  Check,
  Shield,
  GraduationCap,
  LogIn,
  LogOut,
  Save,
  CheckCircle,
  Database,
  RefreshCw,
  AlertCircle,
  Radio,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { UserRole } from '../../domain/models/index.ts';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
} from '../../infrastructure/supabase.ts';

export const SettingsView: React.FC = () => {
  const {
    currentUser,
    subjects,
    updateUserProfile,
    switchUserRole,
    loginWithGoogle,
    logout,
    theme,
    setTheme,
    accentColor,
    accentForeground,
    setAccentColor,
    refreshData,
  } = useApp();

  const [name, setName] = useState<string>(currentUser?.name || '');
  const [grade, setGrade] = useState<number>(currentUser?.grade || 2);
  const [classRoom, setClassRoom] = useState<string>(currentUser?.classRoom || '1組');
  const [studentNumber, setStudentNumber] = useState<number>(currentUser?.studentNumber || 14);
  const [weeklyGoalHours, setWeeklyGoalHours] = useState<number>(() =>
    Math.round((currentUser?.weeklyGoalMinutes || 900) / 60)
  );
  const [focusSubjectId, setFocusSubjectId] = useState<string>(currentUser?.focusSubjectId || 'math');
  const [customHex, setCustomHex] = useState<string>(accentColor);
  const [savedMessage, setSavedMessage] = useState<string>('');
  const [isSyncingData, setIsSyncingData] = useState<boolean>(false);
  const initialSupabase = getStoredSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState<string>(initialSupabase.url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState<string>(initialSupabase.anonKey);
  const [supabaseStatus, setSupabaseStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle');
  const [supabaseStatusDetail, setSupabaseStatusDetail] = useState<string>('');
  const [isSqlOpen, setIsSqlOpen] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const handleSyncData = async () => {
    setIsSyncingData(true);
    try {
      await refreshData();
      setSavedMessage('クラウド（Supabase）と最新データを同期しました。');
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (err: any) {
      setSavedMessage('データ再同期に失敗しました: ' + (err?.message || '通信エラー'));
      setTimeout(() => setSavedMessage(''), 4000);
    } finally {
      setIsSyncingData(false);
    }
  };

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

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
      runSupabaseTest();
    } else {
      setSupabaseStatus('idle');
      setSupabaseStatusDetail('SupabaseのURLとAnon Keyを入力して保存すると、リアルタイム同期が開始されます。');
    }
  }, []);

  const isTeacher = currentUser?.role === 'teacher';

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      name: name.trim(),
      grade: isTeacher ? undefined : Number(grade),
      classRoom: classRoom.trim(),
      studentNumber: isTeacher ? undefined : Number(studentNumber),
      weeklyGoalMinutes: isTeacher ? undefined : Math.max(1, weeklyGoalHours) * 60,
      focusSubjectId: isTeacher ? undefined : focusSubjectId,
    });
    setSavedMessage('アカウント設定を保存しました。');
    setTimeout(() => setSavedMessage(''), 3000);
  };

  const handleCustomColorApply = () => {
    if (/^#[0-9A-Fa-f]{6}$/.test(customHex)) {
      setAccentColor(customHex);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-8 text-xs sm:text-sm">
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
          設定
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          アカウント情報、生徒・教員モードの切替、目標時間、重視する科目、UI外観をカスタマイズできます。
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* 画面モード切替（生徒画面 / 先生画面） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <GraduationCap className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            画面モードの切替（生徒 / 教員）
          </h2>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          高校現場での運用に合わせて、生徒画面と先生画面をいつでも切り替えて操作・確認できます。
        </p>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => switchUserRole('student')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              !isTeacher
                ? 'border-zinc-900 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-100'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">生徒画面</span>
              {!isTeacher && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              学習時間記録、タイマー計測、個人統計の確認
            </p>
          </button>

          <button
            type="button"
            onClick={() => switchUserRole('teacher')}
            className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
              isTeacher
                ? 'border-zinc-900 bg-zinc-50 dark:bg-zinc-800 dark:border-zinc-100'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">先生画面</span>
              {isTeacher && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              クラス生徒の学習統計確認、定期テスト課題範囲の設定
            </p>
          </button>
        </div>
      </div>

      {/* クラウドデータベース & リアルタイム同期（Supabase） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Supabase リアルタイム同期
            </h2>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : supabaseStatus === 'checking'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                : supabaseStatus === 'error'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {supabaseStatus === 'connected' && '● リアルタイム同期中 (WebSocket接続済)'}
            {supabaseStatus === 'checking' && '接続テスト中...'}
            {supabaseStatus === 'error' && '接続エラー'}
            {supabaseStatus === 'idle' && '○ 未設定 (ローカル動作中)'}
          </span>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Supabaseと接続すると、学習記録の追加や定期テスト課題の配信・完了チェックが全端末間で瞬時にリアルタイム反映されます。
        </p>

        {/* 接続設定フォーム */}
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Supabase Project URL
            </label>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              Supabase Anon Key（公開APIキー）
            </label>
            <input
              type="password"
              value={supabaseAnonKey}
              onChange={(e) => setSupabaseAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-hidden"
            />
          </div>
        </div>

        {supabaseStatusDetail && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-start space-x-2 ${
              supabaseStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                : supabaseStatus === 'error'
                ? 'bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
            }`}
          >
            {supabaseStatus === 'connected' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : supabaseStatus === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Database className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
            )}
            <span>{supabaseStatusDetail}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setIsSqlOpen(!isSqlOpen)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>Supabaseテーブル作成SQL</span>
            {isSqlOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => runSupabaseTest(supabaseUrl, supabaseAnonKey)}
            disabled={supabaseStatus === 'checking'}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${supabaseStatus === 'checking' ? 'animate-spin' : ''}`} />
            <span>設定を保存してリアルタイム同期テスト</span>
          </button>
        </div>

        {/* テーブル作成SQLのアコーディオン */}
        {isSqlOpen && (
          <div className="mt-2 p-3 bg-zinc-900 text-zinc-100 rounded-xl text-[11px] font-mono space-y-2 border border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400">Supabase SQL Editor で実行するコード:</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`-- テーブル作成とRealtime有効化
CREATE TABLE IF NOT EXISTS public.study_records (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    date TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    method TEXT DEFAULT 'manual',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.regular_test_tasks (
    id TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL,
    teacher_name TEXT NOT NULL,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    target_grade INTEGER NOT NULL,
    target_class TEXT NOT NULL,
    scope TEXT NOT NULL,
    deadline TEXT NOT NULL,
    notes TEXT,
    material_ids JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.student_tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    subject_id TEXT NOT NULL,
    material_id TEXT NOT NULL,
    material_name TEXT NOT NULL,
    regular_test_task_id TEXT,
    deadline TEXT NOT NULL,
    buffer_days INTEGER DEFAULT 1,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY,
    subject_id TEXT NOT NULL,
    name TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    structure JSONB DEFAULT '{}'::jsonb
);
CREATE TABLE IF NOT EXISTS public.subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    color TEXT
);
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'student',
    grade INTEGER,
    class_room TEXT,
    student_number INTEGER,
    weekly_goal_minutes INTEGER DEFAULT 900,
    focus_subject_id TEXT DEFAULT 'math'
);
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.regular_test_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.materials;
ALTER PUBLICATION supabase_realtime ADD TABLE public.subjects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER TABLE public.study_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regular_test_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public all access on study_records" ON public.study_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on regular_test_tasks" ON public.regular_test_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on student_tasks" ON public.student_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on materials" ON public.materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);
INSERT INTO public.subjects (id, name, category, color) VALUES
('japanese', '国語', 'japanese', '#ef4444'),
('math', '数学', 'math', '#3b82f6'),
('science', '理科', 'science', '#10b981'),
('social', '社会', 'social', '#eab308'),
('english', '英語', 'english', '#8b5cf6'),
('info', '情報', 'info', '#06b6d4'),
('other', 'その他', 'other', '#64748b')
ON CONFLICT (id) DO NOTHING;`);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2500);
                }}
                className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[10px] flex items-center space-x-1 cursor-pointer"
              >
                {copySuccess ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copySuccess ? 'コピーしました！' : 'SQLをコピー'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto p-2 bg-black/50 rounded text-emerald-400 text-[10px] max-h-40">
              {`-- プロジェクト直下の supabase-schema.sql にも完全なSQLスクリプトを保存しています
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.regular_test_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.student_tasks;`}
            </pre>
          </div>
        )}
      </div>

      {/* UI外観設定（テーマ & アクセントカラー） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <Palette className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            UIの外観設定
          </h2>
        </div>

        {/* テーマ（ライト / ダーク） */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            カラーテーマ
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3.5 rounded-xl border flex items-center justify-center space-x-2 font-semibold text-xs transition-all cursor-pointer ${
                theme === 'light'
                  ? 'border-zinc-900 bg-zinc-100 dark:bg-zinc-800 text-zinc-900'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-600'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>ライトモード</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3.5 rounded-xl border flex items-center justify-center space-x-2 font-semibold text-xs transition-all cursor-pointer ${
                theme === 'dark'
                  ? 'border-zinc-100 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'
              }`}
            >
              <Moon className="w-4 h-4 text-indigo-400" />
              <span>ダークモード</span>
            </button>
          </div>
        </div>

        {/* アクセントカラー選択（標準: ライト#219134 / ダーク#e3fff2） */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              アクセントカラー（標準: {theme === 'dark' ? '#e3fff2' : '#219134'}）
            </label>
            <span className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400">
              現在: {accentColor}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              {
                id: 'default',
                name: theme === 'dark' ? '標準ミント (#e3fff2)' : '標準グリーン (#219134)',
                hex: theme === 'dark' ? '#e3fff2' : '#219134',
              },
              { id: 'sky-blue', name: 'スカイブルー', hex: '#0284c7' },
              { id: 'indigo', name: 'インディゴ', hex: '#4f46e5' },
              { id: 'amber', name: 'アンバーオレンジ', hex: '#d97706' },
              { id: 'rose', name: 'チェリーローズ', hex: '#e11d48' },
            ].map((opt) => {
              const isSelected = accentColor.toLowerCase() === opt.hex.toLowerCase();
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setAccentColor(opt.hex);
                    setCustomHex(opt.hex);
                  }}
                  className={`p-2.5 rounded-xl border flex items-center space-x-2 text-xs font-semibold text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-50 dark:bg-zinc-800/80'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shrink-0 shadow-xs flex items-center justify-center border border-zinc-200 dark:border-zinc-700"
                    style={{ backgroundColor: opt.hex, color: opt.hex === '#e3fff2' ? '#09090b' : '#ffffff' }}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </span>
                  <span className="truncate">{opt.name}</span>
                </button>
              );
            })}
          </div>

          {/* カスタムカラーHex指定 */}
          <div className="mt-3 flex items-center space-x-2">
            <input
              type="text"
              placeholder={theme === 'dark' ? '#e3fff2' : '#219134'}
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              className="w-32 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-mono text-zinc-900 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleCustomColorApply}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              HEX色を適用
            </button>
          </div>
        </div>
      </div>

      {/* アカウント設定 */}
      <form onSubmit={handleProfileSave} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <User className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            アカウント情報
          </h2>
        </div>

        {/* 同期・アカウント状態 */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-200">
              {currentUser?.role === 'teacher' ? '教' : '生'}
            </div>
            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5">
                <span>{currentUser?.name || 'ユーザー'}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-700 font-normal">
                  {currentUser?.role === 'teacher' ? '先生' : `${currentUser?.grade || 2}年${currentUser?.classRoom || ''}`}
                </span>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {supabaseStatus === 'connected' ? 'Supabase クラウド同期中' : 'ローカル保存モード'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSyncData}
            disabled={isSyncingData}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingData ? 'animate-spin' : ''}`} />
            <span>{isSyncingData ? '同期中...' : 'データを再同期'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              氏名
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              メールアドレス
            </label>
            <input
              type="email"
              value={currentUser?.email || ''}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/60 text-zinc-500 text-sm cursor-not-allowed"
            />
          </div>

          {!isTeacher && (
            <>
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  学年
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                >
                  <option value={1}>高校1年生</option>
                  <option value={2}>高校2年生</option>
                  <option value={3}>高校3年生</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  クラス
                </label>
                <input
                  type="text"
                  value={classRoom}
                  onChange={(e) => setClassRoom(e.target.value)}
                  placeholder="例: 1組"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  出席番号
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  1週間の目標学習時間（時間）
                </label>
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={weeklyGoalHours}
                  onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
                />
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  ホーム画面の目標円グラフに反映されます
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  重視する科目
                </label>
                <select
                  value={focusSubjectId}
                  onChange={(e) => setFocusSubjectId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-zinc-400 mt-0.5 block">
                  重点的に取り組む科目としてホーム画面に表示されます
                </span>
              </div>
            </>
          )}

          {isTeacher && (
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                担当学年・分掌・教科
              </label>
              <input
                type="text"
                value={classRoom}
                onChange={(e) => setClassRoom(e.target.value)}
                placeholder="例: 2学年団・数学科"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl font-bold text-sm shadow-xs transition-opacity hover:opacity-95 cursor-pointer flex items-center justify-center space-x-2 mt-4"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <Save className="w-4 h-4" />
          <span>アカウント情報を保存</span>
        </button>
      </form>
    </div>
  );
};
