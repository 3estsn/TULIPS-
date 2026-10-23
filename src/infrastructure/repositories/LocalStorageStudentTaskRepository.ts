/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudentTask } from '../../domain/models/index.ts';
import { IStudentTaskRepository } from '../../domain/repositories/index.ts';
import { INITIAL_STUDENT_TASKS } from '../seedData.ts';

const STORAGE_KEY = 'tulips_student_tasks_v1';

export class LocalStorageStudentTaskRepository implements IStudentTaskRepository {
  private tasks: StudentTask[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.tasks = parsed;
          return;
        }
      } catch (e) {
        console.error('Failed to parse student tasks from localStorage', e);
      }
    }
    this.tasks = [...INITIAL_STUDENT_TASKS];
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.tasks));
    } catch (e) {
      console.error('Failed to save student tasks to localStorage', e);
    }
  }

  async getTasksByUser(userId: string): Promise<StudentTask[]> {
    return this.tasks
      .filter((t) => t.userId === userId)
      .sort((a, b) => (a.deadline > b.deadline ? 1 : -1));
  }

  async getTaskById(id: string): Promise<StudentTask | null> {
    const found = this.tasks.find((t) => t.id === id);
    return found ? { ...found } : null;
  }

  async addTask(task: Omit<StudentTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentTask> {
    const now = new Date().toISOString();
    const newTask: StudentTask = {
      ...task,
      id: `stask-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.push(newTask);
    this.save();
    return newTask;
  }

  async updateTask(
    id: string,
    updates: Partial<Omit<StudentTask, 'id' | 'createdAt'>>
  ): Promise<StudentTask> {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Student task not found with id: ${id}`);
    }
    const updated: StudentTask = {
      ...this.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.tasks[index] = updated;
    this.save();
    return updated;
  }

  async toggleItemCompletion(
    taskId: string,
    itemId: string,
    isCompleted: boolean
  ): Promise<StudentTask> {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) {
      throw new Error(`Student task not found with id: ${taskId}`);
    }
    const task = this.tasks[index];
    const now = new Date().toISOString();
    const updatedItems = task.items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          isCompleted,
          completedAt: isCompleted ? now : undefined,
        };
      }
      return item;
    });

    const updatedTask: StudentTask = {
      ...task,
      items: updatedItems,
      updatedAt: now,
    };
    this.tasks[index] = updatedTask;
    this.save();
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const prevLen = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    if (this.tasks.length !== prevLen) {
      this.save();
      return true;
    }
    return false;
  }
}
