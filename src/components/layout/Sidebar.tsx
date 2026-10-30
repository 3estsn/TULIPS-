/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Menu,
  Home,
  PlusCircle,
  BarChart3,
  CalendarCheck,
  Settings,
  Users,
  ClipboardList,
  GraduationCap,
  BookOpen,
  Layers,
  ShieldCheck,
  UserCog,
  type LucideIcon,
} from 'lucide-react';
import { NavTab, useApp } from '../../context/AppContext.tsx';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    isSidebarCollapsed,
    toggleSidebar,
    accentColor,
    accentForeground,
    switchUserRole,
  } = useApp();

  const isSystem = currentUser?.role === 'system';
  const isTeacher = currentUser?.role === 'teacher';

  const studentMenuItems: { id: NavTab; label: string; icon: LucideIcon }[] = [
    { id: 'home', label: 'ホーム', icon: Home },
    { id: 'record', label: '記録する', icon: PlusCircle },
    { id: 'stats', label: '統計', icon: BarChart3 },
    { id: 'schedule', label: '計画・タスク', icon: CalendarCheck },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  const teacherMenuItems: { id: NavTab; label: string; icon: LucideIcon }[] = [
    { id: 'teacher_stats', label: '生徒学習統計', icon: Users },
    { id: 'teacher_tasks', label: '定期テスト課題配信', icon: ClipboardList },
    { id: 'teacher_materials', label: '教材構造マスター', icon: Layers },
    { id: 'settings', label: '設定', icon: Settings },
  ];

  const systemMenuItems: { id: NavTab; label: string; icon: LucideIcon }[] = [
    { id: 'system_users', label: 'アカウント管理・編集', icon: UserCog },
    { id: 'system_portal', label: 'システム管理・同期', icon: ShieldCheck },
    { id: 'teacher_stats', label: '教員画面プレビュー', icon: Users },
    { id: 'home', label: '生徒画面プレビュー', icon: Home },
    { id: 'settings', label: 'システム設定', icon: Settings },
  ];

  const menuItems = isSystem ? systemMenuItems : isTeacher ? teacherMenuItems : studentMenuItems;

  return (
    <aside
      className={`hidden md:flex flex-col border-r transition-all duration-300 select-none ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      } bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shrink-0 h-screen sticky top-0 z-30`}
    >
      {/* 最上部：ハンバーガーアイコン ＆ ブランドヘッダー */}
      <div
        className={`h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 ${
          isSidebarCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        {!isSidebarCollapsed && (
          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base shadow-sm shrink-0"
              style={{ backgroundColor: accentColor, color: accentForeground }}
            >
              {isSystem ? <ShieldCheck className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div className="flex flex-col truncate">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                TULIPS
              </span>
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                {isSystem ? 'システム管理コンソール' : '高校向け学習記録表'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebar}
          aria-label="メニュー開閉"
          title={isSidebarCollapsed ? 'メニューを展開' : 'メニューを収納'}
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ロールバッジ（展開時） */}
      {!isSidebarCollapsed && (
        <div className="px-3 pt-3">
          {isSystem ? (
            <div className="px-3 py-2.5 rounded-xl text-xs bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/40">
              <div className="flex items-center space-x-2 font-bold mb-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>システム管理者（全画面閲覧可能）</span>
              </div>
              <div className="grid grid-cols-3 gap-1 pt-0.5 text-[10px]">
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-1.5 py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                    activeTab === 'home' || activeTab === 'record' || activeTab === 'stats' || activeTab === 'schedule'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  生徒画面
                </button>
                <button
                  onClick={() => setActiveTab('teacher_stats')}
                  className={`px-1.5 py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                    activeTab === 'teacher_stats' || activeTab === 'teacher_tasks' || activeTab === 'teacher_materials'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  教員画面
                </button>
                <button
                  onClick={() => setActiveTab('system_users')}
                  className={`px-1.5 py-1 rounded text-center font-semibold transition-colors cursor-pointer ${
                    activeTab === 'system_users' || activeTab === 'system_portal'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                  }`}
                >
                  管理画面
                </button>
              </div>
            </div>
          ) : isTeacher ? (
            <div className="px-3 py-2 rounded-xl text-xs flex items-center space-x-2 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 font-semibold">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>教員アカウント（教員専用画面）</span>
            </div>
          ) : (
            <div className="px-3 py-2 rounded-xl text-xs flex items-center space-x-2 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 font-semibold">
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>生徒アカウント（生徒専用画面）</span>
            </div>
          )}
        </div>
      )}

      {/* ナビゲーションメニュー */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              title={isSidebarCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-150 cursor-pointer ${
                isSidebarCollapsed ? 'justify-center px-0 py-3' : 'px-3.5 py-2.5 space-x-3'
              } ${
                isActive
                  ? 'text-zinc-900 dark:text-zinc-50 font-semibold shadow-xs'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/60'
              }`}
              style={{
                backgroundColor: isActive ? `${accentColor}22` : undefined,
                borderLeft: isActive && !isSidebarCollapsed ? `4px solid ${accentColor}` : undefined,
              }}
            >
              <Icon
                className={`w-5 h-5 shrink-0 transition-colors ${
                  isActive ? '' : 'text-zinc-500 dark:text-zinc-400'
                }`}
                style={{ color: isActive ? accentColor : undefined }}
              />
              {!isSidebarCollapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ユーザーアカウント下部バー */}
      <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
        <div
          onClick={() => setActiveTab('settings')}
          className={`flex items-center rounded-xl p-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors ${
            isSidebarCollapsed ? 'justify-center' : 'space-x-3'
          }`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0"
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
          </div>
          {!isSidebarCollapsed && (
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentUser?.name || 'ゲスト'}
              </div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                {isSystem
                  ? 'システム統括責任者'
                  : isTeacher
                  ? currentUser?.classRoom || '担当教諭'
                  : `${currentUser?.grade || 2}年${currentUser?.classRoom || '1組'} ${currentUser?.studentNumber ? `${currentUser.studentNumber}番` : ''}`}
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
