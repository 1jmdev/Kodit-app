import type { MouseEvent } from "react";

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `${days}d`;
  if (hours > 0) return `${hours}h`;
  if (minutes > 0) return `${minutes}m`;
  return "now";
}

export function handlePrimaryMouseDown(event: MouseEvent<HTMLButtonElement>, action: () => void) {
  if (event.button !== 0) return;
  event.preventDefault();
  action();
}

export function handleKeyboardClick(event: MouseEvent<HTMLButtonElement>, action: () => void) {
  if (event.detail === 0) {
    action();
  }
}
