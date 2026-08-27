const express = require('express');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const port = process.env.PORT || 8000;
const database = new DatabaseSync(path.join(__dirname, 'ledger.db'));

database.exec('PRAGMA foreign_keys = ON');
database.exec(`
  CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dialer TEXT NOT NULL CHECK (length(trim(dialer)) > 0),
    ownerName TEXT NOT NULL DEFAULT '',
    bizName TEXT NOT NULL CHECK (length(trim(bizName)) > 0),
    city TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
    services TEXT NOT NULL DEFAULT '',
    phone1 TEXT NOT NULL CHECK (length(trim(phone1)) > 0),
    phone2 TEXT NOT NULL DEFAULT '',
    email1 TEXT NOT NULL UNIQUE CHECK (length(trim(email1)) > 0),
    email2 TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT '',
    yelp TEXT NOT NULL DEFAULT '',
    gmb TEXT NOT NULL DEFAULT '',
    website TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Cold' CHECK (status IN ('Hot', 'Warm', 'Cold')),
    stage TEXT NOT NULL DEFAULT 'New Lead' CHECK (stage IN ('New Lead', 'Contacted', 'Follow-Up', 'Interested', 'Closed Won', 'Closed Lost')),
    followupDate TEXT NOT NULL DEFAULT '',
    lastContact TEXT NOT NULL DEFAULT '',
    closedDate TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT ''
  )
`);

database.exec(`
  CREATE TABLE IF NOT EXISTS dialers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
  )
`);
database.prepare('INSERT OR IGNORE INTO dialers (name) VALUES (?)').run('Faisal');
database.prepare('INSERT OR IGNORE INTO dialers (name) VALUES (?)').run('Sana');
const dialerIdByName = database.prepare('SELECT id FROM dialers WHERE name = ?');
const leadColumns = database.prepare('PRAGMA table_info(leads)').all().map((column) => column.name);
if (!leadColumns.includes('dialer_id')) database.exec('ALTER TABLE leads ADD COLUMN dialer_id INTEGER REFERENCES dialers(id)');
database.exec(`
  UPDATE leads SET dialer_id = (SELECT id FROM dialers WHERE dialers.name = leads.dialer)
  WHERE dialer_id IS NULL
`);

const seedLeads = [
  ['Faisal', 'Layla Farooq', 'BrightPath Co.', 'Lahore', 6200, 'SEO, Google Ads', '+92 300 1112233', 'layla@brightpath.co', 'Retail', 'brightpath.co', 'Warm', 'New Lead', '2026-08-17', '2026-08-14', '', 'Interested in a starter SEO package.'],
  ['Sana', 'Ahsan Raza', 'Nova Traders', 'Karachi', 14500, 'Full digital package', '+92 321 4445566', 'ahsan@novatraders.com', 'Wholesale', 'novatraders.com', 'Hot', 'Contacted', '2026-08-16', '2026-08-15', '', 'Follow-up call scheduled today at 3 PM.'],
  ['Faisal', 'Zainab Sheikh', 'Horizon Retail', 'Islamabad', 18400, 'Paid ads + branding', '+92 333 7778899', 'zainab@horizonretail.com', 'E-commerce', 'horizonretail.com', 'Hot', 'Interested', '2026-08-18', '2026-08-15', '', 'Proposal sent, awaiting sign-off.'],
  ['Sana', 'Bilal Khan', 'Urban Tech', 'Lahore', 9750, 'SEO + content', '+92 345 1230099', 'bilal@urbantech.io', 'SaaS', 'urbantech.io', 'Warm', 'Contacted', '2026-08-20', '2026-08-12', '', ''],
  ['Faisal', 'Hina Malik', 'PixelForge', 'Karachi', 5100, 'Social media management', '+92 300 8887766', 'hina@pixelforge.design', 'Design Studio', 'pixelforge.design', 'Warm', 'Closed Won', '', '2026-08-09', '2026-08-10', 'Signed a 6-month retainer.'],
  ['Sana', 'Usman Tariq', 'Skyline Logistics', 'Faisalabad', 7300, 'Website redesign', '+92 302 5556677', 'usman@skylinelog.com', 'Logistics', '', 'Cold', 'Closed Lost', '', '2026-07-28', '', 'Went with a competitor.'],
  ['Faisal', 'Mariam Iqbal', 'GreenLeaf Organics', 'Lahore', 11200, 'Branding + SEO', '+92 311 9998877', 'mariam@greenleaf.pk', 'Food & Beverage', '', 'Cold', 'New Lead', '2026-08-22', '', '', '']
];
if (database.prepare('SELECT COUNT(*) AS count FROM leads').get().count === 0) {
  const insert = database.prepare(`INSERT INTO leads
    (dialer, ownerName, bizName, city, price, services, phone1, email1, industry, website, status, stage, followupDate, lastContact, closedDate, notes, dialer_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  seedLeads.forEach((lead) => insert.run(...lead, dialerIdByName.get(lead[0]).id));
}

app.use(express.json({ limit: '100kb' }));
app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const fields = ['dialer', 'ownerName', 'bizName', 'city', 'price', 'services', 'phone1', 'phone2', 'email1', 'email2', 'industry', 'yelp', 'gmb', 'website', 'status', 'stage', 'followupDate', 'lastContact', 'closedDate', 'notes'];
const readLeads = database.prepare('SELECT * FROM leads ORDER BY id');
const readLead = database.prepare('SELECT * FROM leads WHERE id = ?');

function validateLead(input, partial = false) {
  const errors = [];
  if (!partial || input.dialer !== undefined) if (!String(input.dialer || '').trim()) errors.push('dialer is required');
  if (!partial || input.bizName !== undefined) if (!String(input.bizName || '').trim()) errors.push('bizName is required');
  if (!partial || input.phone1 !== undefined) if (!String(input.phone1 || '').trim()) errors.push('phone1 is required');
  if (!partial || input.email1 !== undefined) {
    if (!String(input.email1 || '').trim()) errors.push('email1 is required');
    else if (!/^\S+@\S+\.\S+$/.test(input.email1)) errors.push('email1 must be a valid email');
  }
  if (input.price !== undefined && (!Number.isFinite(Number(input.price)) || Number(input.price) < 0)) errors.push('price must be a non-negative number');
  if (input.status !== undefined && !['Hot', 'Warm', 'Cold'].includes(input.status)) errors.push('invalid status');
  if (input.stage !== undefined && !['New Lead', 'Contacted', 'Follow-Up', 'Interested', 'Closed Won', 'Closed Lost'].includes(input.stage)) errors.push('invalid stage');
  return errors;
}

function ensureDialerId(name) {
  database.prepare('INSERT OR IGNORE INTO dialers (name) VALUES (?)').run(String(name).trim());
  return dialerIdByName.get(String(name).trim()).id;
}

function isUniqueConstraint(error) {
  return String(error.code || '').includes('CONSTRAINT_UNIQUE') || String(error.message || '').includes('UNIQUE constraint failed');
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', database: 'sqlite' }));
app.get('/api/leads', (req, res) => res.json(readLeads.all()));

app.post('/api/leads', (req, res) => {
  const errors = validateLead(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const values = fields.map((field) => req.body[field] ?? (field === 'price' ? 0 : ''));
  try {
    const result = database.prepare(`INSERT INTO leads (${fields.join(', ')}, dialer_id) VALUES (${fields.map(() => '?').join(', ')}, ?)`).run(...values, ensureDialerId(req.body.dialer));
    return res.status(201).json(readLead.get(result.lastInsertRowid));
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'email1 must be unique' });
    return res.status(400).json({ error: 'Lead could not be created' });
  }
});

app.put('/api/leads/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid lead id' });
  const errors = validateLead(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const values = fields.map((field) => req.body[field] ?? (field === 'price' ? 0 : ''));
  try {
    const result = database.prepare(`UPDATE leads SET ${fields.map((field) => `${field} = ?`).join(', ')}, dialer_id = ? WHERE id = ?`).run(...values, ensureDialerId(req.body.dialer), id);
    if (!result.changes) return res.status(404).json({ error: 'Lead not found' });
    return res.json(readLead.get(id));
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'email1 must be unique' });
    return res.status(400).json({ error: 'Lead could not be replaced' });
  }
});

app.patch('/api/leads/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid lead id' });
  const errors = validateLead(req.body, true);
  if (errors.length) return res.status(400).json({ error: errors.join(', ') });
  const updates = fields.filter((field) => req.body[field] !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'No fields to update' });
  try {
    const updateFields = [...updates];
    const updateValues = updates.map((field) => req.body[field]);
    if (req.body.dialer !== undefined) {
      updateFields.push('dialer_id');
      updateValues.push(ensureDialerId(req.body.dialer));
    }
    const result = database.prepare(`UPDATE leads SET ${updateFields.map((field) => `${field} = ?`).join(', ')} WHERE id = ?`).run(...updateValues, id);
    if (!result.changes) return res.status(404).json({ error: 'Lead not found' });
    return res.json(readLead.get(id));
  } catch (error) {
    if (isUniqueConstraint(error)) return res.status(409).json({ error: 'email1 must be unique' });
    return res.status(400).json({ error: 'Lead could not be updated' });
  }
});

app.delete('/api/leads/:id', (req, res) => {
  const result = database.prepare('DELETE FROM leads WHERE id = ?').run(Number(req.params.id));
  if (!result.changes) return res.status(404).json({ error: 'Lead not found' });
  return res.status(204).send();
});

app.use(express.static(__dirname));
app.listen(port, () => console.log(`Ledger CRM running at http://localhost:${port}`));