/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../../domain/models/index.ts';
import { User, GraduationCap, Shield, X, Check } from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { services } from '../../infrastructure/ServiceContainer.ts';

interface AccountCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AccountCreateModal: React.FC<AccountCreateModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { switchUserRole, refreshData } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [accountName, setAccountName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCreateNewAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // ログアウトして完全な新規IDを生成
      await services.authRepository.logout();
      const newId = `${selectedRole}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      
      const defaultName = selectedRole === 'teacher' ? '新任教諭' : selectedRole === 'system' ? 'システム管理者' : '新入生徒';
      const nameToUse = accountName.trim() || defaultName;

      const newUser = {
        id: newId,
        name: nameToUse,
        email: '',
        role: selectedRole,
        grade: selectedRole === 'student' ? 2 : undefined,
        classRoom: selectedRole === 'student' ? '1組' : selectedRole === 'teacher' ? '数学科' : 'システム保守',
        studentNumber: selectedRole === 'student' ? 1 : undefined,
        weeklyGoalMinutes: 900,
        focusSubjectId: 'math',
        isGoogleAccount: false,
      };

      localStorage.setItem('tulips_current_user', JSON.stringify(newUser));
      const storageKey = selectedRole === 'teacher' ? 'tulips_teacher_user' : selectedRole === 'system' ? 'tulips_system_user' : 'tulips_student_user';
      localStorage.setItem(storageKey, JSON.stringify(newUser));

      await switchUserRole(selectedRole);
      await refreshData();
      setIsLoading(false);
      onCreated();
      onClose();
      window.location.reload();
    } catch (err) {
      console.error('Failed to create new account:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
        
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            新規アカウントの作成と役割選択
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Googleアカウントの変更とは別に、独立した新しいアカウントを新規作成します。ログインする役割を選択してください。
        </p>

        <form onSubmit={handleCreateNewAccountSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
              アカウント名（氏名など）
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="例: 佐藤 太郎 / 山田 先生"
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
              ログインするアカウントの種類（ロール）
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'student', label: '生徒', icon: User, desc: '学習記録・タイマー' },
                { id: 'teacher', label: '先生', icon: GraduationCap, desc: '統計・課題配信' },
                { id: 'system', label: 'システム', icon: Shield, desc: '保守・同期管理' },
              ].map((opt) => {
                const IconComponent = opt.icon;
                const isSelected = selectedRole === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedRole(opt.id as UserRole)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center space-y-1.5 ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 shadow-md'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className={`text-[10px] ${isSelected ? 'opacity-80' : 'text-zinc-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm shadow-md hover:opacity-90 cursor-pointer flex items-center justify-center space-x-2 transition-all mt-4"
          >
            <span>新しいアカウントを作成してログイン</span>
          </button>
        </form>

      </div>
    </div>
  );
};
