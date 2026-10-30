/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Edit2,
  Trash2,
  Save,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Shield,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';
import { User, UserRole } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { useApp } from '../../context/AppContext.tsx';
import { useSupabaseRealtime } from '../../hooks/useSupabaseRealtime.ts';

export const UserManagementView: React.FC = () => {
  const { accentColor, accentForeground, currentUser, refreshData } = useApp();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // 新規追加用ステート
  const [newUserData, setNewUserData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'student',
    grade: 2,
    classRoom: '1組',
    studentNumber: 1,
  });

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const list = await services.authRepository.getAllUsers();
      setUsers(list);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Supabase Realtimeで users テーブルの変更を自動購読
  useSupabaseRealtime('users', useCallback(() => {
    loadUsers();
  }, [loadUsers]));

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const updated = await services.authRepository.updateAnyUser(editingUser.id, {
        name: editingUser.name.trim(),
        role: editingUser.role,
        email: editingUser.email.trim(),
        grade: editingUser.role === 'student' ? Number(editingUser.grade) : undefined,
        classRoom: editingUser.classRoom?.trim(),
        studentNumber: editingUser.role === 'student' ? Number(editingUser.studentNumber) : undefined,
      });

      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setEditingUser(null);
      showNotification('success', `${updated.name} さんのアカウント情報を更新しました。`);
      await refreshData();
    } catch (err: any) {
      showNotification('error', err?.message || 'アカウント情報の更新に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      alert('現在ログイン中の管理者アカウントは削除できません。');
      return;
    }
    if (!window.confirm(`「${userName}」のアカウントを削除しますか？`)) {
      return;
    }
    try {
      await services.authRepository.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showNotification('success', `${userName} のアカウントを削除しました。`);
      await refreshData();
    } catch (err: any) {
      showNotification('error', err?.message || 'アカウント削除に失敗しました。');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name?.trim()) return;
    setIsSaving(true);
    try {
      const newId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const created = await services.authRepository.updateAnyUser(newId, {
        id: newId,
        name: newUserData.name.trim(),
        email: newUserData.email?.trim() || '',
        role: newUserData.role || 'student',
        grade: newUserData.role === 'student' ? Number(newUserData.grade) : undefined,
        classRoom: newUserData.classRoom?.trim() || '1組',
        studentNumber: newUserData.role === 'student' ? Number(newUserData.studentNumber) : undefined,
        weeklyGoalMinutes: 900,
        focusSubjectId: 'math',
      });
      setUsers((prev) => [created, ...prev]);
      setIsAddModalOpen(false);
      setNewUserData({ name: '', email: '', role: 'student', grade: 2, classRoom: '1組', studentNumber: 1 });
      showNotification('success', `${created.name} のアカウントを作成しました。`);
      await refreshData();
    } catch (err: any) {
      showNotification('error', err?.message || 'アカウント作成に失敗しました。');
    } finally {
      setIsSaving(false);
    }
  };

  // フィルタリング
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchClass = u.classRoom?.toLowerCase().includes(q);
      return matchName || matchEmail || matchClass;
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 md:pb-8 text-xs sm:text-sm">
      {/* ページタイトルヘッダー */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-indigo-300">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
              System Administration
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">
              アカウント管理・他アカウント編集
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>新規アカウント作成</span>
        </button>
      </div>

      {notification && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center space-x-2.5 shadow-xs animate-in fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 検索・絞り込みバー */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="氏名、メールアドレス、クラスで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden focus:border-zinc-400"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-zinc-400 shrink-0" />
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 space-x-1">
            {(
              [
                { id: 'all', label: '全員' },
                { id: 'student', label: '生徒' },
                { id: 'teacher', label: '先生' },
                { id: 'system', label: 'システム' },
              ] as const
            ).map((rf) => (
              <button
                key={rf.id}
                type="button"
                onClick={() => setRoleFilter(rf.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  roleFilter === rf.id
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {rf.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={loadUsers}
            title="最新データ再取得"
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-zinc-500 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ユーザー一覧テーブル */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-bold">
                <th className="py-3 px-4">氏名</th>
                <th className="py-3 px-4">ロール</th>
                <th className="py-3 px-4">学年・クラス・番号</th>
                <th className="py-3 px-4">メールアドレス</th>
                <th className="py-3 px-4">Google連携</th>
                <th className="py-3 px-4 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400">
                    該当するアカウントが見つかりません
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  return (
                    <tr key={u.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        {u.name}
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-normal">
                            (現在ログイン中)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {u.role === 'student' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <UserIcon className="w-3 h-3 mr-1" />
                            生徒
                          </span>
                        )}
                        {u.role === 'teacher' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <GraduationCap className="w-3 h-3 mr-1" />
                            先生
                          </span>
                        )}
                        {u.role === 'system' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <Shield className="w-3 h-3 mr-1" />
                            システム
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400">
                        {u.role === 'student' ? (
                          <span>
                            {u.grade ? `${u.grade}年` : ''} {u.classRoom || '1組'} {u.studentNumber ? `${u.studentNumber}番` : ''}
                          </span>
                        ) : (
                          <span>{u.classRoom || (u.role === 'teacher' ? '担当教諭' : 'システム管理')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-600 dark:text-zinc-400 truncate max-w-xs">
                        {u.email || '未設定'}
                      </td>
                      <td className="py-3 px-4">
                        {u.isGoogleAccount ? (
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                            連携済
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">未連携</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingUser({ ...u })}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
                            title="アカウントを編集"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(u.id, u.name)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 cursor-pointer"
                              title="アカウントを削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* アカウント編集モーダル */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  アカウント情報の編集
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  氏名
                </label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  アカウントのロール（権限）
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['student', 'teacher', 'system'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditingUser({ ...editingUser, role: r })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        editingUser.role === r
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-500'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {r === 'student' ? '生徒' : r === 'teacher' ? '先生' : 'システム'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  メールアドレス
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  placeholder="name@tulips-high.ed.jp"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-hidden"
                />
              </div>

              {editingUser.role === 'student' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      学年
                    </label>
                    <select
                      value={editingUser.grade || 2}
                      onChange={(e) => setEditingUser({ ...editingUser, grade: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                    >
                      <option value={1}>1年生</option>
                      <option value={2}>2年生</option>
                      <option value={3}>3年生</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      クラス
                    </label>
                    <input
                      type="text"
                      value={editingUser.classRoom || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, classRoom: e.target.value })}
                      placeholder="例: 1組"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      出席番号
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={editingUser.studentNumber || 1}
                      onChange={(e) => setEditingUser({ ...editingUser, studentNumber: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    担当・分掌
                  </label>
                  <input
                    type="text"
                    value={editingUser.classRoom || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, classRoom: e.target.value })}
                    placeholder="例: 数学科・学年主任"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? '保存中...' : '変更を保存'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 新規アカウント作成モーダル */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  新規アカウント登録
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  氏名
                </label>
                <input
                  type="text"
                  required
                  placeholder="例: 佐藤 健太"
                  value={newUserData.name || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  アカウントのロール
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['student', 'teacher', 'system'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewUserData({ ...newUserData, role: r })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        newUserData.role === r
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200 dark:border-indigo-500'
                          : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      {r === 'student' ? '生徒' : r === 'teacher' ? '先生' : 'システム'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  メールアドレス
                </label>
                <input
                  type="email"
                  placeholder="例: sato@tulips-high.ed.jp"
                  value={newUserData.email || ''}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:outline-hidden"
                />
              </div>

              {newUserData.role === 'student' ? (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      学年
                    </label>
                    <select
                      value={newUserData.grade || 2}
                      onChange={(e) => setNewUserData({ ...newUserData, grade: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                    >
                      <option value={1}>1年生</option>
                      <option value={2}>2年生</option>
                      <option value={3}>3年生</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      クラス
                    </label>
                    <input
                      type="text"
                      value={newUserData.classRoom || '1組'}
                      onChange={(e) => setNewUserData({ ...newUserData, classRoom: e.target.value })}
                      placeholder="例: 1組"
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      出席番号
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={newUserData.studentNumber || 1}
                      onChange={(e) => setNewUserData({ ...newUserData, studentNumber: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">
                    担当・分掌
                  </label>
                  <input
                    type="text"
                    value={newUserData.classRoom || ''}
                    onChange={(e) => setNewUserData({ ...newUserData, classRoom: e.target.value })}
                    placeholder="例: 数学科・学年主任"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs focus:outline-hidden"
                  />
                </div>
              )}

              <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isSaving ? '登録中...' : 'アカウントを作成'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
