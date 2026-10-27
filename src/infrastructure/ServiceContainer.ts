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
  FirestoreAuthRepository,
  FirestoreMaterialRepository,
  FirestoreStudentTaskRepository,
  FirestoreStudyRecordRepository,
  FirestoreTaskRepository,
} from './repositories/FirestoreRepositories.ts';

/**
 * ServiceContainer (DDD Dependency Injection Container)
 * 
 * Firebase (Cloud Firestore & Authentication) 連携リポジトリ実装を管理。
 * クラウドデータベースへのリアルタイム保存・同期およびオフラインフォールバックを提供。
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  public studyRecordRepository: IStudyRecordRepository;
  public taskRepository: ITaskRepository;
  public studentTaskRepository: IStudentTaskRepository;
  public materialRepository: IMaterialRepository;
  public authRepository: IAuthRepository;

  private constructor() {
    // Cloud Firestore & Firebase Auth 実装を注入
    this.studyRecordRepository = new FirestoreStudyRecordRepository();
    this.taskRepository = new FirestoreTaskRepository();
    this.studentTaskRepository = new FirestoreStudentTaskRepository();
    this.materialRepository = new FirestoreMaterialRepository();
    this.authRepository = new FirestoreAuthRepository();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const services = ServiceContainer.getInstance();
