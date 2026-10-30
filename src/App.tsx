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
import { TeacherMaterialStructureEditor } from './components/teacher/TeacherMaterialStructureEditor.tsx';
import { LoginModal } from './components/auth/LoginModal.tsx';
import { SystemPortalView } from './components/system/SystemPortalView.tsx';
import { UserManagementView } from './components/system/UserManagementView.tsx';

const AppContent: React.FC = () => {
  const { activeTab, currentUser } = useApp();

  if (!currentUser) {
    return <LoginModal />;
  }

  const role = currentUser?.role;

  const renderContent = () => {
    // 1. 生徒アカウントの閲覧権限ガード（生徒画面のみ閲覧可能）
    if (role === 'student') {
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
        default:
          return <HomeView />;
      }
    }

    // 2. 教員アカウントの閲覧権限ガード（教員画面のみ閲覧可能）
    if (role === 'teacher') {
      switch (activeTab) {
        case 'teacher_stats':
          return <TeacherDashboardView />;
        case 'teacher_tasks':
          return <TeacherTasksView />;
        case 'teacher_materials':
          return <TeacherMaterialStructureEditor />;
        case 'settings':
          return <SettingsView />;
        default:
          return <TeacherDashboardView />;
      }
    }

    // 3. システムアカウント（生徒画面、教員画面、システム画面の全画面を閲覧・操作可能）
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'record':
        return <RecordView />;
      case 'stats':
        return <StatisticsView />;
      case 'schedule':
        return <PlannedView />;
      case 'teacher_stats':
        return <TeacherDashboardView />;
      case 'teacher_tasks':
        return <TeacherTasksView />;
      case 'teacher_materials':
        return <TeacherMaterialStructureEditor />;
      case 'system_portal':
        return <SystemPortalView />;
      case 'system_users':
        return <UserManagementView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <SystemPortalView />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row">
      {/* デスクトップ用サイドバー（左側配置、上部にハンバーガーボタンで収納・アイコン表示） */}
      <Sidebar />

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-3.5 sm:p-5 max-w-6xl mx-auto w-full">
          {renderContent()}
        </main>
      </div>

      {/* モバイル用ボトムナビゲーション（中央に「記録する」ボタン） */}
      <BottomNav />
    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TULIPS App Error caught:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('tulips_study_records_v2');
      localStorage.removeItem('tulips_regular_test_tasks_v2');
      localStorage.removeItem('tulips_current_user');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold text-lg">
              !
            </div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              画面の表示中に問題が発生しました
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {this.state.error?.message || '予期せぬエラーが発生しました。'}
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 cursor-pointer"
              >
                再試行
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 cursor-pointer"
              >
                データを初期化して再読込
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
