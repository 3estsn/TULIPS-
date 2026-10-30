/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signOut,
} from 'firebase/auth';
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
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../firebase.ts';
import {
  INITIAL_MATERIALS,
  INITIAL_STUDENTS,
  INITIAL_STUDENT_TASKS,
  INITIAL_SUBJECTS,
  INITIAL_TASKS,
  INITIAL_TEACHER,
  INITIAL_USER,
} from '../seedData.ts';
import { LocalStorageStudyRecordRepository } from './LocalStorageStudyRecordRepository.ts';
import { calculateComprehensiveStatistics } from '../../utils/statisticsCalculator.ts';

/**
 * Firestore 学習記録リポジトリ
 */
export class FirestoreStudyRecordRepository implements IStudyRecordRepository {
  private fallback = new LocalStorageStudyRecordRepository();

  async getRecordsByUser(userId: string): Promise<StudyRecord[]> {
    const path = 'records';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snap = await getDocs(q);
      // Firestore接続成功時はFirestoreのデータを正とする（空配列の場合も含む）
      return snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as StudyRecord))
        .sort((a, b) => (a.date > b.date ? -1 : 1));
    } catch (err) {
      console.warn('Firestore getRecordsByUser error, falling back:', err);
    }
    return this.fallback.getRecordsByUser(userId);
  }

  async getRecordsByDateRange(userId: string, startDate: string, endDate: string): Promise<StudyRecord[]> {
    const path = 'records';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snap = await getDocs(q);
      return snap.docs
        .map((d) => ({ ...d.data(), id: d.id } as StudyRecord))
        .filter((r) => r.date >= startDate && r.date <= endDate)
        .sort((a, b) => (a.date > b.date ? -1 : 1));
    } catch (err) {
      console.warn('Firestore getRecordsByDateRange error, falling back:', err);
    }
    return this.fallback.getRecordsByDateRange(userId, startDate, endDate);
  }

  async getAllRecords(): Promise<StudyRecord[]> {
    const path = 'records';
    try {
      const snap = await getDocs(collection(db, path));
      return snap.docs.map((d) => ({ ...d.data(), id: d.id } as StudyRecord));
    } catch (err) {
      console.warn('Firestore getAllRecords error, falling back:', err);
    }
    return this.fallback.getAllRecords();
  }

  async addRecord(record: Omit<StudyRecord, 'id' | 'createdAt'>): Promise<StudyRecord> {
    const path = 'records';
    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newRecord: StudyRecord = {
      ...record,
      id,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, path, id), newRecord);
      try {
        await this.fallback.addRecord(record);
      } catch {}
      return newRecord;
    } catch (err) {
      console.warn('Failed to save record to Firestore, using fallback:', err);
      return this.fallback.addRecord(record);
    }
  }

  async deleteRecord(id: string): Promise<boolean> {
    const path = 'records';
    try {
      await deleteDoc(doc(db, path, id));
      try {
        await this.fallback.deleteRecord(id);
      } catch {}
      return true;
    } catch (err) {
      console.warn('Failed to delete record from Firestore:', err);
      return this.fallback.deleteRecord(id);
    }
  }

  async calculateStatistics(userId: string, targetDate?: string): Promise<ComprehensiveStatistics> {
    try {
      const records = await this.getRecordsByUser(userId);
      return calculateComprehensiveStatistics(records, targetDate);
    } catch (err) {
      console.warn('Firestore calculateStatistics error, falling back to local:', err);
      return this.fallback.calculateStatistics(userId, targetDate);
    }
  }
}

/**
 * Firestore 定期テスト課題リポジトリ (先生配信)
 */
export class FirestoreTaskRepository implements ITaskRepository {
  async getTasks(filter?: { grade?: number; classRoom?: string }): Promise<RegularTestTask[]> {
    const path = 'tasks';
    try {
      const snap = await getDocs(collection(db, path));
      if (!snap.empty) {
        let tasks = snap.docs.map((d) => ({ ...d.data(), id: d.id } as RegularTestTask));
        if (filter?.grade !== undefined) {
          tasks = tasks.filter((t) => t.targetGrade === filter.grade);
        }
        if (filter?.classRoom && filter.classRoom !== '全クラス') {
          tasks = tasks.filter((t) => t.targetClass === '全クラス' || t.targetClass === filter.classRoom);
        }
        return tasks;
      } else {
        // Firestore が空の場合は初期シードを登録
        for (const task of INITIAL_TASKS) {
          await setDoc(doc(db, path, task.id), task).catch(() => {});
        }
        return [...INITIAL_TASKS];
      }
    } catch (err) {
      console.warn('Firestore getTasks error, using seed fallback:', err);
      return [...INITIAL_TASKS];
    }
  }

  async getTaskById(id: string): Promise<RegularTestTask | null> {
    const path = 'tasks';
    try {
      const snap = await getDoc(doc(db, path, id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as RegularTestTask;
      }
    } catch {}
    return INITIAL_TASKS.find((t) => t.id === id) || null;
  }

  async addTask(task: Omit<RegularTestTask, 'id' | 'createdAt'>): Promise<RegularTestTask> {
    const path = 'tasks';
    const id = `rtt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTask: RegularTestTask = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, path, id), newTask);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    return newTask;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<RegularTestTask, 'id' | 'createdAt'>>
  ): Promise<RegularTestTask> {
    const path = 'tasks';
    try {
      await updateDoc(doc(db, path, id), updates);
      const updated = await this.getTaskById(id);
      return updated!;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
    }
  }

  async deleteTask(id: string): Promise<boolean> {
    const path = 'tasks';
    try {
      await deleteDoc(doc(db, path, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
    }
  }
}

/**
 * Firestore 生徒学習タスクリポジトリ
 */
export class FirestoreStudentTaskRepository implements IStudentTaskRepository {
  async getTasksByUser(userId: string): Promise<StudentTask[]> {
    const path = 'studentTasks';
    try {
      const q = query(collection(db, path), where('userId', '==', userId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as StudentTask));
      } else {
        // 初回シード
        for (const st of INITIAL_STUDENT_TASKS) {
          if (st.userId === userId) {
            await setDoc(doc(db, path, st.id), st).catch(() => {});
          }
        }
        return INITIAL_STUDENT_TASKS.filter((st) => st.userId === userId);
      }
    } catch (err) {
      console.warn('Firestore getTasksByUser error, using seed fallback:', err);
      return INITIAL_STUDENT_TASKS.filter((st) => st.userId === userId);
    }
  }

  async getTaskById(id: string): Promise<StudentTask | null> {
    const path = 'studentTasks';
    try {
      const snap = await getDoc(doc(db, path, id));
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as StudentTask;
      }
    } catch {}
    return INITIAL_STUDENT_TASKS.find((t) => t.id === id) || null;
  }

  async addTask(task: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentTask> {
    const path = 'studentTasks';
    const id = `stask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTask: StudentTask = {
      ...task,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, path, id), newTask);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    return newTask;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<StudentTask, 'id' | 'createdAt'>>
  ): Promise<StudentTask> {
    const path = 'studentTasks';
    try {
      const updatedPayload = { ...updates, updatedAt: new Date().toISOString() };
      await updateDoc(doc(db, path, id), updatedPayload);
      const updated = await this.getTaskById(id);
      return updated!;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
    }
  }

  async toggleItemCompletion(
    taskId: string,
    itemId: string,
    isCompleted: boolean
  ): Promise<StudentTask> {
    const task = await this.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    const updatedItems = task.items.map((it) =>
      it.id === itemId
        ? {
            ...it,
            isCompleted,
            completedAt: isCompleted ? new Date().toISOString() : undefined,
          }
        : it
    );

    return this.updateTask(taskId, { items: updatedItems });
  }

  async deleteTask(id: string): Promise<boolean> {
    const path = 'studentTasks';
    try {
      await deleteDoc(doc(db, path, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
    }
  }
}

/**
 * Firestore 教材構造マスターリポジトリ
 */
export class FirestoreMaterialRepository implements IMaterialRepository {
  async getSubjects(): Promise<Subject[]> {
    const path = 'subjects';
    try {
      const snap = await getDocs(collection(db, path));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as Subject));
      }
    } catch {}
    return [...INITIAL_SUBJECTS];
  }

  async getMaterials(subjectId?: string): Promise<Material[]> {
    const path = 'materials';
    try {
      const snap = await getDocs(collection(db, path));
      if (!snap.empty) {
        let mats = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Material));
        if (subjectId) {
          mats = mats.filter((m) => m.subjectId === subjectId);
        }
        return mats;
      } else {
        // 初回シード登録
        for (const mat of INITIAL_MATERIALS) {
          await setDoc(doc(db, path, mat.id), mat).catch(() => {});
        }
        return subjectId
          ? INITIAL_MATERIALS.filter((m) => m.subjectId === subjectId)
          : [...INITIAL_MATERIALS];
      }
    } catch (err) {
      console.warn('Firestore getMaterials error, using seed fallback:', err);
      return subjectId
        ? INITIAL_MATERIALS.filter((m) => m.subjectId === subjectId)
        : [...INITIAL_MATERIALS];
    }
  }

  async addMaterial(material: Omit<Material, 'id'>): Promise<Material> {
    const path = 'materials';
    const id = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newMaterial: Material = { ...material, id };
    try {
      await setDoc(doc(db, path, id), newMaterial);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
    return newMaterial;
  }

  async updateMaterial(id: string, updates: Partial<Omit<Material, 'id'>>): Promise<Material> {
    const path = 'materials';
    try {
      await updateDoc(doc(db, path, id), updates);
      const mats = await this.getMaterials();
      return mats.find((m) => m.id === id)!;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${path}/${id}`);
    }
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const path = 'materials';
    try {
      await deleteDoc(doc(db, path, id));
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${path}/${id}`);
    }
  }
}

/**
 * Firestore & Firebase Auth 認証・ユーザー管理リポジトリ
 */
export class FirestoreAuthRepository implements IAuthRepository {
  private localUser: User = { ...INITIAL_USER };

  async getCurrentUser(): Promise<User | null> {
    // Firebase Auth のユーザーがいれば Firestore から取得
    const fbUser = auth.currentUser;
    if (fbUser) {
      try {
        const snap = await getDoc(doc(db, 'users', fbUser.uid));
        if (snap.exists()) {
          return { ...snap.data(), id: snap.id } as User;
        }
      } catch {}
      return {
        id: fbUser.uid,
        name: fbUser.displayName || 'ログインユーザー',
        email: fbUser.email || '',
        role: 'student',
        grade: 2,
        classRoom: '1組',
        studentNumber: 14,
        isGoogleAccount: true,
      };
    }
    return { ...this.localUser };
  }

  async loginWithGoogle(intendedRole: UserRole = 'student'): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const userRef = doc(db, 'users', fbUser.uid);
      const snap = await getDoc(userRef);

      let appUser: User;
      if (snap.exists()) {
        appUser = { ...snap.data(), id: snap.id } as User;
      } else {
        appUser = {
          id: fbUser.uid,
          name: fbUser.displayName || (intendedRole === 'teacher' ? '教員' : '生徒'),
          email: fbUser.email || '',
          role: intendedRole,
          grade: intendedRole === 'student' ? 2 : undefined,
          classRoom: intendedRole === 'student' ? '1組' : '2年学年主任・数学科',
          studentNumber: intendedRole === 'student' ? 14 : undefined,
          isGoogleAccount: true,
          weeklyGoalMinutes: 900,
          focusSubjectId: 'math',
        };
        await setDoc(userRef, appUser);
      }
      this.localUser = appUser;
      return appUser;
    } catch (error) {
      console.warn('Google sign-in popup skipped or cancelled, using demo account switch:', error);
      // ポップアップキャンセル時は既存のロール設定
      if (intendedRole === 'teacher') {
        this.localUser = { ...INITIAL_TEACHER };
      } else {
        this.localUser = { ...INITIAL_USER };
      }
      return { ...this.localUser };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch {}
    this.localUser = { ...INITIAL_USER };
  }

  async switchRole(role: UserRole): Promise<User> {
    if (role === 'teacher') {
      this.localUser = {
        ...INITIAL_TEACHER,
        id: 'teacher-001',
      };
    } else {
      this.localUser = {
        ...INITIAL_USER,
        id: 'student-001',
      };
    }
    return { ...this.localUser };
  }

  async updateProfile(updates: Partial<Omit<User, 'id' | 'email'>>): Promise<User> {
    this.localUser = {
      ...this.localUser,
      ...updates,
    };
    const fbUser = auth.currentUser;
    if (fbUser) {
      try {
        await updateDoc(doc(db, 'users', fbUser.uid), updates);
      } catch {}
    }
    return { ...this.localUser };
  }

  async getStudentsList(): Promise<User[]> {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as User));
      }
    } catch {}
    return [...INITIAL_STUDENTS];
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const snap = await getDocs(collection(db, 'users'));
      if (!snap.empty) {
        return snap.docs.map((d) => ({ ...d.data(), id: d.id } as User));
      }
    } catch {}
    return [this.localUser, ...INITIAL_STUDENTS];
  }

  async updateAnyUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return { ...snap.data(), id: snap.id } as User;
      }
    } catch {}

    if (this.localUser.id === userId) {
      this.localUser = { ...this.localUser, ...updates };
      return { ...this.localUser };
    }
    const student = INITIAL_STUDENTS.find((s) => s.id === userId);
    if (student) {
      Object.assign(student, updates);
      return { ...student };
    }
    return { ...this.localUser, ...updates, id: userId };
  }

  async deleteUser(userId: string): Promise<boolean> {
    try {
      await deleteDoc(doc(db, 'users', userId));
      return true;
    } catch {
      return true;
    }
  }
}

