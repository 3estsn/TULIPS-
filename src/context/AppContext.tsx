/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ComprehensiveStatistics,
  Material,
  RegularTestTask,
  Subject,
  User,
  UserRole,
} from '../domain/models/index.ts';
import { services } from '../infrastructure/ServiceContainer.ts';

export type NavTab = 'home' | 'record' | 'stats' | 'schedule' | 'settings' | 'teacher_stats' | 'teacher_tasks';

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
  isLoading: boolean;
  refreshData: () => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
  loginWithGoogle: (role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<Omit<User, 'id' | 'email'>>) => Promise<void>;
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

  const refreshData = async () => {
    try {
      const user = await services.authRepository.getCurrentUser();
      setCurrentUser(user);

      if (user) {
        const [statsData, tasksData, subjectsData, materialsData] = await Promise.all([
          services.studyRecordRepository.calculateStatistics(user.id),
          services.taskRepository.getTasks({
            grade: user.role === 'student' ? user.grade : undefined,
            classRoom: user.role === 'student' ? user.classRoom : undefined,
          }),
          services.materialRepository.getSubjects(),
          services.materialRepository.getMaterials(),
        ]);

        setStats(statsData);
        setTasks(tasksData);
        setSubjects(subjectsData);
        setMaterials(materialsData);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

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
        isLoading,
        refreshData,
        switchUserRole,
        loginWithGoogle,
        logout,
        updateUserProfile,
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
