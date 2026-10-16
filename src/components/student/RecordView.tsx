/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  BookOpen,
  CheckCircle,
  Timer,
  Edit3,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { Material, StudyMethod } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { formatMinutes, formatTimerSeconds } from '../../utils/timeFormat.ts';

type InputMode = 'manual' | 'timer';
type TimerType = 'countup' | 'countdown';

export const RecordView: React.FC = () => {
  const { currentUser, subjects, materials, accentColor, accentForeground, refreshData, setActiveTab } = useApp();

  // 入力モード（手動入力 / タイマー計測）
  const [inputMode, setInputMode] = useState<InputMode>('manual');

  // 科目・教材選択状態
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('math');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [customMaterialName, setCustomMaterialName] = useState<string>('');
  const [isAddingNewMaterial, setIsAddingNewMaterial] = useState<boolean>(false);

  // 手動入力フォーム
  const [recordDate, setRecordDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string>('');

  // タイマー状態
  const [timerType, setTimerType] = useState<TimerType>('countup');
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [targetMinutes, setTargetMinutes] = useState<number>(25); // カウントダウン初期値: 25分
  const [countdownRemaining, setCountdownRemaining] = useState<number>(25 * 60);
  const [countdownFinished, setCountdownFinished] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // 科目変更時に選択中教材を先頭にリセット
  useEffect(() => {
    const available = materials.filter((m) => m.subjectId === selectedSubjectId);
    if (available.length > 0) {
      setSelectedMaterialId(available[0].id);
    } else {
      setSelectedMaterialId('');
    }
  }, [selectedSubjectId, materials]);

  // カウントダウン目標時間変更時
  useEffect(() => {
    if (!isRunning) {
      setCountdownRemaining(targetMinutes * 60);
      setCountdownFinished(false);
    }
  }, [targetMinutes, isRunning]);

  // タイマー制御
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        if (timerType === 'countup') {
          setTimerSeconds((prev) => prev + 1);
        } else {
          setCountdownRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current);
              setIsRunning(false);
              setCountdownFinished(true);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, timerType]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    if (timerType === 'countup') {
      setTimerSeconds(0);
    } else {
      setCountdownRemaining(targetMinutes * 60);
      setCountdownFinished(false);
    }
  };

  // 新規教材追加処理
  const handleAddNewMaterial = async () => {
    if (!customMaterialName.trim()) return;
    try {
      const created = await services.materialRepository.addMaterial({
        name: customMaterialName.trim(),
        subjectId: selectedSubjectId,
        isDefault: false,
      });
      await refreshData();
      setSelectedMaterialId(created.id);
      setCustomMaterialName('');
      setIsAddingNewMaterial(false);
    } catch (e) {
      console.error(e);
    }
  };

  // 手動記録送信
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (durationMinutes <= 0) return;

    const chosenMaterial = materials.find((m) => m.id === selectedMaterialId);
    const materialName = chosenMaterial ? chosenMaterial.name : '自習教材';

    setIsSubmitting(true);
    try {
      await services.studyRecordRepository.addRecord({
        userId: currentUser.id,
        subjectId: selectedSubjectId,
        materialId: selectedMaterialId || 'custom',
        materialName,
        date: recordDate,
        durationMinutes,
        notes: notes.trim() || undefined,
        method: 'manual',
      });
      await refreshData();
      setSaveSuccessMsg(`学習記録（${materialName}：${formatMinutes(durationMinutes)}）を保存しました。`);
      setNotes('');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Failed to save record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // タイマー計測結果を記録
  const handleSaveTimerRecord = async () => {
    if (!currentUser) return;

    let recordedMinutes = 0;
    let method: StudyMethod = 'timer_countup';

    if (timerType === 'countup') {
      recordedMinutes = Math.max(1, Math.round(timerSeconds / 60));
      method = 'timer_countup';
    } else {
      const elapsedSeconds = targetMinutes * 60 - countdownRemaining;
      recordedMinutes = Math.max(1, Math.round(elapsedSeconds / 60));
      method = 'timer_countdown';
    }

    const chosenMaterial = materials.find((m) => m.id === selectedMaterialId);
    const materialName = chosenMaterial ? chosenMaterial.name : 'タイマー計測学習';

    setIsSubmitting(true);
    try {
      await services.studyRecordRepository.addRecord({
        userId: currentUser.id,
        subjectId: selectedSubjectId,
        materialId: selectedMaterialId || 'custom',
        materialName,
        date: new Date().toISOString().split('T')[0],
        durationMinutes: recordedMinutes,
        notes: notes.trim() || undefined,
        method,
      });
      await refreshData();
      setSaveSuccessMsg(`タイマー学習記録（${materialName}：${formatMinutes(recordedMinutes)}）を保存しました。`);
      resetTimer();
      setNotes('');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Failed to save timer record:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMaterials = materials.filter((m) => m.subjectId === selectedSubjectId);

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20 md:pb-8 text-xs sm:text-sm">
      {/* ページタイトル */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
          学習を記録する
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          手動入力またはタイマー機能（カウントアップ/カウントダウン）で教材ごとの学習時間を記録します。
        </p>
      </div>

      {/* 完了通知メッセージ */}
      {saveSuccessMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium">{saveSuccessMsg}</span>
        </div>
      )}

      {/* 共通: 教材・科目選択カード */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex items-center space-x-2 border-b border-zinc-200 dark:border-zinc-800 pb-2.5">
          <BookOpen className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            学習する教科・教材を選択
          </h2>
        </div>

        {/* 科目選択ボタンリスト */}
        <div>
          <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
            教科
          </label>
          <div className="flex flex-wrap gap-2">
            {subjects.map((sub) => {
              const isSelected = selectedSubjectId === sub.id;
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'shadow-xs'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                  style={{
                    backgroundColor: isSelected ? accentColor : undefined,
                    color: isSelected ? accentForeground : undefined,
                  }}
                >
                  {sub.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 教材選択ドロップダウン & 追加 */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              使用教材
            </label>
            <button
              type="button"
              onClick={() => setIsAddingNewMaterial(!isAddingNewMaterial)}
              className="text-xs font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
              style={{ color: accentColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingNewMaterial ? '教材選択に戻る' : '新しい教材を追加'}</span>
            </button>
          </div>

          {!isAddingNewMaterial ? (
            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-hidden focus:ring-2"
              style={{ outlineColor: accentColor }}
            >
              {filteredMaterials.map((mat) => (
                <option key={mat.id} value={mat.id}>
                  {mat.name}
                </option>
              ))}
              {filteredMaterials.length === 0 && (
                <option value="">（登録された教材がありません。「新しい教材を追加」から登録してください）</option>
              )}
            </select>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="例: Focus Gold 数学II+B、古文単語帳など"
                value={customMaterialName}
                onChange={(e) => setCustomMaterialName(e.target.value)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden focus:ring-2"
              />
              <button
                type="button"
                onClick={handleAddNewMaterial}
                className="px-4 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                style={{ backgroundColor: accentColor, color: accentForeground }}
              >
                登録
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 入力方法切り替えタブ（手動入力 / タイマー計測） */}
      <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1">
        <button
          type="button"
          onClick={() => setInputMode('manual')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            inputMode === 'manual'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>手動で時間を入力</span>
        </button>
        <button
          type="button"
          onClick={() => setInputMode('timer')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            inputMode === 'timer'
              ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>タイマーで計測</span>
        </button>
      </div>

      {/* 手動入力モードのUI */}
      {inputMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 日付選択 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                学習した日付
              </label>
              <input
                type="date"
                value={recordDate}
                onChange={(e) => setRecordDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-hidden"
              />
            </div>

            {/* 学習時間入力 */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                学習時間（分）
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-hidden"
              />
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 block">
                表示: {formatMinutes(durationMinutes)}
              </span>
            </div>
          </div>

          {/* クイック時間加算ボタン */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              クイック時間選択
            </label>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90, 120].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDurationMinutes(mins)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    durationMinutes === mins
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {mins}分
                </button>
              ))}
            </div>
          </div>

          {/* メモ */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
              学習内容・進捗メモ（任意）
            </label>
            <textarea
              rows={3}
              placeholder="例: 三角関数のグラフ演習 p.42〜p.48、間違えたNo.3とNo.7を解き直し"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
            />
          </div>

          {/* 送信ボタン */}
          <button
            type="submit"
            disabled={isSubmitting || durationMinutes <= 0}
            className="w-full py-3 rounded-xl font-bold text-sm shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            {isSubmitting ? '保存中...' : 'この内容で学習を記録する'}
          </button>
        </form>
      )}

      {/* タイマー計測モードのUI */}
      {inputMode === 'timer' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
          {/* カウントアップ / カウントダウン切り替え */}
          <div className="flex justify-center">
            <div className="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
              <button
                type="button"
                onClick={() => {
                  if (!isRunning) {
                    setTimerType('countup');
                    resetTimer();
                  }
                }}
                disabled={isRunning}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timerType === 'countup'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                カウントアップ
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isRunning) {
                    setTimerType('countdown');
                    resetTimer();
                  }
                }}
                disabled={isRunning}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  timerType === 'countdown'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                カウントダウン
              </button>
            </div>
          </div>

          {/* カウントダウン用 目標分数プリセット */}
          {timerType === 'countdown' && !isRunning && (
            <div>
              <label className="block text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
                タイマー時間を選択（高校1コマ: 45〜50分 / ポモドーロ: 25分）
              </label>
              <div className="flex justify-center flex-wrap gap-2">
                {[15, 25, 45, 50, 60, 90].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setTargetMinutes(mins)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      targetMinutes === mins
                        ? 'shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                    style={{
                      backgroundColor: targetMinutes === mins ? accentColor : undefined,
                      color: targetMinutes === mins ? accentForeground : undefined,
                    }}
                  >
                    {mins}分
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* タイマー大文字デジタル表示 */}
          <div className="text-center py-6">
            <div className="font-mono text-5xl sm:text-7xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {timerType === 'countup'
                ? formatTimerSeconds(timerSeconds)
                : formatTimerSeconds(countdownRemaining)}
            </div>
            <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-2">
              {timerType === 'countup'
                ? isRunning
                  ? '計測中...'
                  : '停止中'
                : countdownFinished
                ? '時間到達！学習完了です。'
                : isRunning
                ? `目標: ${targetMinutes}分`
                : '目標時間を設定して開始'}
            </div>
          </div>

          {/* コントロールボタン（スタート・一時停止・リセット） */}
          <div className="flex items-center justify-center space-x-4">
            <button
              type="button"
              onClick={toggleTimer}
              className="px-6 py-3 rounded-2xl font-bold text-sm shadow-md flex items-center space-x-2 transition-all duration-150 hover:opacity-95 active:scale-95 cursor-pointer"
              style={{ backgroundColor: accentColor, color: accentForeground }}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span>一時停止</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>{timerSeconds > 0 || (timerType === 'countdown' && countdownRemaining < targetMinutes * 60) ? '再開' : '計測開始'}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={resetTimer}
              className="p-3 rounded-2xl border border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="リセット"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* メモ＆記録保存ボタン（計測終了時・停止時） */}
          {(timerSeconds > 0 || (timerType === 'countdown' && countdownRemaining < targetMinutes * 60) || countdownFinished) && (
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  学習メモ・感想
                </label>
                <input
                  type="text"
                  placeholder="例: 単語テスト対策、集中できた"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveTimerRecord}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-bold text-sm shadow-xs transition-opacity hover:opacity-95 disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: accentColor, color: accentForeground }}
              >
                {isSubmitting ? '保存中...' : 'タイマー計測した学習時間を記録する'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
