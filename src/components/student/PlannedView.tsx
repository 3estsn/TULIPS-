/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckSquare,
  Square,
  Clock,
  Target,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Trash2,
  Plus,
  Filter,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Layers,
  CalendarCheck,
  Award,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Material,
  MaterialChapter,
  MaterialSection,
  MaterialUnitItem,
  RegularTestTask,
  StudentTask,
  StudentTaskItem,
  calculateTaskPace,
} from '../../domain/models/index.ts';

export const PlannedView: React.FC = () => {
  const {
    studentTasks,
    activeStudentTaskPaces,
    tasks: regularTestTasks,
    materials,
    subjects,
    currentUser,
    accentColor,
    accentForeground,
    addStudentTask,
    updateStudentTask,
    toggleTaskItemCompletion,
    deleteStudentTask,
    pendingRegularTaskForStudentPlan,
    setPendingRegularTaskForStudentPlan,
  } = useApp();

  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'today' | 'uncompleted' | 'completed'>('all');
  const [isCreatingTask, setIsCreatingTask] = useState<boolean>(false);

  // 新規タスク作成ステート
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [linkedRegularTaskId, setLinkedRegularTaskId] = useState<string>('');
  const [deadline, setDeadline] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [bufferDays, setBufferDays] = useState<number>(2);

  // 教材構造からの選択項目ステート (itemId -> StudentTaskItem)
  const [selectedItemsMap, setSelectedItemsMap] = useState<Record<string, StudentTaskItem>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // 範囲一括選択用ステート
  const [rangeStartNum, setRangeStartNum] = useState<number>(1);
  const [rangeEndNum, setRangeEndNum] = useState<number>(20);

  // 教科に応じた教材一覧
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => m.subjectId === selectedSubjectId);
  }, [materials, selectedSubjectId]);

  // 選択中の教材オブジェクト
  const activeMaterial = useMemo(() => {
    return materials.find((m) => m.id === selectedMaterialId) || filteredMaterials[0];
  }, [materials, selectedMaterialId, filteredMaterials]);

  // 定期テスト課題からの遷移ハンドリング（HomeViewやバナーからのワンクリック作成）
  useEffect(() => {
    if (pendingRegularTaskForStudentPlan) {
      const rTask = pendingRegularTaskForStudentPlan;
      setIsCreatingTask(true);
      setLinkedRegularTaskId(rTask.id);
      setSelectedSubjectId(rTask.subjectId);
      setTaskTitle(`${rTask.title} 対策`);
      setDeadline(rTask.deadline);

      // 教科の教材を自動選択
      const availableMats = materials.filter((m) => m.subjectId === rTask.subjectId);
      if (availableMats.length > 0) {
        setSelectedMaterialId(availableMats[0].id);
      }

      setPendingRegularTaskForStudentPlan(null);
    }
  }, [pendingRegularTaskForStudentPlan, materials, setPendingRegularTaskForStudentPlan]);

  // 教材選択が変わったときにチャプター初期展開
  useEffect(() => {
    if (activeMaterial?.structure?.chapters) {
      const exp: Record<string, boolean> = {};
      activeMaterial.structure.chapters.forEach((c) => {
        exp[c.id] = true;
      });
      setExpandedChapters(exp);
      // デフォルトタイトル
      if (!taskTitle || taskTitle.endsWith('対策')) {
        setTaskTitle(`${activeMaterial.name} 学習タスク`);
      }
    }
  }, [activeMaterial]);

  // 選択中タスクの同期
  useEffect(() => {
    if (studentTasks.length > 0) {
      if (!selectedTaskId || !studentTasks.find((t) => t.id === selectedTaskId)) {
        setSelectedTaskId(studentTasks[0].id);
      }
    } else {
      setSelectedTaskId('');
    }
  }, [studentTasks, selectedTaskId]);

  const activeTask = useMemo(() => {
    return studentTasks.find((t) => t.id === selectedTaskId) || studentTasks[0];
  }, [studentTasks, selectedTaskId]);

  const activePace = useMemo(() => {
    if (!activeTask) return null;
    return calculateTaskPace(activeTask);
  }, [activeTask]);

  // 全体サマリー指標
  const totalActiveTasksCount = studentTasks.length;
  const totalRemainingItemsCount = activeStudentTaskPaces.reduce(
    (acc, p) => acc + p.remainingItems,
    0
  );
  const totalTodayQuotaSum = activeStudentTaskPaces.reduce(
    (acc, p) => acc + p.dailyQuota,
    0
  );

  // 章の開閉トグル
  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // アイテム選択のトグル
  const toggleItemSelection = (
    item: MaterialUnitItem,
    chapterTitle: string,
    sectionTitle: string
  ) => {
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (next[item.id]) {
        delete next[item.id];
      } else {
        next[item.id] = {
          id: `task-item-${Date.now()}-${item.id}-${Math.random().toString(36).substring(2, 5)}`,
          materialItemId: item.id,
          label: item.label,
          chapterTitle,
          sectionTitle,
          page: item.page,
          isCompleted: false,
        };
      }
      return next;
    });
  };

  // 節内全アイテムの一括選択/解除
  const toggleSectionAllItems = (sec: MaterialSection, chapterTitle: string) => {
    const allSelected = sec.items.every((it) => !!selectedItemsMap[it.id]);
    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      if (allSelected) {
        sec.items.forEach((it) => {
          delete next[it.id];
        });
      } else {
        sec.items.forEach((it) => {
          next[it.id] = {
            id: `task-item-${Date.now()}-${it.id}-${Math.random().toString(36).substring(2, 5)}`,
            materialItemId: it.id,
            label: it.label,
            chapterTitle,
            sectionTitle: sec.title,
            page: it.page,
            isCompleted: false,
          };
        });
      }
      return next;
    });
  };

  // 範囲指定（番号・ページ）での一括選択
  const handleSelectByRange = (sec: MaterialSection, chapterTitle: string) => {
    const min = Math.min(rangeStartNum, rangeEndNum);
    const max = Math.max(rangeStartNum, rangeEndNum);

    const targetItems = sec.items.filter((it) => {
      if (it.itemNumber !== undefined) {
        return it.itemNumber >= min && it.itemNumber <= max;
      }
      if (it.page !== undefined) {
        return it.page >= min && it.page <= max;
      }
      return false;
    });

    if (targetItems.length === 0) return;

    setSelectedItemsMap((prev) => {
      const next = { ...prev };
      targetItems.forEach((it) => {
        next[it.id] = {
          id: `task-item-${Date.now()}-${it.id}-${Math.random().toString(36).substring(2, 5)}`,
          materialItemId: it.id,
          label: it.label,
          chapterTitle,
          sectionTitle: sec.title,
          page: it.page,
          isCompleted: false,
        };
      });
      return next;
    });
  };

  // 新規タスク保存
  const handleSaveNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = Object.values(selectedItemsMap);
    if (items.length === 0) {
      alert('タスクの対象となる例題やページを1つ以上選択してください。');
      return;
    }

    try {
      const created = await addStudentTask({
        userId: currentUser?.id || 'student-001',
        title: taskTitle.trim() || `${activeMaterial?.name || '教材'} タスク`,
        subjectId: selectedSubjectId,
        materialId: activeMaterial?.id || 'custom-material',
        materialName: activeMaterial?.name || '教材',
        regularTestTaskId: linkedRegularTaskId || undefined,
        deadline,
        bufferDays: Math.max(0, bufferDays),
        items,
      });

      setSelectedTaskId(created.id);
      setIsCreatingTask(false);
      setSelectedItemsMap({});
      setTaskTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  // タスク削除
  const handleDeleteCurrentTask = async () => {
    if (!activeTask) return;
    if (window.confirm(`タスク「${activeTask.title}」を削除してもよろしいですか？`)) {
      await deleteStudentTask(activeTask.id);
    }
  };

  // フィルタリングされたアイテムリスト
  const displayedItems = useMemo(() => {
    if (!activeTask || !activePace) return [];
    const todayItemIds = new Set(activePace.todayItems.map((i) => i.id));

    return activeTask.items.filter((it) => {
      if (filterMode === 'today') {
        return todayItemIds.has(it.id);
      }
      if (filterMode === 'uncompleted') {
        return !it.isCompleted;
      }
      if (filterMode === 'completed') {
        return it.isCompleted;
      }
      return true;
    });
  }, [activeTask, activePace, filterMode]);

  // 新規作成時の日割りシミュレーション値
  const previewCalculation = useMemo(() => {
    const count = Object.keys(selectedItemsMap).length;
    const refDate = new Date();
    refDate.setHours(0, 0, 0, 0);
    const deadDate = new Date(deadline + 'T00:00:00');
    const diff = Math.floor((deadDate.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const days = Math.max(1, diff);
    const effDays = Math.max(1, days - bufferDays);
    const quota = Math.ceil(count / effDays);
    return {
      count,
      days,
      effDays,
      quota,
    };
  }, [selectedItemsMap, deadline, bufferDays]);

  return (
    <div className="space-y-4 pb-20 md:pb-8 text-xs sm:text-sm">
      {/* 画面トップヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              学習計画 & ペース管理
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              予備日自動計算つき
            </span>
          </div>
          <h1 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            定期テスト・日々の課題計画
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            参考書・問題集の構造からやるべき例題・ページを選択し、期日までの日割りノルマ（予備日考慮）を自動算出して着実に消化できます。
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreatingTask(!isCreatingTask);
            if (!isCreatingTask && activeMaterial) {
              setTaskTitle(`${activeMaterial.name} 学習タスク`);
            }
          }}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg font-bold text-xs transition-opacity hover:opacity-95 cursor-pointer shrink-0 shadow-xs"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <Plus className="w-4 h-4" />
          <span>{isCreatingTask ? '作成フォームを閉じる' : '新規タスクを設定する'}</span>
        </button>
      </div>

      {/* 教員配信の定期テスト課題プロンプト（未タスク化または再設定を促すバナー） */}
      {regularTestTasks.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>先生から定期テストの範囲が公開されています</span>
              </span>
            </div>
            <span className="text-[10px] text-amber-700 dark:text-amber-400">
              ワンクリックで学習タスクに変換
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {regularTestTasks.map((rt) => {
              const sub = subjects.find((s) => s.id === rt.subjectId);
              return (
                <div
                  key={rt.id}
                  className="bg-white/90 dark:bg-zinc-900/90 rounded-lg p-2.5 border border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between gap-2 shadow-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className="px-1.5 py-0.2 rounded text-[10px] font-bold"
                        style={{
                          backgroundColor: `${sub?.color || '#888'}22`,
                          color: sub?.color || '#888',
                        }}
                      >
                        {sub?.name}
                      </span>
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {rt.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-600 dark:text-zinc-400 truncate mt-0.5">
                      {rt.scope}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setPendingRegularTaskForStudentPlan(rt);
                    }}
                    className="shrink-0 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-xs cursor-pointer flex items-center space-x-1"
                  >
                    <span>タスク化</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 新規タスク作成ダイアログ / フォーム */}
      {isCreatingTask && (
        <form
          onSubmit={handleSaveNewTask}
          className="bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl p-4 sm:p-5 shadow-lg space-y-4"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <CalendarCheck className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                教材の構造から学習タスクを作成
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingTask(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕ 閉じる
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* タスクタイトル */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                タスク名称
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="例: 2学期期末考査 青チャート 2次関数対策"
                required
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            {/* 教科 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                教科
              </label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  const mats = materials.filter((m) => m.subjectId === e.target.value);
                  if (mats.length > 0) {
                    setSelectedMaterialId(mats[0].id);
                  }
                }}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 使用する教材 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                参考書・問題集・教科書
              </label>
              <select
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
              >
                {filteredMaterials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 提出・テスト期日 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                完了期日（テスト初日など）
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            {/* 予備日数 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  予備日数
                </label>
                <span className="text-[10px] text-zinc-400">見直し・復習期間</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={bufferDays}
                  onChange={(e) => setBufferDays(Number(e.target.value))}
                  className="w-20 px-2 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-center"
                />
                <span className="text-xs text-zinc-600 dark:text-zinc-400">日間を予備日に設定</span>
              </div>
            </div>
          </div>

          {/* 教材構造からの範囲選択エリア */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-800/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                  <span>『{activeMaterial?.name}』の章・節・例題一覧</span>
                </span>
                <span className="text-[11px] text-zinc-500 ml-1">
                  （やるべき範囲にチェックを入れてください）
                </span>
              </div>

              <div className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                選択中: {Object.keys(selectedItemsMap).length} 項目
              </div>
            </div>

            {!activeMaterial?.structure ||
            !activeMaterial.structure.chapters ||
            activeMaterial.structure.chapters.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 border border-dashed rounded-lg">
                この教材にはまだ章節・連番が登録されていません。先生画面の「参考書・問題集の構造マスター管理」から登録できます。
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {activeMaterial.structure.chapters.map((ch) => {
                  const isExp = !!expandedChapters[ch.id];
                  return (
                    <div
                      key={ch.id}
                      className="border border-zinc-200 dark:border-zinc-700/80 rounded-lg overflow-hidden bg-white dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between px-3 py-2 bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-700/60">
                        <button
                          type="button"
                          onClick={() => toggleChapter(ch.id)}
                          className="flex items-center space-x-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer"
                        >
                          {isExp ? (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                          ) : (
                            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                          )}
                          <span>{ch.title}</span>
                          {ch.pageStart && (
                            <span className="text-[10px] text-zinc-400 font-normal">
                              (p.{ch.pageStart}〜{ch.pageEnd || ''})
                            </span>
                          )}
                        </button>
                      </div>

                      {isExp && (
                        <div className="p-2.5 space-y-2.5">
                          {ch.sections.map((sec) => {
                            const allSecSelected =
                              sec.items.length > 0 &&
                              sec.items.every((it) => !!selectedItemsMap[it.id]);

                            return (
                              <div
                                key={sec.id}
                                className="p-2 rounded bg-zinc-50/70 dark:bg-zinc-850 border border-zinc-150 dark:border-zinc-750 space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                  <div className="flex items-center space-x-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    <span>{sec.title}</span>
                                    <span className="text-zinc-400 font-normal">
                                      ({sec.items.length} 項目)
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleSectionAllItems(sec, ch.title)}
                                      className="text-[10px] px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700 font-medium cursor-pointer"
                                    >
                                      {allSecSelected ? '全解除' : 'この節を全選択'}
                                    </button>
                                  </div>
                                </div>

                                {/* アイテム一覧チェックチップス */}
                                <div className="flex flex-wrap gap-1.5 pt-0.5">
                                  {sec.items.map((it) => {
                                    const isSelected = !!selectedItemsMap[it.id];
                                    return (
                                      <button
                                        key={it.id}
                                        type="button"
                                        onClick={() => toggleItemSelection(it, ch.title, sec.title)}
                                        className={`px-2 py-0.8 rounded text-[11px] font-medium border transition-colors cursor-pointer flex items-center space-x-1 ${
                                          isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100'
                                        }`}
                                      >
                                        <span>{isSelected ? '✓ ' : ''}</span>
                                        <span>{it.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* リアルタイム算出プレビュー（日割りと予備日） */}
          <div className="p-3 bg-zinc-100 dark:bg-zinc-800/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-zinc-200 dark:border-zinc-700">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span>日割りノルマ自動シミュレーション:</span>
              </div>
              <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                期日まで残り <strong>{previewCalculation.days}日間</strong>（予備日 {bufferDays}日
                → 実質学習日数 <strong>{previewCalculation.effDays}日間</strong>）
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="text-right">
                <span className="text-[11px] text-zinc-500">1日あたりの目標:</span>
                <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100">
                  約 {previewCalculation.quota}{' '}
                  <span className="text-xs font-normal">問(頁) / 日</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={previewCalculation.count === 0}
                className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-opacity ${
                  previewCalculation.count > 0 ? 'opacity-100 hover:opacity-95' : 'opacity-40'
                }`}
                style={{ backgroundColor: accentColor, color: accentForeground }}
              >
                この内容でタスクを設定
              </button>
            </div>
          </div>
        </form>
      )}

      {/* タスク一覧 & 進捗チェックメイン画面 */}
      {studentTasks.length === 0 ? (
        <div className="p-10 text-center bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl space-y-3">
          <CalendarCheck className="w-10 h-10 text-zinc-400 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
            登録されている学習タスクがまだありません
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            右上の「新規タスクを設定する」ボタンまたは上記の教員配信定期テスト課題から、参考書・問題集のやるべき範囲を選択してタスクを作成しましょう。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* 左カラム: タスク選択リスト (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 px-1">
              設定中のタスク ({studentTasks.length})
            </div>

            <div className="space-y-2">
              {studentTasks.map((t) => {
                const isSelected = t.id === activeTask?.id;
                const pace = calculateTaskPace(t);
                const sub = subjects.find((s) => s.id === t.subjectId);
                const progressPct =
                  pace.totalItems > 0
                    ? Math.round((pace.completedItems / pace.totalItems) * 100)
                    : 0;

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-white dark:border-zinc-200 dark:bg-zinc-850 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 hover:bg-white dark:hover:bg-zinc-850'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                        style={{
                          backgroundColor: `${sub?.color || '#888'}22`,
                          color: sub?.color || '#888',
                        }}
                      >
                        {sub?.name}
                      </span>
                      <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                        {pace.daysRemaining > 0 ? `あと${pace.daysRemaining}日` : '期日当日/超過'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
                      {t.title}
                    </div>

                    {/* ミニ進捗バー */}
                    <div className="mt-2 space-y-1">
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progressPct}%`,
                            backgroundColor: progressPct === 100 ? '#10b981' : accentColor,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-zinc-400">
                        <span>
                          {pace.completedItems} / {pace.totalItems} 項目 ({progressPct}%)
                        </span>
                        <span>
                          {pace.isCompleted ? (
                            <strong className="text-emerald-600">達成！</strong>
                          ) : (
                            `本日目標: ${pace.dailyQuota}問`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右カラム: 選択中タスクの詳細 & チェックリスト (lg:col-span-8) */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            {activeTask && activePace ? (
              <>
                {/* タスクタイトルバー & 削除 */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-zinc-500">
                        {activeTask.materialName}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        期日: {activeTask.deadline} (予備日 {activeTask.bufferDays}日)
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {activeTask.title}
                    </h2>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleDeleteCurrentTask}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded text-xs text-zinc-400 hover:text-rose-500 border border-zinc-200 dark:border-zinc-800 hover:border-rose-300 cursor-pointer transition-colors"
                      title="このタスクを削除"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>削除</span>
                    </button>
                  </div>
                </div>

                {/* ペース・ノルマ状況バナー */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 font-medium">消化進捗</span>
                    <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {activePace.completedItems} / {activePace.totalItems}
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 font-medium">期日まで残り</span>
                    <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {activePace.daysRemaining} 日
                    </div>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-center">
                    <span className="text-[10px] text-zinc-400 font-medium">実質学習可能日数</span>
                    <div className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {activePace.effectiveStudyDays} 日
                    </div>
                  </div>

                  <div
                    className="p-2.5 rounded-lg border text-center font-bold"
                    style={{
                      backgroundColor: activePace.isCompleted
                        ? '#ecfdf5'
                        : `${accentColor}15`,
                      borderColor: activePace.isCompleted ? '#10b981' : `${accentColor}44`,
                    }}
                  >
                    <span className="text-[10px] text-zinc-500">本日の推奨ノルマ</span>
                    <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                      {activePace.isCompleted ? '完了！' : `${activePace.dailyQuota} 問/頁`}
                    </div>
                  </div>
                </div>

                {/* 予備日アラート */}
                {activePace.isInBufferPeriod && !activePace.isCompleted && (
                  <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center space-x-2 text-xs text-amber-900 dark:text-amber-200">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      現在<strong>予備日期間</strong>に突入しています！未完了の残り {activePace.remainingItems}
                      問を優先的に解き終え、総復習と見直しを行いましょう。
                    </span>
                  </div>
                )}

                {/* 完了お祝いバナー */}
                {activePace.isCompleted && (
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs text-emerald-900 dark:text-emerald-200">
                    <Award className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span className="font-bold">
                      素晴らしい！このタスクのすべての範囲を完了しました。本番のテストでも自信を持って臨みましょう！
                    </span>
                  </div>
                )}

                {/* フィルタタブ */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1.5 text-xs">
                    <Filter className="w-3.5 h-3.5 text-zinc-400 mr-1" />
                    <button
                      type="button"
                      onClick={() => setFilterMode('all')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        filterMode === 'all'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                    >
                      すべて ({activeTask.items.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('today')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        filterMode === 'today'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                    >
                      本日の推奨分 ({activePace.todayItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('uncompleted')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        filterMode === 'uncompleted'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                    >
                      未完了 ({activePace.remainingItems})
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterMode('completed')}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                        filterMode === 'completed'
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'
                      }`}
                    >
                      完了済み ({activePace.completedItems})
                    </button>
                  </div>

                  <span className="text-[11px] text-zinc-400 hidden sm:inline">
                    チェックを入れると進捗が即座に記録されます
                  </span>
                </div>

                {/* チェックリスト本体 */}
                <div className="space-y-1.5 max-h-[calc(100vh-380px)] overflow-y-auto pr-1">
                  {displayedItems.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400 border border-dashed rounded-lg">
                      該当する項目はありません。
                    </div>
                  ) : (
                    displayedItems.map((it) => {
                      const isToday = activePace.todayItems.some((ti) => ti.id === it.id);

                      return (
                        <div
                          key={it.id}
                          onClick={() =>
                            toggleTaskItemCompletion(activeTask.id, it.id, !it.isCompleted)
                          }
                          className={`p-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            it.isCompleted
                              ? 'bg-zinc-50/60 dark:bg-zinc-800/20 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500'
                              : isToday
                              ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-zinc-900 dark:text-zinc-100 font-medium'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            {it.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-zinc-400 shrink-0" />
                            )}
                            <div className="flex flex-col">
                              <div className="flex items-center space-x-1.5">
                                <span
                                  className={`text-xs font-bold ${
                                    it.isCompleted ? 'line-through text-zinc-400' : ''
                                  }`}
                                >
                                  {it.label}
                                </span>
                                {isToday && !it.isCompleted && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                                    本日目標
                                  </span>
                                )}
                              </div>
                              {(it.chapterTitle || it.sectionTitle) && (
                                <span className="text-[10px] text-zinc-400">
                                  {it.chapterTitle} {it.sectionTitle ? `› ${it.sectionTitle}` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          {it.completedAt && (
                            <span className="text-[10px] text-zinc-400">
                              {new Date(it.completedAt).toLocaleDateString('ja-JP', {
                                month: 'numeric',
                                day: 'numeric',
                              })}{' '}
                              完了
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
