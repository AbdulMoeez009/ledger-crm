import { qs, qsa } from './dom.js';
import { state, STAGES, fmtPrice, today, daysUntil, fmtDate, statusClass, stageClass, matchesSearch, inMonth, monthLabel, exportCsv } from './state.js';
import { showToast } from './toast.js';
import { bindNavigation, switchView, updateNavBadge } from './navigation.js';
import { initNotifications } from './notifications.js';
import { initProfile } from './profile.js';
import { initSettings } from './settings.js';
import { initShortcuts } from './shortcuts.js';
import { api } from './api.js';

let searchQuery = '';
let sortKey = null;
let sortDir = 1;
let revenueMonthOffset = 0;
let activeLeadId = null;
let lastFocusedElement = null;
let editingId = null;

function renderAll(options = {}) {
  if (options.searchQuery !== undefined) searchQuery = options.searchQuery;

  populateCityFilter();
  const currentView = qs('.view.active')?.id?.replace('view-', '') || 'dashboard';

  if (currentView === 'dashboard') renderDashboard();
  if (currentView === 'leads') renderLeadsTable();
  if (currentView === 'pipeline') renderPipeline();
  if (currentView === 'followups') renderFollowups();
  if (currentView === 'revenue') renderRevenue();

  bindFollowupStrips();
  const dueCount = state.leads.filter((lead) => lead.followupDate && daysUntil(lead.followupDate) <= 0).length;
  const navBadge = qs('#navFollowupBadge');
  if (navBadge) {
    navBadge.textContent = dueCount;
    navBadge.classList.toggle('hidden', dueCount === 0);
  }
}

function followupStripHtml() {
  const due = state.leads.filter((lead) => lead.followupDate && daysUntil(lead.followupDate) <= 0);
  if (!due.length) {
    return '<div class="followup-strip"><span class="fs-title">⏰ Follow-ups:</span><span style="font-size:.82rem;color:var(--text-dim);">All caught up — nothing due today.</span></div>';
  }

  return `<div class="followup-strip"><span class="fs-title">⏰ Due today:</span>${due.map((lead) => `<button class="followup-chip" data-lead="${lead.id}">${lead.ownerName} — ${lead.bizName}</button>`).join('')}</div>`;
}

function bindFollowupStrips() {
  qsa('.followup-chip[data-lead]').forEach((chip) => {
    chip.addEventListener('click', () => openDetail(chip.dataset.lead));
  });
}

function renderDashboard() {
  const total = state.leads.length;
  const hot = state.leads.filter((lead) => lead.status === 'Hot').length;
  const warm = state.leads.filter((lead) => lead.status === 'Warm').length;
  const due = state.leads.filter((lead) => lead.followupDate && daysUntil(lead.followupDate) <= 0).length;

  qs('#dashStats').innerHTML = `
    <article class="stat-card" style="animation-delay:.05s;cursor:pointer;" data-list-title="All Leads" data-list-filter="all"><span class="label">Total Leads</span><span class="value">${total}</span><span class="desc">In your CRM</span></article>
    <article class="stat-card" style="animation-delay:.1s;cursor:pointer;" data-list-title="🔥 Hot Leads" data-list-filter="Hot"><span class="label">🔥 Hot Leads</span><span class="value" style="color:var(--hot)">${hot}</span><span class="desc">Ready to close</span></article>
    <article class="stat-card" style="animation-delay:.15s;cursor:pointer;" data-list-title="🌤 Warm Leads" data-list-filter="Warm"><span class="label">🌤 Warm Leads</span><span class="value" style="color:var(--gold)">${warm}</span><span class="desc">Nurture them</span></article>
    <article class="stat-card" style="animation-delay:.2s;cursor:pointer;" data-list-title="⏰ Follow-Ups Today" data-list-filter="due"><span class="label">⏰ Follow-Ups Today</span><span class="value">${due}</span><span class="desc">${due > 0 ? 'Action needed!' : 'All clear'}</span></article>
  `;

  qsa('#dashStats .stat-card').forEach((card) => {
    card.addEventListener('click', () => {
      const filter = card.dataset.listFilter;
      const list = filter === 'all' ? state.leads : filter === 'due' ? state.leads.filter((lead) => lead.followupDate && daysUntil(lead.followupDate) <= 0) : state.leads.filter((lead) => lead.status === filter);
      openLeadsListModal(card.dataset.listTitle, list);
    });
  });

  qs('#followupStripWrap').innerHTML = followupStripHtml();

  const upcoming = state.leads
    .filter((lead) => lead.followupDate)
    .sort((a, b) => a.followupDate.localeCompare(b.followupDate))
    .slice(0, 5);
  qs('#dashFollowupsList').innerHTML = upcoming.map((lead) => {
    const diff = daysUntil(lead.followupDate);
    const label = diff < 0 ? `${-diff}d overdue` : diff === 0 ? 'Due today' : `in ${diff}d`;
    return `<button class="followup-row" data-lead="${lead.id}"><span class="followup-avatar">${lead.ownerName.split(' ').map((part) => part[0]).join('').slice(0, 2)}</span><span class="followup-person"><strong>${lead.ownerName}</strong><small>${lead.bizName}</small></span><span class="followup-time">${fmtDate(lead.followupDate)}</span><span class="followup-status ${diff <= 0 ? 'is-due' : ''}">${label}</span></button>`;
  }).join('') || '<div class="empty-state">No follow-ups scheduled.</div>';
  qsa('#dashFollowupsList .followup-row').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.lead)));

  const board = qs('#dashPipelinePreview');
  board.innerHTML = STAGES.map((stage) => {
    const stageLeads = state.leads.filter((lead) => lead.stage === stage && matchesSearch(lead, searchQuery));
    return `<div class="pipeline-col"><div class="pipeline-header" style="cursor:pointer;" data-stage="${stage}">${stage}<span class="pipeline-count">${stageLeads.length}</span></div>
      <div class="pipeline-cards">${stageLeads.slice(0, 2).map((lead) => `<div class="pipeline-card" data-lead="${lead.id}"><div class="pc-name">${lead.status === 'Hot' ? '🔥 ' : ''}${lead.ownerName}</div><div class="pc-biz">${lead.bizName}</div></div>`).join('') || '<div class="pipeline-empty-col">Empty</div>'}</div></div>`;
  }).join('');

  board.querySelectorAll('.pipeline-card[data-lead]').forEach((card) => card.addEventListener('click', () => openDetail(card.dataset.lead)));
  board.querySelectorAll('.pipeline-header[data-stage]').forEach((header) => {
    header.addEventListener('click', () => openLeadsListModal(header.dataset.stage, state.leads.filter((lead) => lead.stage === header.dataset.stage)));
  });

  const hotLeads = state.leads.filter((lead) => lead.status === 'Hot' && matchesSearch(lead, searchQuery));
  qs('#dashHotTbody').innerHTML = hotLeads.map((lead) => `
    <tr data-lead="${lead.id}"><td><div class="lead-name">${lead.ownerName}</div><div class="lead-biz">${lead.bizName}</div></td><td>${lead.phone1}</td><td class="lead-price">${fmtPrice(lead.price)}</td><td><span class="badge-stage ${stageClass(lead.stage)}">${lead.stage}</span></td></tr>
  `).join('') || '<tr><td colspan="4" class="empty-state">No hot leads right now.</td></tr>';

  qsa('#dashHotTbody tr[data-lead]').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.lead)));

  qs('#dashRevenueMonthLabel').textContent = monthLabel(0);
  const closedThisMonth = state.leads.filter((lead) => lead.stage === 'Closed Won' && lead.closedDate && inMonth(lead.closedDate, 0) && matchesSearch(lead, searchQuery));
  const revTotal = closedThisMonth.reduce((sum, lead) => sum + Number(lead.price || 0), 0);
  const revAvg = closedThisMonth.length ? Math.round(revTotal / closedThisMonth.length) : 0;

  qs('#dashRevenueStats').innerHTML = `
    <article class="stat-card" style="cursor:pointer;" data-go="revenue"><span class="label">Total Revenue</span><span class="value" style="color:var(--gain)">${fmtPrice(revTotal)}</span><span class="desc">This month</span></article>
    <article class="stat-card" style="cursor:pointer;" data-go="revenue"><span class="label">Deals Closed</span><span class="value">${closedThisMonth.length}</span><span class="desc">This month</span></article>
    <article class="stat-card" style="cursor:pointer;" data-go="revenue"><span class="label">Avg Deal Size</span><span class="value">${fmtPrice(revAvg)}</span><span class="desc">This month</span></article>
  `;

  qsa('#dashRevenueStats .stat-card[data-go]').forEach((card) => card.addEventListener('click', () => switchView('revenue')));

  qs('#dashRevenueTbody').innerHTML = closedThisMonth.map((lead) => `<tr data-lead="${lead.id}" style="cursor:pointer;"><td>${lead.ownerName}</td><td>${lead.bizName}</td><td>${fmtDate(lead.closedDate)}</td><td class="lead-price">${fmtPrice(lead.price)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty-state">No deals closed this month.</td></tr>';
  qsa('#dashRevenueTbody tr[data-lead]').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.lead)));
}

function renderLeadsTable() {
  let rows = state.leads.filter((lead) => matchesSearch(lead, searchQuery));
  const statusFilter = qs('#filterStatus');
  const stageFilter = qs('#filterStage');
  const cityFilter = qs('#filterCity');

  if (statusFilter?.value) rows = rows.filter((lead) => lead.status === statusFilter.value);
  if (stageFilter?.value) rows = rows.filter((lead) => lead.stage === stageFilter.value);
  if (cityFilter?.value) rows = rows.filter((lead) => lead.city === cityFilter.value);

  if (sortKey) {
    rows = [...rows].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      return (av > bv ? 1 : av < bv ? -1 : 0) * sortDir;
    });
  }

  qs('#leadsTbody').innerHTML = rows.map((lead) => `
    <tr data-lead="${lead.id}">
      <td><div class="lead-name">${lead.status === 'Hot' ? '🔥 ' : ''}${lead.ownerName}</div><div class="lead-biz">${lead.bizName}</div></td>
      <td>${lead.dialer}</td><td>${lead.phone1}</td><td class="lead-price">${fmtPrice(lead.price)}</td>
      <td><span class="badge ${statusClass(lead.status)}">${lead.status}</span></td>
      <td><span class="badge-stage ${stageClass(lead.stage)}">${lead.stage}</span></td>
      <td>${lead.followupDate ? fmtDate(lead.followupDate) : '—'}</td>
    </tr>
  `).join('');

  qsa('#leadsTbody tr[data-lead]').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.lead)));
  const empty = qs('#leadsEmpty');
  if (empty) empty.style.display = rows.length === 0 ? 'block' : 'none';
}

function renderPipeline() {
  const board = qs('#pipelineBoard');
  board.innerHTML = STAGES.map((stage) => {
    const stageLeads = state.leads.filter((lead) => lead.stage === stage && matchesSearch(lead, searchQuery));
    return `<div class="pipeline-col"><div class="pipeline-header" style="cursor:pointer;" data-stage="${stage}">${stage}<span class="pipeline-count">${stageLeads.length}</span></div>
      <div class="pipeline-cards">${stageLeads.map((lead) => `<div class="pipeline-card" data-lead="${lead.id}"><div class="pc-name">${lead.status === 'Hot' ? '🔥 ' : ''}${lead.ownerName}</div><div class="pc-biz">${lead.bizName}</div></div>`).join('') || '<div class="pipeline-empty-col">Empty</div>'}</div></div>`;
  }).join('');

  board.querySelectorAll('.pipeline-card[data-lead]').forEach((card) => card.addEventListener('click', () => openDetail(card.dataset.lead)));
  board.querySelectorAll('.pipeline-header[data-stage]').forEach((header) => {
    header.addEventListener('click', () => openLeadsListModal(header.dataset.stage, state.leads.filter((lead) => lead.stage === header.dataset.stage)));
  });
}

function renderFollowups() {
  qs('#followupStripWrap2').innerHTML = followupStripHtml();
  let rows = state.leads.filter((lead) => lead.followupDate && matchesSearch(lead, searchQuery)).sort((a, b) => a.followupDate.localeCompare(b.followupDate));

  qs('#followupsTbody').innerHTML = rows.map((lead) => {
    const diff = daysUntil(lead.followupDate);
    const cls = diff <= 0 ? 'fu-due' : diff <= 3 ? 'fu-soon' : 'fu-ok';
    const label = diff < 0 ? `${-diff}d overdue` : diff === 0 ? 'Due today' : `in ${diff}d`;
    return `<tr data-lead="${lead.id}" style="cursor:pointer;"><td><div class="lead-name">${lead.ownerName}</div></td><td>${lead.bizName}</td><td>${lead.phone1}</td><td class="${cls}">${fmtDate(lead.followupDate)} (${label})</td><td>${lead.lastContact ? fmtDate(lead.lastContact) : '—'}</td><td><span class="badge ${statusClass(lead.status)}">${lead.status}</span></td></tr>`;
  }).join('');

  qsa('#followupsTbody tr[data-lead]').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.lead)));
  const empty = qs('#followupsEmpty');
  if (empty) empty.style.display = rows.length === 0 ? 'block' : 'none';
}

function renderRevenue() {
  qs('#revenueMonthLabel').textContent = monthLabel(revenueMonthOffset);
  qs('#nextMonthBtn').disabled = revenueMonthOffset >= 0;

  const closed = state.leads.filter((lead) => lead.stage === 'Closed Won' && lead.closedDate && inMonth(lead.closedDate, revenueMonthOffset) && matchesSearch(lead, searchQuery));
  const total = closed.reduce((sum, lead) => sum + Number(lead.price || 0), 0);
  const avg = closed.length ? Math.round(total / closed.length) : 0;

  qs('#revenueStats').innerHTML = `
    <article class="stat-card" style="cursor:pointer;" data-revenue-list="true"><span class="label">Total Revenue</span><span class="value" style="color:var(--gain)">${fmtPrice(total)}</span></article>
    <article class="stat-card" style="cursor:pointer;" data-revenue-list="true"><span class="label">Deals Closed</span><span class="value">${closed.length}</span></article>
    <article class="stat-card" style="cursor:pointer;" data-revenue-list="true"><span class="label">Avg Deal Size</span><span class="value">${fmtPrice(avg)}</span></article>
  `;

  qsa('#revenueStats .stat-card[data-revenue-list]').forEach((card) => {
    card.addEventListener('click', () => openLeadsListModal(`Closed Deals — ${monthLabel(revenueMonthOffset)}`, closed));
  });

  qs('#revenueTableTitle').textContent = `Closed Deals — ${monthLabel(revenueMonthOffset)}`;
  qs('#revenueTbody').innerHTML = closed.map((lead) => `<tr data-lead="${lead.id}"><td>${lead.ownerName}</td><td>${lead.bizName}</td><td>${fmtDate(lead.closedDate)}</td><td class="lead-price">${fmtPrice(lead.price)}</td></tr>`).join('');
  qsa('#revenueTbody tr[data-lead]').forEach((row) => row.addEventListener('click', () => openDetail(row.dataset.lead)));
  const empty = qs('#revenueEmpty');
  if (empty) empty.style.display = closed.length === 0 ? 'block' : 'none';
}

function populateCityFilter() {
  const cityFilter = qs('#filterCity');
  if (!cityFilter) return;

  const cities = [...new Set(state.leads.map((lead) => lead.city).filter(Boolean))].sort();
  cityFilter.innerHTML = '<option value="">All Cities</option>' + cities.map((city) => `<option>${city}</option>`).join('');
  if (!cityFilter.dataset.initialized) {
    cityFilter.dataset.initialized = 'true';
  }
}

function initSorting() {
  qsa('th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const key = th.dataset.sort;
      sortDir = sortKey === key ? -sortDir : 1;
      sortKey = key;
      renderLeadsTable();
    });
  });
}

function bindLeadsFilters() {
  const statusFilter = qs('#filterStatus');
  const stageFilter = qs('#filterStage');
  const cityFilter = qs('#filterCity');
  const clearFiltersButton = qs('#clearFiltersBtn');
  const exportButton = qs('#exportCsvBtn');
  const addLeadButton = qs('#addLeadBtn');

  STAGES.forEach((stage) => {
    if (stageFilter) stageFilter.insertAdjacentHTML('beforeend', `<option>${stage}</option>`);
  });

  [statusFilter, stageFilter, cityFilter].forEach((element) => {
    element?.addEventListener('change', renderLeadsTable);
  });

  clearFiltersButton?.addEventListener('click', () => {
    if (statusFilter) statusFilter.value = '';
    if (stageFilter) stageFilter.value = '';
    if (cityFilter) cityFilter.value = '';
    renderLeadsTable();
  });

  exportButton?.addEventListener('click', () => {
    const csv = exportCsv();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `Ledger_Leads_${today()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Exported to CSV!');
  });

  addLeadButton?.addEventListener('click', () => openLeadForm(null));
}

const listModal = qs('#listModal');
function openLeadsListModal(title, list) {
  qs('#listModalTitle').textContent = title;
  const body = qs('#listModalBody');
  body.innerHTML = list.length ? list.map((lead) => `<div class="pipeline-card" data-lead="${lead.id}" style="cursor:pointer;"><div class="pc-name">${lead.status === 'Hot' ? '🔥 ' : ''}${lead.ownerName}</div><div class="pc-biz">${lead.bizName} — ${fmtPrice(lead.price)}</div></div>`).join('') : '<p class="empty-state">No leads found.</p>';
  body.querySelectorAll('[data-lead]').forEach((card) => card.addEventListener('click', () => { closeListModal(); openDetail(card.dataset.lead); }));

  if (listModal) {
    listModal.classList.add('open');
    listModal.setAttribute('aria-hidden', 'false');
    lastFocusedElement = document.activeElement;
    const focusable = listModal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    setTimeout(() => focusable && focusable.focus(), 50);
  }
}

function closeListModal() {
  if (!listModal) return;
  if (lastFocusedElement) lastFocusedElement.focus();
  listModal.classList.remove('open');
  listModal.setAttribute('aria-hidden', 'true');
}

if (listModal) {
  listModal.addEventListener('click', (event) => { if (event.target === listModal) closeListModal(); });
  qs('#listModalClose')?.addEventListener('click', closeListModal);
  listModal.addEventListener('a11y-escape', closeListModal);
}

function openDetail(id) {
  const lead = state.leads.find((item) => item.id == id);
  if (!lead) return;

  activeLeadId = lead.id;
  const detailOverlay = qs('#detailOverlay');
  const statusBadge = qs('#dhStatusBadge');
  const stageBadge = qs('#dhStageBadge');

  qs('#dhName').textContent = lead.ownerName;
  qs('#dhBiz').textContent = lead.bizName;
  statusBadge.className = 'badge ' + statusClass(lead.status);
  statusBadge.textContent = lead.status;
  stageBadge.className = 'badge-stage ' + stageClass(lead.stage);
  stageBadge.textContent = lead.stage;

  qs('#dOwner').textContent = lead.ownerName || '—';
  qs('#dPhone').textContent = lead.phone1 || '—';
  qs('#dEmail').textContent = lead.email1 || '—';
  qs('#dCity').textContent = lead.city || '—';
  qs('#dDialer').textContent = lead.dialer || '—';
  qs('#dIndustry').textContent = lead.industry || '—';
  qs('#dServices').textContent = lead.services || '—';
  qs('#dPrice').textContent = fmtPrice(lead.price);
  qs('#dYelp').innerHTML = lead.yelp ? `<a href="#" onclick="return false;">${lead.yelp}</a>` : '—';
  qs('#dGmb').innerHTML = lead.gmb ? `<a href="#" onclick="return false;">${lead.gmb}</a>` : '—';
  qs('#dWebsite').innerHTML = lead.website ? `<a href="#" onclick="return false;">${lead.website}</a>` : '—';
  qs('#dFollowup').textContent = lead.followupDate ? fmtDate(lead.followupDate) : '—';
  qs('#dLastContact').textContent = lead.lastContact ? fmtDate(lead.lastContact) : '—';
  qs('#dNotes').textContent = lead.notes || 'No notes yet.';
  qs('#detailWonBtn').style.display = lead.stage === 'Closed Won' ? 'none' : '';

  if (detailOverlay) {
    detailOverlay.classList.add('open');
    detailOverlay.removeAttribute('aria-hidden');
    lastFocusedElement = document.activeElement;
  }
}

function closeDetail() {
  const detailOverlay = qs('#detailOverlay');
  if (detailOverlay) {
    if (lastFocusedElement) lastFocusedElement.focus();
    detailOverlay.classList.remove('open');
    detailOverlay.setAttribute('aria-hidden', 'true');
  }
}

function fieldError(inputId, message) {
  const input = qs(`#${inputId}`);
  if (input) {
    input.style.borderColor = 'var(--hot)';
    input.focus();
    setTimeout(() => { input.style.borderColor = ''; }, 2000);
  }
  showToast(message, 'error');
}

function isValidEmail(email) {
  return !email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone) {
  return !phone || /\d{7,}/.test(phone.replace(/[\s\-().+]/g, ''));
}

function openLeadForm(editId) {
  editingId = editId || null;
  const title = qs('#leadFormTitle');
  const modal = qs('#leadFormModal');
  const form = qs('#leadForm');
  if (title) title.textContent = editingId ? 'Edit Lead' : 'Add Lead';
  form.reset();

  if (editingId) {
    const lead = state.leads.find((item) => item.id === editingId);
    if (!lead) return;
    qs('#f-dialer').value = lead.dialer || '';
    qs('#f-owner').value = lead.ownerName || '';
    qs('#f-bizname').value = lead.bizName || '';
    qs('#f-city').value = lead.city || '';
    qs('#f-phone1').value = lead.phone1 || '';
    qs('#f-email1').value = lead.email1 || '';
    qs('#f-industry').value = lead.industry || '';
    qs('#f-price').value = lead.price || '';
    qs('#f-services').value = lead.services || '';
    qs('#f-status').value = lead.status || 'Cold';
    qs('#f-stage').value = lead.stage || 'New Lead';
    qs('#f-yelp').value = lead.yelp || '';
    qs('#f-gmb').value = lead.gmb || '';
    qs('#f-website').value = lead.website || '';
    qs('#f-followup-date').value = lead.followupDate || '';
    qs('#f-last-contact').value = lead.lastContact || '';
    qs('#f-notes').value = lead.notes || '';
  } else {
    qs('#f-status').value = 'Cold';
    qs('#f-stage').value = 'New Lead';
  }

  if (modal) {
    modal.classList.add('open');
    modal.removeAttribute('aria-hidden');
    lastFocusedElement = document.activeElement;
  }
}

function closeLeadForm() {
  const modal = qs('#leadFormModal');
  if (modal) {
    if (lastFocusedElement) lastFocusedElement.focus();
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
  }
  editingId = null;
}

if (qs('#detailClose')) qs('#detailClose').addEventListener('click', closeDetail);
if (qs('#detailWonBtn')) {
  qs('#detailWonBtn').addEventListener('click', async () => {
    const lead = state.leads.find((item) => item.id === activeLeadId);
    if (!lead) return;
    try {
      const updated = await api.updateLead(lead.id, { stage: 'Closed Won', closedDate: today() });
      state.leads = state.leads.map((item) => item.id === updated.id ? updated : item);
      closeDetail();
      renderAll();
      showToast(`${lead.ownerName} marked as Closed Won`);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
if (qs('#detailDeleteBtn')) {
  qs('#detailDeleteBtn').addEventListener('click', async () => {
    const lead = state.leads.find((item) => item.id === activeLeadId);
    if (!lead) return;
    if (!window.confirm(`Delete ${lead.ownerName} (${lead.bizName})? This cannot be undone.`)) return;
    try {
      await api.deleteLead(activeLeadId);
      state.leads = state.leads.filter((item) => item.id !== activeLeadId);
      closeDetail();
      renderAll();
      showToast(`${lead.ownerName} deleted`, 'error');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
if (qs('#detailEditBtn')) qs('#detailEditBtn').addEventListener('click', () => { closeDetail(); openLeadForm(activeLeadId); });
if (qs('#leadFormClose')) qs('#leadFormClose').addEventListener('click', closeLeadForm);
if (qs('#leadFormCancel')) qs('#leadFormCancel').addEventListener('click', closeLeadForm);
if (qs('#leadFormModal')) qs('#leadFormModal').addEventListener('click', (event) => { if (event.target === qs('#leadFormModal')) closeLeadForm(); });

qs('#leadForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();

  const dialer = qs('#f-dialer').value.trim();
  const bizName = qs('#f-bizname').value.trim();
  const phone1 = qs('#f-phone1').value.trim();
  const email1 = qs('#f-email1').value.trim();

  if (!dialer) return fieldError('f-dialer', 'Dialer Name is required!');
  if (!bizName) return fieldError('f-bizname', 'Business Name is required!');
  if (!phone1) return fieldError('f-phone1', 'Primary Phone is required!');
  if (!isValidPhone(phone1)) return fieldError('f-phone1', 'Primary phone looks invalid.');
  if (!email1) return fieldError('f-email1', 'Primary Email is required!');
  if (!isValidEmail(email1)) return fieldError('f-email1', 'Primary email format is invalid.');

  const payload = {
    dialer,
    ownerName: qs('#f-owner').value.trim(),
    bizName,
    city: qs('#f-city').value.trim(),
    phone1,
    phone2: '',
    email1,
    email2: '',
    industry: qs('#f-industry').value.trim(),
    price: Number(qs('#f-price').value) || 0,
    services: qs('#f-services').value.trim(),
    status: qs('#f-status').value,
    stage: qs('#f-stage').value,
    yelp: qs('#f-yelp').value.trim(),
    gmb: qs('#f-gmb').value.trim(),
    website: qs('#f-website').value.trim(),
    followupDate: qs('#f-followup-date').value,
    lastContact: qs('#f-last-contact').value,
    notes: qs('#f-notes').value.trim()
  };

  if (editingId) {
    const existing = state.leads.find((lead) => lead.id === editingId);
    if (payload.stage === 'Closed Won' && existing.stage !== 'Closed Won') payload.closedDate = today();
    else if (payload.stage !== 'Closed Won') payload.closedDate = '';
    try {
      const updated = await api.updateLead(editingId, payload);
      state.leads = state.leads.map((lead) => lead.id === updated.id ? updated : lead);
      showToast('Lead updated!');
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }
  } else {
    if (payload.stage === 'Closed Won') payload.closedDate = today();
    try {
      const created = await api.createLead(payload);
      state.leads.push(created);
      showToast('Lead added!');
    } catch (error) {
      showToast(error.message, 'error');
      return;
    }
  }

  closeLeadForm();
  renderAll();
});

if (qs('#prevMonthBtn')) qs('#prevMonthBtn').addEventListener('click', () => { revenueMonthOffset--; renderRevenue(); });
if (qs('#nextMonthBtn')) qs('#nextMonthBtn').addEventListener('click', () => { if (revenueMonthOffset < 0) { revenueMonthOffset++; renderRevenue(); } });

window.openDetail = openDetail;
window.openLeadsListModal = openLeadsListModal;
window.closeListModal = closeListModal;
window.switchView = switchView;

async function initializeApp() {
  bindNavigation();
  initNotifications();
  initProfile();
  initSettings();
  initShortcuts();
  initSorting();
  bindLeadsFilters();

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const hasOpenDetail = qs('#detailOverlay')?.classList.contains('open');
      const hasOpenList = qs('#listModal')?.classList.contains('open');
      const hasOpenLeadForm = qs('#leadFormModal')?.classList.contains('open');
      const hasOpenNotificationModal = qs('#notifModal')?.classList.contains('open');
      const hasOpenLogout = qs('#logoutConfirmModal')?.classList.contains('open');

      if (hasOpenDetail) closeDetail();
      else if (hasOpenList) closeListModal();
      else if (hasOpenLeadForm) closeLeadForm();
      else if (hasOpenNotificationModal) {
        const notifModal = qs('#notifModal');
        const notifButton = qs('#notifBtn');
        notifButton?.focus?.();
        notifModal?.classList.remove('open');
        notifModal?.setAttribute('aria-hidden', 'true');
      }
      else if (hasOpenLogout) {
        const logoutModal = qs('#logoutConfirmModal');
        const logoutButton = qs('#logoutBtn');
        logoutButton?.focus?.();
        logoutModal?.classList.remove('open');
        logoutModal?.setAttribute('aria-hidden', 'true');
      }
    }
  });

  document.addEventListener('ledger:render', (event) => {
    renderAll({ searchQuery: event.detail?.searchQuery ?? searchQuery });
  });

  try {
    state.leads = await api.listLeads();
  } catch (error) {
    showToast(`Could not load leads: ${error.message}`, 'error');
  }
  renderAll();
}

initializeApp();
export { renderAll, renderDashboard, renderLeadsTable, renderPipeline, renderFollowups, renderRevenue, switchView, openDetail };
