/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BookOpen, GraduationCap, Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

export const Header: React.FC = () => {
  const { currentUser, switchUserRole, accentColor, accentForeground, theme, setTheme } = useApp();
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <header className="h-14 sm:h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md sticky top-0 z-20 px-4 sm:px-6 flex items-center justify-between">
      {/* モバイル用ブランド表示 */}
      <div className="flex items-center space-x-2 md:hidden">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-xs"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <BookOpen className="w-4 h-4" />
        </div>
        <span className="font-extrabold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
          TULIPS
        </span>
      </div>

      <div className="hidden md:block">
        <span className="text-xs font-semibold text-zinc-400">高校生向け学習記録システム</span>
      </div>

      {/* 右側アクション：ロール表示・切替 ＆ テーマ切替 */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {currentUser?.role === 'system' ? (
          <div className="flex items-center space-x-1 bg-indigo-50 dark:bg-indigo-950/50 p-1 rounded-full border border-indigo-200 dark:border-indigo-800 text-xs">
            <span className="px-2 py-0.5 font-bold text-indigo-700 dark:text-indigo-300 text-[11px]">
              管理者
            </span>
          </div>
        ) : isTeacher ? (
          <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700">
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>教員専用</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold border bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700">
            <GraduationCap className="w-3.5 h-3.5 shrink-0" />
            <span>生徒専用</span>
          </div>
        )}

        {/* テーマ切替アイコン */}
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="p-2 rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          title={theme === 'light' ? 'ダークモードへ' : 'ライトモードへ'}
          aria-label="テーマ切替"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
