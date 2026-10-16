/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  grade?: number; // 1, 2, 3
  classRoom?: string; // "1組", "2組" など
  studentNumber?: number; // 出席番号
  avatarUrl?: string;
  isGoogleAccount?: boolean;
}

export type SubjectCategory = 'japanese' | 'math' | 'english' | 'science' | 'social' | 'info' | 'other';

export interface Subject {
  id: string;
  name: string;
  category: SubjectCategory;
  color: string;
}

export interface Material {
  id: string;
  subjectId: string;
  name: string;
  isDefault?: boolean;
}

export type StudyMethod = 'manual' | 'timer_countup' | 'timer_countdown';

export interface StudyRecord {
  id: string;
  userId: string;
  subjectId: string;
  materialId: string;
  materialName: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  notes?: string;
  method: StudyMethod;
  createdAt: string; // ISO 8601
}

/**
 * 定期テスト課題（先生が設定し生徒が確認する課題範囲）
 */
export interface RegularTestTask {
  id: string;
  teacherId: string;
  teacherName: string;
  title: string; // 例: "1学期期末考査", "2学期中間考査", "学年末考査"
  subjectId: string;
  targetGrade: number; // 1, 2, 3
  targetClass: string; // "全クラス", "1組", "2組" など
  scope: string; // 例: "教科書 p.45〜p.92、問題集『チャート式』例題40〜85、プリントNo.1〜8"
  deadline: string; // YYYY-MM-DD
  notes?: string; // 補足注意事項（例: "ワークは別冊解答を外してノートに途中式を記入して提出"）
  createdAt: string;
}

/**
 * 集計・統計情報モデル
 */
export interface StudyPeriodStats {
  totalMinutes: number;
  averageMinutesPerDay: number;
  activeDaysCount: number;
}

export interface ComprehensiveStatistics {
  streakDays: number;
  // ホームで表示する今週の情報
  thisWeek: {
    totalMinutes: number;
    averageMinutesPerDay: number;
    dailyBreakdown: { day: string; date: string; minutes: number }[]; // 月〜日
  };
  // 統計画面で表示する追加指標
  today: {
    totalMinutes: number;
    averageMinutesPerDay: number; // 今日1日の学習時間と同値
  };
  thisMonth: {
    totalMinutes: number;
    averageMinutesPerDay: number;
  };
  thisFiscalYear: {
    // 高校の年度（4月1日〜翌年3月31日）
    totalMinutes: number;
    averageMinutesPerDay: number;
  };
  cumulative: {
    // 累計
    totalMinutes: number;
    averageMinutesPerDay: number;
  };
  subjectBreakdown: {
    subjectId: string;
    subjectName: string;
    color: string;
    minutes: number;
    percentage: number;
  }[];
}
