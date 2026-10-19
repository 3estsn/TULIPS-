/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { RegularTestTask } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';

export const TeacherTasksView: React.FC = () => {
  const { tasks, subjects, currentUser, accentColor, accentForeground, refreshData } = useApp();

  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('2学期期末考査');
  const [subjectId, setSubjectId] = useState<string>('math');
  const [targetGrade, setTargetGrade] = useState<number>(2);
  const [targetClass, setTargetClass] = useState<string>('全クラス');
  const [scope, setScope] = useState<string>('');
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // 2週間後
    return d.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scope.trim()) return;

    try {
      await services.taskRepository.addTask({
        teacherId: currentUser?.id || 'teacher-001',
        teacherName: currentUser?.name || '担当教諭',
        title: title.trim(),
        subjectId,
        targetGrade,
        targetClass,
        scope: scope.trim(),
        deadline,
        notes: notes.trim() || undefined,
      });

      await refreshData();
      setSuccessMessage('定期テスト課題の範囲を登録・生徒へ配信しました。');
      setIsCreating(false);
      setScope('');
      setNotes('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    await services.taskRepository.deleteTask(id);
    await refreshData();
  };

  return (
    <div className="space-y-4 pb-20 md:pb-8 text-xs sm:text-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            教員用タスク管理
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            定期テスト課題の範囲設定
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            定期テストの課題範囲や提出期限を設定・配信します。生徒のホーム画面に即座に共有されます。
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-opacity hover:opacity-95 cursor-pointer shrink-0 shadow-xs"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isCreating ? 'フォームを閉じる' : '新規テスト課題を追加'}</span>
        </button>
      </div>

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 新規課題作成フォーム */}
      {isCreating && (
        <form
          onSubmit={handleCreateTask}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5"
        >
          <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <ClipboardList className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              新規 定期テスト課題の範囲を入力
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                テスト名称
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 2学期期末考査、1学期中間考査など"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                教科
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                対象学年
              </label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              >
                <option value={1}>1年生</option>
                <option value={2}>2年生</option>
                <option value={3}>3年生</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                対象クラス
              </label>
              <select
                value={targetClass}
                onChange={(e) => setTargetClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              >
                <option value="全クラス">学年全クラス</option>
                <option value="1組">1組</option>
                <option value="2組">2組</option>
                <option value="3組">3組</option>
                <option value="4組">4組</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              定期テスト課題の範囲（具体的に打ち込んでください）
            </label>
            <textarea
              rows={3}
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              placeholder="例: 教科書 p.48〜p.85（三角関数・対数関数の性質）、4STEP No.120〜No.185、配布プリントNo.1〜5"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                提出期日（考査初日または指定日）
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                注意事項・提出方法（任意）
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="例: 別冊解答で丸付けし間違えた問題は解き直すこと"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold shadow-xs transition-opacity hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: accentColor, color: accentForeground }}
            >
              生徒に課題範囲を配信する
            </button>
          </div>
        </form>
      )}

      {/* 登録済み定期テスト課題一覧 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            配信中の定期テスト課題一覧（{tasks.length}件）
          </h2>
          <span className="text-xs text-zinc-400">
            生徒のホーム画面に表示中
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="p-8 text-center text-sm text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            現在登録されている課題はありません。「新規テスト課題を追加」から入力してください。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => {
              const sub = subjects.find((s) => s.id === task.subjectId);
              return (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                          style={{ backgroundColor: sub?.color || '#3b82f6' }}
                        >
                          {sub?.name || '教科'}
                        </span>
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {task.title}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-zinc-400 hover:text-rose-500 p-1 transition-colors cursor-pointer"
                        title="課題を削除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3">
                      <div className="text-xs text-zinc-400 font-medium">課題範囲:</div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mt-0.5">
                        {task.scope}
                      </div>
                    </div>

                    {task.notes && (
                      <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 p-2 rounded-lg border border-zinc-200/60 dark:border-zinc-700/60">
                        指示: {task.notes}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>
                      対象: {task.targetGrade}年 {task.targetClass}
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      提出期限: {task.deadline}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
