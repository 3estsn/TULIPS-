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
  weeklyGoalMinutes?: number; // 1週間の目標学習時間（分）
  focusSubjectId?: string; // 重視する科目ID
}

export type SubjectCategory = 'japanese' | 'math' | 'english' | 'science' | 'social' | 'info' | 'other';

export interface Subject {
  id: string;
  name: string;
  category: SubjectCategory;
  color: string;
}

export type MaterialItemType = 'numbered' | 'page';

export interface MaterialUnitItem {
  id: string;
  type: MaterialItemType; // 連番型 (例題1〜45等) or ページ型 (p.10〜25)
  label: string;          // 例: "例題 1", "問 3", "p.42", "Step 1"
  itemNumber?: number;    // ソート・連番用
  page?: number;          // 該当ページ
}

export interface MaterialSection {
  id: string;
  title: string;          // 例: "第1節 2次方程式とその解"
  items: MaterialUnitItem[];
}

export interface MaterialChapter {
  id: string;
  chapterNumber?: number;
  title: string;          // 例: "第1章 数と式"
  pageStart?: number;
  pageEnd?: number;
  sections: MaterialSection[];
}

export interface MaterialStructure {
  itemTypeDefault?: MaterialItemType; // デフォルト項目種別
  prefixDefault?: string;             // デフォルト接頭辞 (例: "例題", "問", "Step")
  suffixDefault?: string;             // デフォルト接尾辞 (例: "番", "")
  chapters: MaterialChapter[];
}

export interface Material {
  id: string;
  subjectId: string;
  name: string;
  isDefault?: boolean;
  structure?: MaterialStructure;
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
  materialIds?: string[]; // 関連する教材ID
}

/**
 * 生徒が教材構造から作成した学習タスク項目
 */
export interface StudentTaskItem {
  id: string;
  materialItemId?: string; // 教材マスタの項目ID
  label: string;           // 例: "例題 12", "p.45"
  chapterTitle?: string;
  sectionTitle?: string;
  page?: number;
  isCompleted: boolean;
  completedAt?: string;    // 完了日時 ISO
}

/**
 * 生徒が設定する学習タスク（定期テストや日々の課題対策）
 */
export interface StudentTask {
  id: string;
  userId: string;
  title: string;             // 例: "2学期期末考査 青チャート対策"
  subjectId: string;
  materialId: string;
  materialName: string;
  regularTestTaskId?: string; // 先生の定期テスト課題との紐付け
  deadline: string;          // YYYY-MM-DD
  bufferDays: number;        // 予備日数 (デフォルト 1〜2日)
  items: StudentTaskItem[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 1日の推奨ノルマ計算結果
 */
export interface TaskPaceInfo {
  taskId: string;
  taskTitle: string;
  totalItems: number;
  completedItems: number;
  remainingItems: number;
  daysRemaining: number;      // 締切までの実日数 (今日含む)
  bufferDays: number;         // 予備日数
  effectiveStudyDays: number; // 予備日を除いた学習可能日数 (最低1日)
  dailyQuota: number;         // 本日こなすべき推奨個数 (Math.ceil(remainingItems / effectiveStudyDays))
  isCompleted: boolean;       // 全問完了したか
  isInBufferPeriod: boolean;  // 予備日期間に突入しているか (残り日数 <= bufferDays かつ未完了あり)
  isOverdue: boolean;         // 期日超過
  todayItems: StudentTaskItem[]; // 今日やるべき推奨未完了アイテムリスト
}

/**
 * 期日と予備日を考慮した日割りペース計算
 */
export function calculateTaskPace(task: StudentTask, referenceDate: string = new Date().toISOString().split('T')[0]): TaskPaceInfo {
  const totalItems = task.items.length;
  const completedItems = task.items.filter((i) => i.isCompleted).length;
  const remainingItems = totalItems - completedItems;
  const isCompleted = remainingItems === 0;

  // 日数計算
  const refDateObj = new Date(referenceDate + 'T00:00:00');
  const deadlineObj = new Date(task.deadline + 'T00:00:00');
  const diffTime = deadlineObj.getTime() - refDateObj.getTime();
  const daysRemaining = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // 当日を含めるため +1

  const isOverdue = daysRemaining < 1 && !isCompleted;
  const bufferDays = Math.max(0, task.bufferDays || 0);

  // 実質学習可能日数（予備日を差し引く、ただし最低1日）
  let effectiveStudyDays: number;
  let isInBufferPeriod = false;

  if (daysRemaining <= 0) {
    effectiveStudyDays = 1;
  } else if (daysRemaining <= bufferDays) {
    // すでに予備日期間に入っている
    isInBufferPeriod = true;
    effectiveStudyDays = Math.max(1, daysRemaining);
  } else {
    effectiveStudyDays = Math.max(1, daysRemaining - bufferDays);
  }

  // 1日のノルマ計算
  const dailyQuota = isCompleted ? 0 : Math.ceil(remainingItems / effectiveStudyDays);

  // 本日推奨の未完了アイテム（未完了アイテムの先頭からdailyQuota個）
  const uncompletedItems = task.items.filter((i) => !i.isCompleted);
  const todayItems = uncompletedItems.slice(0, dailyQuota);

  return {
    taskId: task.id,
    taskTitle: task.title,
    totalItems,
    completedItems,
    remainingItems,
    daysRemaining,
    bufferDays,
    effectiveStudyDays,
    dailyQuota,
    isCompleted,
    isInBufferPeriod,
    isOverdue,
    todayItems,
  };
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
    dailyBreakdown: {
      day: string;
      date: string;
      minutes: number;
      subjectsBreakdown: { subjectId: string; subjectName: string; color: string; minutes: number }[];
    }[]; // 月〜日
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
