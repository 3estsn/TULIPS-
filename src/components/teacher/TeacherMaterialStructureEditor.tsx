/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  FolderPlus,
  ListPlus,
  Hash,
  FileSpreadsheet,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Sparkles,
  Save,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import {
  Material,
  MaterialChapter,
  MaterialItemType,
  MaterialSection,
  MaterialStructure,
  MaterialUnitItem,
} from '../../domain/models/index.ts';

export const TeacherMaterialStructureEditor: React.FC = () => {
  const {
    materials,
    subjects,
    accentColor,
    accentForeground,
    addMaterial,
    updateMaterial,
    deleteMaterial,
  } = useApp();

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => {
    return materials[0]?.id || '';
  });

  // 新規教材作成モーダル状態
  const [isCreatingMaterial, setIsCreatingMaterial] = useState<boolean>(false);
  const [newMaterialName, setNewMaterialName] = useState<string>('');
  const [newMaterialSubjectId, setNewMaterialSubjectId] = useState<string>('math');
  const [newMaterialType, setNewMaterialType] = useState<MaterialItemType>('numbered');

  // 選択中教材の編集中構造ステート
  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];

  // 編集中の構造コピー
  const [editingStructure, setEditingStructure] = useState<MaterialStructure | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // 展開中の章IDセット
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  // 連番ジェネレーターの入力ステート
  const [activeGeneratorSection, setActiveGeneratorSection] = useState<{
    chapterId: string;
    sectionId: string;
  } | null>(null);

  const [genPrefix, setGenPrefix] = useState<string>('例題 ');
  const [genStartNum, setGenStartNum] = useState<number>(1);
  const [genEndNum, setGenEndNum] = useState<number>(15);
  const [genSuffix, setGenSuffix] = useState<string>('');
  const [genZeroPad, setGenZeroPad] = useState<boolean>(false);
  const [genStartPage, setGenStartPage] = useState<string>('');

  // ページ範囲一括追加ステート
  const [pageStartNum, setPageStartNum] = useState<number>(10);
  const [pageEndNum, setPageEndNum] = useState<number>(30);

  // 単一アイテム追加
  const [singleItemLabel, setSingleItemLabel] = useState<string>('');

  // 章追加モーダル
  const [isAddingChapter, setIsAddingChapter] = useState<boolean>(false);
  const [newChapterTitle, setNewChapterTitle] = useState<string>('');
  const [newChapterStartPage, setNewChapterStartPage] = useState<string>('');
  const [newChapterEndPage, setNewChapterEndPage] = useState<string>('');

  // 節追加
  const [addingSectionForChapterId, setAddingSectionForChapterId] = useState<string | null>(null);
  const [newSectionTitle, setNewSectionTitle] = useState<string>('');

  // 教材選択切り替え時、編集状態を同期
  React.useEffect(() => {
    if (selectedMaterial) {
      const initialStruct: MaterialStructure = selectedMaterial.structure || {
        itemTypeDefault: 'numbered',
        prefixDefault: '例題 ',
        chapters: [],
      };
      setEditingStructure(JSON.parse(JSON.stringify(initialStruct)));
      setHasUnsavedChanges(false);

      // 初期展開: 全ての章を展開
      const expands: Record<string, boolean> = {};
      (initialStruct.chapters || []).forEach((c) => {
        expands[c.id] = true;
      });
      setExpandedChapters(expands);
    }
  }, [selectedMaterialId, selectedMaterial]);

  // 絞り込み教材リスト
  const filteredMaterials = materials.filter((m) => {
    if (selectedSubjectId === 'all') return true;
    return m.subjectId === selectedSubjectId;
  });

  // 保存処理
  const handleSaveChanges = async () => {
    if (!selectedMaterial || !editingStructure) return;
    try {
      await updateMaterial(selectedMaterial.id, {
        structure: editingStructure,
      });
      setHasUnsavedChanges(false);
      setSaveSuccessMsg('教材の構造を保存しました！生徒画面にも即時反映されます。');
      setTimeout(() => setSaveSuccessMsg(''), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  // 新規教材登録
  const handleCreateMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaterialName.trim()) return;

    const defaultPrefix = newMaterialType === 'page' ? 'p.' : '例題 ';
    const created = await addMaterial({
      name: newMaterialName.trim(),
      subjectId: newMaterialSubjectId,
      isDefault: false,
      structure: {
        itemTypeDefault: newMaterialType,
        prefixDefault: defaultPrefix,
        chapters: [
          {
            id: `ch-${Date.now()}-1`,
            chapterNumber: 1,
            title: '第1章 はじめに',
            sections: [
              {
                id: `sec-${Date.now()}-1`,
                title: '第1節 基本項目',
                items: [],
              },
            ],
          },
        ],
      },
    });

    setNewMaterialName('');
    setIsCreatingMaterial(false);
    setSelectedMaterialId(created.id);
  };

  // 教材削除
  const handleDeleteCurrentMaterial = async () => {
    if (!selectedMaterial) return;
    if (
      !window.confirm(
        `教材「${selectedMaterial.name}」を削除してもよろしいですか？（生徒の作成済みタスクには影響しません）`
      )
    ) {
      return;
    }
    await deleteMaterial(selectedMaterial.id);
    const remaining = materials.filter((m) => m.id !== selectedMaterial.id);
    if (remaining.length > 0) {
      setSelectedMaterialId(remaining[0].id);
    }
  };

  // 章の開閉切り替え
  const toggleChapterExpand = (chapterId: string) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  // 章の追加
  const handleAddChapter = () => {
    if (!newChapterTitle.trim() || !editingStructure) return;
    const chapters = editingStructure.chapters || [];
    const newChapter: MaterialChapter = {
      id: `ch-${Date.now()}`,
      chapterNumber: chapters.length + 1,
      title: newChapterTitle.trim(),
      pageStart: newChapterStartPage ? Number(newChapterStartPage) : undefined,
      pageEnd: newChapterEndPage ? Number(newChapterEndPage) : undefined,
      sections: [
        {
          id: `sec-${Date.now()}-1`,
          title: '第1節',
          items: [],
        },
      ],
    };

    setEditingStructure({
      ...editingStructure,
      chapters: [...chapters, newChapter],
    });
    setExpandedChapters((prev) => ({ ...prev, [newChapter.id]: true }));
    setHasUnsavedChanges(true);
    setNewChapterTitle('');
    setNewChapterStartPage('');
    setNewChapterEndPage('');
    setIsAddingChapter(false);
  };

  // 章の削除
  const handleDeleteChapter = (chapterId: string) => {
    if (!editingStructure) return;
    const updatedChapters = editingStructure.chapters.filter((c) => c.id !== chapterId);
    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
  };

  // 節の追加
  const handleAddSection = (chapterId: string) => {
    if (!newSectionTitle.trim() || !editingStructure) return;
    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        const newSec: MaterialSection = {
          id: `sec-${Date.now()}`,
          title: newSectionTitle.trim(),
          items: [],
        };
        return {
          ...ch,
          sections: [...ch.sections, newSec],
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
    setNewSectionTitle('');
    setAddingSectionForChapterId(null);
  };

  // 節の削除
  const handleDeleteSection = (chapterId: string, sectionId: string) => {
    if (!editingStructure) return;
    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          sections: ch.sections.filter((s) => s.id !== sectionId),
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
  };

  // 連番アイテムの一括生成
  const handleGenerateNumberedItems = (chapterId: string, sectionId: string) => {
    if (!editingStructure) return;
    const start = Math.min(genStartNum, genEndNum);
    const end = Math.max(genStartNum, genEndNum);
    const generated: MaterialUnitItem[] = [];
    const basePage = genStartPage ? Number(genStartPage) : undefined;

    for (let i = start; i <= end; i++) {
      let numStr = String(i);
      if (genZeroPad && i < 10) {
        numStr = `0${i}`;
      }
      const label = `${genPrefix}${numStr}${genSuffix}`.trim();
      generated.push({
        id: `item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'numbered',
        label,
        itemNumber: i,
        page: basePage !== undefined ? basePage + (i - start) : undefined,
      });
    }

    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id === sectionId) {
              return {
                ...sec,
                items: [...sec.items, ...generated],
              };
            }
            return sec;
          }),
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
    setActiveGeneratorSection(null);
  };

  // ページ範囲の一括追加 (教科書・読物モード)
  const handleGeneratePageItems = (chapterId: string, sectionId: string) => {
    if (!editingStructure) return;
    const start = Math.min(pageStartNum, pageEndNum);
    const end = Math.max(pageStartNum, pageEndNum);
    const generated: MaterialUnitItem[] = [];

    for (let p = start; p <= end; p++) {
      generated.push({
        id: `p-${Date.now()}-${p}-${Math.random().toString(36).substring(2, 5)}`,
        type: 'page',
        label: `p.${p}`,
        page: p,
      });
    }

    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id === sectionId) {
              return {
                ...sec,
                items: [...sec.items, ...generated],
              };
            }
            return sec;
          }),
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
    setActiveGeneratorSection(null);
  };

  // 単一アイテムの追加
  const handleAddSingleItem = (chapterId: string, sectionId: string) => {
    if (!singleItemLabel.trim() || !editingStructure) return;
    const newItem: MaterialUnitItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      type: 'numbered',
      label: singleItemLabel.trim(),
    };

    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id === sectionId) {
              return {
                ...sec,
                items: [...sec.items, newItem],
              };
            }
            return sec;
          }),
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
    setSingleItemLabel('');
  };

  // 個別アイテムの削除
  const handleDeleteItem = (chapterId: string, sectionId: string, itemId: string) => {
    if (!editingStructure) return;
    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id === sectionId) {
              return {
                ...sec,
                items: sec.items.filter((it) => it.id !== itemId),
              };
            }
            return sec;
          }),
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
  };

  // セクション内全アイテムのクリア
  const handleClearSectionItems = (chapterId: string, sectionId: string) => {
    if (!editingStructure) return;
    const updatedChapters = editingStructure.chapters.map((ch) => {
      if (ch.id === chapterId) {
        return {
          ...ch,
          sections: ch.sections.map((sec) => {
            if (sec.id === sectionId) {
              return {
                ...sec,
                items: [],
              };
            }
            return sec;
          }),
        };
      }
      return ch;
    });

    setEditingStructure({
      ...editingStructure,
      chapters: updatedChapters,
    });
    setHasUnsavedChanges(true);
  };

  // 集計値の計算
  const totalChaptersCount = editingStructure?.chapters?.length || 0;
  const totalSectionsCount =
    editingStructure?.chapters?.reduce((acc, c) => acc + c.sections.length, 0) || 0;
  const totalItemsCount =
    editingStructure?.chapters?.reduce(
      (acc, c) => acc + c.sections.reduce((sAcc, s) => sAcc + s.items.length, 0),
      0
    ) || 0;

  return (
    <div className="space-y-4">
      {/* 画面上部ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
              マスター管理
            </span>
            {hasUnsavedChanges && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                未保存の変更あり
              </span>
            )}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
            参考書・問題集の構造マスター登録
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            章・節・例題連番や教科書ページをあらかじめ定義することで、定期テスト範囲の指定や生徒のタスク作成を極めて円滑にします。
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsCreatingMaterial(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新規教材を追加</span>
          </button>

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasUnsavedChanges}
            className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer ${
              hasUnsavedChanges
                ? 'opacity-100 hover:opacity-90'
                : 'opacity-50 cursor-not-allowed'
            }`}
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            <Save className="w-3.5 h-3.5" />
            <span>変更を保存</span>
          </button>
        </div>
      </div>

      {saveSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2 text-xs font-medium">
          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* 新規教材追加モーダル */}
      {isCreatingMaterial && (
        <form
          onSubmit={handleCreateMaterialSubmit}
          className="bg-white dark:bg-zinc-900 border-2 border-zinc-300 dark:border-zinc-700 rounded-xl p-4 sm:p-5 shadow-lg space-y-3"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center space-x-1.5">
              <FolderPlus className="w-4 h-4 text-zinc-600" />
              <span>新しい参考書・問題集・教科書の登録</span>
            </h2>
            <button
              type="button"
              onClick={() => setIsCreatingMaterial(false)}
              className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
            >
              ✕ 閉じる
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                教材名称
              </label>
              <input
                type="text"
                value={newMaterialName}
                onChange={(e) => setNewMaterialName(e.target.value)}
                placeholder="例: スタンダード数学演習I・II・A・B、セミナー物理など"
                required
                className="w-full px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                教科
              </label>
              <select
                value={newMaterialSubjectId}
                onChange={(e) => setNewMaterialSubjectId(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
              基本の分節タイプ
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label
                className={`p-2.5 rounded-lg border flex items-center space-x-2 cursor-pointer transition-colors ${
                  newMaterialType === 'numbered'
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-300 dark:bg-zinc-800 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="matType"
                  checked={newMaterialType === 'numbered'}
                  onChange={() => setNewMaterialType('numbered')}
                  className="hidden"
                />
                <Hash className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="text-zinc-900 dark:text-zinc-100">連番型（問題集・参考書）</div>
                  <div className="text-[10px] text-zinc-500 font-normal">例題・問・Step・No.などの番号管理</div>
                </div>
              </label>

              <label
                className={`p-2.5 rounded-lg border flex items-center space-x-2 cursor-pointer transition-colors ${
                  newMaterialType === 'page'
                    ? 'border-zinc-900 bg-zinc-50 dark:border-zinc-300 dark:bg-zinc-800 font-bold'
                    : 'border-zinc-200 dark:border-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="matType"
                  checked={newMaterialType === 'page'}
                  onChange={() => setNewMaterialType('page')}
                  className="hidden"
                />
                <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="text-zinc-900 dark:text-zinc-100">ページ型（教科書・読物）</div>
                  <div className="text-[10px] text-zinc-500 font-normal">ページ番号単位（p.10〜p.45など）で管理</div>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingMaterial(false)}
              className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-semibold cursor-pointer"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              style={{ backgroundColor: accentColor, color: accentForeground }}
            >
              教材を追加して構造を作成
            </button>
          </div>
        </form>
      )}

      {/* PC対応 2カラムメインエリア */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* 左カラム (lg:col-span-4): 教材リスト */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              教材一覧 ({filteredMaterials.length})
            </span>

            {/* 科目フィルタ */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="px-2 py-0.5 rounded text-[11px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800"
            >
              <option value="all">全教科</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
            {filteredMaterials.map((m) => {
              const isSelected = m.id === selectedMaterial?.id;
              const sub = subjects.find((s) => s.id === m.subjectId);
              const struct = m.structure;
              const chCount = struct?.chapters?.length || 0;
              const itemsCount =
                struct?.chapters?.reduce(
                  (acc, c) => acc + c.sections.reduce((sAcc, s) => sAcc + s.items.length, 0),
                  0
                ) || 0;

              return (
                <div
                  key={m.id}
                  onClick={() => {
                    if (hasUnsavedChanges) {
                      if (!window.confirm('未保存の変更があります。教材を切り替えますか？')) {
                        return;
                      }
                    }
                    setSelectedMaterialId(m.id);
                  }}
                  className={`p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'border-zinc-900 bg-zinc-100/90 dark:border-zinc-200 dark:bg-zinc-800 font-medium'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[10px] px-1.5 py-0.2 rounded font-bold"
                      style={{
                        backgroundColor: `${sub?.color || '#888'}22`,
                        color: sub?.color || '#888',
                      }}
                    >
                      {sub?.name || 'その他'}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      {chCount > 0 ? `${chCount}章 / ${itemsCount}項目` : '未構造化'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 mt-1 line-clamp-1">
                    {m.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 右カラム (lg:col-span-8): 選択教材の構造エディタ */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-4">
          {selectedMaterial && editingStructure ? (
            <>
              {/* 教材ヘッダー & サマリー指標 */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {selectedMaterial.name}
                    </h2>
                    <button
                      type="button"
                      onClick={handleDeleteCurrentMaterial}
                      title="この教材を削除"
                      className="text-zinc-400 hover:text-rose-500 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    <span>章数: <strong className="text-zinc-800 dark:text-zinc-200">{totalChaptersCount}</strong></span>
                    <span>節数: <strong className="text-zinc-800 dark:text-zinc-200">{totalSectionsCount}</strong></span>
                    <span>総アイテム数: <strong className="text-zinc-800 dark:text-zinc-200">{totalItemsCount}</strong> 個</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingChapter(true)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-blue-500" />
                    <span>章を追加</span>
                  </button>
                </div>
              </div>

              {/* 章追加インラインフォーム */}
              {isAddingChapter && (
                <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900 dark:text-blue-200">
                    新しい章を登録
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={newChapterTitle}
                        onChange={(e) => setNewChapterTitle(e.target.value)}
                        placeholder="例: 第3章 2次方程式と不等式"
                        className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={newChapterStartPage}
                        onChange={(e) => setNewChapterStartPage(e.target.value)}
                        placeholder="開始ページ (任意)"
                        className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={newChapterEndPage}
                        onChange={(e) => setNewChapterEndPage(e.target.value)}
                        placeholder="終了ページ (任意)"
                        className="w-full px-2.5 py-1.5 rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingChapter(false)}
                      className="px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                    >
                      キャンセル
                    </button>
                    <button
                      type="button"
                      onClick={handleAddChapter}
                      className="px-3 py-1 rounded bg-blue-600 text-white font-bold cursor-pointer hover:bg-blue-700"
                    >
                      追加
                    </button>
                  </div>
                </div>
              )}

              {/* 章・節・アイテム階層ツリー */}
              {editingStructure.chapters.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <Layers className="w-8 h-8 text-zinc-400 mx-auto" />
                  <div className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    まだ章が登録されていません
                  </div>
                  <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                    「章を追加」ボタンから第1章を追加し、節や連番アイテム（例題1〜20等）を登録してください。
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {editingStructure.chapters.map((ch, chIdx) => {
                    const isExpanded = !!expandedChapters[ch.id];
                    return (
                      <div
                        key={ch.id}
                        className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50/40 dark:bg-zinc-800/20"
                      >
                        {/* 章ヘッダー */}
                        <div className="flex items-center justify-between p-3 bg-zinc-100/70 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => toggleChapterExpand(ch.id)}
                            className="flex items-center space-x-2 text-left cursor-pointer flex-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-zinc-500 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              {ch.title}
                            </span>
                            {ch.pageStart && (
                              <span className="text-[11px] text-zinc-500 font-normal">
                                (p.{ch.pageStart}〜{ch.pageEnd || ''})
                              </span>
                            )}
                          </button>

                          <div className="flex items-center space-x-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => setAddingSectionForChapterId(ch.id)}
                              className="text-[11px] px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                            >
                              ＋ 節を追加
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteChapter(ch.id)}
                              className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                              title="章を削除"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* 節追加入力フォーム */}
                        {addingSectionForChapterId === ch.id && (
                          <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center space-x-2">
                            <input
                              type="text"
                              value={newSectionTitle}
                              onChange={(e) => setNewSectionTitle(e.target.value)}
                              placeholder="節の名称（例: 第2節 2次関数の決定）"
                              className="flex-1 px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSection(ch.id)}
                              className="px-2.5 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold cursor-pointer"
                            >
                              追加
                            </button>
                            <button
                              type="button"
                              onClick={() => setAddingSectionForChapterId(null)}
                              className="px-2 py-1 text-xs text-zinc-400 cursor-pointer"
                            >
                              キャンセル
                            </button>
                          </div>
                        )}

                        {/* 章の本体（節一覧） */}
                        {isExpanded && (
                          <div className="p-3 space-y-3">
                            {ch.sections.length === 0 ? (
                              <div className="text-center py-4 text-xs text-zinc-400">
                                節がありません。「＋ 節を追加」から節を登録してください。
                              </div>
                            ) : (
                              ch.sections.map((sec) => {
                                const isGeneratorActive =
                                  activeGeneratorSection?.chapterId === ch.id &&
                                  activeGeneratorSection?.sectionId === sec.id;

                                return (
                                  <div
                                    key={sec.id}
                                    className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 space-y-2.5"
                                  >
                                    {/* 節タイトルバー */}
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-2">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                        <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                          {sec.title}
                                        </h3>
                                        <span className="text-[10px] text-zinc-400 font-normal">
                                          ({sec.items.length} 項目)
                                        </span>
                                      </div>

                                      <div className="flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setActiveGeneratorSection(
                                              isGeneratorActive
                                                ? null
                                                : { chapterId: ch.id, sectionId: sec.id }
                                            )
                                          }
                                          className="inline-flex items-center space-x-1 px-2 py-0.8 rounded text-[11px] font-semibold border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                                        >
                                          <Sparkles className="w-3 h-3 text-blue-500" />
                                          <span>連番・ページ一括生成</span>
                                        </button>

                                        {sec.items.length > 0 && (
                                          <button
                                            type="button"
                                            onClick={() => handleClearSectionItems(ch.id, sec.id)}
                                            className="text-[10px] text-zinc-400 hover:text-rose-500 cursor-pointer"
                                            title="この節のアイテムを全消去"
                                          >
                                            クリア
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleDeleteSection(ch.id, sec.id)}
                                          className="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                                          title="節を削除"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* 連番ジェネレーター操作パネル */}
                                    {isGeneratorActive && (
                                      <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-lg space-y-3 text-xs">
                                        <div className="flex items-center justify-between font-bold text-zinc-800 dark:text-zinc-200">
                                          <span className="flex items-center space-x-1">
                                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                            <span>分節・連番ジェネレーター</span>
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => setActiveGeneratorSection(null)}
                                            className="text-[11px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                          >
                                            閉じる
                                          </button>
                                        </div>

                                        {/* パターン1: 連番モード (例題・問・Step) */}
                                        <div className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-750 space-y-2">
                                          <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                            パターンA: 接頭辞・連番・接尾辞生成（問題集向け）
                                          </div>
                                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                                            <div>
                                              <label className="text-[10px] text-zinc-500">接頭辞</label>
                                              <input
                                                type="text"
                                                value={genPrefix}
                                                onChange={(e) => setGenPrefix(e.target.value)}
                                                placeholder="例: 例題 , 問 , No."
                                                className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-zinc-500">開始番号</label>
                                              <input
                                                type="number"
                                                value={genStartNum}
                                                onChange={(e) => setGenStartNum(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-zinc-500">終了番号</label>
                                              <input
                                                type="number"
                                                value={genEndNum}
                                                onChange={(e) => setGenEndNum(Number(e.target.value))}
                                                className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-zinc-500">接尾辞</label>
                                              <input
                                                type="text"
                                                value={genSuffix}
                                                onChange={(e) => setGenSuffix(e.target.value)}
                                                placeholder="例: 番 , (1)"
                                                className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                              />
                                            </div>
                                            <div>
                                              <label className="text-[10px] text-zinc-500">開始ページ(任意)</label>
                                              <input
                                                type="number"
                                                value={genStartPage}
                                                onChange={(e) => setGenStartPage(e.target.value)}
                                                placeholder="p."
                                                className="w-full px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between pt-1">
                                            <div className="text-[11px] text-zinc-500">
                                              プレビュー:{' '}
                                              <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                                {genPrefix}{genStartNum}{genSuffix} 〜 {genPrefix}{genEndNum}{genSuffix}
                                              </span>{' '}
                                              ({Math.abs(genEndNum - genStartNum) + 1}問)
                                            </div>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleGenerateNumberedItems(ch.id, sec.id)
                                              }
                                              className="px-3 py-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs font-bold cursor-pointer"
                                            >
                                              連番を一括生成して追加
                                            </button>
                                          </div>
                                        </div>

                                        {/* パターン2: ページ範囲一括モード (教科書・読物向け) */}
                                        <div className="p-2.5 bg-white dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-750 space-y-2">
                                          <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                                            パターンB: 教科書・読物向け ページ一括生成 (p.XX)
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className="text-zinc-500">開始ページ:</span>
                                            <input
                                              type="number"
                                              value={pageStartNum}
                                              onChange={(e) => setPageStartNum(Number(e.target.value))}
                                              className="w-20 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                            />
                                            <span className="text-zinc-500">〜 終了ページ:</span>
                                            <input
                                              type="number"
                                              value={pageEndNum}
                                              onChange={(e) => setPageEndNum(Number(e.target.value))}
                                              className="w-20 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-xs bg-white dark:bg-zinc-800"
                                            />
                                            <button
                                              type="button"
                                              onClick={() => handleGeneratePageItems(ch.id, sec.id)}
                                              className="px-3 py-1 rounded bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-700 ml-auto"
                                            >
                                              ページを一括追加
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* アイテム一覧チップス */}
                                    {sec.items.length === 0 ? (
                                      <div className="py-2 text-[11px] text-zinc-400 italic">
                                        まだ項目がありません。上の「連番・ページ一括生成」から生成してください。
                                      </div>
                                    ) : (
                                      <div className="flex flex-wrap gap-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
                                        {sec.items.map((it) => (
                                          <div
                                            key={it.id}
                                            className="group inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700"
                                          >
                                            <span className="font-medium">{it.label}</span>
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteItem(ch.id, sec.id, it.id)}
                                              className="text-zinc-400 hover:text-rose-500 opacity-60 group-hover:opacity-100 cursor-pointer text-[10px]"
                                              title="削除"
                                            >
                                              ✕
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* 単一カスタムアイテムのクイック追加 */}
                                    <div className="pt-1 flex items-center space-x-2">
                                      <input
                                        type="text"
                                        value={singleItemLabel}
                                        onChange={(e) => setSingleItemLabel(e.target.value)}
                                        placeholder="個別に1件追加（例: 章末問題A, 発展例題1）"
                                        className="flex-1 px-2 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-[11px] bg-white dark:bg-zinc-800"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddSingleItem(ch.id, sec.id);
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddSingleItem(ch.id, sec.id)}
                                        className="px-2.5 py-1 rounded border border-zinc-300 dark:border-zinc-700 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-50"
                                      >
                                        ＋追加
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-zinc-400">
              左側の教材一覧から教材を選択してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
