/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  BookOpen,
  Plus,
  Trash2,
  Clock,
  ChevronDown,
  ChevronRight,
  Bookmark,
  Layers,
  Save,
  Edit2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Material,
  MaterialChapter,
  MaterialSection,
  MaterialStructure,
  MaterialUnitItem,
} from '../../domain/models/index.ts';

export interface SectionDraft {
  id: string;
  title: string;
  pageCount: number;
  targetMinutes: number;
}

export interface ChapterDraft {
  id: string;
  title: string;
  sections: SectionDraft[];
}

// --- Helper Functions ---

export function convertMaterialToDrafts(material: Material): ChapterDraft[] {
  const struct = material?.structure;
  const chapters = struct?.chapters || [];

  if (chapters.length === 0) {
    return [
      {
        id: `chap_${Date.now()}_1`,
        title: '第1章',
        sections: [
          {
            id: `sec_${Date.now()}_1`,
            title: '第1節',
            pageCount: 15,
            targetMinutes: 15,
          },
        ],
      },
    ];
  }

  return chapters.map((chapter, cIdx) => {
    const sections: SectionDraft[] = (chapter?.sections || []).map((sec, sIdx) => ({
      id: sec.id || `sec_${chapter.id}_${sIdx + 1}`,
      title: sec.title || `第${sIdx + 1}節`,
      pageCount: Math.max(1, (sec.items || []).length || 15),
      targetMinutes: 15,
    }));

    if (sections.length === 0) {
      sections.push({
        id: `sec_${chapter.id}_1`,
        title: '第1節',
        pageCount: 15,
        targetMinutes: 15,
      });
    }

    return {
      id: chapter.id || `chap_${cIdx + 1}`,
      title: chapter.title || `第${cIdx + 1}章`,
      sections,
    };
  });
}

export function convertDraftsToMaterialChapters(
  chapterDrafts: ChapterDraft[]
): MaterialChapter[] {
  return (chapterDrafts || []).map((chapterDraft, cIdx) => {
    const sections: MaterialSection[] = (chapterDraft.sections || []).map((secDraft, sIdx) => {
      const pageCount = Math.max(1, secDraft.pageCount || 1);
      const items: MaterialUnitItem[] = Array.from({ length: pageCount }, (_, pIdx) => ({
        id: `item_${secDraft.id}_${pIdx + 1}`,
        type: 'page',
        label: `p.${pIdx + 1}`,
        page: pIdx + 1,
      }));

      return {
        id: secDraft.id || `sec_${chapterDraft.id}_${sIdx + 1}`,
        title: secDraft.title.trim() || `第${sIdx + 1}節`,
        items,
      };
    });

    return {
      id: chapterDraft.id || `chap_${cIdx + 1}`,
      chapterNumber: cIdx + 1,
      title: (chapterDraft.title || '').trim() || `第${cIdx + 1}章`,
      sections,
    };
  });
}

export function createDefaultChapter(
  chapterTitle: string,
  sectionTitle: string,
  pageCount: number = 15
): ChapterDraft {
  const chapterId = `chap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const sectionId = `sec_${chapterId}_1`;
  return {
    id: chapterId,
    title: chapterTitle,
    sections: [
      {
        id: sectionId,
        title: sectionTitle,
        pageCount,
        targetMinutes: 15,
      },
    ],
  };
}

export const TeacherMaterialStructureEditor: React.FC = () => {
  const {
    materials,
    subjects,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [editingMaterialId, setEditingMaterialId] = useState<string | null>(null);

  // 新規教材作成モーダル状態
  const [isCreatingMaterial, setIsCreatingMaterial] = useState<boolean>(false);
  const [newMaterialName, setNewMaterialName] = useState<string>('');
  const [newMaterialSubjectId, setNewMaterialSubjectId] = useState<string>('math');
  const [newPageCount, setNewPageCount] = useState<number>(15);

  // 編集中のエディタステート
  const [bookTitle, setBookTitle] = useState<string>('');
  const [chapters, setChapters] = useState<ChapterDraft[]>([]);
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // 編集対象が開かれたときのエディタ初期化
  const openEditModal = (mat: Material) => {
    setEditingMaterialId(mat.id);
    setBookTitle(mat.name || '');

    const initialChapters = convertMaterialToDrafts(mat);
    setChapters(initialChapters);

    const expands: Record<string, boolean> = {};
    initialChapters.forEach((c) => {
      expands[c.id] = true;
    });
    setExpandedChapters(expands);
    setIsEditingModalOpen(true);
  };

  const openNewModal = () => {
    setIsCreatingMaterial(true);
  };

  // 絞り込み教材リスト
  const filteredMaterials = (materials || []).filter((m) => {
    if (selectedSubjectId === 'all') return true;
    return m.subjectId === selectedSubjectId;
  });

  // 保存処理
  const handleSaveBook = async () => {
    if (!editingMaterialId || !bookTitle.trim()) return;
    try {
      const compiledChapters = convertDraftsToMaterialChapters(chapters);
      const updatedStructure: MaterialStructure = {
        itemTypeDefault: 'page',
        chapters: compiledChapters,
      };

      await updateMaterial(editingMaterialId, {
        name: bookTitle.trim(),
        structure: updatedStructure,
      });

      setIsEditingModalOpen(false);
      setSaveSuccessMsg('教材の構造を保存しました！');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // 新規教材登録
  const handleCreateMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) return;

    try {
      const defaultChap = createDefaultChapter('第1章', '第1節', Math.max(1, newPageCount));
      const compiled = convertDraftsToMaterialChapters([defaultChap]);

      const created = await addMaterial({
        name: newMaterialName.trim(),
        subjectId: newMaterialSubjectId,
        isDefault: false,
        structure: {
          itemTypeDefault: 'page',
          chapters: compiled,
        },
      });

      setIsCreatingMaterial(false);
      setNewMaterialName('');
      openEditModal(created);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMaterial = async (matId: string) => {
    const mat = materials.find((m) => m.id === matId);
    if (!mat) return;
    if (!window.confirm(`本当に教材『${mat.name}』を削除しますか？`)) return;
    await deleteMaterial(matId);
  };

  // 章の操作
  const handleAddChapter = () => {
    const nextIdx = chapters.length + 1;
    const newChap = createDefaultChapter(`第${nextIdx}章`, '第1節', 15);
    setChapters([...chapters, newChap]);
    setExpandedChapters((prev) => ({ ...prev, [newChap.id]: true }));
  };

  const handleRemoveChapter = (chapterId: string) => {
    if (chapters.length <= 1) {
      alert('最低1つの章が必要です。');
      return;
    }
    setChapters(chapters.filter((c) => c.id !== chapterId));
  };

  const handleUpdateChapterTitle = (chapterId: string, title: string) => {
    setChapters(chapters.map((c) => (c.id === chapterId ? { ...c, title } : c)));
  };

  // 節の操作
  const handleAddSection = (chapterId: string) => {
    setChapters(
      chapters.map((chap) => {
        if (chap.id !== chapterId) return chap;
        const nextSecIdx = chap.sections.length + 1;
        const newSec: SectionDraft = {
          id: `sec_${chapterId}_${Date.now()}`,
          title: `第${nextSecIdx}節`,
          pageCount: 15,
          targetMinutes: 15,
        };
        return {
          ...chap,
          sections: [...chap.sections, newSec],
        };
      })
    );
  };

  const handleRemoveSection = (chapterId: string, sectionId: string) => {
    setChapters(
      chapters.map((chap) => {
        if (chap.id !== chapterId) return chap;
        if (chap.sections.length <= 1) {
          alert('各章には最低1つの節が必要です。');
          return chap;
        }
        return {
          ...chap,
          sections: chap.sections.filter((s) => s.id !== sectionId),
        };
      })
    );
  };

  const handleUpdateSection = (
    chapterId: string,
    sectionId: string,
    field: keyof SectionDraft,
    value: string | number
  ) => {
    setChapters(
      chapters.map((chap) => {
        if (chap.id !== chapterId) return chap;
        return {
          ...chap,
          sections: chap.sections.map((sec) => {
            if (sec.id !== sectionId) return sec;
            return {
              ...sec,
              [field]: value,
            };
          }),
        };
      })
    );
  };

  // 全体統計（総ページ数）
  const totalStats = useMemo(() => {
    let totalChapters = chapters.length;
    let totalSections = 0;
    let totalPages = 0;

    chapters.forEach((ch) => {
      totalSections += (ch.sections || []).length;
      (ch.sections || []).forEach((sec) => {
        totalPages += Number(sec.pageCount) || 0;
      });
    });

    return {
      totalChapters,
      totalSections,
      totalPages,
    };
  }, [chapters]);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      {/* 画面上部ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              マスター管理
            </span>
            {saveSuccessMsg && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {saveSuccessMsg}
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            参考書・問題集の構造管理（章・節・ページ数）
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            登録された教材の章・節・ページ数をシンプルに管理します。
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={openNewModal}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>新規教材を追加</span>
          </button>
        </div>
      </div>

      {/* 教材一覧グリッドカード */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">登録済み教材一覧</span>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-medium"
          >
            <option value="all">全教科</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMaterials.map((m) => {
            const sub = subjects.find((s) => s.id === m.subjectId);
            const struct = m.structure;
            const chCount = Array.isArray(struct?.chapters) ? struct.chapters.length : 0;
            const totalPages = Array.isArray(struct?.chapters)
              ? struct.chapters.reduce(
                  (acc, c) => acc + (c.sections || []).reduce((sAcc, s) => sAcc + (s.items || []).length, 0),
                  0
                )
              : 0;

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 space-y-3 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-md font-bold"
                      style={{
                        backgroundColor: `${sub?.color || '#888'}22`,
                        color: sub?.color || '#888',
                      }}
                    >
                      {sub?.name || 'その他'}
                    </span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {chCount > 0 ? `${chCount} 章 / ${totalPages} ページ` : '未構造化'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-2">
                    {m.name}
                  </h3>
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleDeleteMaterial(m.id)}
                    className="p-2 text-zinc-400 hover:text-rose-500 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
                    title="削除"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(m)}
                    className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 cursor-pointer shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>構造を編集</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 新規教材追加モーダル */}
      {isCreatingMaterial && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>新規教材の登録</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingMaterial(false)}
                className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMaterialSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  教科
                </label>
                <select
                  value={newMaterialSubjectId}
                  onChange={(e) => setNewMaterialSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  教材名 *
                </label>
                <input
                  type="text"
                  required
                  value={newMaterialName}
                  onChange={(e) => setNewMaterialName(e.target.value)}
                  placeholder="例: 総合数学 II+B 対策問題集"
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  初期の第1章・第1節のページ数
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={newPageCount}
                  onChange={(e) => setNewPageCount(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-bold text-center"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingMaterial(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 font-semibold cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer shadow-xs"
                >
                  登録してエディタを開く
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 画面いっぱいの専用エディタモーダル（章・節・ページ数管理） */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-950 flex flex-col overflow-hidden animate-in fade-in duration-150">
          {/* モーダルヘッダーバー */}
          <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900 shrink-0">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
              <div>
                <h2 className="font-mono font-extrabold text-sm tracking-wide text-zinc-900 dark:text-zinc-100">
                  EDIT BOOK STRUCTURE (CHAPTERS & SECTIONS)
                </h2>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <span>CHAPTERS: {totalStats.totalChapters}</span>
                  <span>•</span>
                  <span>SECTIONS: {totalStats.totalSections}</span>
                  <span>•</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    TOTAL PAGES: {totalStats.totalPages}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingModalOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              aria-label="閉じる"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* モーダル本文（スクロール領域） */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
            {/* 教材名設定エリア */}
            <div className="bg-zinc-50/70 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
              <label className="block font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                BOOK TITLE *
              </label>
              <input
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-zinc-100 text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* 章・節・ページ数一覧管理セクション */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    CHAPTERS & SECTIONS
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                    章と節のタイトル、およびそこに含まれるページ数を管理します。
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddChapter}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-dashed border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ 章を追加</span>
                </button>
              </div>

              {/* 章リスト */}
              <div className="space-y-4">
                {chapters.map((chapter) => {
                  const isExpanded = expandedChapters[chapter.id] ?? true;
                  const chapterPages = (chapter.sections || []).reduce(
                    (acc, s) => acc + (Number(s.pageCount) || 0),
                    0
                  );

                  return (
                    <div
                      key={chapter.id}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 shadow-xs"
                    >
                      {/* 章ヘッダー */}
                      <div
                        onClick={() => setExpandedChapters((prev) => ({ ...prev, [chapter.id]: !isExpanded }))}
                        className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-850 border-b border-zinc-200 dark:border-zinc-800 cursor-pointer select-none"
                      >
                        <div className="flex items-center space-x-2.5 flex-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setExpandedChapters((prev) => ({ ...prev, [chapter.id]: !isExpanded }))}
                            className="text-zinc-500 cursor-pointer"
                          >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </button>
                          <input
                            type="text"
                            value={chapter.title}
                            onChange={(e) => handleUpdateChapterTitle(chapter.id, e.target.value)}
                            className="px-3 py-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-bold text-zinc-900 dark:text-zinc-100 max-w-sm"
                          />
                        </div>

                        <div className="flex items-center space-x-4 text-xs font-mono" onClick={(e) => e.stopPropagation()}>
                          <span className="text-zinc-500">
                            全 <strong className="text-zinc-900 dark:text-zinc-100">{chapterPages}</strong> ページ ({chapter.sections.length} 節)
                          </span>

                          <button
                            type="button"
                            onClick={() => handleRemoveChapter(chapter.id)}
                            className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-xl transition-colors cursor-pointer"
                            title="章を削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* 節リスト */}
                      {isExpanded && (
                        <div className="p-4 bg-white dark:bg-zinc-900/50 space-y-3">
                          <div className="space-y-2">
                            {(chapter.sections || []).map((section, sIdx) => (
                              <div
                                key={section.id}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-50/70 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-750 text-xs"
                              >
                                <div className="flex items-center space-x-2 flex-1 min-w-0">
                                  <Bookmark className="w-4 h-4 text-blue-500 shrink-0" />
                                  <span className="font-mono text-zinc-400 font-bold shrink-0">節 {sIdx + 1}</span>
                                  <input
                                    type="text"
                                    value={section.title}
                                    onChange={(e) => handleUpdateSection(chapter.id, section.id, 'title', e.target.value)}
                                    placeholder="節のタイトル（例: 2次方程式と解）"
                                    className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-medium text-zinc-900 dark:text-zinc-100"
                                  />
                                </div>

                                <div className="flex items-center space-x-3 shrink-0">
                                  <div className="flex items-center space-x-1.5 bg-white dark:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 font-mono">
                                    <span className="text-zinc-400">ページ数:</span>
                                    <input
                                      type="number"
                                      min={1}
                                      max={500}
                                      value={section.pageCount}
                                      onChange={(e) =>
                                        handleUpdateSection(
                                          chapter.id,
                                          section.id,
                                          'pageCount',
                                          Math.max(1, parseInt(e.target.value) || 1)
                                        )
                                      }
                                      className="w-12 text-right font-bold text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-hidden"
                                    />
                                    <span className="text-zinc-400">P</span>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSection(chapter.id, section.id)}
                                    className="p-1.5 text-zinc-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                                    title="節を削除"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleAddSection(chapter.id)}
                              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-750 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5 text-blue-500" />
                              <span>+ この章に節を追加</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* モーダルフッター */}
          <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              <div>
                CHAPTERS: <strong className="text-zinc-900 dark:text-zinc-100">{totalStats.totalChapters}</strong>
              </div>
              <div>
                SECTIONS: <strong className="text-zinc-900 dark:text-zinc-100">{totalStats.totalSections}</strong>
              </div>
              <div>
                TOTAL PAGES: <strong className="text-emerald-600 dark:text-emerald-400">{totalStats.totalPages}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setIsEditingModalOpen(false)}
                className="px-5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveBook}
                className="px-6 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-mono text-xs font-bold hover:opacity-90 cursor-pointer shadow-md transition-all"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
