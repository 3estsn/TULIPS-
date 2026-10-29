/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { LogIn, Shield, GraduationCap, User as UserIcon, RefreshCw, AlertCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginWithGoogle, switchUserRole, refreshData } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      if (email.includes('system') || email === 'system@tulips-high.ed.jp') {
        await switchUserRole('system');
      } else if (email.includes('teacher') || email.includes('yamada')) {
        await switchUserRole('teacher');
      } else {
        await switchUserRole('student');
      }
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err?.message || 'ログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      await loginWithGoogle('student');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Googleログインに失敗しました。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex items-center justify-center p-4">
      <div className="bg-white border border-zinc-200 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ヘッダータイトル */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs border border-emerald-100">
            <LogIn className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">
            おかえりなさい！
          </h1>
          <p className="text-xs text-zinc-500 font-medium">
            またお会いしましたね
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* メール & パスワード ログインフォーム */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@tulips-high.ed.jp"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-hidden focus:border-zinc-900 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1.5">
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl border border-zinc-300 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-hidden focus:border-zinc-900 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-xl bg-zinc-900 text-white font-bold text-sm shadow-md hover:bg-zinc-800 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
            <span>ログイン</span>
          </button>
        </form>

        <div className="relative flex py-1 items-center">
          <div className="grow border-t border-zinc-200"></div>
          <span className="shrink mx-4 text-zinc-400 text-[11px] font-semibold">または</span>
          <div className="grow border-t border-zinc-200"></div>
        </div>

        {/* Google ログインボタン */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3 rounded-xl border border-zinc-300 bg-white text-zinc-800 font-bold text-sm hover:bg-zinc-50 transition-all cursor-pointer flex items-center justify-center space-x-2 shadow-2xs"
        >
          <span className="text-[#4285F4] font-extrabold text-base">G</span>
          <span>Googleアカウントでログイン</span>
        </button>

        {/* 簡単クイックアクセス（生徒 / 先生 / システム） */}
        <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={async () => {
              await switchUserRole('student');
              await refreshData();
            }}
            className="flex-1 py-2 px-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 font-semibold text-[11px] hover:bg-zinc-100 cursor-pointer flex items-center justify-center space-x-1"
          >
            <UserIcon className="w-3 h-3 text-emerald-600" />
            <span>生徒モード</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await switchUserRole('teacher');
              await refreshData();
            }}
            className="flex-1 py-2 px-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 font-semibold text-[11px] hover:bg-zinc-100 cursor-pointer flex items-center justify-center space-x-1"
          >
            <GraduationCap className="w-3 h-3 text-blue-600" />
            <span>先生モード</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await switchUserRole('system');
              await refreshData();
            }}
            className="flex-1 py-2 px-2 rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-700 font-semibold text-[11px] hover:bg-zinc-100 cursor-pointer flex items-center justify-center space-x-1"
          >
            <Shield className="w-3 h-3 text-indigo-600" />
            <span>システム</span>
          </button>
        </div>

      </div>
    </div>
  );
};
