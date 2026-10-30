/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ComprehensiveStatistics,
  Material,
  RegularTestTask,
  StudentTask,
  StudyRecord,
  Subject,
  User,
  UserRole,
} from '../../domain/models/index.ts';
import {
  IAuthRepository,
  IMaterialRepository,
  IStudentTaskRepository,
  IStudyRecordRepository,
  ITaskRepository,
} from '../../domain/repositories/index.ts';
import { FirebaseAuthRepository } from './FirebaseAuthRepository.ts';
import { LocalStorageMaterialRepository } from './LocalStorageMaterialRepository.ts';
import { LocalStorageStudentTaskRepository } from './LocalStorageStudentTaskRepository.ts';
import { LocalStorageStudyRecordRepository } from './LocalStorageStudyRecordRepository.ts';
import { LocalStorageTaskRepository } from './LocalStorageTaskRepository.ts';

// ConoHa サーバー API のエンドポイント解決
export const getApiBaseUrl = (): string => {
  // Vite 環境変数 VITE_API_BASE_URL が定義されていれば最優先
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '');
  }
  // 相対パス /api（ConoHa サーバーで同一オリジン配信または Nginx リバースプロキシ時）
  return '/api';
};

const API_BASE = getApiBaseUrl();

/**
 * ConoHa サーバー連携用 学習記録リポジトリ
 * ConoHa 上の Node.js/Express バックエンドと通信。
 * オフライン時や開発環境ではローカルストレージへフォールバック。
 */
export class ConoHaStudyRecordRepository implements IStudyRecordRepository {
  private fallback = new LocalStorageStudyRecordRepository();

  async getRecordsByUser(userId: string): Promise<StudyRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/records?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // サーバー未接続時はローカルストレージへフォールバック
    }
    return this.fallback.getRecordsByUser(userId);
  }

  async getRecordsByDateRange(userId: string, startDate: string, endDate: string): Promise<StudyRecord[]> {
    try {
      const res = await fetch(
        `${API_BASE}/records?userId=${encodeURIComponent(userId)}&startDate=${startDate}&endDate=${endDate}`
      );
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getRecordsByDateRange(userId, startDate, endDate);
  }

  async getAllRecords(): Promise<StudyRecord[]> {
    try {
      const res = await fetch(`${API_BASE}/records`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getAllRecords();
  }

  async addRecord(record: Omit<StudyRecord, 'id' | 'createdAt'>): Promise<StudyRecord> {
    try {
      const res = await fetch(`${API_BASE}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (res.ok) {
        const created = await res.json();
        // ローカル側にもキャッシュ同期
        try {
          await this.fallback.addRecord(record);
        } catch {}
        return created;
      }
    } catch {}
    return this.fallback.addRecord(record);
  }

  async deleteRecord(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/records/${id}`, { method: 'DELETE' });
      if (res.ok) {
        try {
          await this.fallback.deleteRecord(id);
        } catch {}
        return true;
      }
    } catch {}
    return this.fallback.deleteRecord(id);
  }

  async calculateStatistics(userId: string, targetDate?: string): Promise<ComprehensiveStatistics> {
    // 統計計算ロジック（レコードを取得して算出）
    return this.fallback.calculateStatistics(userId, targetDate);
  }
}

/**
 * ConoHa サーバー連携用 定期テスト課題リポジトリ
 */
export class ConoHaTaskRepository implements ITaskRepository {
  private fallback = new LocalStorageTaskRepository();

  async getTasks(filter?: { grade?: number; classRoom?: string }): Promise<RegularTestTask[]> {
    try {
      const params = new URLSearchParams();
      if (filter?.grade !== undefined) params.append('grade', String(filter.grade));
      if (filter?.classRoom) params.append('classRoom', filter.classRoom);
      const res = await fetch(`${API_BASE}/tasks?${params.toString()}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getTasks(filter);
  }

  async getTaskById(id: string): Promise<RegularTestTask | null> {
    try {
      const tasks = await this.getTasks();
      return tasks.find((t) => t.id === id) || null;
    } catch {}
    return this.fallback.getTaskById(id);
  }

  async addTask(task: Omit<RegularTestTask, 'id' | 'createdAt'>): Promise<RegularTestTask> {
    try {
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const created = await res.json();
        try {
          await this.fallback.addTask(task);
        } catch {}
        return created;
      }
    } catch {}
    return this.fallback.addTask(task);
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<RegularTestTask, 'id' | 'createdAt'>>
  ): Promise<RegularTestTask> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          await this.fallback.updateTask(id, updates);
        } catch {}
        return updated;
      }
    } catch {}
    return this.fallback.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        try {
          await this.fallback.deleteTask(id);
        } catch {}
        return true;
      }
    } catch {}
    return this.fallback.deleteTask(id);
  }
}

/**
 * ConoHa サーバー連携用 生徒学習タスクリポジトリ
 */
export class ConoHaStudentTaskRepository implements IStudentTaskRepository {
  private fallback = new LocalStorageStudentTaskRepository();

  async getTasksByUser(userId: string): Promise<StudentTask[]> {
    try {
      const res = await fetch(`${API_BASE}/student-tasks?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getTasksByUser(userId);
  }

  async getTaskById(id: string): Promise<StudentTask | null> {
    try {
      const res = await fetch(`${API_BASE}/student-tasks`);
      if (res.ok) {
        const tasks: StudentTask[] = await res.json();
        return tasks.find((t) => t.id === id) || null;
      }
    } catch {}
    return this.fallback.getTaskById(id);
  }

  async addTask(task: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentTask> {
    try {
      const res = await fetch(`${API_BASE}/student-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      });
      if (res.ok) {
        const created = await res.json();
        try {
          await this.fallback.addTask(task);
        } catch {}
        return created;
      }
    } catch {}
    return this.fallback.addTask(task);
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<StudentTask, 'id' | 'createdAt'>>
  ): Promise<StudentTask> {
    try {
      const res = await fetch(`${API_BASE}/student-tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          await this.fallback.updateTask(id, updates);
        } catch {}
        return updated;
      }
    } catch {}
    return this.fallback.updateTask(id, updates);
  }

  async toggleItemCompletion(
    taskId: string,
    itemId: string,
    isCompleted: boolean
  ): Promise<StudentTask> {
    try {
      const res = await fetch(`${API_BASE}/student-tasks/${taskId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted }),
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          await this.fallback.toggleItemCompletion(taskId, itemId, isCompleted);
        } catch {}
        return updated;
      }
    } catch {}
    return this.fallback.toggleItemCompletion(taskId, itemId, isCompleted);
  }

  async deleteTask(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/student-tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        try {
          await this.fallback.deleteTask(id);
        } catch {}
        return true;
      }
    } catch {}
    return this.fallback.deleteTask(id);
  }
}

/**
 * ConoHa サーバー連携用 教材構造マスターリポジトリ
 */
export class ConoHaMaterialRepository implements IMaterialRepository {
  private fallback = new LocalStorageMaterialRepository();

  async getSubjects(): Promise<Subject[]> {
    try {
      const res = await fetch(`${API_BASE}/subjects`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getSubjects();
  }

  async getMaterials(subjectId?: string): Promise<Material[]> {
    try {
      const url = subjectId
        ? `${API_BASE}/materials?subjectId=${encodeURIComponent(subjectId)}`
        : `${API_BASE}/materials`;
      const res = await fetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getMaterials(subjectId);
  }

  async addMaterial(material: Omit<Material, 'id'>): Promise<Material> {
    try {
      const res = await fetch(`${API_BASE}/materials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(material),
      });
      if (res.ok) {
        const created = await res.json();
        try {
          await this.fallback.addMaterial(material);
        } catch {}
        return created;
      }
    } catch {}
    return this.fallback.addMaterial(material);
  }

  async updateMaterial(id: string, updates: Partial<Omit<Material, 'id'>>): Promise<Material> {
    try {
      const res = await fetch(`${API_BASE}/materials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          await this.fallback.updateMaterial(id, updates);
        } catch {}
        return updated;
      }
    } catch {}
    return this.fallback.updateMaterial(id, updates);
  }

  async deleteMaterial(id: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/materials/${id}`, { method: 'DELETE' });
      if (res.ok) {
        try {
          await this.fallback.deleteMaterial(id);
        } catch {}
        return true;
      }
    } catch {}
    return this.fallback.deleteMaterial(id);
  }
}

/**
 * ConoHa サーバー連携用 認証・ユーザー管理リポジトリ
 */
export class ConoHaAuthRepository implements IAuthRepository {
  private fallback = new FirebaseAuthRepository();

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getCurrentUser();
  }

  async loginWithGoogle(intendedRole: UserRole = 'student'): Promise<User> {
    return this.fallback.loginWithGoogle(intendedRole);
  }

  async logout(): Promise<void> {
    return this.fallback.logout();
  }

  async switchRole(role: UserRole): Promise<User> {
    return this.fallback.switchRole(role);
  }

  async updateProfile(updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User> {
    try {
      const currentUser = await this.getCurrentUser();
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id, ...updates }),
      });
      if (res.ok) {
        const updated = await res.json();
        try {
          await this.fallback.updateProfile(updates);
        } catch {}
        return updated;
      }
    } catch {}
    return this.fallback.updateProfile(updates);
  }

  async getStudentsList(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/students`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getStudentsList();
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.getAllUsers();
  }

  async updateAnyUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {}
    return this.fallback.updateAnyUser(userId, updates);
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
      if (res.ok) {
        return true;
      }
    } catch {}
    return this.fallback.deleteUser(userId);
  }
}
