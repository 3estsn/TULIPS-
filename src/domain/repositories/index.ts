/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ComprehensiveStatistics,
  Material,
  RegularTestTask,
  StudyRecord,
  Subject,
  User,
  UserRole,
} from '../models/index.ts';

/**
 * 学習記録リポジトリのインターフェイス (DDD Repository Interface)
 * Node.js+Express+PostgreSQL / Vercel+Supabase / LocalStorage / Firebase の
 * いずれのバックエンド・データベース構成でも差し替え可能に設計。
 */
export interface IStudyRecordRepository {
  /** 指定ユーザーの全学習記録を取得 */
  getRecordsByUser(userId: string): Promise<StudyRecord[]>;

  /** 指定ユーザーの指定日付範囲の学習記録を取得 */
  getRecordsByDateRange(userId: string, startDate: string, endDate: string): Promise<StudyRecord[]>;

  /** 先生用: 全生徒の学習記録を取得 */
  getAllRecords(): Promise<StudyRecord[]>;

  /** 新しい学習記録を保存 */
  addRecord(record: Omit<StudyRecord, 'id' | 'createdAt'>): Promise<StudyRecord>;

  /** 学習記録を削除 */
  deleteRecord(id: string): Promise<boolean>;

  /** ユーザーの統計情報を算出（ホームおよび統計画面で使用） */
  calculateStatistics(userId: string, targetDate?: string): Promise<ComprehensiveStatistics>;
}

/**
 * 定期テスト課題リポジトリのインターフェイス (DDD Repository Interface)
 * 先生が打ち込んだ定期テスト課題範囲を保存・取得・更新・削除する。
 */
export interface ITaskRepository {
  /** 課題一覧を取得（学年・クラスで絞り込み可能） */
  getTasks(filter?: { grade?: number; classRoom?: string }): Promise<RegularTestTask[]>;

  /** 指定IDの課題を取得 */
  getTaskById(id: string): Promise<RegularTestTask | null>;

  /** 先生が新しい定期テスト課題を作成 */
  addTask(task: Omit<RegularTestTask, 'id' | 'createdAt'>): Promise<RegularTestTask>;

  /** 定期テスト課題を更新 */
  updateTask(id: string, updates: Partial<Omit<RegularTestTask, 'id' | 'createdAt'>>): Promise<RegularTestTask>;

  /** 定期テスト課題を削除 */
  deleteTask(id: string): Promise<boolean>;
}

/**
 * 教材・科目リポジトリのインターフェイス (DDD Repository Interface)
 */
export interface IMaterialRepository {
  /** 全科目リストを取得 */
  getSubjects(): Promise<Subject[]>;

  /** 教材一覧を取得（科目別フィルタ可） */
  getMaterials(subjectId?: string): Promise<Material[]>;

  /** 生徒が新しい教材を独自に追加 */
  addMaterial(material: Omit<Material, 'id'>): Promise<Material>;
}

/**
 * 認証・ユーザー管理リポジトリのインターフェイス (DDD Repository Interface)
 * Firebase Auth / Supabase Auth / LocalAuth の統一抽象化。
 */
export interface IAuthRepository {
  /** 現在ログイン中のユーザー情報を取得 */
  getCurrentUser(): Promise<User | null>;

  /** Google アカウントでログイン (Firebase Auth プロバイダ等と連携) */
  loginWithGoogle(intendedRole?: UserRole): Promise<User>;

  /** ログアウト */
  logout(): Promise<void>;

  /** 生徒と先生のロールを切り替える */
  switchRole(role: UserRole): Promise<User>;

  /** プロフィール（氏名、学年、クラス、出席番号など）の更新 */
  updateProfile(updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User>;

  /** 先生用: 生徒一覧の取得 */
  getStudentsList(): Promise<User[]>;
}
