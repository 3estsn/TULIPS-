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
  GraduationCap,
  LogOut,
  Save,
  CheckCircle,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { AccountCreateModal } from '../auth/AccountCreateModal.tsx';

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
    setActiveTab,
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
  const [isSigningInGoogle, setIsSigningInGoogle] = useState<boolean>(false);
  const [googleAuthError, setGoogleAuthError] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.name) {
      setName(currentUser.name);
    }
  }, [currentUser?.name]);

  const handleGoogleSignIn = async () => {
    setIsSigningInGoogle(true);
    setGoogleAuthError('');
    try {
      await loginWithGoogle(currentUser?.role || 'student');
      setSavedMessage('Googleアカウント（Firebase Auth）と正常に連携・再同期しました。');
      setTimeout(() => setSavedMessage(''), 3500);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const msg = err?.message || String(err);
      setGoogleAuthError(msg);
    } finally {
      setIsSigningInGoogle(false);
    }
  };

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

      {/* 画面モード切替（システム管理者のみ切替可能。生徒・教員は自身の固定ロールを表示） */}
      {currentUser?.role === 'system' ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              画面モードの切替（システム管理者権限）
            </h2>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            システムアカウントは生徒画面・教員画面・システム管理画面の3種類全てを切り替えて点検・操作できます。
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">生徒画面をプレビュー</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                学習記録表・統計・スケジュール
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('teacher_stats')}
              className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">教員画面をプレビュー</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                生徒統計一覧・課題配信
              </p>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('system_users')}
              className="p-3.5 rounded-xl border border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-left transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-indigo-900 dark:text-indigo-200">ユーザー管理・編集</span>
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                生徒/先生アカウントの編集・削除
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <GraduationCap className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              画面権限情報
            </h2>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">現在のアカウント権限:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
              currentUser?.role === 'teacher'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {currentUser?.role === 'teacher' ? '教員アカウント（教員画面専用）' : '生徒アカウント（生徒画面専用）'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
            ※教員アカウントは教員画面のみ、生徒アカウントは生徒画面のみ閲覧可能です。ロールや学年・クラス等の変更はシステム管理者にお問い合わせください。
          </p>
        </div>
      )}

      {/* ログアウト管理 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            セッションログアウト
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            ログアウトすると、ログイン画面が表示されます。
          </p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="px-4 py-2.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 text-xs font-bold hover:bg-rose-100 cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs shrink-0 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>ログアウトする</span>
        </button>
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

        {/* Google アカウント状態（Firebase Auth 連携） */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 flex items-center justify-center font-bold text-sm text-zinc-700 dark:text-zinc-200 shadow-2xs shrink-0">
              <span className="text-[#4285F4]">G</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {isTeacher ? '先生用 Google アカウント (Firebase Auth)' : '生徒用 Google アカウント (Firebase Auth)'}
                </span>
                {currentUser?.isGoogleAccount ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    連携済み
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400">
                    未連携
                  </span>
                )}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {currentUser?.email ? currentUser.email : 'Google アカウントと未接続です'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningInGoogle}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSigningInGoogle ? 'animate-spin' : ''}`} />
              <span>{currentUser?.isGoogleAccount ? 'Googleアカウント切替' : 'Googleアカウントに接続'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:border-emerald-700 dark:text-emerald-200 hover:bg-emerald-100 flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <span>+ アカウント新規作成</span>
            </button>
          </div>
        </div>

        <AccountCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {}}
        />

        {googleAuthError && (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">{googleAuthError}</p>
              {googleAuthError.includes('Firebase未承認ドメイン') && (
                <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-relaxed">
                  ※ ConoHaサーバー（{typeof window !== 'undefined' ? window.location.hostname : '163.44.113.224'}）でGoogleログインを許可するには、Firebase Console の「Authentication &gt; Settings &gt; Authorized domains（承認済みドメイン）」に対象ホストを追加する必要があります。
                </p>
              )}
            </div>
          </div>
        )}

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
                  max="86"
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
