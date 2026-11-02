/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { UserRole } from '../../domain/models/index.ts';
import { Shield, GraduationCap, User as UserIcon, Check, ArrowRight, RefreshCw } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { switchUserRole, refreshData, accentColor, accentForeground } = useApp();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleLogin = async (roleToLogin: UserRole = selectedRole) => {
    setIsLoading(true);
    try {
      await switchUserRole(roleToLogin);
      await refreshData();
    } catch (err: any) {
      console.error('Role login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const roles: {
    id: UserRole;
    name: string;
    subName: string;
    description: string;
    badge: string;
    icon: typeof UserIcon;
    colorClasses: {
      borderSelected: string;
      bgSelected: string;
      textSelected: string;
      badgeColor: string;
      iconBg: string;
      iconColor: string;
    };
  }[] = [
    {
      id: 'student',
      name: '生徒アカウント',
      subName: '高校生向け',
      description: '日々の学習記録の登録、タイマー計測、統計グラフ、日割り計画タスクのチェック',
      badge: '生徒画面専用',
      icon: UserIcon,
      colorClasses: {
        borderSelected: 'border-emerald-500 ring-2 ring-emerald-500/20',
        bgSelected: 'bg-emerald-50/70 dark:bg-emerald-950/30',
        textSelected: 'text-emerald-950 dark:text-emerald-100',
        badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300',
        iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
      },
    },
    {
      id: 'teacher',
      name: '先生アカウント',
      subName: '指導教員向け',
      description: '学年・クラスごとの生徒学習統計一覧、定期テスト課題の作成・配信、教材構造マスター作成',
      badge: '教員画面専用',
      icon: GraduationCap,
      colorClasses: {
        borderSelected: 'border-amber-500 ring-2 ring-amber-500/20',
        bgSelected: 'bg-amber-50/70 dark:bg-amber-950/30',
        textSelected: 'text-amber-950 dark:text-amber-100',
        badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300',
        iconBg: 'bg-amber-100 dark:bg-amber-900/50',
        iconColor: 'text-amber-600 dark:text-amber-400',
      },
    },
    {
      id: 'system',
      name: 'システム管理',
      subName: 'システム管理者',
      description: '生徒画面・教員画面・システム管理画面の全プレビュー、ユーザーの編集・管理権限',
      badge: '全画面閲覧可能',
      icon: Shield,
      colorClasses: {
        borderSelected: 'border-indigo-500 ring-2 ring-indigo-500/20',
        bgSelected: 'bg-indigo-50/70 dark:bg-indigo-950/30',
        textSelected: 'text-indigo-950 dark:text-indigo-100',
        badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-300',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto">
        
        {/* 見出し */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            おかえりなさい！
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            またお会いしましたね
          </p>
          <div className="pt-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            ご利用のアカウントを選択してログインしてください
          </div>
        </div>

        {/* 3つのロール選択カード（生徒 / 先生 / システム管理） */}
        <div className="space-y-3">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isSelected
                    ? `${r.colorClasses.borderSelected} ${r.colorClasses.bgSelected} shadow-xs`
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${r.colorClasses.iconBg} ${r.colorClasses.iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {r.name}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.colorClasses.badgeColor}`}>
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 self-center">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-transparent bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ログイン実行ボタン */}
        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={() => handleRoleLogin(selectedRole)}
            disabled={isLoading}
            className="w-full py-3.5 px-5 rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
            style={{ backgroundColor: accentColor, color: accentForeground }}
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>
                  {selectedRole === 'student'
                    ? '生徒としてログイン'
                    : selectedRole === 'teacher'
                    ? '先生としてログイン'
                    : 'システム管理者としてログイン'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-zinc-400 dark:text-zinc-500">
            ※ 検証の簡便化のためGoogle認証を一時休止中。ワンクリックで対象ロールとして操作・閲覧を開始できます。
          </p>
        </div>

      </div>
    </div>
  );
};
