import { qs } from './dom.js';

export function showToast(message, type = '') {
  const toast = qs('#toast');
  if (!toast) return;

  toast.textContent = message;
  toast.className = `toast show${type === 'error' ? ' error' : ''}`;
  window.clearTimeout(toast._toastTimer);
  toast._toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}
