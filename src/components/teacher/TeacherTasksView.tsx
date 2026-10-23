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
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { RegularTestTask } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { TeacherMaterialStructureEditor } from './TeacherMaterialStructureEditor.tsx';

export const TeacherTasksView: React.FC = () => {
  const {
    tasks,
    subjects,
    materials,
    currentUser,
    accentColor,
    accentForeground,
    refreshData,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'tasks' | 'materials'>('tasks');
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
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string>('');

  // 教科に応じた登録済み構造化教材
  const subjectMaterials = materials.filter((m) => m.subjectId === subjectId);

  const handleAppendScopeFromStructure = (textToAppend: string, matId: string) => {
    setScope((prev) => {
      const cleanPrev = prev.trim();
      if (!cleanPrev) return textToAppend;
      return `${cleanPrev}、${textToAppend}`;
    });
    if (!selectedMaterialIds.includes(matId)) {
      setSelectedMaterialIds((prev) => [...prev, matId]);
    }
  };

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
        materialIds: selectedMaterialIds.length > 0 ? selectedMaterialIds : undefined,
      });

      await refreshData();
      setSuccessMessage('定期テスト課題の範囲を登録・生徒へ配信しました。');
      setIsCreating(false);
      setScope('');
      setNotes('');
      setSelectedMaterialIds([]);
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
      {/* サブタブ切り替えバー */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 sm:space-x-3">
        <button
          type="button"
          onClick={() => setActiveSubTab('tasks')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'tasks'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          style={{
            borderColor: activeSubTab === 'tasks' ? accentColor : 'transparent',
          }}
        >
          <ClipboardList className="w-4 h-4" />
          <span>定期テスト課題配信</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700">
            {tasks.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('materials')}
          className={`flex items-center space-x-2 py-2.5 px-3 border-b-2 text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'materials'
              ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
              : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
          }`}
          style={{
            borderColor: activeSubTab === 'materials' ? accentColor : 'transparent',
          }}
        >
          <Layers className="w-4 h-4" />
          <span>参考書・問題集の構造マスター管理</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-zinc-200 dark:bg-zinc-700">
            {materials.length}
          </span>
        </button>
      </div>

      {activeSubTab === 'materials' ? (
        <TeacherMaterialStructureEditor />
      ) : (
        <>
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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                定期テスト課題の範囲（具体的に打ち込んでください）
              </label>
              <span className="text-[10px] text-zinc-400">
                下記の登録済み教材をクリックすると自動入力されます
              </span>
            </div>

            {/* 教科に応じた登録済み構造化教材のクイック挿入バー */}
            {subjectMaterials.length > 0 && (
              <div className="mb-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
                <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>登録済み教材の構造から範囲をワンクリック挿入:</span>
                </div>
                <div className="space-y-1.5">
                  {subjectMaterials.map((sm) => {
                    const struct = sm.structure;
                    if (!struct || !struct.chapters || struct.chapters.length === 0) {
                      return (
                        <div key={sm.id} className="flex items-center space-x-1.5 text-[11px]">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                            {sm.name}:
                          </span>
                          <button
                            type="button"
                            onClick={() => handleAppendScopeFromStructure(`『${sm.name}』指定範囲`, sm.id)}
                            className="px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 text-[10px] cursor-pointer"
                          >
                            + 教材名を追加
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div key={sm.id} className="text-[11px] space-y-1">
                        <div className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center space-x-1">
                          <BookOpen className="w-3 h-3 text-zinc-500" />
                          <span>{sm.name}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pl-4">
                          {struct.chapters.map((ch) => {
                            const firstSec = ch.sections[0];
                            const lastSec = ch.sections[ch.sections.length - 1];
                            const firstItem = firstSec?.items[0];
                            const lastItem = lastSec?.items[lastSec?.items.length - 1];
                            const rangeLabel =
                              firstItem && lastItem
                                ? `${ch.title}（${firstItem.label}〜${lastItem.label}）`
                                : ch.pageStart && ch.pageEnd
                                ? `${ch.title}（p.${ch.pageStart}〜p.${ch.pageEnd}）`
                                : ch.title;

                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() =>
                                  handleAppendScopeFromStructure(`『${sm.name}』${rangeLabel}`, sm.id)
                                }
                                className="px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-[10px] font-medium cursor-pointer transition-colors"
                              >
                                + {rangeLabel}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
      </>
      )}
    </div>
  );
};
