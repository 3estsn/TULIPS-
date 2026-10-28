/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComprehensiveStatistics, StudyRecord } from '../domain/models/index.ts';
import { INITIAL_SUBJECTS } from '../infrastructure/seedData.ts';

export function calculateComprehensiveStatistics(
  userRecords: StudyRecord[],
  targetDateStr?: string
): ComprehensiveStatistics {
  const now = targetDateStr ? new Date(targetDateStr) : new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 今週の計算（月曜日起算〜日曜日）
  const dayOfWeek = now.getDay(); // 0(日)〜6(土)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday);

  const weekDays: {
    day: string;
    date: string;
    minutes: number;
    subjectsBreakdown: { subjectId: string; subjectName: string; color: string; minutes: number }[];
  }[] = [];
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  let thisWeekTotalMinutes = 0;

  for (let i = 0; i < 7; i++) {
    const currentDay = new Date(monday);
    currentDay.setDate(monday.getDate() + i);
    const curDateStr = currentDay.toISOString().split('T')[0];

    const dayRecords = userRecords.filter((r) => r.date === curDateStr);
    const dayMinutes = dayRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

    // 教科ごとの学習時間内訳
    const daySubjectMap = new Map<string, number>();
    dayRecords.forEach((r) => {
      const sid = r.subjectId || 'other';
      daySubjectMap.set(sid, (daySubjectMap.get(sid) || 0) + (Number(r.durationMinutes) || 0));
    });

    const daySubjectsBreakdown = INITIAL_SUBJECTS.map((sub) => ({
      subjectId: sub.id,
      subjectName: sub.name,
      color: sub.color,
      minutes: daySubjectMap.get(sub.id) || 0,
    })).filter((s) => s.minutes > 0);

    weekDays.push({
      day: dayNames[i],
      date: curDateStr,
      minutes: dayMinutes,
      subjectsBreakdown: daySubjectsBreakdown,
    });

    thisWeekTotalMinutes += dayMinutes;
  }

  // 今日の合計
  const todayMinutes = userRecords
    .filter((r) => r.date === todayStr)
    .reduce((sum, r) => sum + r.durationMinutes, 0);

  // 今月（当月1日〜本日）
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStartStr = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const daysInMonthSoFar = now.getDate();
  const thisMonthRecords = userRecords.filter((r) => r.date >= monthStartStr && r.date <= todayStr);
  const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

  // 今年度（日本の高校: 4月1日〜翌3月31日）
  const fiscalYear = month >= 3 ? year : year - 1;
  const fiscalStartStr = `${fiscalYear}-04-01`;
  const fiscalRecords = userRecords.filter((r) => r.date >= fiscalStartStr && r.date <= todayStr);
  const fiscalTotal = fiscalRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

  // 今年度の経過日数
  const fiscalStartDate = new Date(`${fiscalYear}-04-01T00:00:00`);
  const diffTime = Math.max(0, now.getTime() - fiscalStartDate.getTime());
  const fiscalDaysPassed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

  // 累計
  const cumulativeTotal = userRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
  const recordDates = Array.from(new Set(userRecords.map((r) => r.date))).sort();
  let cumulativeDays = 1;
  if (recordDates.length > 0) {
    const firstDate = new Date(recordDates[0]);
    const daysDiff = Math.max(1, Math.floor((now.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    cumulativeDays = daysDiff;
  }

  // 連続記録日数（ストリーク計算）
  let streak = 0;
  const checkDate = new Date(now);
  const hasTodayRecord = userRecords.some((r) => r.date === todayStr);
  if (!hasTodayRecord) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  while (true) {
    const dateCheckStr = checkDate.toISOString().split('T')[0];
    const hasRecord = userRecords.some((r) => r.date === dateCheckStr);
    if (hasRecord) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // 科目別内訳
  const subjectMap = new Map<string, number>();
  userRecords.forEach((r) => {
    const sid = r.subjectId || 'other';
    subjectMap.set(sid, (subjectMap.get(sid) || 0) + (Number(r.durationMinutes) || 0));
  });

  const subjectBreakdown = INITIAL_SUBJECTS.map((sub) => {
    const minutes = subjectMap.get(sub.id) || 0;
    const percentage = cumulativeTotal > 0 ? Math.round((minutes / cumulativeTotal) * 100) : 0;
    return {
      subjectId: sub.id,
      subjectName: sub.name,
      color: sub.color,
      minutes,
      percentage,
    };
  }).sort((a, b) => b.minutes - a.minutes);

  return {
    streakDays: streak,
    thisWeek: {
      totalMinutes: thisWeekTotalMinutes,
      averageMinutesPerDay: Math.round(thisWeekTotalMinutes / 7),
      dailyBreakdown: weekDays,
    },
    today: {
      totalMinutes: todayMinutes,
      averageMinutesPerDay: todayMinutes,
    },
    thisMonth: {
      totalMinutes: thisMonthTotal,
      averageMinutesPerDay: Math.round(thisMonthTotal / Math.max(1, daysInMonthSoFar)),
    },
    thisFiscalYear: {
      totalMinutes: fiscalTotal,
      averageMinutesPerDay: Math.round(fiscalTotal / fiscalDaysPassed),
    },
    cumulative: {
      totalMinutes: cumulativeTotal,
      averageMinutesPerDay: Math.round(cumulativeTotal / cumulativeDays),
    },
    subjectBreakdown,
  };
}
