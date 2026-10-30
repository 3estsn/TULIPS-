/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  ComprehensiveStatistics,
  Material,
  RegularTestTask,
  StudentTask,
  Subject,
  TaskPaceInfo,
  User,
  UserRole,
  calculateTaskPace,
} from '../domain/models/index.ts';
import { services } from '../infrastructure/ServiceContainer.ts';
import { subscribeToSupabaseRealtime, syncSupabaseConfigFromServer } from '../infrastructure/supabase.ts';
import { useSupabaseRealtime } from '../hooks/useSupabaseRealtime.ts';

export type NavTab =
  | 'home'
  | 'record'
  | 'stats'
  | 'schedule'
  | 'settings'
  | 'teacher_stats'
  | 'teacher_tasks'
  | 'teacher_materials'
  | 'system_portal';

export const LIGHT_DEFAULT_ACCENT = '#219134';
export const DARK_DEFAULT_ACCENT = '#e3fff2';

export interface AccentColorOption {
  id: string;
  name: string;
  hex: string;
}

export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#09090b' : '#ffffff';
}

interface AppContextType {
  currentUser: User | null;
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  accentColor: string;
  accentForeground: string;
  setAccentColor: (color: string) => void;
  stats: ComprehensiveStatistics | null;
  tasks: RegularTestTask[];
  subjects: Subject[];
  materials: Material[];
  studentTasks: StudentTask[];
  activeStudentTaskPaces: TaskPaceInfo[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
  
  // 生徒学習タスク操作
  addStudentTask: (task: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>) => Promise<StudentTask>;
  updateStudentTask: (id: string, updates: Partial<Omit<StudentTask, 'id' | 'createdAt'>>) => Promise<StudentTask>;
  toggleTaskItemCompletion: (taskId: string, itemId: string, isCompleted: boolean) => Promise<void>;
  deleteStudentTask: (id: string) => Promise<void>;

  // 教材・構造マスタ操作 (教員・生徒)
  addMaterial: (material: Omit<Material, 'id'>) => Promise<Material>;
  updateMaterial: (id: string, updates: Partial<Omit<Material, 'id'>>) => Promise<Material>;
  deleteMaterial: (id: string) => Promise<boolean>;

  // テスト課題からタスク作成への引き継ぎ状態
  pendingRegularTaskForStudentPlan: RegularTestTask | null;
  setPendingRegularTaskForStudentPlan: (task: RegularTestTask | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('tulips_sidebar_collapsed') === 'true';
  });
  
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tulips_theme') as 'light' | 'dark') || 'light';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    const saved = localStorage.getItem('tulips_accent_color');
    if (!saved || saved === '#65cf77') {
      const initialTheme = (localStorage.getItem('tulips_theme') as 'light' | 'dark') || 'light';
      return initialTheme === 'dark' ? DARK_DEFAULT_ACCENT : LIGHT_DEFAULT_ACCENT;
    }
    return saved;
  });

  const [stats, setStats] = useState<ComprehensiveStatistics | null>(null);
  const [tasks, setTasks] = useState<RegularTestTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [studentTasks, setStudentTasks] = useState<StudentTask[]>([]);
  const [pendingRegularTaskForStudentPlan, setPendingRegularTaskForStudentPlan] = useState<RegularTestTask | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const accentForeground = getContrastTextColor(accentColor);

  // テーマ・アクセントカラーのCSS変数適用
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--accent-color', accentColor);
    root.style.setProperty('--accent-foreground', accentForeground);
    root.style.setProperty('--accent-glow', `${accentColor}33`);
    
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('tulips_theme', theme);
    localStorage.setItem('tulips_accent_color', accentColor);
  }, [theme, accentColor, accentForeground]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('tulips_sidebar_collapsed', String(next));
      return next;
    });
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    // デフォルトアクセントカラーを使用している場合は新テーマのデフォルトへ自動追従
    setAccentColorState((current) => {
      if (
        current === LIGHT_DEFAULT_ACCENT ||
        current === DARK_DEFAULT_ACCENT ||
        current === '#65cf77'
      ) {
        return newTheme === 'dark' ? DARK_DEFAULT_ACCENT : LIGHT_DEFAULT_ACCENT;
      }
      return current;
    });
  };

  const setAccentColor = (newColor: string) => {
    setAccentColorState(newColor);
  };

  const refreshData = React.useCallback(async () => {
    try {
      const user = await services.authRepository.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const studentId = user.role === 'student' ? user.id : 'student-001';
        const [statsData, tasksData, subjectsData, materialsData, studentTasksData] = await Promise.all([
          services.studyRecordRepository.calculateStatistics(user.id),
          services.taskRepository.getTasks({
            grade: user.role === 'student' ? user.grade : undefined,
            classRoom: user.role === 'student' ? user.classRoom : undefined,
          }),
          services.materialRepository.getSubjects(),
          services.materialRepository.getMaterials(),
          services.studentTaskRepository.getTasksByUser(studentId),
        ]);

        setStats(statsData);
        setTasks(tasksData);
        setSubjects(subjectsData);
        setMaterials(materialsData);
        setStudentTasks(studentTasksData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Supabase Realtime カスタムフックによる自動購読（URL入力不要）
  useSupabaseRealtime('study_records', React.useCallback(() => {
    refreshData();
  }, [refreshData]));

  useSupabaseRealtime('regular_test_tasks', React.useCallback(() => {
    refreshData();
  }, [refreshData]));

  useSupabaseRealtime('student_tasks', React.useCallback(() => {
    refreshData();
  }, [refreshData]));

  useSupabaseRealtime('users', React.useCallback(() => {
    refreshData();
  }, [refreshData]));

  useEffect(() => {
    refreshData();

    // サーバーから Supabase 設定を同期取得（別端末でも自動設定）
    syncSupabaseConfigFromServer().then((updated) => {
      if (updated) refreshData();
    });

    // 2. ConoHa サーバー SSE (/api/events) による全端末リアルタイム同期
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload?.event === 'data_changed') {
            refreshData();
          }
        } catch {}
      };
    } catch {}

    // 3. 5秒おきのバックアップ自動ポーリング（通信瞬断時も確実に最新化）
    const interval = setInterval(() => {
      refreshData();
    }, 5000);

    // 4. ウィンドウ・タブ復帰時の即時最新化
    const onFocus = () => {
      refreshData();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      if (eventSource) eventSource.close();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // 全アクティブタスクの日割りペース情報をリアルタイム算出
  const activeStudentTaskPaces = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return studentTasks.map((t) => calculateTaskPace(t, today));
  }, [studentTasks]);

  // 生徒タスクの操作
  const addStudentTask = async (
    taskData: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<StudentTask> => {
    const created = await services.studentTaskRepository.addTask(taskData);
    setStudentTasks((prev) => [created, ...prev]);
    return created;
  };

  const updateStudentTask = async (
    id: string,
    updates: Partial<Omit<StudentTask, 'id' | 'createdAt'>>
  ): Promise<StudentTask> => {
    const updated = await services.studentTaskRepository.updateTask(id, updates);
    setStudentTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  };

  const toggleTaskItemCompletion = async (
    taskId: string,
    itemId: string,
    isCompleted: boolean
  ): Promise<void> => {
    const updated = await services.studentTaskRepository.toggleItemCompletion(
      taskId,
      itemId,
      isCompleted
    );
    setStudentTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
  };

  const deleteStudentTask = async (id: string): Promise<void> => {
    await services.studentTaskRepository.deleteTask(id);
    setStudentTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // 教材・構造マスタ操作
  const addMaterial = async (
    materialData: Omit<Material, 'id'>
  ): Promise<Material> => {
    const created = await services.materialRepository.addMaterial(materialData);
    setMaterials((prev) => [...prev, created]);
    return created;
  };

  const updateMaterial = async (
    id: string,
    updates: Partial<Omit<Material, 'id'>>
  ): Promise<Material> => {
    const updated = await services.materialRepository.updateMaterial(id, updates);
    setMaterials((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const deleteMaterial = async (id: string): Promise<boolean> => {
    const ok = await services.materialRepository.deleteMaterial(id);
    if (ok) {
      setMaterials((prev) => prev.filter((m) => m.id !== id));
    }
    return ok;
  };

  const switchUserRole = async (role: UserRole) => {
    setIsLoading(true);
    const updated = await services.authRepository.switchRole(role);
    setCurrentUser(updated);
    if (role === 'teacher') {
      setActiveTab('teacher_stats');
    } else {
      setActiveTab('home');
    }
    await refreshData();
  };

  const loginWithGoogle = async (role: UserRole = 'student') => {
    setIsLoading(true);
    const user = await services.authRepository.loginWithGoogle(role);
    setCurrentUser(user);
    if (role === 'teacher') {
      setActiveTab('teacher_stats');
    } else {
      setActiveTab('home');
    }
    await refreshData();
  };

  const logout = async () => {
    await services.authRepository.logout();
    setCurrentUser(null);
  };

  const updateUserProfile = async (updates: Partial<Omit<User, 'id' | 'email'>>) => {
    const updated = await services.authRepository.updateProfile(updates);
    setCurrentUser(updated);
    await refreshData();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeTab,
        setActiveTab,
        isSidebarCollapsed,
        toggleSidebar,
        theme,
        setTheme,
        accentColor,
        accentForeground,
        setAccentColor,
        stats,
        tasks,
        subjects,
        materials,
        studentTasks,
        activeStudentTaskPaces,
        isLoading,
        refreshData,
        switchUserRole,
        loginWithGoogle,
        logout,
        updateUserProfile,
        addStudentTask,
        updateStudentTask,
        toggleTaskItemCompletion,
        deleteStudentTask,
        addMaterial,
        updateMaterial,
        deleteMaterial,
        pendingRegularTaskForStudentPlan,
        setPendingRegularTaskForStudentPlan,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
