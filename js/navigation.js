import { qs, qsa } from './dom.js';

export function switchView(target) {
  const navLinks = qsa('.nav-link[data-view]');
  const views = qsa('.view');
  const globalSearch = qs('#globalSearch');
  const placeholders = { dashboard: 'Search leads…', leads: 'Search leads…', pipeline: 'Search pipeline…', followups: 'Search follow-ups…', revenue: 'Search revenue…', profile: 'Search profile…' };

  navLinks.forEach((link) => link.classList.toggle('active', link.dataset.view === target));
  views.forEach((view) => view.classList.toggle('active', view.id === 'view-' + target));
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (globalSearch) {
    globalSearch.placeholder = placeholders[target] || 'Search…';
    globalSearch.value = '';
  }

  document.dispatchEvent(new CustomEvent('ledger:render', { detail: { searchQuery: '' } }));
}

export function bindNavigation() {
  qsa('.nav-link[data-view]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      switchView(link.dataset.view);
    });
  });

  qsa('[data-goto]').forEach((button) => {
    button.addEventListener('click', () => switchView(button.dataset.goto));
  });

  const globalSearch = qs('#globalSearch');
  if (globalSearch) {
    globalSearch.addEventListener('input', () => {
      const query = globalSearch.value.trim().toLowerCase();
      document.dispatchEvent(new CustomEvent('ledger:render', { detail: { searchQuery: query } }));
    });
  }
}

export function updateNavBadge() {
  const navBadge = qs('#navFollowupBadge');
  if (!navBadge) return;
  const dueCount = document.querySelectorAll('#followupsTbody tr[data-lead]').length;
  navBadge.textContent = dueCount;
  navBadge.classList.toggle('hidden', dueCount === 0);
}
