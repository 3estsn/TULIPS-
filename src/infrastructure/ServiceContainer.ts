/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  IAuthRepository,
  IMaterialRepository,
  IStudyRecordRepository,
  ITaskRepository,
} from '../domain/repositories/index.ts';
import { FirebaseAuthRepository } from './repositories/FirebaseAuthRepository.ts';
import { LocalStorageMaterialRepository } from './repositories/LocalStorageMaterialRepository.ts';
import { LocalStorageStudyRecordRepository } from './repositories/LocalStorageStudyRecordRepository.ts';
import { LocalStorageTaskRepository } from './repositories/LocalStorageTaskRepository.ts';

/**
 * ServiceContainer (DDD Dependency Injection Container)
 * 
 * 本番環境（Node.js + Express + PostgreSQL）
 * 仮デプロイ環境（Vercel + Supabase）
 * およびオフライン・クライアント環境（LocalStorage + Firebase Auth）
 * のリポジトリ実装を透過的に切り替え可能にするコンテナ。
 */
export class ServiceContainer {
  private static instance: ServiceContainer;

  public studyRecordRepository: IStudyRecordRepository;
  public taskRepository: ITaskRepository;
  public materialRepository: IMaterialRepository;
  public authRepository: IAuthRepository;

  private constructor() {
    // 現在の環境・設定に応じたアダプタを生成
    // 将来的に PostgreSQL や Supabase アダプタに差し替える際も
    // ドメイン層・プレゼンテーション層の変更は一切不要。
    this.studyRecordRepository = new LocalStorageStudyRecordRepository();
    this.taskRepository = new LocalStorageTaskRepository();
    this.materialRepository = new LocalStorageMaterialRepository();
    this.authRepository = new FirebaseAuthRepository();
  }

  public static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }
}

export const services = ServiceContainer.getInstance();
