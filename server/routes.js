import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|heic/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) &&
               allowed.test(file.mimetype.replace('image/', ''));
    cb(ok ? null : new Error('Only image files are allowed'), ok);
  }
});

// --- Reports ---

router.get('/reports', (req, res) => {
  const { status, severity, limit = 200, offset = 0 } = req.query;
  let sql = 'SELECT * FROM reports WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (severity) {
    sql += ' AND severity = ?';
    params.push(severity);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const rows = db.prepare(sql).all(...params);
  const parsed = rows.map(r => ({ ...r, photos: JSON.parse(r.photos || '[]') }));
  res.json(parsed);
});

router.get('/reports/:id', (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const comments = db.prepare('SELECT * FROM comments WHERE report_id = ? ORDER BY created_at ASC').all(req.params.id);
  const confirmations = db.prepare('SELECT * FROM confirmations WHERE report_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({
    ...report,
    photos: JSON.parse(report.photos || '[]'),
    comments,
    confirmations
  });
});

router.post('/reports', upload.array('photos', 5), (req, res) => {
  const { description, severity, latitude, longitude, address, reporter_name } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Missing required fields: latitude, longitude' });
  }

  const id = uuidv4();
  const photos = (req.files || []).map(f => `/uploads/${f.filename}`);

  db.prepare(`
    INSERT INTO reports (id, description, severity, latitude, longitude, address, reporter_name, photos)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, description || '', severity || 'medium', Number(latitude), Number(longitude), address || '', reporter_name || 'Anonymous', JSON.stringify(photos));

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
  res.status(201).json({ ...report, photos: JSON.parse(report.photos) });
});

router.patch('/reports/:id', upload.array('photos', 5), (req, res) => {
  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const { description, severity, address } = req.body;
  const sets = [];
  const params = [];

  if (description !== undefined) { sets.push('description = ?'); params.push(description); }
  if (severity && ['low', 'medium', 'high', 'critical'].includes(severity)) { sets.push('severity = ?'); params.push(severity); }
  if (address !== undefined) { sets.push('address = ?'); params.push(address); }

  const newPhotos = (req.files || []).map(f => `/uploads/${f.filename}`);
  if (newPhotos.length > 0) {
    const existing = JSON.parse(report.photos || '[]');
    const merged = [...existing, ...newPhotos].slice(0, 5);
    sets.push('photos = ?');
    params.push(JSON.stringify(merged));
  }

  if (sets.length === 0) {
    return res.json({ ...report, photos: JSON.parse(report.photos || '[]') });
  }

  sets.push("updated_at = datetime('now')");
  params.push(req.params.id);

  db.prepare(`UPDATE reports SET ${sets.join(', ')} WHERE id = ?`).run(...params);
  const updated = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  res.json({ ...updated, photos: JSON.parse(updated.photos || '[]') });
});

router.patch('/reports/:id/status', (req, res) => {
  const { status } = req.body;
  if (!['active', 'fixed', 'disputed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const result = db.prepare("UPDATE reports SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Report not found' });

  const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
  res.json({ ...report, photos: JSON.parse(report.photos || '[]') });
});

// --- Comments ---

router.post('/reports/:id/comments', (req, res) => {
  const { text, author_name } = req.body;
  if (!text) return res.status(400).json({ error: 'Comment text is required' });

  const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const id = uuidv4();
  db.prepare('INSERT INTO comments (id, report_id, author_name, text) VALUES (?, ?, ?, ?)')
    .run(id, req.params.id, author_name || 'Anonymous', text);

  const comment = db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
  res.status(201).json(comment);
});

// --- Confirmations ---

router.post('/reports/:id/confirm', (req, res) => {
  const { confirmed_by, still_there = true } = req.body;

  const report = db.prepare('SELECT id FROM reports WHERE id = ?').get(req.params.id);
  if (!report) return res.status(404).json({ error: 'Report not found' });

  const id = uuidv4();
  const stillThereInt = still_there ? 1 : 0;

  db.prepare('INSERT INTO confirmations (id, report_id, confirmed_by, still_there) VALUES (?, ?, ?, ?)')
    .run(id, req.params.id, confirmed_by || 'Anonymous', stillThereInt);

  if (still_there) {
    db.prepare("UPDATE reports SET confirmations = confirmations + 1, updated_at = datetime('now') WHERE id = ?").run(req.params.id);
  }

  const totalConfirmations = db.prepare('SELECT COUNT(*) as count FROM confirmations WHERE report_id = ? AND still_there = 1').get(req.params.id);
  const totalDisputes = db.prepare('SELECT COUNT(*) as count FROM confirmations WHERE report_id = ? AND still_there = 0').get(req.params.id);

  res.status(201).json({
    id,
    report_id: req.params.id,
    still_there: !!stillThereInt,
    total_confirmations: totalConfirmations.count,
    total_disputes: totalDisputes.count
  });
});

// --- Stats ---

router.get('/stats', (_req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM reports').get();
  const active = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'active'").get();
  const fixed = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'fixed'").get();
  const bySeverity = db.prepare("SELECT severity, COUNT(*) as count FROM reports GROUP BY severity").all();

  res.json({
    total: total.count,
    active: active.count,
    fixed: fixed.count,
    bySeverity: Object.fromEntries(bySeverity.map(r => [r.severity, r.count]))
  });
});

export default router;
