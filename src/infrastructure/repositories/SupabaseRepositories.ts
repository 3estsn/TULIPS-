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
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../firebase.ts';
import { getSupabaseClient } from '../supabase.ts';
import {
  INITIAL_MATERIALS,
  INITIAL_STUDENTS,
  INITIAL_STUDENT_TASKS,
  INITIAL_SUBJECTS,
  INITIAL_TASKS,
  INITIAL_TEACHER,
  INITIAL_SYSTEM,
  INITIAL_USER,
} from '../seedData.ts';
import {
  ConoHaAuthRepository,
  ConoHaMaterialRepository,
  ConoHaStudentTaskRepository,
  ConoHaStudyRecordRepository,
  ConoHaTaskRepository,
} from './ApiRepositories.ts';
import { calculateComprehensiveStatistics } from '../../utils/statisticsCalculator.ts';

// --- 学習記録 (Study Records) ---
export class SupabaseStudyRecordRepository implements IStudyRecordRepository {
  private fallback = new ConoHaStudyRecordRepository();

  async getRecordsByUser(userId: string): Promise<StudyRecord[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getRecordsByUser(userId);

    try {
      const { data, error } = await client
        .from('study_records')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map(toStudyRecord);
      }
    } catch (err) {
      console.warn('[Supabase] getRecordsByUser error, falling back:', err);
    }
    return this.fallback.getRecordsByUser(userId);
  }

  async getRecordsByDateRange(userId: string, startDate: string, endDate: string): Promise<StudyRecord[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getRecordsByDateRange(userId, startDate, endDate);

    try {
      const { data, error } = await client
        .from('study_records')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map(toStudyRecord);
      }
    } catch (err) {
      console.warn('[Supabase] getRecordsByDateRange error, falling back:', err);
    }
    return this.fallback.getRecordsByDateRange(userId, startDate, endDate);
  }

  async getAllRecords(): Promise<StudyRecord[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getAllRecords();

    try {
      const { data, error } = await client
        .from('study_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        return data.map(toStudyRecord);
      }
    } catch (err) {
      console.warn('[Supabase] getAllRecords error, falling back:', err);
    }
    return this.fallback.getAllRecords();
  }

  async addRecord(record: Omit<StudyRecord, 'id' | 'createdAt'>): Promise<StudyRecord> {
    const id = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const created: StudyRecord = { ...record, id, createdAt };

    const client = getSupabaseClient();
    if (client) {
      try {
        const { error } = await client.from('study_records').insert({
          id,
          user_id: record.userId,
          subject_id: record.subjectId,
          material_id: record.materialId,
          material_name: record.materialName,
          date: record.date,
          duration_minutes: record.durationMinutes,
          notes: record.notes || null,
          method: record.method || 'manual',
          created_at: createdAt,
        });
        if (error) {
          console.warn('[Supabase] Failed to insert record:', error);
        }
      } catch (err) {
        console.warn('[Supabase] insert record exception:', err);
      }
    }

    try {
      await this.fallback.addRecord(record);
    } catch {}
    return created;
  }

  async deleteRecord(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('study_records').delete().eq('id', id);
      } catch (err) {
        console.warn('[Supabase] delete record error:', err);
      }
    }
    return this.fallback.deleteRecord(id);
  }

  async calculateStatistics(userId: string, targetDate?: string): Promise<ComprehensiveStatistics> {
    const records = await this.getRecordsByUser(userId);
    return calculateComprehensiveStatistics(records, targetDate);
  }
}

// --- 定期テスト課題 (Regular Test Tasks) ---
export class SupabaseTaskRepository implements ITaskRepository {
  private fallback = new ConoHaTaskRepository();

  async getTasks(filter?: { grade?: number; classRoom?: string }): Promise<RegularTestTask[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getTasks(filter);

    try {
      let q = client.from('regular_test_tasks').select('*').order('created_at', { ascending: false });
      if (filter?.grade !== undefined) {
        q = q.eq('target_grade', filter.grade);
      }
      if (filter?.classRoom && filter.classRoom !== '全クラス') {
        q = q.or(`target_class.eq.全クラス,target_class.eq.${filter.classRoom}`);
      }

      const { data, error } = await q;
      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(toRegularTestTask);
      } else {
        // テーブルが空なら初期シードを登録
        for (const t of INITIAL_TASKS) {
          try {
            await client.from('regular_test_tasks').upsert({
              id: t.id,
              teacher_id: t.teacherId,
              teacher_name: t.teacherName,
              title: t.title,
              subject_id: t.subjectId,
              target_grade: t.targetGrade,
              target_class: t.targetClass,
              scope: t.scope,
              deadline: t.deadline,
              notes: t.notes || null,
              material_ids: t.materialIds || [],
              created_at: t.createdAt,
            });
          } catch {}
        }
        return [...INITIAL_TASKS];
      }
    } catch (err) {
      console.warn('[Supabase] getTasks error, using fallback:', err);
    }
    return this.fallback.getTasks(filter);
  }

  async getTaskById(id: string): Promise<RegularTestTask | null> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getTaskById(id);

    try {
      const { data, error } = await client
        .from('regular_test_tasks')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return toRegularTestTask(data);
    } catch {}
    return this.fallback.getTaskById(id);
  }

  async addTask(task: Omit<RegularTestTask, 'id' | 'createdAt'>): Promise<RegularTestTask> {
    const id = `rtt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const createdAt = new Date().toISOString();
    const created: RegularTestTask = { ...task, id, createdAt };

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('regular_test_tasks').insert({
          id,
          teacher_id: task.teacherId,
          teacher_name: task.teacherName,
          title: task.title,
          subject_id: task.subjectId,
          target_grade: task.targetGrade,
          target_class: task.targetClass,
          scope: task.scope,
          deadline: task.deadline,
          notes: task.notes || null,
          material_ids: task.materialIds || [],
          created_at: createdAt,
        });
      } catch (err) {
        console.warn('[Supabase] addTask error:', err);
      }
    }

    try {
      await this.fallback.addTask(task);
    } catch {}
    return created;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<RegularTestTask, 'id' | 'createdAt'>>
  ): Promise<RegularTestTask> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const payload: any = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
        if (updates.targetGrade !== undefined) payload.target_grade = updates.targetGrade;
        if (updates.targetClass !== undefined) payload.target_class = updates.targetClass;
        if (updates.scope !== undefined) payload.scope = updates.scope;
        if (updates.deadline !== undefined) payload.deadline = updates.deadline;
        if (updates.notes !== undefined) payload.notes = updates.notes;
        if (updates.materialIds !== undefined) payload.material_ids = updates.materialIds;

        await client.from('regular_test_tasks').update(payload).eq('id', id);
      } catch (err) {
        console.warn('[Supabase] updateTask error:', err);
      }
    }
    return this.fallback.updateTask(id, updates);
  }

  async deleteTask(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('regular_test_tasks').delete().eq('id', id);
      } catch (err) {
        console.warn('[Supabase] deleteTask error:', err);
      }
    }
    return this.fallback.deleteTask(id);
  }
}

// --- 生徒学習タスク (Student Tasks) ---
export class SupabaseStudentTaskRepository implements IStudentTaskRepository {
  private fallback = new ConoHaStudentTaskRepository();

  async getTasksByUser(userId: string): Promise<StudentTask[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getTasksByUser(userId);

    try {
      const { data, error } = await client
        .from('student_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        return data.map(toStudentTask);
      } else {
        // 初回シード投入
        for (const st of INITIAL_STUDENT_TASKS) {
          if (st.userId === userId) {
            try {
              await client.from('student_tasks').upsert({
                id: st.id,
                user_id: st.userId,
                title: st.title,
                subject_id: st.subjectId,
                material_id: st.materialId,
                material_name: st.materialName,
                regular_test_task_id: st.regularTestTaskId || null,
                deadline: st.deadline,
                buffer_days: st.bufferDays,
                items: st.items,
                created_at: st.createdAt,
                updated_at: st.updatedAt,
              });
            } catch {}
          }
        }
        return INITIAL_STUDENT_TASKS.filter((st) => st.userId === userId);
      }
    } catch (err) {
      console.warn('[Supabase] getTasksByUser error, using fallback:', err);
    }
    return this.fallback.getTasksByUser(userId);
  }

  async getTaskById(id: string): Promise<StudentTask | null> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getTaskById(id);

    try {
      const { data, error } = await client
        .from('student_tasks')
        .select('*')
        .eq('id', id)
        .single();
      if (!error && data) return toStudentTask(data);
    } catch {}
    return this.fallback.getTaskById(id);
  }

  async addTask(task: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentTask> {
    const id = `stask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();
    const created: StudentTask = { ...task, id, createdAt: nowIso, updatedAt: nowIso };

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('student_tasks').insert({
          id,
          user_id: task.userId,
          title: task.title,
          subject_id: task.subjectId,
          material_id: task.materialId,
          material_name: task.materialName,
          regular_test_task_id: task.regularTestTaskId || null,
          deadline: task.deadline,
          buffer_days: task.bufferDays,
          items: task.items,
          created_at: nowIso,
          updated_at: nowIso,
        });
      } catch (err) {
        console.warn('[Supabase] addTask error:', err);
      }
    }

    try {
      await this.fallback.addTask(task);
    } catch {}
    return created;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<StudentTask, 'id' | 'createdAt'>>
  ): Promise<StudentTask> {
    const nowIso = new Date().toISOString();
    const client = getSupabaseClient();
    if (client) {
      try {
        const payload: any = { updated_at: nowIso };
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
        if (updates.materialId !== undefined) payload.material_id = updates.materialId;
        if (updates.materialName !== undefined) payload.material_name = updates.materialName;
        if (updates.deadline !== undefined) payload.deadline = updates.deadline;
        if (updates.bufferDays !== undefined) payload.buffer_days = updates.bufferDays;
        if (updates.items !== undefined) payload.items = updates.items;

        await client.from('student_tasks').update(payload).eq('id', id);
      } catch (err) {
        console.warn('[Supabase] updateTask error:', err);
      }
    }
    return this.fallback.updateTask(id, updates);
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
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('student_tasks').delete().eq('id', id);
      } catch (err) {
        console.warn('[Supabase] deleteTask error:', err);
      }
    }
    return this.fallback.deleteTask(id);
  }
}

// --- 教材マスター (Materials) ---
export class SupabaseMaterialRepository implements IMaterialRepository {
  private fallback = new ConoHaMaterialRepository();

  async getSubjects(): Promise<Subject[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getSubjects();

    try {
      const { data, error } = await client.from('subjects').select('*');
      if (!error && data && data.length > 0) {
        return data as Subject[];
      } else if (client) {
        // 初期シード投入
        for (const s of INITIAL_SUBJECTS) {
          try {
            await client.from('subjects').upsert(s);
          } catch {}
        }
        return [...INITIAL_SUBJECTS];
      }
    } catch {}
    return this.fallback.getSubjects();
  }

  async getMaterials(subjectId?: string): Promise<Material[]> {
    const client = getSupabaseClient();
    if (!client) return this.fallback.getMaterials(subjectId);

    try {
      let q = client.from('materials').select('*');
      if (subjectId) q = q.eq('subject_id', subjectId);

      const { data, error } = await q;
      if (!error && data && data.length > 0) {
        return data.map(toMaterial);
      } else if (client) {
        for (const m of INITIAL_MATERIALS) {
          try {
            await client.from('materials').upsert({
              id: m.id,
              subject_id: m.subjectId,
              name: m.name,
              is_default: m.isDefault ?? false,
              structure: m.structure || {},
            });
          } catch {}
        }
        return subjectId
          ? INITIAL_MATERIALS.filter((m) => m.subjectId === subjectId)
          : [...INITIAL_MATERIALS];
      }
    } catch (err) {
      console.warn('[Supabase] getMaterials error:', err);
    }
    return this.fallback.getMaterials(subjectId);
  }

  async addMaterial(material: Omit<Material, 'id'>): Promise<Material> {
    const id = `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const created: Material = { ...material, id };

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('materials').insert({
          id,
          subject_id: material.subjectId,
          name: material.name,
          is_default: material.isDefault ?? false,
          structure: material.structure || {},
        });
      } catch (err) {
        console.warn('[Supabase] addMaterial error:', err);
      }
    }

    try {
      await this.fallback.addMaterial(material);
    } catch {}
    return created;
  }

  async updateMaterial(id: string, updates: Partial<Omit<Material, 'id'>>): Promise<Material> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
        if (updates.isDefault !== undefined) payload.is_default = updates.isDefault;
        if (updates.structure !== undefined) payload.structure = updates.structure;

        await client.from('materials').update(payload).eq('id', id);
      } catch (err) {
        console.warn('[Supabase] updateMaterial error:', err);
      }
    }
    return this.fallback.updateMaterial(id, updates);
  }

  async deleteMaterial(id: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('materials').delete().eq('id', id);
      } catch (err) {
        console.warn('[Supabase] deleteMaterial error:', err);
      }
    }
    return this.fallback.deleteMaterial(id);
  }
}

// --- ユーザー & 認証 (Auth - Firebase Auth 連携 & Supabase/ConoHa同期) ---
export class SupabaseAuthRepository implements IAuthRepository {
  private localUser: User = { ...INITIAL_USER };
  private conohaAuth = new ConoHaAuthRepository();

  constructor() {
    if (typeof window !== 'undefined') {
      const isLoggedOut = localStorage.getItem('tulips_logged_out') === 'true';
      if (isLoggedOut) {
        this.localUser = null as any;
      } else {
        try {
          const raw = localStorage.getItem('tulips_current_user');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed === 'object') {
              this.localUser = { ...this.localUser, ...parsed };
            }
          }
        } catch {}
      }

      try {
        auth.onAuthStateChanged((fbUser) => {
          if (fbUser && localStorage.getItem('tulips_logged_out') !== 'true') {
            const oldId = this.localUser?.id;
            const isGoogleLinked = this.localUser?.isGoogleAccount && this.localUser.email === fbUser.email;
            if (!isGoogleLinked || this.localUser?.id !== fbUser.uid) {
              this.localUser = {
                ...(this.localUser || INITIAL_USER),
                id: fbUser.uid,
                name: this.localUser?.name && this.localUser.name !== '生徒' && this.localUser.name !== '担当教諭'
                  ? this.localUser.name
                  : (fbUser.displayName || (this.localUser?.role === 'teacher' ? '担当教諭' : '生徒')),
                email: fbUser.email || this.localUser?.email || '',
                isGoogleAccount: true,
              };
              try {
                localStorage.setItem('tulips_current_user', JSON.stringify(this.localUser));
                const storageKey = this.localUser.role === 'teacher' ? 'tulips_teacher_user' : 'tulips_student_user';
                localStorage.setItem(storageKey, JSON.stringify(this.localUser));
              } catch {}
              // ConoHa サーバーにも同期
              fetch('/api/users/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldId, ...this.localUser }),
              }).catch(() => {});
            }
          }
        });
      } catch (err) {
        console.warn('[Firebase Auth] State listener error:', err);
      }
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (typeof window !== 'undefined' && localStorage.getItem('tulips_logged_out') === 'true') {
      return null;
    }
    if (!this.localUser) return null;

    const currentRole = this.localUser.role;
    const currentId = this.localUser.id;

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data } = await client.from('users').select('*').eq('id', currentId).single();
        if (data) {
          const remoteUser = toUser(data);
          this.localUser = {
            ...this.localUser,
            ...remoteUser,
            role: currentRole, // ローカルのロール切替を絶対優先
          };
          return { ...this.localUser };
        }
      } catch {}
    }
    try {
      const serverUser = await this.conohaAuth.getCurrentUser();
      if (serverUser) {
        this.localUser = {
          ...this.localUser,
          ...serverUser,
          role: currentRole,
        };
      }
    } catch {}
    return { ...this.localUser };
  }

  async loginWithGoogle(intendedRole: UserRole = 'student'): Promise<User> {
    try {
      localStorage.removeItem('tulips_logged_out');
      const result = await signInWithPopup(auth, googleAuthProvider);
      const fbUser = result.user;
      const oldId = this.localUser?.id;
      const isTeacher = intendedRole === 'teacher';
      const isSystem = intendedRole === 'system';

      // サーバーまたはSupabaseからこのUIDの既存ユーザーデータがあるか探索
      let existingUser: User | null = null;
      const client = getSupabaseClient();
      if (client) {
        try {
          const { data } = await client.from('users').select('*').eq('id', fbUser.uid).single();
          if (data) {
            existingUser = toUser(data);
          }
        } catch {}
      }
      if (!existingUser) {
        try {
          const res = await fetch(`/api/auth/me?userId=${encodeURIComponent(fbUser.uid)}`);
          if (res.ok) {
            const u = await res.json();
            if (u && u.id === fbUser.uid) {
              existingUser = u;
            }
          }
        } catch {}
      }

      const updatedUser: User = existingUser ? {
        ...existingUser,
        role: intendedRole,
        isGoogleAccount: true,
        email: fbUser.email || existingUser.email,
        name: fbUser.displayName || existingUser.name,
      } : {
        ...(this.localUser || (isSystem ? INITIAL_SYSTEM : isTeacher ? INITIAL_TEACHER : INITIAL_USER)),
        id: fbUser.uid,
        name: fbUser.displayName || (isTeacher ? '担当教諭' : isSystem ? 'システム管理者' : '生徒'),
        email: fbUser.email || '',
        role: intendedRole,
        grade: (isTeacher || isSystem) ? undefined : (this.localUser?.grade || 2),
        classRoom: isTeacher
          ? (this.localUser?.classRoom && this.localUser.classRoom !== '1組' ? this.localUser.classRoom : '数学科・学年主任')
          : isSystem
          ? '情報システム統括'
          : (this.localUser?.classRoom || '1組'),
        studentNumber: (isTeacher || isSystem) ? undefined : (this.localUser?.studentNumber || 1),
        weeklyGoalMinutes: this.localUser?.weeklyGoalMinutes || 900,
        focusSubjectId: this.localUser?.focusSubjectId || 'math',
        isGoogleAccount: true,
      };

      this.localUser = updatedUser;
      try {
        localStorage.setItem('tulips_current_user', JSON.stringify(this.localUser));
        const storageKey = isTeacher ? 'tulips_teacher_user' : isSystem ? 'tulips_system_user' : 'tulips_student_user';
        localStorage.setItem(storageKey, JSON.stringify(this.localUser));
      } catch {}

      // ConoHa サーバー API に同期
      try {
        await fetch('/api/users/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oldId, ...updatedUser }),
        });
      } catch (err) {
        console.warn('[ConoHa API] users/sync error:', err);
      }

      if (client) {
        try {
          if (oldId && oldId !== updatedUser.id) {
            await client.from('study_records').update({ user_id: updatedUser.id }).eq('user_id', oldId);
            await client.from('student_tasks').update({ user_id: updatedUser.id }).eq('user_id', oldId);
            await client.from('users').delete().eq('id', oldId);
          }
          await client.from('users').upsert({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            grade: updatedUser.grade ?? null,
            class_room: updatedUser.classRoom ?? null,
            student_number: updatedUser.studentNumber ?? null,
            weekly_goal_minutes: updatedUser.weeklyGoalMinutes ?? 900,
            focus_subject_id: updatedUser.focusSubjectId ?? 'math',
          });
        } catch (dbErr) {
          console.warn('[Supabase] Failed to sync user to users table:', dbErr);
        }
      }

      return { ...this.localUser };
    } catch (error: any) {
      console.warn('[Firebase Auth] Google login error:', error);
      if (error?.code === 'auth/unauthorized-domain') {
        throw new Error(
          `Firebase未承認ドメイン: Firebase Console (Authentication > Settings > Authorized domains) に「${window.location.hostname}」を追加してください。`
        );
      } else if (error?.code === 'auth/popup-closed-by-user') {
        throw new Error('Googleログインのポップアップが閉じられました。');
      } else if (error?.code === 'auth/cancelled-popup-request') {
        throw new Error('ログイン要求がキャンセルされました。もう一度お試しください。');
      }
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[Firebase] SignOut error:', e);
    }
    try {
      localStorage.setItem('tulips_logged_out', 'true');
      localStorage.removeItem('tulips_current_user');
      localStorage.removeItem('tulips_teacher_user');
      localStorage.removeItem('tulips_student_user');
    } catch {}
    this.localUser = null as any;
  }

  async switchRole(role: UserRole): Promise<User> {
    localStorage.removeItem('tulips_logged_out');
    const storageKey = role === 'teacher' ? 'tulips_teacher_user' : role === 'system' ? 'tulips_system_user' : 'tulips_student_user';
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          this.localUser = {
            ...(role === 'teacher' ? INITIAL_TEACHER : role === 'system' ? INITIAL_SYSTEM : INITIAL_USER),
            ...parsed,
            role,
          };
          localStorage.setItem('tulips_current_user', JSON.stringify(this.localUser));
          return { ...this.localUser };
        }
      }
    } catch {}

    if (role === 'teacher') {
      this.localUser = {
        ...INITIAL_TEACHER,
        id: this.localUser?.role === 'teacher' && this.localUser.id !== 'teacher-001' ? this.localUser.id : 'teacher-001',
        role: 'teacher',
      };
    } else if (role === 'system') {
      this.localUser = {
        ...INITIAL_SYSTEM,
        id: 'system-001',
        role: 'system',
      };
    } else {
      this.localUser = {
        ...INITIAL_USER,
        id: this.localUser?.role === 'student' && this.localUser.id !== 'student-001' ? this.localUser.id : 'student-001',
        role: 'student',
      };
    }
    try {
      localStorage.setItem('tulips_current_user', JSON.stringify(this.localUser));
      localStorage.setItem(storageKey, JSON.stringify(this.localUser));
    } catch {}
    return { ...this.localUser };
  }

  async updateProfile(updates: Partial<Omit<User, 'id'>>): Promise<User> {
    this.localUser = {
      ...this.localUser,
      ...updates,
    };
    try {
      localStorage.setItem('tulips_current_user', JSON.stringify(this.localUser));
      const storageKey = this.localUser.role === 'teacher' ? 'tulips_teacher_user' : 'tulips_student_user';
      localStorage.setItem(storageKey, JSON.stringify(this.localUser));
    } catch {}

    // ConoHa サーバー API にも同期（生徒名簿・メールアドレスを別端末へ共有）
    try {
      await fetch('/api/users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.localUser),
      });
    } catch {}

    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('users').upsert({
          id: this.localUser.id,
          name: this.localUser.name,
          email: this.localUser.email,
          role: this.localUser.role,
          grade: this.localUser.grade || null,
          class_room: this.localUser.classRoom || null,
          student_number: this.localUser.studentNumber || null,
          weekly_goal_minutes: this.localUser.weeklyGoalMinutes || 900,
          focus_subject_id: this.localUser.focusSubjectId || 'math',
        });
      } catch (err) {
        console.warn('[Supabase] updateProfile error:', err);
      }
    }

    return { ...this.localUser };
  }

  async getStudentsList(): Promise<User[]> {
    const DEMO_IDS = new Set(['student-002', 'student-003', 'student-004', 'student-005', 'student-006']);
    const DEMO_NAMES = new Set(['田中 陽翔', '伊藤 葵', '渡辺 蓮', '小林 結衣', '高橋 湊']);
    const isRealStudent = (u: User) => !DEMO_IDS.has(u.id) && !DEMO_NAMES.has(u.name);

    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('users').select('*').eq('role', 'student');
        if (!error && data && data.length > 0) {
          const list = data.map(toUser).filter(isRealStudent);
          if (list.length > 0) return list;
        }
      } catch {}
    }
    // ConoHa サーバー API (/api/students) から最新の生徒名簿を取得！
    try {
      const serverStudents = await this.conohaAuth.getStudentsList();
      if (serverStudents && serverStudents.length > 0) {
        return serverStudents.filter(isRealStudent);
      }
    } catch {}
    return [];
  }

  async getAllUsers(): Promise<User[]> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const { data, error } = await client.from('users').select('*').order('name');
        if (!error && data && data.length > 0) {
          return data.map(toUser);
        }
      } catch (err) {
        console.warn('[Supabase] getAllUsers error:', err);
      }
    }
    try {
      const serverUsers = await this.conohaAuth.getAllUsers();
      if (serverUsers && serverUsers.length > 0) {
        return serverUsers;
      }
    } catch {}
    return this.localUser ? [this.localUser] : [];
  }

  async updateAnyUser(userId: string, updates: Partial<User>): Promise<User> {
    const client = getSupabaseClient();
    if (client) {
      try {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.role !== undefined) payload.role = updates.role;
        if (updates.grade !== undefined) payload.grade = updates.grade;
        if (updates.classRoom !== undefined) payload.class_room = updates.classRoom;
        if (updates.studentNumber !== undefined) payload.student_number = updates.studentNumber;
        if (updates.weeklyGoalMinutes !== undefined) payload.weekly_goal_minutes = updates.weeklyGoalMinutes;
        if (updates.focusSubjectId !== undefined) payload.focus_subject_id = updates.focusSubjectId;

        await client.from('users').update(payload).eq('id', userId);
      } catch (err) {
        console.warn('[Supabase] updateAnyUser error:', err);
      }
    }

    let resultUser: User = updates as User;
    try {
      resultUser = await this.conohaAuth.updateAnyUser(userId, updates);
    } catch {}

    if (this.localUser && this.localUser.id === userId) {
      this.localUser = { ...this.localUser, ...updates };
      try {
        localStorage.setItem('tulips_current_user', JSON.stringify(this.localUser));
      } catch {}
    }

    return resultUser;
  }

  async deleteUser(userId: string): Promise<boolean> {
    const client = getSupabaseClient();
    if (client) {
      try {
        await client.from('users').delete().eq('id', userId);
      } catch (err) {
        console.warn('[Supabase] deleteUser error:', err);
      }
    }
    return this.conohaAuth.deleteUser(userId);
  }
}

// --- マッピングヘルパー ---
function toStudyRecord(row: any): StudyRecord {
  return {
    id: row.id,
    userId: row.user_id,
    subjectId: row.subject_id,
    materialId: row.material_id,
    materialName: row.material_name,
    date: row.date,
    durationMinutes: Number(row.duration_minutes) || 0,
    notes: row.notes || undefined,
    method: row.method || 'manual',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function toRegularTestTask(row: any): RegularTestTask {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    teacherName: row.teacher_name,
    title: row.title,
    subjectId: row.subject_id,
    targetGrade: Number(row.target_grade) || 2,
    targetClass: row.target_class || '全クラス',
    scope: row.scope || '',
    deadline: row.deadline || '',
    notes: row.notes || undefined,
    materialIds: Array.isArray(row.material_ids) ? row.material_ids : [],
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function toStudentTask(row: any): StudentTask {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    subjectId: row.subject_id,
    materialId: row.material_id,
    materialName: row.material_name,
    regularTestTaskId: row.regular_test_task_id || undefined,
    deadline: row.deadline,
    bufferDays: Number(row.buffer_days) ?? 1,
    items: Array.isArray(row.items) ? row.items : [],
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

function toMaterial(row: any): Material {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    isDefault: Boolean(row.is_default),
    structure: row.structure || undefined,
  };
}

function toUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email || '',
    role: row.role as UserRole,
    grade: row.grade ? Number(row.grade) : undefined,
    classRoom: row.class_room || undefined,
    studentNumber: row.student_number ? Number(row.student_number) : undefined,
    weeklyGoalMinutes: Number(row.weekly_goal_minutes) || 900,
    focusSubjectId: row.focus_subject_id || 'math',
  };
}
