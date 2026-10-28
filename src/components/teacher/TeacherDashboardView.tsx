/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Clock,
  TrendingUp,
  Flame,
  BookOpen,
  ChevronRight,
  X,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext.tsx';
import { StudyRecord, User } from '../../domain/models/index.ts';
import { services } from '../../infrastructure/ServiceContainer.ts';
import { formatMinutes } from '../../utils/timeFormat.ts';

interface StudentSummary {
  user: User;
  weekMinutes: number;
  todayMinutes: number;
  cumulativeMinutes: number;
  streakDays: number;
  lastRecord?: StudyRecord;
}

export const TeacherDashboardView: React.FC = () => {
  const { accentColor } = useApp();
  const [students, setStudents] = useState<User[]>([]);
  const [allRecords, setAllRecords] = useState<StudyRecord[]>([]);
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<StudentSummary | null>(null);
  const [studentDetailRecords, setStudentDetailRecords] = useState<StudyRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const [studentsList, recordsList] = await Promise.all([
        services.authRepository.getStudentsList(),
        services.studyRecordRepository.getAllRecords(),
      ]);

      setStudents(studentsList);
      setAllRecords(recordsList);

      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      const dayOfWeek = now.getDay();
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(now);
      monday.setDate(now.getDate() + diffToMonday);
      const mondayStr = monday.toISOString().split('T')[0];

      const computed: StudentSummary[] = await Promise.all(
        studentsList.map(async (student) => {
          const stats = await services.studyRecordRepository.calculateStatistics(student.id);
          const studentRecs = recordsList
            .filter((r) => r.userId === student.id)
            .sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));

          return {
            user: student,
            weekMinutes: stats.thisWeek.totalMinutes,
            todayMinutes: stats.today.totalMinutes,
            cumulativeMinutes: stats.cumulative.totalMinutes,
            streakDays: stats.streakDays,
            lastRecord: studentRecs[0],
          };
        }),
      );

      setSummaries(computed);
    };

    load();
    const interval = setInterval(load, 4000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const openStudentDetail = async (summary: StudentSummary) => {
    setSelectedStudent(summary);
    const recs = await services.studyRecordRepository.getRecordsByUser(summary.user.id);
    setStudentDetailRecords(recs);
  };

  // フィルタリング
  const filteredSummaries = summaries.filter((s) => {
    if (selectedClass !== 'all' && s.user.classRoom !== selectedClass) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.user.name.toLowerCase().includes(q) ||
        (s.user.classRoom && s.user.classRoom.includes(q))
      );
    }
    return true;
  });

  // 全体集計値
  const totalClassWeekMinutes = summaries.reduce((sum, s) => sum + s.weekMinutes, 0);
  const avgClassWeekMinutes =
    summaries.length > 0 ? Math.round(totalClassWeekMinutes / summaries.length) : 0;
  const activeTodayCount = summaries.filter((s) => s.todayMinutes > 0).length;

  return (
    <div className="space-y-4 pb-20 md:pb-8 text-xs sm:text-sm">
      {/* 画面ヘッダー */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
        <div>
          <div className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
            教員専用ポータル
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-zinc-100">
            生徒の学習時間 統計情報
          </h1>
        </div>
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>生徒1人あたりの今週平均時間</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
            {formatMinutes(avgClassWeekMinutes)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">今週の学年平均学習量</span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>本日の学習記録 提出生徒</span>
            <Users className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
            {activeTodayCount} / {summaries.length}
            <span className="text-xs font-semibold text-zinc-500 ml-1">名</span>
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">
            本日すでに学習を記録した生徒数
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            <span>学年全体の総学習時間（今週）</span>
            <Clock className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 mt-1.5">
            {formatMinutes(totalClassWeekMinutes)}
          </div>
          <span className="text-[11px] text-zinc-400 mt-0.5 block">今週の学年総勉強時間</span>
        </div>
      </div>

      {/* 絞り込み & 生徒一覧テーブル */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            生徒別 学習進捗一覧（{filteredSummaries.length}名）
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            {/* クラス絞り込み */}
            <div className="flex items-center space-x-1.5">
              <Filter className="w-4 h-4 text-zinc-400" />
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="all">全クラス</option>
                <option value="1組">1組</option>
                <option value="2組">2組</option>
              </select>
            </div>

            {/* 検索入力 */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="生徒名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* テーブル */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
              <tr>
                <th className="py-3 px-3">氏名</th>
                <th className="py-3 px-3">クラス / 番号</th>
                <th className="py-3 px-3">今週の学習時間</th>
                <th className="py-3 px-3">今日の学習時間</th>
                <th className="py-3 px-3">連続日数</th>
                <th className="py-3 px-3">直近の学習教材</th>
                <th className="py-3 px-3 text-right">詳細</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 text-zinc-700 dark:text-zinc-300">
              {filteredSummaries.map((s) => (
                <tr
                  key={s.user.id}
                  onClick={() => openStudentDetail(s)}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100">{s.user.name}</div>
                    <div className="text-[11px] text-zinc-400">{s.user.email}</div>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap font-medium">
                    {s.user.grade}年 {s.user.classRoom} {s.user.studentNumber ? `${s.user.studentNumber}番` : ''}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                      {formatMinutes(s.weekMinutes)}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span
                      className={`font-semibold ${
                        s.todayMinutes > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400'
                      }`}
                    >
                      {s.todayMinutes > 0 ? formatMinutes(s.todayMinutes) : '未記録'}
                    </span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span>{s.streakDays}日</span>
                    </span>
                  </td>
                  <td className="py-3 px-3 max-w-[200px] truncate text-zinc-600 dark:text-zinc-400">
                    {s.lastRecord ? s.lastRecord.materialName : '未記録'}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 生徒詳細モーダル */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* モーダルヘッダー */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  {selectedStudent.user.grade}年 {selectedStudent.user.classRoom} {selectedStudent.user.studentNumber ? `${selectedStudent.user.studentNumber}番` : ''}
                </span>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  {selectedStudent.user.name} さんの学習カルテ
                </h3>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* モーダル本文 */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-semibold">今週の学習時間</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatMinutes(selectedStudent.weekMinutes)}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-semibold">本日の記録</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatMinutes(selectedStudent.todayMinutes)}
                  </div>
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl">
                  <div className="text-[11px] text-zinc-400 font-semibold">累計学習時間</div>
                  <div className="text-base font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                    {formatMinutes(selectedStudent.cumulativeMinutes)}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-2">
                  直近の学習記録一覧
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {studentDetailRecords.length === 0 ? (
                    <div className="text-xs text-zinc-500 text-center py-4">記録はありません</div>
                  ) : (
                    studentDetailRecords.slice(0, 10).map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {r.materialName}
                          </div>
                          <div className="text-[11px] text-zinc-400">
                            {r.date} • {r.method === 'manual' ? '手動' : 'タイマー'} {r.notes ? `• ${r.notes}` : ''}
                          </div>
                        </div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatMinutes(r.durationMinutes)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 cursor-pointer"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
