/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Clock,
  Flame,
  TrendingUp,
  PlusCircle,
  CalendarDays,
  FileText,
  ChevronRight,
  BookOpen,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { StudyRecord } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { formatMinutes } from '../../utils/timeFormat.ts';

export const HomeView: React.FC = () => {
  const { stats, tasks, currentUser, setActiveTab, accentColor, accentForeground } = useApp();
  const [todayRecords, setTodayRecords] = useState<StudyRecord[]>([]);

  useEffect(() => {
    if (currentUser) {
      const todayStr = new Date().toISOString().split('T')[0];
      services.studyRecordRepository
        .getRecordsByDateRange(currentUser.id, todayStr, todayStr)
        .then((records) => setTodayRecords(records));
    }
  }, [currentUser, stats]);

  // 曜日グラフの最大値（Y軸スケール用）
  const weekBreakdown = stats?.thisWeek.dailyBreakdown || [];
  const maxMinutesInWeek = Math.max(120, ...weekBreakdown.map((d) => d.minutes));

  // 直近の定期テスト課題
  const nearestTasks = tasks.slice(0, 2);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      

      {/* ホーム主要指標 3枚カード (今週の合計、1日平均、連続記録日数) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1: 今週の学習時間合計 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>今週の学習時間合計</span>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatMinutes(stats?.thisWeek.totalMinutes || 0)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center space-x-1">
              <span>月曜日から日曜日までの総時間</span>
            </div>
          </div>
        </div>

        {/* 2: 1週間における1日の平均学習時間 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>1日の平均学習時間（今週）</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {formatMinutes(stats?.thisWeek.averageMinutesPerDay || 0)}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              今週合計 ÷ 7日間
            </div>
          </div>
        </div>

        {/* 3: 連続記録日数 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-semibold">
            <span>連続記録日数</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {stats?.streakDays || 0}
              <span className="text-base font-semibold text-zinc-500 dark:text-zinc-400 ml-1">日連続</span>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              毎日の学習記録を継続中
            </div>
          </div>
        </div>
      </div>

      {/* 今週の学習時間グラフ（曜日別棒グラフ） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              今週の学習時間推移
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              曜日ごとの記録状況（月曜日〜日曜日）
            </p>
          </div>
          <button
            onClick={() => setActiveTab('stats')}
            className="text-xs font-semibold flex items-center hover:underline cursor-pointer"
            style={{ color: accentColor }}
          >
            <span>統計詳細を見る</span>
            <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {/* 棒グラフ本体 */}
        <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 pt-4 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {weekBreakdown.map((item) => {
            const heightPercent = maxMinutesInWeek > 0 ? (item.minutes / maxMinutesInWeek) * 100 : 0;
            const isToday = item.date === new Date().toISOString().split('T')[0];

            return (
              <div key={item.date} className="flex-1 flex flex-col items-center h-full justify-end group">
                {/* ツールチップ/時間表示 */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 mb-1 whitespace-nowrap">
                  {formatMinutes(item.minutes)}
                </div>

                {/* グラフのバー */}
                <div className="w-full max-w-[36px] bg-zinc-100 dark:bg-zinc-800 rounded-t-lg h-full flex items-end p-0.5">
                  <div
                    className="w-full rounded-t-md transition-all duration-500"
                    style={{
                      height: `${Math.max(4, heightPercent)}%`,
                      backgroundColor: item.minutes > 0 ? accentColor : 'transparent',
                      opacity: isToday ? 1 : 0.85,
                    }}
                  />
                </div>

                {/* 曜日ラベル */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-semibold ${
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

        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mt-3 pt-1">
          <div className="flex items-center space-x-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-xs"
              style={{ backgroundColor: accentColor }}
            />
            <span>学習時間（分）</span>
          </div>
          <div>目標目安: 平日120分 / 休日240分</div>
        </div>
      </div>

      {/* 2カラムレイアウト: 定期テスト課題の範囲 & 今日の学習記録 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 定期テスト課題（先生が設定した課題範囲） */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                定期テスト課題の範囲
              </h2>
            </div>
            <span className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-full font-medium">
              教員配信
            </span>
          </div>

          {nearestTasks.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 dark:text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              現在配信されている定期テスト課題はありません。
            </div>
          ) : (
            <div className="space-y-3">
              {nearestTasks.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                      {t.title}
                    </span>
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                      提出期日: {t.deadline}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.scope}
                  </div>
                  {t.notes && (
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      指示: {t.notes}
                    </div>
                  )}
                  <div className="mt-2 pt-2 border-t border-zinc-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span>配信者: {t.teacherName}</span>
                    <span>対象: {t.targetGrade}年 {t.targetClass}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 今日の学習記録一覧 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                本日の学習記録
              </h2>
            </div>
            <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
              合計 {formatMinutes(stats?.today.totalMinutes || 0)}
            </span>
          </div>

          {todayRecords.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
              <BookOpen className="w-8 h-8 text-zinc-400 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                本日はまだ学習記録がありません。
              </p>
              <button
                onClick={() => setActiveTab('record')}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer shadow-xs"
                style={{ backgroundColor: accentColor, color: accentForeground }}
              >
                今すぐ記録する
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {todayRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {rec.materialName}
                    </div>
                    {rec.notes && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                        {rec.notes}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {formatMinutes(rec.durationMinutes)}
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                      {rec.method === 'manual'
                        ? '手動入力'
                        : rec.method === 'timer_countup'
                        ? 'カウントアップ'
                        : 'カウントダウン'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
