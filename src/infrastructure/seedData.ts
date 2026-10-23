/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, RegularTestTask, StudentTask, Subject, User } from '../domain/models/index.ts';

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
  {
    id: 'm-math-1',
    subjectId: 'math',
    name: '数学I・A 教科書',
    isDefault: true,
    structure: {
      itemTypeDefault: 'page',
      prefixDefault: 'p.',
      suffixDefault: '',
      chapters: [
        {
          id: 'ch-m1-1',
          chapterNumber: 1,
          title: '第1章 数と式',
          pageStart: 8,
          pageEnd: 42,
          sections: [
            {
              id: 'sec-m1-1-1',
              title: '第1節 多項式の計算と因数分解',
              items: Array.from({ length: 15 }, (_, i) => ({
                id: `m1-p-${8 + i}`,
                type: 'page',
                label: `p.${8 + i}`,
                page: 8 + i,
              })),
            },
            {
              id: 'sec-m1-1-2',
              title: '第2節 実数・1次不等式',
              items: Array.from({ length: 20 }, (_, i) => ({
                id: `m1-p-${23 + i}`,
                type: 'page',
                label: `p.${23 + i}`,
                page: 23 + i,
              })),
            },
          ],
        },
        {
          id: 'ch-m1-2',
          chapterNumber: 2,
          title: '第2章 2次関数',
          pageStart: 44,
          pageEnd: 88,
          sections: [
            {
              id: 'sec-m1-2-1',
              title: '第1節 2次関数とグラフ',
              items: Array.from({ length: 22 }, (_, i) => ({
                id: `m1-p-${44 + i}`,
                type: 'page',
                label: `p.${44 + i}`,
                page: 44 + i,
              })),
            },
            {
              id: 'sec-m1-2-2',
              title: '第2節 2次方程式・2次不等式',
              items: Array.from({ length: 23 }, (_, i) => ({
                id: `m1-p-${66 + i}`,
                type: 'page',
                label: `p.${66 + i}`,
                page: 66 + i,
              })),
            },
          ],
        },
      ],
    },
  },
  {
    id: 'm-math-2',
    subjectId: 'math',
    name: 'チャート式 基礎からの数学I+A（青チャート）',
    isDefault: true,
    structure: {
      itemTypeDefault: 'numbered',
      prefixDefault: '例題 ',
      suffixDefault: '',
      chapters: [
        {
          id: 'ch-m2-1',
          chapterNumber: 1,
          title: '第1章 数と式',
          pageStart: 10,
          pageEnd: 55,
          sections: [
            {
              id: 'sec-m2-1-1',
              title: '整式の乗法・因数分解',
              items: Array.from({ length: 10 }, (_, i) => ({
                id: `item-m2-${i + 1}`,
                type: 'numbered',
                label: `例題 ${i + 1}`,
                itemNumber: i + 1,
                page: 12 + Math.floor(i * 1.5),
              })),
            },
            {
              id: 'sec-m2-1-2',
              title: '実数と不等式',
              items: Array.from({ length: 10 }, (_, i) => ({
                id: `item-m2-${i + 11}`,
                type: 'numbered',
                label: `例題 ${i + 11}`,
                itemNumber: i + 11,
                page: 28 + Math.floor(i * 1.5),
              })),
            },
          ],
        },
        {
          id: 'ch-m2-2',
          chapterNumber: 2,
          title: '第2章 2次関数',
          pageStart: 56,
          pageEnd: 110,
          sections: [
            {
              id: 'sec-m2-2-1',
              title: '2次関数のグラフ・最大最小',
              items: Array.from({ length: 15 }, (_, i) => ({
                id: `item-m2-${i + 21}`,
                type: 'numbered',
                label: `例題 ${i + 21}`,
                itemNumber: i + 21,
                page: 58 + Math.floor(i * 1.5),
              })),
            },
            {
              id: 'sec-m2-2-2',
              title: '2次方程式・不等式への応用',
              items: Array.from({ length: 13 }, (_, i) => ({
                id: `item-m2-${i + 36}`,
                type: 'numbered',
                label: `例題 ${i + 36}`,
                itemNumber: i + 36,
                page: 82 + Math.floor(i * 1.5),
              })),
            },
          ],
        },
      ],
    },
  },
  { id: 'm-math-3', subjectId: 'math', name: 'Focus Gold 数学I+A', isDefault: true },
  { id: 'm-math-4', subjectId: 'math', name: '4STEP 数学I+A 問題集', isDefault: true },
  
  // 英語
  { id: 'm-eng-1', subjectId: 'english', name: '英語コミュニケーションI 教科書', isDefault: true },
  { id: 'm-eng-2', subjectId: 'english', name: 'ターゲット1900（英単語）', isDefault: true },
  {
    id: 'm-eng-3',
    subjectId: 'english',
    name: 'Next Stage 英文法・語法問題',
    isDefault: true,
    structure: {
      itemTypeDefault: 'numbered',
      prefixDefault: 'No.',
      suffixDefault: '',
      chapters: [
        {
          id: 'ch-eng-1',
          chapterNumber: 1,
          title: '第1章 文法',
          sections: [
            {
              id: 'sec-eng-1-1',
              title: '時制 (Tense)',
              items: Array.from({ length: 20 }, (_, i) => ({
                id: `ns-${i + 1}`,
                type: 'numbered',
                label: `No.${i + 1}`,
                itemNumber: i + 1,
              })),
            },
            {
              id: 'sec-eng-1-2',
              title: '助動詞 (Auxiliary Verbs)',
              items: Array.from({ length: 20 }, (_, i) => ({
                id: `ns-${i + 21}`,
                type: 'numbered',
                label: `No.${i + 21}`,
                itemNumber: i + 21,
              })),
            },
          ],
        },
      ],
    },
  },
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

export const INITIAL_TASKS: RegularTestTask[] = [
  {
    id: 'rtt-sample-1',
    teacherId: 'teacher-001',
    teacherName: '山田 健一 教諭',
    title: '2学期期末考査',
    subjectId: 'math',
    targetGrade: 2,
    targetClass: '全クラス',
    scope: '教科書 p.44〜p.88、青チャート 第2章 例題21〜35',
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString().split('T')[0];
    })(),
    notes: 'ワークノートに途中式を必ず残すこと。テスト直前の授業で提出。',
    createdAt: new Date().toISOString(),
    materialIds: ['m-math-1', 'm-math-2'],
  },
];

export const INITIAL_STUDENT_TASKS: StudentTask[] = [
  {
    id: 'stask-sample-1',
    userId: 'student-001',
    title: '2学期期末考査 青チャート 例題21〜35対策',
    subjectId: 'math',
    materialId: 'm-math-2',
    materialName: 'チャート式 基礎からの数学I+A（青チャート）',
    regularTestTaskId: 'rtt-sample-1',
    deadline: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 10);
      return d.toISOString().split('T')[0];
    })(),
    bufferDays: 2, // 2日間の予備日
    items: [
      { id: 'item-21', materialItemId: 'item-m2-21', label: '例題 21', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: true, completedAt: '2026-10-18T10:00:00.000Z' },
      { id: 'item-22', materialItemId: 'item-m2-22', label: '例題 22', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: true, completedAt: '2026-10-18T11:00:00.000Z' },
      { id: 'item-23', materialItemId: 'item-m2-23', label: '例題 23', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: true, completedAt: '2026-10-19T09:30:00.000Z' },
      { id: 'item-24', materialItemId: 'item-m2-24', label: '例題 24', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-25', materialItemId: 'item-m2-25', label: '例題 25', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-26', materialItemId: 'item-m2-26', label: '例題 26', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-27', materialItemId: 'item-m2-27', label: '例題 27', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-28', materialItemId: 'item-m2-28', label: '例題 28', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-29', materialItemId: 'item-m2-29', label: '例題 29', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-30', materialItemId: 'item-m2-30', label: '例題 30', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-31', materialItemId: 'item-m2-31', label: '例題 31', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-32', materialItemId: 'item-m2-32', label: '例題 32', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-33', materialItemId: 'item-m2-33', label: '例題 33', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-34', materialItemId: 'item-m2-34', label: '例題 34', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
      { id: 'item-35', materialItemId: 'item-m2-35', label: '例題 35', chapterTitle: '第2章 2次関数', sectionTitle: '2次関数のグラフ・最大最小', isCompleted: false },
    ],
    createdAt: '2026-10-18T08:00:00.000Z',
    updatedAt: '2026-10-19T09:30:00.000Z',
  },
];
