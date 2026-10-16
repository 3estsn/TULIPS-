/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RegularTestTask } from '../../domain/models/index.ts';
import { ITaskRepository } from '../../domain/repositories/index.ts';
import { INITIAL_TASKS } from '../seedData.ts';

const STORAGE_KEY = 'tulips_regular_test_tasks_v2';

export class LocalStorageTaskRepository implements ITaskRepository {
  private tasks: RegularTestTask[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 過去の古いシードデータを削除
    localStorage.removeItem('tulips_regular_test_tasks');

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.tasks = JSON.parse(raw);
        return;
      } catch (e) {
        console.error('Failed to parse tasks from localStorage', e);
      }
    }
    this.tasks = [];
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }

  async getTasks(filter?: { grade?: number; classRoom?: string }): Promise<RegularTestTask[]> {
    let result = [...this.tasks];
    if (filter?.grade) {
      result = result.filter((t) => t.targetGrade === filter.grade);
    }
    if (filter?.classRoom && filter.classRoom !== '全クラス') {
      result = result.filter((t) => t.targetClass === '全クラス' || t.targetClass === filter.classRoom);
    }
    // 締切が近い順にソート
    return result.sort((a, b) => (a.deadline > b.deadline ? 1 : -1));
  }

  async getTaskById(id: string): Promise<RegularTestTask | null> {
    const found = this.tasks.find((t) => t.id === id);
    return found || null;
  }

  async addTask(task: Omit<RegularTestTask, 'id' | 'createdAt'>): Promise<RegularTestTask> {
    const newTask: RegularTestTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.unshift(newTask);
    this.save();
    return newTask;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<RegularTestTask, 'id' | 'createdAt'>>,
  ): Promise<RegularTestTask> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Task not found with id: ${id}`);
    }
    this.tasks[index] = {
      ...this.tasks[index],
      ...updates,
    };
    this.save();
    return this.tasks[index];
  }

  async deleteTask(id: string): Promise<boolean> {
    const prevLength = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.tasks.length !== prevLength) {
      this.save();
      return true;
    }
    return false;
  }
}
