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
  ConoHaAuthRepository,
  ConoHaMaterialRepository,
  ConoHaStudentTaskRepository,
  ConoHaStudyRecordRepository,
  ConoHaTaskRepository,
} from './repositories/ApiRepositories.ts';

/**
 * ServiceContainer (DDD Dependency Injection Container)
 * 
 * ConoHa サーバー環境（ConoHa VPS / ConoHa WING / Node.js + Express + ファイルDB/MySQL）
 * およびオフライン・クライアント環境（LocalStorage + Firebase Auth）
 * のリポジトリ実装を透過的に切り替え可能にするコンテナ。
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  public studyRecordRepository: IStudyRecordRepository;
  public taskRepository: ITaskRepository;
  public studentTaskRepository: IStudentTaskRepository;
  public materialRepository: IMaterialRepository;
  public authRepository: IAuthRepository;

  private constructor() {
    // ConoHa サーバー API 連携アダプタ（サーバー非起動時は LocalStorage へシームレスにフォールバック）
    this.studyRecordRepository = new ConoHaStudyRecordRepository();
    this.taskRepository = new ConoHaTaskRepository();
    this.studentTaskRepository = new ConoHaStudentTaskRepository();
    this.materialRepository = new ConoHaMaterialRepository();
    this.authRepository = new ConoHaAuthRepository();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const services = ServiceContainer.getInstance();
