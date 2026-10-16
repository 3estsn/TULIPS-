/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { BottomNav } from './components/layout/BottomNav.tsx';
import { Header } from './components/layout/Header.tsx';
import { HomeView } from './components/student/HomeView.tsx';
import { RecordView } from './components/student/RecordView.tsx';
import { StatisticsView } from './components/student/StatisticsView.tsx';
import { PlannedView } from './components/student/PlannedView.tsx';
import { SettingsView } from './components/student/SettingsView.tsx';
import { TeacherDashboardView } from './components/teacher/TeacherDashboardView.tsx';
import { TeacherTasksView } from './components/teacher/TeacherTasksView.tsx';

const AppContent: React.FC = () => {
  const { activeTab, currentUser } = useApp();
  const isTeacher = currentUser?.role === 'teacher';

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'record':
        return <RecordView />;
      case 'stats':
        return <StatisticsView />;
      case 'schedule':
        return <PlannedView />;
      case 'settings':
        return <SettingsView />;
      case 'teacher_stats':
        return <TeacherDashboardView />;
      case 'teacher_tasks':
        return <TeacherTasksView />;
      default:
        return isTeacher ? <TeacherDashboardView /> : <HomeView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row">
      {/* デスクトップ用サイドバー（左側配置、上部にハンバーガーボタンで収納・アイコン表示） */}
      <Sidebar />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* モバイル用ボトムナビゲーション（中央に「記録する」ボタン） */}
      <BottomNav />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
