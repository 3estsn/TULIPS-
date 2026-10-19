/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Clock,
  Flame,
  PlusCircle,
  FileText,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  Target,
  Bookmark,
  Calendar,
  Layers,
  Edit2,
  Check,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { StudyRecord, Subject } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { INITIAL_SUBJECTS } from '../../infrastructure/seedData.ts';
import { formatMinutes } from '../../utils/timeFormat.ts';

export const HomeView: React.FC = () => {
  const { stats, tasks, currentUser, subjects, setActiveTab, accentColor, accentForeground, updateUserProfile } = useApp();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);
  const [isEditingGoal, setIsEditingGoal] = useState<boolean>(false);
  const [goalHoursInput, setGoalHoursInput] = useState<number>(() => {
    return Math.round((currentUser?.weeklyGoalMinutes || 900) / 60);
  });
  const [isEditingFocus, setIsEditingFocus] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser) {
      const todayStr = new Date().toISOString().split('T')[0];
      services.studyRecordRepository
        .getRecordsByDateRange(currentUser.id, todayStr, todayStr)
        .then((records) => setTodayRecords(records));

      if (currentUser.weeklyGoalMinutes) {
        setGoalHoursInput(Math.round(currentUser.weeklyGoalMinutes / 60));
      }
    }
  }, [currentUser, stats]);

  // 目標学習時間（分）デフォルトは15時間（900分）
  const weeklyGoalMinutes = currentUser?.weeklyGoalMinutes || 900;
  const thisWeekTotalMinutes = stats?.thisWeek?.totalMinutes || 0;
  const progressPercent = Math.min(100, Math.round((thisWeekTotalMinutes / Math.max(1, weeklyGoalMinutes)) * 100));

  // 重視する科目
  const currentFocusSubject =
    subjects.find((s) => s.id === currentUser?.focusSubjectId) ||
    subjects.find((s) => s.id === 'math') ||
    subjects[0];

  // 曜日グラフの最大値（Y軸スケール用）
  const weekBreakdown = stats?.thisWeek?.dailyBreakdown || [];
  const maxMinutesInWeek = Math.max(120, ...weekBreakdown.map((d) => d.minutes || 0));

  // 直近の定期テスト課題
  const nearestTasks = tasks.slice(0, 2);

  // 円グラフ用SVG計算 (半径 r=26, 周長 = 2*pi*26 ≈ 163.36)
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const handleSaveGoal = async () => {
    try {
      await updateUserProfile({
        weeklyGoalMinutes: Math.max(1, goalHoursInput) * 60,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditingGoal(false);
    }
  };

  const handleSelectFocusSubject = async (subjectId: string) => {
    try {
      await updateUserProfile({
        focusSubjectId: subjectId,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsEditingFocus(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 md:pb-6 text-xs sm:text-sm">
      {/* 上部ステータスバー: 重視する科目 ＆ 学習記録へのショートカット */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 shadow-xs">
        <div className="flex items-center space-x-2">
          <Bookmark className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <span className="font-semibold text-zinc-600 dark:text-zinc-400">重視する科目:</span>
          
          {!isEditingFocus ? (
            <div className="flex items-center space-x-1.5">
              <span
                className="px-2.5 py-0.5 rounded-full font-bold text-white text-xs shadow-xs"
                style={{ backgroundColor: currentFocusSubject?.color || '#3b82f6' }}
              >
                {currentFocusSubject?.name || '数学'}
              </span>
              <button
                onClick={() => setIsEditingFocus(true)}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 underline cursor-pointer"
              >
                変更
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-1 flex-wrap gap-1">
              {subjects.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => handleSelectFocusSubject(sub.id)}
                  className="px-2 py-0.5 rounded-md text-[11px] font-semibold text-white cursor-pointer hover:opacity-90"
                  style={{ backgroundColor: sub.color }}
                >
                  {sub.name}
                </button>
              ))}
              <button
                onClick={() => setIsEditingFocus(false)}
                className="text-[11px] text-zinc-400 hover:text-zinc-600 px-1"
              >
                取消
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab('record')}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-opacity hover:opacity-95 active:scale-98 cursor-pointer shadow-xs ml-auto"
          style={{ backgroundColor: accentColor, color: accentForeground }}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>学習を記録</span>
        </button>
      </div>

      {/* ホーム主要指標カード（今週の合計、1週間の目標進捗円グラフ、今日、累計、連続日数） */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1: 今週の学習時間合計 */}
        <div className="col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>今週の学習時間</span>
            <Clock className="w-3.5 h-3.5" style={{ color: accentColor }} />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatMinutes(thisWeekTotalMinutes)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">月曜〜日曜の合計</div>
          </div>
        </div>

        {/* 2: 1週間の目標学習時間 & 円グラフ進捗率 */}
        <div className="col-span-2 sm:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs flex items-center justify-between">
          <div className="flex-1 pr-2">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
              <span className="flex items-center space-x-1">
                <Target className="w-3.5 h-3.5 text-rose-500" />
                <span>週間目標</span>
              </span>
              {!isEditingGoal && (
                <button
                  onClick={() => setIsEditingGoal(true)}
                  className="text-[10px] text-zinc-400 hover:text-zinc-600 underline"
                  title="目標時間を設定"
                >
                  編集
                </button>
              )}
            </div>

            {!isEditingGoal ? (
              <div className="mt-1">
                <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {formatMinutes(weeklyGoalMinutes)}
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  残り {formatMinutes(Math.max(0, weeklyGoalMinutes - thisWeekTotalMinutes))}
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center space-x-1">
                <input
                  type="number"
                  min="1"
                  max="80"
                  value={goalHoursInput}
                  onChange={(e) => setGoalHoursInput(Number(e.target.value))}
                  className="w-14 px-1.5 py-0.5 border border-zinc-300 dark:border-zinc-700 rounded text-xs text-zinc-900 dark:text-zinc-100"
                />
                <span className="text-xs">時間</span>
                <button
                  onClick={handleSaveGoal}
                  className="p-1 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px]"
                >
                  <Check className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* 円グラフ（SVG ドーナツプログレス） */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
              {/* 背景トラック円 */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-zinc-100 dark:stroke-zinc-800"
                strokeWidth="5"
                fill="transparent"
              />
              {/* 進捗ストローク円 */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={accentColor}
                strokeWidth="5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100">
                {progressPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* 3: 今日の学習時間（要件指定追加） */}
        <div className="col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>今日の学習時間</span>
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatMinutes(stats?.today?.totalMinutes || 0)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">本日分の実績</div>
          </div>
        </div>

        {/* 4: 累計学習時間（要件指定追加） */}
        <div className="col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>累計学習時間</span>
            <Layers className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatMinutes(stats?.cumulative?.totalMinutes || 0)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">全記録期間の総合計</div>
          </div>
        </div>

        {/* 5: 連続記録日数 */}
        <div className="col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>連続記録日数</span>
            <Flame className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {stats?.streakDays || 0}
              <span className="text-xs font-medium text-zinc-400 ml-1">日連続</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">継続中</div>
          </div>
        </div>
      </div>

      {/* 今週の学習時間グラフ（教科ごとの指定色スタック棒グラフ） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              今週の教科別 学習時間推移
            </h2>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              教科ごとの色分けグラフ（月曜日〜日曜日）
            </p>
          </div>
          <button
            onClick={() => setActiveTab('stats')}
            className="text-xs font-semibold flex items-center hover:underline cursor-pointer"
            style={{ color: accentColor }}
          >
            <span>統計詳細</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* 棒グラフ本体（教科別スタックバー） */}
        <div className="h-40 flex items-end justify-between gap-1.5 sm:gap-3 pt-3 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {weekBreakdown.map((item) => {
            const isToday = item.date === new Date().toISOString().split('T')[0];
            const hasData = item.minutes > 0;
            const totalPercent = maxMinutesInWeek > 0 ? (item.minutes / maxMinutesInWeek) * 100 : 0;

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* ツールチップ/教科別内訳ポップオーバー */}
                <div className="absolute -top-12 z-20 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-[10px] py-1 px-2 rounded shadow-md pointer-events-none whitespace-nowrap">
                  <div className="font-bold">{item.day}曜日: {formatMinutes(item.minutes)}</div>
                  {item.subjectsBreakdown?.map((s) => (
                    <div key={s.subjectId} className="flex items-center space-x-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span>{s.subjectName}: {formatMinutes(s.minutes)}</span>
                    </div>
                  ))}
                </div>

                {/* グラフのバー（教科ごとに積み上げ） */}
                <div className="w-full max-w-[32px] bg-zinc-100 dark:bg-zinc-800 rounded-t-md h-full flex flex-col-reverse justify-start overflow-hidden">
                  {hasData ? (
                    item.subjectsBreakdown?.map((sub) => {
                      const subPercent = maxMinutesInWeek > 0 ? (sub.minutes / maxMinutesInWeek) * 100 : 0;
                      return (
                        <div
                          key={sub.subjectId}
                          title={`${sub.subjectName}: ${formatMinutes(sub.minutes)}`}
                          style={{
                            height: `${Math.max(2, subPercent)}%`,
                            backgroundColor: sub.color,
                          }}
                          className="w-full transition-all duration-300 hover:brightness-110"
                        />
                      );
                    })
                  ) : (
                    <div className="w-full h-1 bg-transparent" />
                  )}
                </div>

                {/* 曜日ラベル */}
                <div className="mt-1.5 text-center">
                  <span
                    className={`text-[11px] font-semibold ${
                      isToday
                        ? 'font-bold px-1.5 py-0.5 rounded-md shadow-xs'
                        : 'text-zinc-500 dark:text-zinc-400'
                    }`}
                    style={{
                      backgroundColor: isToday ? accentColor : undefined,
                      color: isToday ? accentForeground : undefined,
                    }}
                  >
                    {item.day}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 教科別の色凡例（要件指定色） */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-600 dark:text-zinc-400 mt-2.5 pt-1 gap-y-1.5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {INITIAL_SUBJECTS.map((sub) => (
              <div key={sub.id} className="flex items-center space-x-1">
                <span className="w-2.5 h-2.5 rounded-xs shrink-0" style={{ backgroundColor: sub.color }} />
                <span>{sub.name}</span>
              </div>
            ))}
          </div>
          <div className="text-[10px] text-zinc-400">
            バーにマウスを合わせると内訳を表示
          </div>
        </div>
      </div>

      {/* 2カラムレイアウト: 定期テスト課題の範囲 & 今日の学習記録 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {/* 定期テスト課題（先生が設定した課題範囲） */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                定期テスト課題の範囲
              </h2>
            </div>
            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
              教員配信
            </span>
          </div>

          {nearestTasks.length === 0 ? (
            <div className="p-5 text-center text-zinc-500 dark:text-zinc-400 text-xs border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              現在配信されている定期テスト課題はありません。
            </div>
          ) : (
            <div className="space-y-2.5">
              {nearestTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                      {t.title}
                    </span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400 text-[11px]">
                      提出期日: {t.deadline}
                    </span>
                  </div>
                  <div className="mt-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.scope}
                  </div>
                  {t.notes && (
                    <div className="mt-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                      指示: {t.notes}
                    </div>
                  )}
                  <div className="mt-1.5 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[10px] text-zinc-400">
                    <span>配信: {t.teacherName}</span>
                    <span>対象: {t.targetGrade}年 {t.targetClass}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 今日の学習記録一覧 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                本日の学習記録
              </h2>
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              合計 {formatMinutes(stats?.today?.totalMinutes || 0)}
            </span>
          </div>

          {todayRecords.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
              <BookOpen className="w-6 h-6 text-zinc-400 dark:text-zinc-600 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                本日はまだ学習記録がありません。
              </p>
              <button
                onClick={() => setActiveTab('record')}
                className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs"
                style={{ backgroundColor: accentColor, color: accentForeground }}
              >
                今すぐ記録する
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {todayRecords.map((rec) => {
                const sub = subjects.find((s) => s.id === rec.subjectId);
                return (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: sub?.color || '#3b82f6' }}
                        />
                        <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                          {rec.materialName}
                        </span>
                      </div>
                      {rec.notes && (
                        <div className="text-[11px] text-zinc-400 truncate mt-0.5 pl-3.5">
                          {rec.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {formatMinutes(rec.durationMinutes)}
                      </div>
                      <span className="text-[9px] text-zinc-400">
                        {rec.method === 'manual'
                          ? '手動'
                          : rec.method === 'timer_countup'
                          ? 'アップ'
                          : 'ダウン'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
