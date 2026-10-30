/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, UserRole } from '../../domain/models/index.ts';
import { IAuthRepository } from '../../domain/repositories/index.ts';
import { INITIAL_STUDENTS, INITIAL_TEACHER, INITIAL_USER } from '../seedData.ts';

const USER_STORAGE_KEY = 'tulips_current_user';

export class FirebaseAuthRepository implements IAuthRepository {
  private currentUser: User | null = null;

  constructor() {
    this.init();
  }

  private init() {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.currentUser = {
            ...INITIAL_USER,
            ...parsed,
            weeklyGoalMinutes: typeof parsed.weeklyGoalMinutes === 'number' ? parsed.weeklyGoalMinutes : 900,
            focusSubjectId: typeof parsed.focusSubjectId === 'string' ? parsed.focusSubjectId : 'math',
          };
          return;
        }
      } catch (e) {
        console.error('Failed to parse current user from localStorage', e);
      }
    }
    // デフォルトは生徒アカウント
    this.currentUser = { ...INITIAL_USER };
    this.save();
  }

  private save() {
    try {
      if (this.currentUser) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to save current user to localStorage', e);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser ? { ...this.currentUser } : null;
  }

  async loginWithGoogle(intendedRole: UserRole = 'student'): Promise<User> {
    // Firebase GoogleAuthProvider 連携対応設計
    // 認証が成功した場合のユーザープロファイル更新
    if (intendedRole === 'teacher') {
      this.currentUser = {
        ...INITIAL_TEACHER,
        isGoogleAccount: true,
      };
    } else {
      this.currentUser = {
        ...INITIAL_USER,
        isGoogleAccount: true,
      };
    }
    this.save();
    return { ...this.currentUser };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
    this.save();
  }

  async switchRole(role: UserRole): Promise<User> {
    if (role === 'teacher') {
      this.currentUser = {
        id: 'teacher-001',
        name: this.currentUser?.name.includes('教諭') ? this.currentUser.name : `${this.currentUser?.name || '山田'} 教諭`,
        email: this.currentUser?.email || 'teacher@tulips-high.ed.jp',
        role: 'teacher',
        classRoom: '2学年団・数学科',
        isGoogleAccount: this.currentUser?.isGoogleAccount ?? true,
      };
    } else {
      this.currentUser = {
        id: 'student-001',
        name: this.currentUser?.name.replace(/ 教諭$/, '') || '佐藤 翼',
        email: this.currentUser?.email || 'sato.tsubasa@tulips-high.ed.jp',
        role: 'student',
        grade: 2,
        classRoom: '1組',
        studentNumber: 14,
        isGoogleAccount: this.currentUser?.isGoogleAccount ?? true,
      };
    }
    this.save();
    return { ...this.currentUser };
  }

  async updateProfile(updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User> {
    if (!this.currentUser) {
      this.currentUser = { ...INITIAL_USER };
    }
    this.currentUser = {
      ...this.currentUser,
      ...updates,
    };
    this.save();
    return { ...this.currentUser };
  }

  async getStudentsList(): Promise<User[]> {
    return [...INITIAL_STUDENTS];
  }

  async getAllUsers(): Promise<User[]> {
    const current = this.currentUser || { ...INITIAL_USER };
    return [current, ...INITIAL_STUDENTS];
  }

  async updateAnyUser(userId: string, updates: Partial<User>): Promise<User> {
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = { ...this.currentUser, ...updates } as User;
      this.save();
      return { ...this.currentUser };
    }
    const user = INITIAL_STUDENTS.find((u) => u.id === userId);
    if (user) {
      Object.assign(user, updates);
      return { ...user };
    }
    const base = this.currentUser || { ...INITIAL_USER };
    return { ...base, ...updates, id: userId, name: updates.name || base.name } as User;
  }

  async deleteUser(_userId: string): Promise<boolean> {
    return true;
  }
}
