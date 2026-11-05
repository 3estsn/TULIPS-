/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { registerSW } from 'virtual:pwa-register';

let updateSWFunction: ((reloadPage?: boolean) => Promise<void>) | null = null;
let isUpdateAvailableState = false;
const listeners = new Set<(available: boolean) => void>();

export function initPWAAutoUpdate() {
  if (typeof window === 'undefined') return;

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('[PWA] New version detected - auto updating SW...');
      isUpdateAvailableState = true;
      listeners.forEach((fn) => fn(true));
      // 自動で更新を適用してリロード
      updateSW(true);
    },
    onOfflineReady() {
      console.log('[PWA] App is ready to work offline');
    },
    onRegistered(r) {
      if (!r) return;
      // 定期的にSWの更新をチェック（1時間ごと）
      setInterval(() => {
        r.update();
      }, 60 * 60 * 1000);
    },
  });

  updateSWFunction = updateSW;
}

export function subscribePWAUpdate(listener: (available: boolean) => void) {
  listeners.add(listener);
  listener(isUpdateAvailableState);
  return () => {
    listeners.delete(listener);
  };
}

export async function checkOrTriggerPWAUpdate(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
    } catch (e) {
      console.warn('[PWA] update error:', e);
    }
  }

  if (updateSWFunction) {
    await updateSWFunction(true);
    return true;
  } else {
    // Service Worker未登録環境やフォールバック
    window.location.reload();
    return true;
  }
}
