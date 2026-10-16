/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Material, Subject } from '../../domain/models/index.ts';
import { IMaterialRepository } from '../../domain/repositories/index.ts';
import { INITIAL_MATERIALS, INITIAL_SUBJECTS } from '../seedData.ts';

const STORAGE_KEY = 'tulips_materials';

export class LocalStorageMaterialRepository implements IMaterialRepository {
  private materials: Material[] = [];

  constructor() {
    this.init();
  }

  private init() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        this.materials = JSON.parse(raw);
        return;
      } catch (e) {
        console.error('Failed to parse materials from localStorage', e);
      }
    }
    this.materials = [...INITIAL_MATERIALS];
    this.save();
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.materials));
    } catch (e) {
      console.error('Failed to save materials to localStorage', e);
    }
  }

  async getSubjects(): Promise<Subject[]> {
    return [...INITIAL_SUBJECTS];
  }

  async getMaterials(subjectId?: string): Promise<Material[]> {
    if (subjectId) {
      return this.materials.filter((m) => m.subjectId === subjectId);
    }
    return [...this.materials];
  }

  async addMaterial(material: Omit<Material, 'id'>): Promise<Material> {
    const newMaterial: Material = {
      ...material,
      id: `mat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.materials.push(newMaterial);
    this.save();
    return newMaterial;
  }
}
