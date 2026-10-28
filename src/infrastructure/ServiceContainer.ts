/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IAuthRepository,
  IMaterialRepository,
  IStudentTaskRepository,
  IStudyRecordRepository,
  ITaskRepository,
} from '../domain/repositories/index.ts';
import {
  SupabaseAuthRepository,
  SupabaseMaterialRepository,
  SupabaseStudentTaskRepository,
  SupabaseStudyRecordRepository,
  SupabaseTaskRepository,
} from './repositories/SupabaseRepositories.ts';

/**
 * ServiceContainer (DDD Dependency Injection Container)
 * 
 * Supabase (PostgreSQL & Realtime WebSocket) 連携リポジトリ実装を管理。
 * クラウドデータベースへのリアルタイム双方向同期およびオフラインフォールバックを提供。
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  public studyRecordRepository: IStudyRecordRepository;
  public taskRepository: ITaskRepository;
  public studentTaskRepository: IStudentTaskRepository;
  public materialRepository: IMaterialRepository;
  public authRepository: IAuthRepository;

  private constructor() {
    // Supabase (PostgreSQL + Realtime) 実装を注入
    this.studyRecordRepository = new SupabaseStudyRecordRepository();
    this.taskRepository = new SupabaseTaskRepository();
    this.studentTaskRepository = new SupabaseStudentTaskRepository();
    this.materialRepository = new SupabaseMaterialRepository();
    this.authRepository = new SupabaseAuthRepository();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const services = ServiceContainer.getInstance();
