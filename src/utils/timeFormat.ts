/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 分数を「○時間○分」または「○時間」形式に整形
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 0) return '0分';
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes}分`;
  }
  if (remainingMinutes === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${remainingMinutes}分`;
}

/**
 * 分数を「○.○h」形式に整形（グラフの凡例などに便利）
 */
export function formatHoursDecimal(minutes: number): string {
  return (minutes / 60).toFixed(1);
}

/**
 * 秒数を「HH:MM:SS」または「MM:SS」形式に整形（タイマー用）
 */
export function formatTimerSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
