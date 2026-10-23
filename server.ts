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
} from './src/infrastructure/seedData.ts';
import {
  Material,
  RegularTestTask,
  StudentTask,
  StudyRecord,
  Subject,
  User,
} from './src/domain/models/index.ts';

// 環境変数の読み込み (.env または .env.conoha)
dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
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
      return JSON.parse(raw) as ConoHaDatabase;
    }
  } catch (err) {
    console.error('[ConoHa Server] Failed to read database file, initializing defaults:', err);
  }

  // 初期シードデータ
  const initialDb: ConoHaDatabase = {
    users: [INITIAL_TEACHER, ...INITIAL_STUDENTS],
    subjects: INITIAL_SUBJECTS,
    materials: INITIAL_MATERIALS,
    tasks: INITIAL_TASKS,
    studentTasks: INITIAL_STUDENT_TASKS,
    records: [
      {
        id: 'rec-init-1',
        userId: 'student-001',
        subjectId: 'math',
        materialId: 'm-math-2',
        materialName: 'チャート式 基礎からの数学I+A（青チャート）',
        date: new Date().toISOString().split('T')[0],
        durationMinutes: 60,
        notes: '例題21〜23の復習と演習',
        method: 'manual',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ConoHa Server] Failed to save initial database file:', err);
  }

  return initialDb;
}

function saveDatabase(db: ConoHaDatabase): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('[ConoHa Server] Failed to write database file:', err);
  }
}

let db = loadDatabase();

// --- ヘルスチェック & サーバー情報 ---
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    server: 'ConoHa Server (Node.js + Express)',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    nodeVersion: process.version,
    dataDirectory: DATA_DIR,
  });
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
  const students = db.users.filter((u) => u.role === 'student');
  res.json(students);
});

app.patch('/api/auth/profile', (req: Request, res: Response) => {
  const { userId, ...updates } = req.body;
  const idx = db.users.findIndex((u) => u.id === (userId || 'student-001'));
  if (idx !== -1) {
    db.users[idx] = { ...db.users[idx], ...updates };
    saveDatabase(db);
    res.json(db.users[idx]);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
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
