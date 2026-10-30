/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Home, BarChart3, Plus, CalendarCheck, Settings, Users, ClipboardList, ShieldCheck, UserCog } from 'lucide-react';
import { NavTab, useApp } from '../../context/AppContext.tsx';

export const BottomNav: React.FC = () => {
  const { currentUser, activeTab, setActiveTab, accentColor, accentForeground } = useApp();
  const isSystem = currentUser?.role === 'system';
  const isTeacher = currentUser?.role === 'teacher';

  if (isSystem) {
    return (
      <nav
        aria-label="モバイルナビゲーション"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-3 py-1.5 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => setActiveTab('system_users')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'system_users'
              ? 'text-zinc-900 dark:text-zinc-100 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: activeTab === 'system_users' ? accentColor : undefined }}
        >
          <UserCog className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">ユーザー管理</span>
        </button>

        <button
          onClick={() => setActiveTab('system_portal')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'system_portal'
              ? 'text-zinc-900 dark:text-zinc-100 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: activeTab === 'system_portal' ? accentColor : undefined }}
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">同期保守</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher_stats')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'teacher_stats' || activeTab === 'teacher_tasks' || activeTab === 'teacher_materials'
              ? 'text-zinc-900 dark:text-zinc-100 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: (activeTab === 'teacher_stats' || activeTab === 'teacher_tasks' || activeTab === 'teacher_materials') ? accentColor : undefined }}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">教員画面</span>
        </button>

        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'home' || activeTab === 'record' || activeTab === 'stats' || activeTab === 'schedule'
              ? 'text-zinc-900 dark:text-zinc-100 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: (activeTab === 'home' || activeTab === 'record' || activeTab === 'stats' || activeTab === 'schedule') ? accentColor : undefined }}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">生徒画面</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'text-zinc-900 dark:text-zinc-100 font-bold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: activeTab === 'settings' ? accentColor : undefined }}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">設定</span>
        </button>
      </nav>
    );
  }

  if (isTeacher) {
    return (
      <nav
        aria-label="モバイルナビゲーション"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 flex items-center justify-around shadow-lg"
      >
        <button
          onClick={() => setActiveTab('teacher_stats')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'teacher_stats'
              ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: activeTab === 'teacher_stats' ? accentColor : undefined }}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span>生徒統計</span>
        </button>

        <button
          onClick={() => setActiveTab('teacher_tasks')}
          className="flex flex-col items-center -top-3 relative cursor-pointer"
        >
          <div
            className="w-13 h-13 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95"
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            <ClipboardList className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200 mt-1">
            課題設定
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center py-1 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
            activeTab === 'settings'
              ? 'text-zinc-900 dark:text-zinc-100 font-semibold'
              : 'text-zinc-500 dark:text-zinc-400'
          }`}
          style={{ color: activeTab === 'settings' ? accentColor : undefined }}
        >
          <Settings className="w-5 h-5 mb-0.5" />
          <span>設定</span>
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="モバイルナビゲーション"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 py-1.5 flex items-center justify-around shadow-lg"
    >
      {/* 1: ホーム */}
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          activeTab === 'home'
            ? 'text-zinc-900 dark:text-zinc-100 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
        style={{ color: activeTab === 'home' ? accentColor : undefined }}
      >
        <Home className="w-5 h-5 mb-0.5" />
        <span className="text-[11px]">ホーム</span>
      </button>

      {/* 2: 統計 */}
      <button
        onClick={() => setActiveTab('stats')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          activeTab === 'stats'
            ? 'text-zinc-900 dark:text-zinc-100 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
        style={{ color: activeTab === 'stats' ? accentColor : undefined }}
      >
        <BarChart3 className="w-5 h-5 mb-0.5" />
        <span className="text-[11px]">統計</span>
      </button>

      {/* 3: 中央「記録する」ボタン（要件指定） */}
      <button
        onClick={() => setActiveTab('record')}
        aria-label="記録する"
        className="flex flex-col items-center -top-3.5 relative cursor-pointer group"
      >
        <div
          className="w-13 h-13 rounded-full flex items-center justify-center shadow-md ring-4 ring-white dark:ring-zinc-900 transition-all duration-200 group-hover:scale-105 active:scale-95"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </div>
        <span
          className="text-[11px] font-bold mt-0.5"
          style={{ color: activeTab === 'record' ? accentColor : undefined }}
        >
          記録する
        </span>
      </button>

      {/* 4: 計画・タスク */}
      <button
        onClick={() => setActiveTab('schedule')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          activeTab === 'schedule'
            ? 'text-zinc-900 dark:text-zinc-100 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
        style={{ color: activeTab === 'schedule' ? accentColor : undefined }}
      >
        <CalendarCheck className="w-5 h-5 mb-0.5" />
        <span className="text-[11px]">計画</span>
      </button>

      {/* 5: 設定 */}
      <button
        onClick={() => setActiveTab('settings')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
          activeTab === 'settings'
            ? 'text-zinc-900 dark:text-zinc-100 font-bold'
            : 'text-zinc-500 dark:text-zinc-400'
        }`}
        style={{ color: activeTab === 'settings' ? accentColor : undefined }}
      >
        <Settings className="w-5 h-5 mb-0.5" />
        <span className="text-[11px]">設定</span>
      </button>
    </nav>
  );
};
