import { qs } from './dom.js';

export function initSettings() {
  const logoutBtn = qs('#logoutBtn');
  const logoutConfirmModal = qs('#logoutConfirmModal');
  const closeButton = qs('#logoutConfirmClose');
  const cancelButton = qs('#logoutCancelBtn');
  const confirmButton = qs('#logoutConfirmBtn');

  const openModal = () => {
    if (!logoutConfirmModal) return;
    logoutConfirmModal.classList.add('open');
    logoutConfirmModal.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    if (!logoutConfirmModal) return;
    const restoreTarget = qs('#logoutBtn') || document.body;
    restoreTarget.focus?.();
    logoutConfirmModal.classList.remove('open');
    logoutConfirmModal.setAttribute('aria-hidden', 'true');
  };

  if (logoutBtn) logoutBtn.addEventListener('click', openModal);
  if (closeButton) closeButton.addEventListener('click', closeModal);
  if (cancelButton) cancelButton.addEventListener('click', closeModal);
  if (confirmButton) confirmButton.addEventListener('click', () => {
    closeModal();
    const toast = qs('#toast');
    if (toast) {
      toast.textContent = 'Logged out of this demo session';
      toast.classList.add('show');
      window.clearTimeout(toast._toastTimer);
      toast._toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2400);
    }
  });

  if (logoutConfirmModal) {
    logoutConfirmModal.addEventListener('click', (event) => {
      if (event.target === logoutConfirmModal) closeModal();
    });
    logoutConfirmModal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  }
}
