/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  PieChart,
  ListFilter,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { StudyRecord } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { formatMinutes } from '../../utils/timeFormat.ts';

export const StatisticsView: React.FC = () => {
  const { stats, currentUser, accentColor, refreshData } = useApp();
  const [records, setRecords] = useState<StudyRecord[]>([]);
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>('all');

  useEffect(() => {
    if (currentUser) {
      services.studyRecordRepository.getRecordsByUser(currentUser.id).then((recs) => {
        setRecords(recs);
      });
    }
  }, [currentUser, stats]);

  const handleDeleteRecord = async (id: string) => {
    await services.studyRecordRepository.deleteRecord(id);
    await refreshData();
  };

  const filteredRecords =
    selectedSubjectFilter === 'all'
      ? records
      : records.filter((r) => r.subjectId === selectedSubjectFilter);

  return (
    <div className="space-y-4 pb-20 md:pb-8 text-xs sm:text-sm">
      {/* タイトルヘッダー */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
          学習統計
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          日々の学習履歴を累計・今年度・今月・今日など多様な期間で分析し、弱点克服と継続を支援します。
        </p>
      </div>

      {/* ホーム主要指標の再掲（今週の合計、1週間の1日平均、連続日数） */}
      <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
        <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
          今週のサマリー（ホーム連携指標）
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">今週の学習時間</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formatMinutes(stats?.thisWeek?.totalMinutes || 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">1週間の1日平均</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {formatMinutes(stats?.thisWeek?.averageMinutesPerDay || 0)}
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold">連続記録日数</div>
            <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              {stats?.streakDays || 0} 日連続
            </div>
          </div>
        </div>
      </div>

      {/* 要件指定：学習時間（累計・今年度・今月・今日） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            期間別 学習時間合計
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 今日 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今日</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.today?.totalMinutes || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">本日分の合計</span>
          </div>

          {/* 今月 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今月</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.thisMonth?.totalMinutes || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">当月1日〜今日</span>
          </div>

          {/* 今年度 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今年度</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.thisFiscalYear?.totalMinutes || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">4月1日〜現在</span>
          </div>

          {/* 累計 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">累計</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.cumulative?.totalMinutes || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">利用開始からの総時間</span>
          </div>
        </div>
      </div>

      {/* 要件指定：平均学習時間（累計・今年度・今月・今日） */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            平均学習時間
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 今日 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今日</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.today?.averageMinutesPerDay || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">今日の学習実績</span>
          </div>

          {/* 今月 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今月平均</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.thisMonth?.averageMinutesPerDay || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">今月日数で除算</span>
          </div>

          {/* 今年度 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">今年度平均</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.thisFiscalYear?.averageMinutesPerDay || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">年度経過日数で除算</span>
          </div>

          {/* 累計 */}
          <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">累計平均</span>
            <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
              {formatMinutes(stats?.cumulative?.averageMinutesPerDay || 0)}
            </div>
            <span className="text-[11px] text-zinc-400 mt-1 block">全記録期間での平均</span>
          </div>
        </div>
      </div>

      {/* 教科別学習時間の内訳 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-3">
          <PieChart className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            教科別 学習時間の割合
          </h2>
        </div>

        {/* スタックバー */}
        <div className="h-3.5 rounded-full overflow-hidden flex bg-zinc-100 dark:bg-zinc-800">
          {(stats?.subjectBreakdown || [])
            .filter((sub) => sub.percentage > 0)
            .map((sub) => (
              <div
                key={sub.subjectId}
                title={`${sub.subjectName}: ${sub.percentage}%`}
                style={{
                  width: `${sub.percentage}%`,
                  backgroundColor: sub.color,
                }}
              />
            ))}
        </div>

        {/* 教科ごとのリスト */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mt-3.5">
          {(stats?.subjectBreakdown || []).map((sub) => (
            <div
              key={sub.subjectId}
              className="p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/30 flex items-center justify-between"
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {sub.subjectName}
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                  {formatMinutes(sub.minutes)}
                </span>
                <span className="text-[10px] text-zinc-400 ml-1">({sub.percentage}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 詳細な学習記録履歴テーブル */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 mb-3">
          <div className="flex items-center space-x-1.5">
            <ListFilter className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              学習記録一覧
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">教科絞り込み:</label>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => setSelectedSubjectFilter(e.target.value)}
              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              <option value="all">全教科</option>
              <option value="math">数学</option>
              <option value="english">英語</option>
              <option value="japanese">国語</option>
              <option value="science">理科</option>
              <option value="social">地歴公民</option>
              <option value="info">情報</option>
              <option value="other">その他</option>
            </select>
          </div>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 text-sm border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
            該当する学習記録はありません。
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">日付</th>
                  <th className="py-2.5 px-3">教材名</th>
                  <th className="py-2.5 px-3">時間</th>
                  <th className="py-2.5 px-3">方法</th>
                  <th className="py-2.5 px-3">メモ・内容</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="py-2.5 px-3 whitespace-nowrap font-medium">{r.date}</td>
                    <td className="py-2.5 px-3 font-semibold text-zinc-900 dark:text-zinc-100 max-w-[200px] truncate">
                      {r.materialName}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-bold text-zinc-900 dark:text-zinc-100">
                      {formatMinutes(r.durationMinutes)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {r.method === 'manual'
                          ? '手動入力'
                          : r.method === 'timer_countup'
                          ? 'カウントアップ'
                          : 'カウントダウン'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-zinc-500 dark:text-zinc-400 max-w-[220px] truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteRecord(r.id)}
                        className="text-zinc-400 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                        title="記録を削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
