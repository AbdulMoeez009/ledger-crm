export const STAGES = ['New Lead', 'Contacted', 'Follow-Up', 'Interested', 'Closed Won', 'Closed Lost'];

export const state = {
  nextId: 8,
  leads: [
    { id: 1, dialer: 'Faisal', ownerName: 'Layla Farooq', bizName: 'BrightPath Co.', industry: 'Retail', city: 'Lahore', price: 6200, services: 'SEO, Google Ads', phone1: '+92 300 1112233', phone2: '', email1: 'layla@brightpath.co', email2: '', yelp: '', gmb: '', website: 'brightpath.co', status: 'Warm', stage: 'New Lead', followupDate: '2026-08-17', lastContact: '2026-08-14', notes: 'Interested in a starter SEO package.' },
    { id: 2, dialer: 'Sana', ownerName: 'Ahsan Raza', bizName: 'Nova Traders', industry: 'Wholesale', city: 'Karachi', price: 14500, services: 'Full digital package', phone1: '+92 321 4445566', phone2: '', email1: 'ahsan@novatraders.com', email2: '', yelp: '', gmb: 'novatraders', website: 'novatraders.com', status: 'Hot', stage: 'Contacted', followupDate: '2026-08-16', lastContact: '2026-08-15', notes: 'Follow-up call scheduled today at 3 PM.' },
    { id: 3, dialer: 'Faisal', ownerName: 'Zainab Sheikh', bizName: 'Horizon Retail', industry: 'E-commerce', city: 'Islamabad', price: 18400, services: 'Paid ads + branding', phone1: '+92 333 7778899', phone2: '', email1: 'zainab@horizonretail.com', email2: '', yelp: 'horizon-retail', gmb: '', website: 'horizonretail.com', status: 'Hot', stage: 'Interested', followupDate: '2026-08-18', lastContact: '2026-08-15', notes: 'Proposal sent, awaiting sign-off.' },
    { id: 4, dialer: 'Sana', ownerName: 'Bilal Khan', bizName: 'Urban Tech', industry: 'SaaS', city: 'Lahore', price: 9750, services: 'SEO + content', phone1: '+92 345 1230099', phone2: '', email1: 'bilal@urbantech.io', email2: '', yelp: '', gmb: '', website: 'urbantech.io', status: 'Warm', stage: 'Contacted', followupDate: '2026-08-20', lastContact: '2026-08-12', notes: '' },
    { id: 5, dialer: 'Faisal', ownerName: 'Hina Malik', bizName: 'PixelForge', industry: 'Design Studio', city: 'Karachi', price: 5100, services: 'Social media management', phone1: '+92 300 8887766', phone2: '', email1: 'hina@pixelforge.design', email2: '', yelp: '', gmb: 'pixelforge', website: 'pixelforge.design', status: 'Warm', stage: 'Closed Won', followupDate: '', lastContact: '2026-08-09', closedDate: '2026-08-10', notes: 'Signed a 6-month retainer.' },
    { id: 6, dialer: 'Sana', ownerName: 'Usman Tariq', bizName: 'Skyline Logistics', industry: 'Logistics', city: 'Faisalabad', price: 7300, services: 'Website redesign', phone1: '+92 302 5556677', phone2: '', email1: 'usman@skylinelog.com', email2: '', yelp: '', gmb: '', website: '', status: 'Cold', stage: 'Closed Lost', followupDate: '', lastContact: '2026-07-28', notes: 'Went with a competitor.' },
    { id: 7, dialer: 'Faisal', ownerName: 'Mariam Iqbal', bizName: 'GreenLeaf Organics', industry: 'Food & Beverage', city: 'Lahore', price: 11200, services: 'Branding + SEO', phone1: '+92 311 9998877', phone2: '', email1: 'mariam@greenleaf.pk', email2: '', yelp: '', gmb: '', website: '', status: 'Cold', stage: 'New Lead', followupDate: '2026-08-22', lastContact: '', notes: '' }
  ]
};

export function fmtPrice(n) {
  return '$' + Number(n || 0).toLocaleString();
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const t = new Date(today());
  return Math.round((d - t) / 86400000);
}

export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function statusClass(s) {
  return s === 'Hot' ? 'badge-hot' : s === 'Warm' ? 'badge-warm' : 'badge-cold';
}

export function stageClass(s) {
  return s === 'Closed Won' ? 'stage-won' : s === 'Closed Lost' ? 'stage-lost' : '';
}

export function monthLabel(offset) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function inMonth(dateStr, offset) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const ref = new Date();
  ref.setMonth(ref.getMonth() + offset);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function matchesSearch(lead, query) {
  if (!query) return true;
  const haystack = [lead.ownerName, lead.bizName, lead.dialer, lead.phone1, lead.email1].join(' ').toLowerCase();
  return haystack.includes(query);
}

export function exportCsv() {
  const headers = ['ID', 'Dialer', 'Owner', 'Business', 'Industry', 'City', 'Price', 'Services', 'Phone', 'Email', 'Status', 'Stage', 'Follow-Up', 'Last Contact'];
  const rows = state.leads.map((lead) => [
    lead.id,
    lead.dialer,
    lead.ownerName,
    lead.bizName,
    lead.industry,
    lead.city,
    lead.price,
    lead.services,
    lead.phone1,
    lead.email1,
    lead.status,
    lead.stage,
    lead.followupDate,
    lead.lastContact
  ].map((value) => `"${String(value || '').replace(/"/g, '""')}"`));

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}
