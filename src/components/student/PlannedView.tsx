/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Calendar, Clock, AlertCircle, ArrowRight, BookMarked, CheckSquare } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';

export const PlannedView: React.FC = () => {
  const { accentColor, accentForeground, tasks, setActiveTab } = useApp();

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 md:pb-12 text-center py-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 sm:p-10 shadow-xs">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-sm"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <Calendar className="w-8 h-8" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 mb-3">
          将来的に実装予定の機能
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          学習計画・カレンダー（予定）
        </h1>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
          定期テスト、校内模試、検定試験の日程に合わせた学習スケジュールの逆算登録や、日々の学習目標タスクを自動管理する機能を次回アップデートにて実装予定です。
        </p>

        <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 text-left space-y-3">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            実装予定の機能一覧：
          </div>
          <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2">
            <li className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 shrink-0 text-zinc-400" />
              <span>定期テスト・模試日程カウントダウンカレンダー</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 shrink-0 text-zinc-400" />
              <span>教科書・問題集のページ配分による週間目標自動設定</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 shrink-0 text-zinc-400" />
              <span>Google カレンダー等との学習予定同期連携</span>
            </li>
          </ul>
        </div>

        <div className="mt-8">
          <button
            onClick={() => setActiveTab('record')}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-opacity hover:opacity-95 cursor-pointer shadow-xs"
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            <span>今の学習時間を記録する</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
