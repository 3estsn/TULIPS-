/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ComprehensiveStatistics, StudyRecord } from '../../domain/models/index.ts';
import { IStudyRecordRepository } from '../../domain/repositories/index.ts';
import { INITIAL_SUBJECTS } from '../seedData.ts';

const STORAGE_KEY = 'tulips_study_records_v2';

export class LocalStorageStudyRecordRepository implements IStudyRecordRepository {
  private records: StudyRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 過去の古いシードデータを削除
    localStorage.removeItem('tulips_study_records');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.records = JSON.parse(raw);
        return;
      } catch (e) {
        console.error('Failed to parse study records from localStorage', e);
      }
    }

    // 初回は全て空データで初期化
    this.records = [];
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.records));
    } catch (e) {
      console.error('Failed to save study records to localStorage', e);
    }
  }

  async getRecordsByUser(userId: string): Promise<StudyRecord[]> {
    return this.records
      .filter((r) => r.userId === userId)
      .sort((a, b) => (a.date === b.date ? (a.createdAt > b.createdAt ? -1 : 1) : a.date > b.date ? -1 : 1));
  }

  async getRecordsByDateRange(userId: string, startDate: string, endDate: string): Promise<StudyRecord[]> {
    return this.records
      .filter((r) => r.userId === userId && r.date >= startDate && r.date <= endDate)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
  }

  async getAllRecords(): Promise<StudyRecord[]> {
    return [...this.records];
  }

  async addRecord(record: Omit<StudyRecord, 'id' | 'createdAt'>): Promise<StudyRecord> {
    const newRecord: StudyRecord = {
      ...record,
      id: `record-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.records.unshift(newRecord);
    this.save();
    return newRecord;
  }

  async deleteRecord(id: string): Promise<boolean> {
    const prevLength = this.records.length;
    this.records = this.records.filter((r) => r.id !== id);
    if (this.records.length !== prevLength) {
      this.save();
      return true;
    }
    return false;
  }

  async calculateStatistics(userId: string, targetDateStr?: string): Promise<ComprehensiveStatistics> {
    const userRecords = this.records.filter((r) => r.userId === userId);
    const now = targetDateStr ? new Date(targetDateStr) : new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 今週の計算（月曜日起算〜日曜日）
    const dayOfWeek = now.getDay(); // 0(日)〜6(土)
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);

    const weekDays: { day: string; date: string; minutes: number }[] = [];
    const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
    let thisWeekTotalMinutes = 0;

    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      const curDateStr = currentDay.toISOString().split('T')[0];
      
      const dayMinutes = userRecords
        .filter((r) => r.date === curDateStr)
        .reduce((sum, r) => sum + r.durationMinutes, 0);

      weekDays.push({
        day: dayNames[i],
        date: curDateStr,
        minutes: dayMinutes,
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
    const daysInMonthSoFar = now.getDate(); // 1日〜今日までの日数
    const thisMonthRecords = userRecords.filter((r) => r.date >= monthStartStr && r.date <= todayStr);
    const thisMonthTotal = thisMonthRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

    // 今年度（日本の高校: 4月1日〜翌3月31日）
    const fiscalYear = month >= 3 ? year : year - 1; // 4月(month=3)以降は当年、1〜3月は前年
    const fiscalStartStr = `${fiscalYear}-04-01`;
    const fiscalRecords = userRecords.filter((r) => r.date >= fiscalStartStr && r.date <= todayStr);
    const fiscalTotal = fiscalRecords.reduce((sum, r) => sum + r.durationMinutes, 0);

    // 今年度の経過日数
    const fiscalStartDate = new Date(`${fiscalYear}-04-01T00:00:00`);
    const diffTime = Math.max(0, now.getTime() - fiscalStartDate.getTime());
    const fiscalDaysPassed = Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

    // 累計
    const cumulativeTotal = userRecords.reduce((sum, r) => sum + r.durationMinutes, 0);
    // 累計のユニーク日付数または初日からの日数
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
    // もし今日記録があれば今日から、なければ昨日からチェック（今日まだ記録していない場合も昨日の連続を維持）
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

    // 科目別内訳（累計または今月）
    const subjectMap = new Map<string, number>();
    userRecords.forEach((r) => {
      subjectMap.set(r.subjectId, (subjectMap.get(r.subjectId) || 0) + r.durationMinutes);
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
}
