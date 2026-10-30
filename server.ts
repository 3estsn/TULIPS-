/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import {
  INITIAL_MATERIALS,
  INITIAL_STUDENT_TASKS,
  INITIAL_STUDENTS,
  INITIAL_SUBJECTS,
  INITIAL_TASKS,
  INITIAL_TEACHER,
  INITIAL_SYSTEM,
} from './src/infrastructure/seedData.ts';
import {
  Material,
  RegularTestTask,
  StudentTask,
  StudyRecord,
  Subject,
  User,
} from './src/domain/models/index.ts';

import firebaseConfig from './firebase-applet-config.json';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

// 環境変数の読み込み (.env または .env.conoha)
dotenv.config();

const serverFirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig, 'server-app')
  : getApps()[0];
const serverDb = getFirestore(serverFirebaseApp, firebaseConfig.firestoreDatabaseId);

const app = express();
const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.CONOHA_SERVER_HOST || process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'conoha_tulips_db.json');

// JSONパーサーとCORS設定
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// --- ConoHa サーバー永続化データベース構造 (ファイルDB) ---
interface ConoHaDatabase {
  users: User[];
  subjects: Subject[];
  materials: Material[];
  tasks: RegularTestTask[];
  studentTasks: StudentTask[];
  records: StudyRecord[];
}

function loadDatabase(): ConoHaDatabase {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const loaded = JSON.parse(raw) as ConoHaDatabase;
      // サンプル例として入っていた生徒（student-002〜006）およびサンプル氏名を完全削除
      const DEMO_STUDENT_IDS = new Set(['student-002', 'student-003', 'student-004', 'student-005', 'student-006']);
      const DEMO_STUDENT_NAMES = new Set(['田中 陽翔', '伊藤 葵', '渡辺 蓮', '小林 結衣', '高橋 湊']);
      loaded.users = (loaded.users || []).filter(
        (u) => !DEMO_STUDENT_IDS.has(u.id) && !DEMO_STUDENT_NAMES.has(u.name)
      );
      // サンプル初期学習記録 (rec-init-1) も削除
      loaded.records = (loaded.records || []).filter((r) => r.id !== 'rec-init-1');
      return loaded;
    }
  } catch (err) {
    console.error('[ConoHa Server] Failed to read database file, initializing defaults:', err);
  }

  // 初期シードデータ（サンプル生徒は含めず、実在する登録生徒のみ管理）
  const initialDb: ConoHaDatabase = {
    users: [INITIAL_TEACHER],
    subjects: INITIAL_SUBJECTS,
    materials: INITIAL_MATERIALS,
    tasks: INITIAL_TASKS,
    studentTasks: INITIAL_STUDENT_TASKS,
    records: [],
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ConoHa Server] Failed to save initial database file:', err);
  }

  return initialDb;
}

const sseClients: Response[] = [];

function notifyClients(event = 'data_changed') {
  for (const clientRes of sseClients) {
    try {
      clientRes.write(`data: ${JSON.stringify({ event, time: Date.now() })}\n\n`);
    } catch {}
  }
}

function saveDatabase(db: ConoHaDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    notifyClients();
  } catch (err) {
    console.error('[ConoHa Server] Failed to write database file:', err);
  }
}

let db = loadDatabase();

// --- Realtime SSE (全端末瞬時同期) ---
app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  sseClients.push(res);
  res.write(`data: ${JSON.stringify({ event: 'connected', time: Date.now() })}\n\n`);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// --- ヘルスチェック & サーバー情報 ---
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'ConoHa Server (Node.js + Express)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    dataDirectory: DATA_DIR,
    firebaseProject: firebaseConfig.projectId,
  });
});

// --- 管理者用 データベース完全初期化（全データ削除） ---
app.post('/api/admin/reset-db', (_req: Request, res: Response) => {
  try {
    const freshDb: ConoHaDatabase = {
      users: [INITIAL_TEACHER, INITIAL_SYSTEM],
      subjects: INITIAL_SUBJECTS,
      materials: INITIAL_MATERIALS,
      tasks: INITIAL_TASKS,
      studentTasks: [],
      records: [],
    };
    saveDatabase(freshDb);
    db = freshDb;
    res.json({ success: true, message: 'データベースの全データを正常に初期化・削除しました。' });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to reset database' });
  }
});

// --- Firebase Firestore 疎通確認エンドポイント ---
app.get('/api/firebase-status', async (_req: Request, res: Response) => {
  try {
    await getDoc(doc(serverDb, 'test', 'connection'));
    res.json({
      status: 'ok',
      connected: true,
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      message: 'ConoHa サーバーから Firebase Firestore への疎通接続が正常に確認できました。',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.json({
      status: 'warning',
      connected: false,
      error: err?.message || String(err),
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    });
  }
});

// --- 教科 (Subjects) ---
app.get('/api/subjects', (_req: Request, res: Response) => {
  res.json(db.subjects);
});

// --- 教材マスター (Materials) ---
app.get('/api/materials', (req: Request, res: Response) => {
  const subjectId = req.query.subjectId as string | undefined;
  if (subjectId) {
    res.json(db.materials.filter((m) => m.subjectId === subjectId));
  } else {
    res.json(db.materials);
  }
});

app.post('/api/materials', (req: Request, res: Response) => {
  const newMaterial: Material = {
    ...req.body,
    id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };
  db.materials.push(newMaterial);
  saveDatabase(db);
  res.status(201).json(newMaterial);
});

app.put('/api/materials/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.materials.findIndex((m) => m.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Material not found' });
    return;
  }
  db.materials[idx] = { ...db.materials[idx], ...req.body, id };
  saveDatabase(db);
  res.json(db.materials[idx]);
});

app.delete('/api/materials/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = db.materials.length;
  db.materials = db.materials.filter((m) => m.id !== id);
  if (db.materials.length < initialLen) {
    saveDatabase(db);
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Material not found' });
  }
});

// --- 定期テスト課題 (Regular Test Tasks - 先生配信) ---
app.get('/api/tasks', (req: Request, res: Response) => {
  const grade = req.query.grade ? Number(req.query.grade) : undefined;
  const classRoom = req.query.classRoom as string | undefined;

  let results = db.tasks;
  if (grade !== undefined) {
    results = results.filter((t) => t.targetGrade === grade);
  }
  if (classRoom && classRoom !== '全クラス') {
    results = results.filter((t) => t.targetClass === '全クラス' || t.targetClass === classRoom);
  }
  res.json(results);
});

app.post('/api/tasks', (req: Request, res: Response) => {
  const newTask: RegularTestTask = {
    ...req.body,
    id: `rtt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  db.tasks.unshift(newTask);
  saveDatabase(db);
  res.status(201).json(newTask);
});

app.put('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.tasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }
  db.tasks[idx] = { ...db.tasks[idx], ...req.body, id };
  saveDatabase(db);
  res.json(db.tasks[idx]);
});

app.delete('/api/tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.tasks = db.tasks.filter((t) => t.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// --- 生徒学習計画タスク (Student Tasks - 構造から作成・日割り計算) ---
app.get('/api/student-tasks', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  if (userId) {
    res.json(db.studentTasks.filter((t) => t.userId === userId));
  } else {
    res.json(db.studentTasks);
  }
});

app.post('/api/student-tasks', (req: Request, res: Response) => {
  const newTask: StudentTask = {
    ...req.body,
    id: `stask-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.studentTasks.unshift(newTask);
  saveDatabase(db);
  res.status(201).json(newTask);
});

app.put('/api/student-tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = db.studentTasks.findIndex((t) => t.id === id);
  if (idx === -1) {
    res.status(404).json({ error: 'Student task not found' });
    return;
  }
  db.studentTasks[idx] = {
    ...db.studentTasks[idx],
    ...req.body,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase(db);
  res.json(db.studentTasks[idx]);
});

app.patch('/api/student-tasks/:taskId/items/:itemId', (req: Request, res: Response) => {
  const { taskId, itemId } = req.params;
  const { isCompleted } = req.body;

  const tIdx = db.studentTasks.findIndex((t) => t.id === taskId);
  if (tIdx === -1) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const task = db.studentTasks[tIdx];
  const item = task.items.find((i) => i.id === itemId);
  if (!item) {
    res.status(404).json({ error: 'Task item not found' });
    return;
  }

  item.isCompleted = Boolean(isCompleted);
  item.completedAt = isCompleted ? new Date().toISOString() : undefined;
  task.updatedAt = new Date().toISOString();

  saveDatabase(db);
  res.json(task);
});

app.delete('/api/student-tasks/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.studentTasks = db.studentTasks.filter((t) => t.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// --- 学習記録 (Study Records) ---
app.get('/api/records', (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;

  let results = db.records;
  if (userId) {
    results = results.filter((r) => r.userId === userId);
  }
  if (startDate && endDate) {
    results = results.filter((r) => r.date >= startDate && r.date <= endDate);
  }
  res.json(results);
});

app.post('/api/records', (req: Request, res: Response) => {
  const newRecord: StudyRecord = {
    ...req.body,
    id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };
  db.records.unshift(newRecord);
  saveDatabase(db);
  res.status(201).json(newRecord);
});

app.delete('/api/records/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  db.records = db.records.filter((r) => r.id !== id);
  saveDatabase(db);
  res.json({ success: true });
});

// --- ユーザー & 認証 (Users & Auth) ---
app.get('/api/auth/me', (req: Request, res: Response) => {
  const userId = (req.query.userId as string) || 'student-001';
  const user = db.users.find((u) => u.id === userId) || db.users[0];
  res.json(user);
});

app.get('/api/students', (_req: Request, res: Response) => {
  const DEMO_STUDENT_IDS = new Set(['student-002', 'student-003', 'student-004', 'student-005', 'student-006']);
  const DEMO_STUDENT_NAMES = new Set(['田中 陽翔', '伊藤 葵', '渡辺 蓮', '小林 結衣', '高橋 湊']);

  // デモ用サンプル生徒を確実に除外
  let students = db.users.filter((u) => {
    if (u.role !== 'student') return false;
    if (DEMO_STUDENT_IDS.has(u.id)) return false;
    if (DEMO_STUDENT_NAMES.has(u.name)) return false;
    return true;
  });

  // もしGoogle連携済みの生徒アカウントが存在し、未連携のstudent-001が残っている場合、
  // student-001の学習記録をGoogle生徒アカウントへ統合
  const googleStudent = students.find(
    (u) => u.isGoogleAccount || (u.email && u.email.includes('@') && !u.email.endsWith('@tulips-high.ed.jp'))
  );
  if (googleStudent && students.some((u) => u.id === 'student-001')) {
    let touched = false;
    for (const r of db.records) {
      if (r.userId === 'student-001') {
        r.userId = googleStudent.id;
        touched = true;
      }
    }
    for (const st of db.studentTasks) {
      if (st.userId === 'student-001') {
        st.userId = googleStudent.id;
        touched = true;
      }
    }
    db.users = db.users.filter((u) => u.id !== 'student-001');
    students = students.filter((u) => u.id !== 'student-001');
    if (touched) {
      saveDatabase(db);
    }
  }

  // もし学習記録が0件かつ名前が初期「生徒」かつメール未設定の完全未記入student-001がある場合、
  // 先生画面に余計なダミー行として表示されないよう除外
  const hasRecords = (uid: string) => db.records.some((r) => r.userId === uid);
  students = students.filter((s) => {
    if (s.id === 'student-001' && s.name === '生徒' && !s.email && !hasRecords('student-001')) {
      return false;
    }
    return true;
  });

  res.json(students);
});

app.patch('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, ...updates } = req.body;
  const targetId = userId || 'student-001';
  const idx = db.users.findIndex((u) => u.id === targetId);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...updates };
    saveDatabase(db);
    res.json(db.users[idx]);
  } else {
    const newUser: User = {
      id: targetId,
      name: updates.name || (updates.role === 'teacher' ? '担当教諭' : '生徒'),
      email: updates.email || '',
      role: updates.role || 'student',
      grade: updates.grade,
      classRoom: updates.classRoom,
      studentNumber: updates.studentNumber,
      weeklyGoalMinutes: updates.weeklyGoalMinutes || 900,
      focusSubjectId: updates.focusSubjectId || 'math',
      isGoogleAccount: Boolean(updates.isGoogleAccount),
      ...updates,
    };
    db.users.push(newUser);
    saveDatabase(db);
    res.json(newUser);
  }
});

// ユーザー・名簿同期 (Google アカウント連携や生徒・教員名簿更新)
app.post('/api/users/sync', (req: Request, res: Response) => {
  const { oldId, ...user } = req.body;
  if (!user || !user.id) {
    res.status(400).json({ error: 'User id is required' });
    return;
  }

  // Google アカウント連携に伴う旧ID（student-001やteacher-001）からの学習記録・計画タスク移行
  if (oldId && oldId !== user.id) {
    let migratedCount = 0;
    for (const r of db.records) {
      if (r.userId === oldId) {
        r.userId = user.id;
        migratedCount++;
      }
    }
    for (const st of db.studentTasks) {
      if (st.userId === oldId) {
        st.userId = user.id;
      }
    }
    // 旧ダミーIDを名簿から削除
    db.users = db.users.filter((u) => u.id !== oldId);
    if (migratedCount > 0) {
      console.log(`[ConoHa Server] Migrated ${migratedCount} study records from ${oldId} to ${user.id}`);
    }
  }

  const idx = db.users.findIndex((u) => u.id === user.id);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...user };
  } else {
    db.users.push(user as User);
  }
  saveDatabase(db);
  res.json(db.users.find((u) => u.id === user.id));
});

app.post('/api/students', (req: Request, res: Response) => {
  const student: User = {
    ...req.body,
    role: 'student',
    id: req.body.id || `student-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
  };
  const idx = db.users.findIndex((u) => u.id === student.id);
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...student };
  } else {
    db.users.push(student);
  }
  saveDatabase(db);
  res.status(201).json(student);
});

// --- 全端末自動設定共有 (Supabase / サーバー環境) ---
const DEFAULT_SUPABASE_URL = 'https://kgiszkybhakkwoxmkxnh.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtnaXN6a3liaGFra3dveG1reG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1NjgyMDcsImV4cCI6MjEwODE0NDIwN30.rCKWekBKXlw9gvzgUfsXGT8rs3P4CxAgqWhgJZnX6lo';

function sanitizeUrl(raw: string): string {
  if (!raw) return '';
  return raw.trim().replace(/\/+\$0\/?$/i, '').replace(/\/\$0$/i, '').replace(/\/+$/, '');
}

app.get('/api/config', (_req: Request, res: Response) => {
  let url = sanitizeUrl(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '');
  let anonKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (!url || url.includes('yourapp-') || url.includes('ai-studio-tulips')) {
    url = DEFAULT_SUPABASE_URL;
  }
  if (!anonKey || anonKey.includes('ey.......') || anonKey.includes('tulips_default')) {
    anonKey = DEFAULT_SUPABASE_ANON_KEY;
  }

  res.json({
    supabaseUrl: url,
    supabaseAnonKey: anonKey,
  });
});

app.post('/api/config', (req: Request, res: Response) => {
  const { supabaseUrl, supabaseAnonKey } = req.body;
  if (supabaseUrl !== undefined) {
    process.env.VITE_SUPABASE_URL = sanitizeUrl(String(supabaseUrl));
  }
  if (supabaseAnonKey !== undefined) {
    process.env.VITE_SUPABASE_ANON_KEY = String(supabaseAnonKey).trim();
  }
  res.json({
    success: true,
    supabaseUrl: process.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL,
    supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY,
  });
});

// --- 本番環境静的ファイル配信 (Vite dist/) ---
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// サーバー起動
app.listen(PORT, HOST, () => {
  console.log(`[ConoHa Server] Server running on http://${HOST}:${PORT}`);
  console.log(`[ConoHa Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[ConoHa Server] Database storage: ${DB_FILE}`);
});

export default app;
