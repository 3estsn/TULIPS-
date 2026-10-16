/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, RegularTestTask, Subject, User } from '../domain/models/index.ts';

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'japanese', name: '国語', category: 'japanese', color: '#ef4444' },
  { id: 'math', name: '数学', category: 'math', color: '#3b82f6' },
  { id: 'science', name: '理科', category: 'science', color: '#10b981' },
  { id: 'social', name: '社会', category: 'social', color: '#eab308' },
  { id: 'english', name: '英語', category: 'english', color: '#8b5cf6' },
  { id: 'info', name: '情報', category: 'info', color: '#06b6d4' },
  { id: 'other', name: 'その他', category: 'other', color: '#64748b' },
];

export const INITIAL_MATERIALS: Material[] = [
  // 数学
  { id: 'm-math-1', subjectId: 'math', name: '数学I・A 教科書', isDefault: true },
  { id: 'm-math-2', subjectId: 'math', name: 'チャート式 基礎からの数学I+A（青チャート）', isDefault: true },
  { id: 'm-math-3', subjectId: 'math', name: 'Focus Gold 数学I+A', isDefault: true },
  { id: 'm-math-4', subjectId: 'math', name: '4STEP 数学I+A 問題集', isDefault: true },
  
  // 英語
  { id: 'm-eng-1', subjectId: 'english', name: '英語コミュニケーションI 教科書', isDefault: true },
  { id: 'm-eng-2', subjectId: 'english', name: 'ターゲット1900（英単語）', isDefault: true },
  { id: 'm-eng-3', subjectId: 'english', name: 'Next Stage 英文法・語法問題', isDefault: true },
  { id: 'm-eng-4', subjectId: 'english', name: '論理・表現I ワークノート', isDefault: true },

  // 国語
  { id: 'm-jp-1', subjectId: 'japanese', name: '現代の国語 教科書', isDefault: true },
  { id: 'm-jp-2', subjectId: 'japanese', name: '新編 言語文化 教科書', isDefault: true },
  { id: 'm-jp-3', subjectId: 'japanese', name: '古文単語315', isDefault: true },
  { id: 'm-jp-4', subjectId: 'japanese', name: '漢文必携', isDefault: true },

  // 理科
  { id: 'm-sci-1', subjectId: 'science', name: '物理基礎 教科書', isDefault: true },
  { id: 'm-sci-2', subjectId: 'science', name: '化学基礎 教科書', isDefault: true },
  { id: 'm-sci-3', subjectId: 'science', name: 'セミナー化学基礎＋化学', isDefault: true },
  { id: 'm-sci-4', subjectId: 'science', name: 'リードα 物理基礎', isDefault: true },

  // 地歴公民
  { id: 'm-soc-1', subjectId: 'social', name: '歴史総合 教科書＆用語集', isDefault: true },
  { id: 'm-soc-2', subjectId: 'social', name: '公共 ワークブック', isDefault: true },

  // 情報
  { id: 'm-inf-1', subjectId: 'info', name: '情報I 教科書＆実習プリント', isDefault: true },

  // その他
  { id: 'm-oth-1', subjectId: 'other', name: '模試の解き直し・復習ノート', isDefault: true },
  { id: 'm-oth-2', subjectId: 'other', name: '小テスト対策プリント', isDefault: true },
];

export const INITIAL_USER: User = {
  id: 'student-001',
  name: '佐藤 翼',
  email: 'sato.tsubasa@tulips-high.ed.jp',
  role: 'student',
  grade: 2,
  classRoom: '1組',
  studentNumber: 14,
  isGoogleAccount: true,
  weeklyGoalMinutes: 900, // 15時間
  focusSubjectId: 'math', // 重視する科目: 数学
};

export const INITIAL_STUDENTS: User[] = [
  INITIAL_USER,
  {
    id: 'student-002',
    name: '田中 陽翔',
    email: 'tanaka.haruto@tulips-high.ed.jp',
    role: 'student',
    grade: 2,
    classRoom: '1組',
    studentNumber: 15,
  },
  {
    id: 'student-003',
    name: '伊藤 葵',
    email: 'ito.aoi@tulips-high.ed.jp',
    role: 'student',
    grade: 2,
    classRoom: '1組',
    studentNumber: 3,
  },
  {
    id: 'student-004',
    name: '渡辺 蓮',
    email: 'watanabe.ren@tulips-high.ed.jp',
    role: 'student',
    grade: 2,
    classRoom: '1組',
    studentNumber: 28,
  },
  {
    id: 'student-005',
    name: '小林 結衣',
    email: 'kobayashi.yui@tulips-high.ed.jp',
    role: 'student',
    grade: 2,
    classRoom: '1組',
    studentNumber: 9,
  },
  {
    id: 'student-006',
    name: '高橋 湊',
    email: 'takahashi.so@tulips-high.ed.jp',
    role: 'student',
    grade: 2,
    classRoom: '2組',
    studentNumber: 12,
  },
];

export const INITIAL_TEACHER: User = {
  id: 'teacher-001',
  name: '山田 健一 教諭',
  email: 'yamada.kenichi@tulips-high.ed.jp',
  role: 'teacher',
  classRoom: '2年学年主任・数学科',
  isGoogleAccount: true,
};

export const INITIAL_TASKS: RegularTestTask[] = [];
