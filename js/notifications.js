import { qs, qsa, bindKeyboardActivation } from './dom.js';
import { showToast } from './toast.js';

export function updateNotifBadge() {
  const unreadCount = qsa('.notif-item.unread').length;
  const badge = qs('#notifBadge');
  if (badge) {
    badge.textContent = unreadCount;
    badge.classList.toggle('hidden', unreadCount === 0);
  }
}

export function initNotifications() {
  const notifBtn = qs('#notifBtn');
  const notifPanel = qs('#notifPanel');
  const notifModal = qs('#notifModal');
  const notifItems = qsa('.notif-item');

  if (notifBtn && notifPanel) {
    notifBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = notifPanel.classList.toggle('open');
      notifBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  document.addEventListener('click', (event) => {
    if (!notifPanel) return;
    if (!notifPanel.contains(event.target) && event.target !== notifBtn) {
      notifPanel.classList.remove('open');
      if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
    }
  });

  notifItems.forEach((item) => {
    const openIt = () => {
      const title = item.querySelector('.notif-title')?.textContent || '';
      const time = item.querySelector('.notif-time')?.textContent || '';
      const detail = item.querySelector('.notif-detail')?.textContent || '';
      const icon = item.querySelector('.notif-icon')?.textContent || 'ℹ️';

      const modalTitle = qs('#notifModalTitle');
      const modalTime = qs('#notifModalTime');
      const modalText = qs('#notifModalText');
      const modalIcon = qs('#notifModalIcon');
      if (modalTitle) modalTitle.textContent = title;
      if (modalTime) modalTime.textContent = time;
      if (modalText) modalText.textContent = detail.trim();
      if (modalIcon) modalIcon.textContent = icon;

      if (notifModal) {
        notifModal.classList.add('open');
        notifModal.setAttribute('aria-hidden', 'false');
      }
      if (notifPanel) {
        notifPanel.classList.remove('open');
      }
      item.classList.remove('unread');
      updateNotifBadge();
    };

    item.addEventListener('click', openIt);
    bindKeyboardActivation(item, openIt);
  });

  const markAllRead = qs('#markAllRead');
  if (markAllRead) {
    markAllRead.addEventListener('click', (event) => {
      event.stopPropagation();
      qsa('.notif-item').forEach((item) => item.classList.remove('unread'));
      updateNotifBadge();
    });
  }

  const modalClose = qs('#notifModalClose');
  const modalOk = qs('#notifModalOk');
  const closeModal = () => {
    if (notifModal) {
      const restoreTarget = document.activeElement && notifModal.contains(document.activeElement) ? (qs('#notifBtn') || document.body) : (qs('#notifBtn') || document.body);
      restoreTarget.focus?.();
      notifModal.classList.remove('open');
      notifModal.setAttribute('aria-hidden', 'true');
    }
  };

  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalOk) modalOk.addEventListener('click', closeModal);
  if (notifModal) {
    notifModal.addEventListener('click', (event) => {
      if (event.target === notifModal) closeModal();
    });
    notifModal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
  }

  updateNotifBadge();
}
