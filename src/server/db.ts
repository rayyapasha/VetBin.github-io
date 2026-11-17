import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import {
  SEED_BINS as INITIAL_BINS,
  SEED_REPORTS as INITIAL_REPORTS,
  SEED_VOUCHERS as INITIAL_VOUCHERS,
  SEED_REDEMPTIONS as INITIAL_REDEMPTIONS
} from '../data/campusSeedData';
import {
  AuthRole,
  AuthUser,
  BinStatus,
  CampusBin,
  CampusVoucher,
  RedemptionRecord,
  ReportIssueType,
  ReportStatus,
  ReporterRole,
  UserReport,
  VoucherCategory,
  VoucherStatus,
  WasteCategory
} from '../types';
import { generateSessionToken, hashPassword, verifyPassword } from './authUtils';
import { generatePhpMyAdminSqlDump, SqlDumpUserRow } from '../utils/sqlDumpGenerator';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'vetbin.db');
const SQL_DUMP_PATH = path.resolve(process.cwd(), 'database', 'vetbin_phpmyadmin.sql');

let dbInstance: DatabaseSync | null = null;

function ensureDb(): DatabaseSync {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'petugas', 'user')),
      full_name TEXT NOT NULL,
      points INTEGER NOT NULL DEFAULT 0,
      bottles_count INTEGER NOT NULL DEFAULT 0,
      food_wrappers_count INTEGER NOT NULL DEFAULT 0,
      organic_kg REAL NOT NULL DEFAULT 0,
      improvement_percent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS campus_bins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      building TEXT NOT NULL,
      location_detail TEXT NOT NULL,
      distance_m INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Kosong',
      capacity_kg INTEGER NOT NULL DEFAULT 40,
      last_emptied TEXT NOT NULL,
      reported_minutes_ago INTEGER,
      qr_printed INTEGER NOT NULL DEFAULT 1,
      coord_x REAL NOT NULL,
      coord_y REAL NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS user_reports (
      id TEXT PRIMARY KEY,
      bin_id TEXT NOT NULL,
      bin_name TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT NOT NULL,
      issue_type TEXT NOT NULL,
      photo_url TEXT,
      timestamp TEXT NOT NULL,
      time_ago_text TEXT NOT NULL,
      reporter TEXT NOT NULL,
      reported_by_username TEXT,
      status TEXT NOT NULL DEFAULT 'Baru',
      notes TEXT,
      assigned_to_petugas INTEGER NOT NULL DEFAULT 0,
      assigned_at TEXT,
      admin_verification_note TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS campus_vouchers (
      id TEXT PRIMARY KEY,
      partner_name TEXT NOT NULL,
      voucher_title TEXT NOT NULL,
      category TEXT NOT NULL,
      point_cost INTEGER NOT NULL,
      stock INTEGER NOT NULL DEFAULT 0,
      redeemed_count INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Aktif',
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS redemption_records (
      id TEXT PRIMARY KEY,
      voucher_id TEXT NOT NULL,
      voucher_title TEXT NOT NULL,
      partner_name TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_id TEXT,
      points_spent INTEGER NOT NULL,
      time_ago_text TEXT NOT NULL,
      redeem_code TEXT NOT NULL UNIQUE,
      timestamp TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Migrate existing users table if created before 'petugas' role was introduced
  const usersSchema = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'users'")
    .get() as { sql?: string } | undefined;
  if (usersSchema?.sql && !usersSchema.sql.includes("'petugas'")) {
    db.exec(`
      PRAGMA foreign_keys = OFF;
      BEGIN;
      CREATE TABLE users_new (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'petugas', 'user')),
        full_name TEXT NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        bottles_count INTEGER NOT NULL DEFAULT 0,
        food_wrappers_count INTEGER NOT NULL DEFAULT 0,
        organic_kg REAL NOT NULL DEFAULT 0,
        improvement_percent INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
      INSERT INTO users_new SELECT * FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;
      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }

  dbInstance = db;
  seedInitialDataIfEmpty(db);
  return db;
}

function seedInitialDataIfEmpty(db: DatabaseSync) {
  const userCountRow = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
  const now = new Date().toISOString();
  const insertUser = db.prepare(`
    INSERT INTO users (
      id, username, password_hash, role, full_name,
      points, bottles_count, food_wrappers_count, organic_kg, improvement_percent, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  if (userCountRow.cnt === 0) {
    // Default Admin account: Admin / Admin
    insertUser.run(
      'usr-admin',
      'Admin',
      hashPassword('Admin'),
      'admin',
      'Administrator Sarpras Kampus',
      0,
      0,
      0,
      0,
      0,
      now
    );

    // Default Petugas Kebersihan account: Petugas / Petugas
    insertUser.run(
      'usr-petugas',
      'Petugas',
      hashPassword('Petugas'),
      'petugas',
      'Petugas Kebersihan Kampus',
      0,
      0,
      0,
      0,
      0,
      now
    );

    // Default Student / Regular User account: 2510501272@kampus.ac.id / 2510501272@kampus.ac.id
    insertUser.run(
      'usr-2510501272',
      '2510501272@kampus.ac.id',
      hashPassword('2510501272@kampus.ac.id'),
      'user',
      'Mahasiswa (2510501272)',
      1240,
      86,
      32,
      14,
      22,
      now
    );
  } else {
    // Ensure default Petugas account exists in pre-seeded databases
    const existingPetugas = db.prepare("SELECT id FROM users WHERE role = 'petugas' OR username = 'Petugas'").get();
    if (!existingPetugas) {
      insertUser.run(
        'usr-petugas',
        'Petugas',
        hashPassword('Petugas'),
        'petugas',
        'Petugas Kebersihan Kampus',
        0,
        0,
        0,
        0,
        0,
        now
      );
    }
  }

  const binCountRow = db.prepare('SELECT COUNT(*) as cnt FROM campus_bins').get() as { cnt: number };
  if (binCountRow.cnt === 0) {
    const insertBin = db.prepare(`
      INSERT INTO campus_bins (
        id, name, category, building, location_detail, distance_m, status,
        capacity_kg, last_emptied, reported_minutes_ago, qr_printed, coord_x, coord_y, description, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    INITIAL_BINS.forEach((b, idx) => {
      insertBin.run(
        b.id,
        b.name,
        b.category,
        b.building,
        b.locationDetail,
        b.distanceM,
        b.status,
        b.capacityKg,
        b.lastEmptied,
        b.reportedMinutesAgo ?? null,
        b.qrPrinted ? 1 : 0,
        b.coordinates.x,
        b.coordinates.y,
        b.description ?? null,
        idx
      );
    });
  }

  const reportCountRow = db.prepare('SELECT COUNT(*) as cnt FROM user_reports').get() as { cnt: number };
  if (reportCountRow.cnt === 0) {
    const insertReport = db.prepare(`
      INSERT INTO user_reports (
        id, bin_id, bin_name, category, location, issue_type, photo_url, timestamp,
        time_ago_text, reporter, reported_by_username, status, notes, assigned_to_petugas,
        assigned_at, admin_verification_note, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    INITIAL_REPORTS.forEach((r, idx) => {
      insertReport.run(
        r.id,
        r.binId,
        r.binName,
        r.category,
        r.location,
        r.issueType,
        r.photoUrl ?? null,
        r.timestamp,
        r.timeAgoText,
        r.reporter,
        r.reportedByUsername ?? null,
        r.status,
        r.notes ?? null,
        r.assignedToPetugas ? 1 : 0,
        r.assignedAt ?? null,
        r.adminVerificationNote ?? null,
        idx
      );
    });
  }

  const voucherCountRow = db.prepare('SELECT COUNT(*) as cnt FROM campus_vouchers').get() as { cnt: number };
  if (voucherCountRow.cnt === 0) {
    const insertVoucher = db.prepare(`
      INSERT INTO campus_vouchers (
        id, partner_name, voucher_title, category, point_cost, stock, redeemed_count, status, description, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    INITIAL_VOUCHERS.forEach((v, idx) => {
      insertVoucher.run(
        v.id,
        v.partnerName,
        v.voucherTitle,
        v.category,
        v.pointCost,
        v.stock,
        v.redeemedCount,
        v.status,
        v.description,
        idx
      );
    });
  }

  const redemptionCountRow = db.prepare('SELECT COUNT(*) as cnt FROM redemption_records').get() as { cnt: number };
  if (redemptionCountRow.cnt === 0) {
    const insertRedemption = db.prepare(`
      INSERT INTO redemption_records (
        id, voucher_id, voucher_title, partner_name, user_name, user_id, points_spent,
        time_ago_text, redeem_code, timestamp, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    INITIAL_REDEMPTIONS.forEach((rec, idx) => {
      insertRedemption.run(
        rec.id,
        rec.voucherId,
        rec.voucherTitle,
        rec.partnerName,
        rec.userName,
        rec.userId ?? null,
        rec.pointsSpent,
        rec.timeAgoText,
        rec.redeemCode,
        rec.timestamp,
        idx
      );
    });
  }
}

function mapUserRow(row: any): AuthUser {
  return {
    id: row.id,
    username: row.username,
    role: row.role as AuthRole,
    fullName: row.full_name,
    points: Number(row.points),
    bottlesCount: Number(row.bottles_count),
    foodWrappersCount: Number(row.food_wrappers_count),
    organicKg: Number(row.organic_kg),
    improvementPercent: Number(row.improvement_percent)
  };
}

function mapBinRow(row: any): CampusBin {
  return {
    id: row.id,
    name: row.name,
    category: row.category as WasteCategory,
    building: row.building,
    locationDetail: row.location_detail,
    distanceM: Number(row.distance_m),
    status: row.status as BinStatus,
    capacityKg: Number(row.capacity_kg),
    lastEmptied: row.last_emptied,
    reportedMinutesAgo: row.reported_minutes_ago !== null && row.reported_minutes_ago !== undefined ? Number(row.reported_minutes_ago) : undefined,
    qrPrinted: Boolean(row.qr_printed),
    coordinates: { x: Number(row.coord_x), y: Number(row.coord_y) },
    description: row.description ?? undefined
  };
}

function mapReportRow(row: any): UserReport {
  return {
    id: row.id,
    binId: row.bin_id,
    binName: row.bin_name,
    category: row.category as WasteCategory,
    location: row.location,
    issueType: row.issue_type as ReportIssueType,
    photoUrl: row.photo_url ?? undefined,
    timestamp: row.timestamp,
    timeAgoText: row.time_ago_text,
    reporter: row.reporter as ReporterRole,
    reportedByUsername: row.reported_by_username ?? undefined,
    status: row.status as ReportStatus,
    notes: row.notes ?? undefined,
    assignedToPetugas: Boolean(row.assigned_to_petugas),
    assignedAt: row.assigned_at ?? undefined,
    adminVerificationNote: row.admin_verification_note ?? undefined
  };
}

function mapVoucherRow(row: any): CampusVoucher {
  return {
    id: row.id,
    partnerName: row.partner_name,
    voucherTitle: row.voucher_title,
    category: row.category as VoucherCategory,
    pointCost: Number(row.point_cost),
    stock: Number(row.stock),
    redeemedCount: Number(row.redeemed_count),
    status: row.status as VoucherStatus,
    description: row.description
  };
}

function mapRedemptionRow(row: any): RedemptionRecord {
  return {
    id: row.id,
    voucherId: row.voucher_id,
    voucherTitle: row.voucher_title,
    partnerName: row.partner_name,
    userName: row.user_name,
    userId: row.user_id ?? undefined,
    pointsSpent: Number(row.points_spent),
    timeAgoText: row.time_ago_text,
    redeemCode: row.redeem_code,
    timestamp: row.timestamp
  };
}

/**
 * Persists the current SQLite state to `/database/vetbin_phpmyadmin.sql`
 * so the `.sql` dump file on disk always matches the latest database state.
 */
export function syncSqlDumpFileToDisk(): void {
  try {
    const sql = generateLiveSqlDump();
    const dir = path.dirname(SQL_DUMP_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SQL_DUMP_PATH, sql, 'utf-8');
  } catch (err) {
    console.error('Failed to sync vetbin_phpmyadmin.sql:', err);
  }
}

export function initDatabase(): void {
  ensureDb();
  syncSqlDumpFileToDisk();
}

export function getFullState() {
  const db = ensureDb();
  const bins = db
    .prepare('SELECT * FROM campus_bins ORDER BY sort_order ASC, id ASC')
    .all()
    .map(mapBinRow);
  const reports = db
    .prepare('SELECT * FROM user_reports ORDER BY sort_order ASC, timestamp DESC')
    .all()
    .map(mapReportRow);
  const vouchers = db
    .prepare('SELECT * FROM campus_vouchers ORDER BY sort_order ASC, id ASC')
    .all()
    .map(mapVoucherRow);
  const redemptions = db
    .prepare('SELECT * FROM redemption_records ORDER BY sort_order ASC, timestamp DESC')
    .all()
    .map(mapRedemptionRow);

  return { bins, reports, vouchers, redemptions };
}

export function generateLiveSqlDump(): string {
  const db = ensureDb();
  const state = getFullState();
  const users: SqlDumpUserRow[] = db
    .prepare('SELECT * FROM users ORDER BY created_at ASC')
    .all()
    .map((u: any) => ({
      id: u.id,
      username: u.username,
      passwordHash: u.password_hash,
      role: u.role as AuthRole,
      fullName: u.full_name,
      points: Number(u.points),
      bottlesCount: Number(u.bottles_count),
      foodWrappersCount: Number(u.food_wrappers_count),
      organicKg: Number(u.organic_kg),
      improvementPercent: Number(u.improvement_percent),
      createdAt: u.created_at
    }));

  return generatePhpMyAdminSqlDump({
    databaseName: 'vetbin_db',
    users,
    bins: state.bins,
    reports: state.reports,
    vouchers: state.vouchers,
    redemptions: state.redemptions
  });
}

// ======================= AUTHENTICATION =======================

export function authenticateUser(username: string, password: string): { token: string; user: AuthUser } | null {
  const db = ensureDb();
  const trimmedUser = username.trim();
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(trimmedUser) as any;
  if (!row) return null;

  if (!verifyPassword(password, row.password_hash)) {
    return null;
  }

  const token = generateSessionToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, row.id, now.toISOString(), expiresAt);

  return { token, user: mapUserRow(row) };
}

export function registerCampusUser(
  username: string,
  password: string,
  fullName?: string
): { token: string; user: AuthUser } | { error: string } {
  const db = ensureDb();
  const trimmedUser = username.trim();
  if (!trimmedUser || trimmedUser.length < 3) {
    return { error: 'Username atau email minimal 3 karakter.' };
  }
  if (!password || password.length < 4) {
    return { error: 'Password minimal 4 karakter.' };
  }
  if (trimmedUser.toLowerCase() === 'admin' || trimmedUser.toLowerCase() === 'petugas') {
    return { error: 'Username resmi Admin/Petugas tidak dapat didaftarkan ulang.' };
  }

  const existing = db.prepare('SELECT id FROM users WHERE LOWER(username) = LOWER(?)').get(trimmedUser);
  if (existing) {
    return { error: 'Username/email ini sudah terdaftar. Silakan masuk.' };
  }

  const id = `usr-${Date.now().toString().slice(-6)}`;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const display = fullName?.trim() || trimmedUser.split('@')[0] || trimmedUser;

  db.prepare(`
    INSERT INTO users (
      id, username, password_hash, role, full_name,
      points, bottles_count, food_wrappers_count, organic_kg, improvement_percent, created_at
    ) VALUES (?, ?, ?, 'user', ?, 100, 0, 0, 0, 0, ?)
  `).run(id, trimmedUser, hashPassword(password), display, now.toISOString());

  const token = generateSessionToken();
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(token, id, now.toISOString(), expiresAt);

  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  syncSqlDumpFileToDisk();
  return { token, user: mapUserRow(row) };
}

export function getSessionUser(token?: string | null): AuthUser | null {
  if (!token) return null;
  const db = ensureDb();
  const row = db
    .prepare(`
      SELECT u.*, s.expires_at
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `)
    .get(token) as any;

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }

  return mapUserRow(row);
}

export function logoutSession(token?: string | null): void {
  if (!token) return;
  const db = ensureDb();
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

// ======================= BINS CRUD =======================

export function createBin(binData: Omit<CampusBin, 'id' | 'distanceM'>): CampusBin {
  const db = ensureDb();
  const minRow = db.prepare('SELECT MIN(sort_order) as minOrder FROM campus_bins').get() as { minOrder: number | null };
  const nextOrder = (minRow?.minOrder ?? 0) - 1;
  const id = `bin-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
  const distanceM = Math.floor(Math.random() * 200) + 30;

  db.prepare(`
    INSERT INTO campus_bins (
      id, name, category, building, location_detail, distance_m, status,
      capacity_kg, last_emptied, reported_minutes_ago, qr_printed, coord_x, coord_y, description, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    binData.name,
    binData.category,
    binData.building,
    binData.locationDetail,
    distanceM,
    binData.status || 'Kosong',
    binData.capacityKg || 40,
    binData.lastEmptied || 'Baru saja',
    binData.reportedMinutesAgo ?? null,
    binData.qrPrinted ? 1 : 0,
    binData.coordinates.x,
    binData.coordinates.y,
    binData.description ?? null,
    nextOrder
  );

  const row = db.prepare('SELECT * FROM campus_bins WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapBinRow(row);
}

export function updateBinById(id: string, updates: Partial<CampusBin>): CampusBin | null {
  const db = ensureDb();
  const existing = db.prepare('SELECT * FROM campus_bins WHERE id = ?').get(id) as any;
  if (!existing) return null;

  const current = mapBinRow(existing);
  const merged: CampusBin = {
    ...current,
    ...updates,
    coordinates: updates.coordinates ?? current.coordinates
  };

  db.prepare(`
    UPDATE campus_bins
    SET name = ?, category = ?, building = ?, location_detail = ?, distance_m = ?,
        status = ?, capacity_kg = ?, last_emptied = ?, reported_minutes_ago = ?,
        qr_printed = ?, coord_x = ?, coord_y = ?, description = ?
    WHERE id = ?
  `).run(
    merged.name,
    merged.category,
    merged.building,
    merged.locationDetail,
    merged.distanceM,
    merged.status,
    merged.capacityKg,
    merged.lastEmptied,
    merged.reportedMinutesAgo ?? null,
    merged.qrPrinted ? 1 : 0,
    merged.coordinates.x,
    merged.coordinates.y,
    merged.description ?? null,
    id
  );

  const updated = db.prepare('SELECT * FROM campus_bins WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapBinRow(updated);
}

export function deleteBinById(id: string): boolean {
  const db = ensureDb();
  const res = db.prepare('DELETE FROM campus_bins WHERE id = ?').run(id);
  if (res.changes > 0) {
    syncSqlDumpFileToDisk();
    return true;
  }
  return false;
}

export function emptyBinById(id: string): CampusBin | null {
  const db = ensureDb();
  const existing = db.prepare('SELECT * FROM campus_bins WHERE id = ?').get(id);
  if (!existing) return null;

  db.exec('BEGIN');
  try {
    db.prepare(`
      UPDATE campus_bins
      SET status = 'Kosong', last_emptied = 'Baru saja', reported_minutes_ago = NULL
      WHERE id = ?
    `).run(id);

    db.prepare(`
      UPDATE user_reports
      SET status = 'Selesai'
      WHERE bin_id = ? AND issue_type = 'Penuh' AND status != 'Ditolak'
    `).run(id);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updated = db.prepare('SELECT * FROM campus_bins WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapBinRow(updated);
}

// ======================= REPORTS WORKFLOW =======================

export function createReport(data: {
  binId: string;
  issueType: ReportIssueType;
  photoUrl?: string;
  notes?: string;
  reporter?: ReporterRole;
  reportedByUsername?: string;
}): UserReport {
  const db = ensureDb();
  const binRow = (db.prepare('SELECT * FROM campus_bins WHERE id = ?').get(data.binId) ||
    db.prepare('SELECT * FROM campus_bins LIMIT 1').get()) as any;
  const bin = mapBinRow(binRow);

  const minRow = db.prepare('SELECT MIN(sort_order) as minOrder FROM user_reports').get() as { minOrder: number | null };
  const nextOrder = (minRow?.minOrder ?? 0) - 1;
  const id = `rep-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
  const now = new Date().toISOString();
  const notes = data.notes?.trim() || `Laporan ${data.issueType.toLowerCase()} pada ${bin.name}`;

  db.prepare(`
    INSERT INTO user_reports (
      id, bin_id, bin_name, category, location, issue_type, photo_url, timestamp,
      time_ago_text, reporter, reported_by_username, status, notes, assigned_to_petugas,
      assigned_at, admin_verification_note, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Baru saja', ?, ?, 'Baru', ?, 0, NULL, NULL, ?)
  `).run(
    id,
    bin.id,
    bin.name,
    bin.category,
    `${bin.building} · ${bin.locationDetail}`,
    data.issueType,
    data.photoUrl ?? null,
    now,
    data.reporter || 'Mahasiswa',
    data.reportedByUsername ?? null,
    notes,
    nextOrder
  );

  const row = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapReportRow(row);
}

export function updateReportStatusById(id: string, status: ReportStatus): UserReport | null {
  const db = ensureDb();
  const res = db.prepare('UPDATE user_reports SET status = ? WHERE id = ?').run(status, id);
  if (res.changes === 0) return null;
  const row = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapReportRow(row);
}

export function dispatchReportById(id: string): UserReport | null {
  const db = ensureDb();
  const existingRow = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id) as any;
  if (!existingRow) return null;
  const report = mapReportRow(existingRow);

  const now = new Date().toISOString();
  db.exec('BEGIN');
  try {
    db.prepare(`
      UPDATE user_reports
      SET status = 'Diproses',
          assigned_to_petugas = 1,
          assigned_at = ?,
          admin_verification_note = 'Diverifikasi asli oleh admin & ditugaskan ke petugas kebersihan'
      WHERE id = ?
    `).run(now, id);

    if (['Penuh', 'Sampah berserakan', 'Bau tidak sedap'].includes(report.issueType)) {
      db.prepare(`UPDATE campus_bins SET status = 'Penuh', reported_minutes_ago = 1 WHERE id = ?`).run(report.binId);
    } else if (['Rusak', 'Tong rusak', 'Tutup macet'].includes(report.issueType)) {
      db.prepare(`UPDATE campus_bins SET status = 'Rusak', reported_minutes_ago = 1 WHERE id = ?`).run(report.binId);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updated = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapReportRow(updated);
}

export function rejectFalseReportById(id: string, reason?: string): UserReport | null {
  const db = ensureDb();
  const existingRow = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id) as any;
  if (!existingRow) return null;
  const report = mapReportRow(existingRow);

  db.exec('BEGIN');
  try {
    db.prepare(`
      UPDATE user_reports
      SET status = 'Ditolak',
          assigned_to_petugas = 0,
          admin_verification_note = ?
      WHERE id = ?
    `).run(reason || 'Laporan terindikasi palsu / tidak valid setelah diteliti admin', id);

    const remaining = db
      .prepare(`
        SELECT COUNT(*) as cnt FROM user_reports
        WHERE bin_id = ? AND id != ? AND status IN ('Baru', 'Diproses')
      `)
      .get(report.binId, id) as { cnt: number };

    if (remaining.cnt === 0) {
      db.prepare(`UPDATE campus_bins SET status = 'Kosong' WHERE id = ?`).run(report.binId);
    }

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updated = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapReportRow(updated);
}

export function bulkDispatchReportsByIds(ids: string[]): number {
  const db = ensureDb();
  if (!ids.length) return 0;

  let dispatched = 0;
  db.exec('BEGIN');
  try {
    const now = new Date().toISOString();
    for (const id of ids) {
      const row = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id) as any;
      if (!row || row.status === 'Selesai' || row.status === 'Ditolak') continue;

      db.prepare(`
        UPDATE user_reports
        SET status = 'Diproses',
            assigned_to_petugas = 1,
            assigned_at = ?,
            admin_verification_note = 'Diverifikasi asli (bulk) oleh admin'
        WHERE id = ?
      `).run(now, id);

      db.prepare(`UPDATE campus_bins SET status = 'Penuh', reported_minutes_ago = 1 WHERE id = ? AND status = 'Kosong'`)
        .run(row.bin_id);
      dispatched++;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  syncSqlDumpFileToDisk();
  return dispatched;
}

export function resolveReportById(id: string): UserReport | null {
  const db = ensureDb();
  const existingRow = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id) as any;
  if (!existingRow) return null;

  db.exec('BEGIN');
  try {
    db.prepare(`UPDATE user_reports SET status = 'Selesai' WHERE id = ?`).run(id);
    db.prepare(`
      UPDATE campus_bins
      SET status = 'Kosong', last_emptied = 'Baru saja', reported_minutes_ago = NULL
      WHERE id = ?
    `).run(existingRow.bin_id);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updated = db.prepare('SELECT * FROM user_reports WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapReportRow(updated);
}

// ======================= VOUCHERS & POINTS =======================

export function createVoucher(v: Omit<CampusVoucher, 'id' | 'redeemedCount'>): CampusVoucher {
  const db = ensureDb();
  const minRow = db.prepare('SELECT MIN(sort_order) as minOrder FROM campus_vouchers').get() as { minOrder: number | null };
  const nextOrder = (minRow?.minOrder ?? 0) - 1;
  const id = `vouc-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;

  db.prepare(`
    INSERT INTO campus_vouchers (
      id, partner_name, voucher_title, category, point_cost, stock, redeemed_count, status, description, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?)
  `).run(
    id,
    v.partnerName,
    v.voucherTitle,
    v.category,
    v.pointCost,
    v.stock,
    v.status || 'Aktif',
    v.description || '',
    nextOrder
  );

  const row = db.prepare('SELECT * FROM campus_vouchers WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapVoucherRow(row);
}

export function updateVoucherById(
  id: string,
  updates: { stock?: number; toggleStatus?: boolean }
): CampusVoucher | null {
  const db = ensureDb();
  const row = db.prepare('SELECT * FROM campus_vouchers WHERE id = ?').get(id) as any;
  if (!row) return null;

  let stock = Number(row.stock);
  let status = row.status as VoucherStatus;

  if (typeof updates.stock === 'number') {
    stock = Math.max(0, updates.stock);
    if (stock === 0) status = 'Habis';
    else if (status === 'Habis') status = 'Aktif';
  }

  if (updates.toggleStatus) {
    status = status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  }

  db.prepare('UPDATE campus_vouchers SET stock = ?, status = ? WHERE id = ?').run(stock, status, id);
  const updated = db.prepare('SELECT * FROM campus_vouchers WHERE id = ?').get(id);
  syncSqlDumpFileToDisk();
  return mapVoucherRow(updated);
}

export function deleteVoucherById(id: string): boolean {
  const db = ensureDb();
  const res = db.prepare('DELETE FROM campus_vouchers WHERE id = ?').run(id);
  if (res.changes > 0) {
    syncSqlDumpFileToDisk();
    return true;
  }
  return false;
}

export function addUserPoints(
  userId: string,
  amount: number,
  wasteType?: string
): AuthUser | null {
  const db = ensureDb();
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!userRow) return null;

  let bottles = Number(userRow.bottles_count);
  let wrappers = Number(userRow.food_wrappers_count);
  let organic = Number(userRow.organic_kg);

  if (wasteType?.includes('Anorganik') || wasteType?.includes('Plastik') || wasteType?.includes('Botol')) {
    bottles += 1;
  } else if (wasteType?.includes('Bungkus') || wasteType?.includes('Makanan')) {
    wrappers += 1;
  } else if (wasteType?.includes('Organik')) {
    organic = Math.round((organic + 0.5) * 10) / 10;
  } else {
    bottles += 1;
  }

  const nextPoints = Number(userRow.points) + amount;
  db.prepare(`
    UPDATE users
    SET points = ?, bottles_count = ?, food_wrappers_count = ?, organic_kg = ?
    WHERE id = ?
  `).run(nextPoints, bottles, wrappers, organic, userId);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  syncSqlDumpFileToDisk();
  return mapUserRow(updated);
}

export function redeemVoucherForUser(
  userId: string,
  voucherId: string
): { success: boolean; message: string; code?: string; user?: AuthUser; redemption?: RedemptionRecord } {
  const db = ensureDb();
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  const voucherRow = db.prepare('SELECT * FROM campus_vouchers WHERE id = ?').get(voucherId) as any;

  if (!userRow) return { success: false, message: 'Silakan login terlebih dahulu untuk menukar poin.' };
  if (!voucherRow) return { success: false, message: 'Voucher tidak ditemukan.' };
  if (Number(voucherRow.stock) <= 0) return { success: false, message: 'Stok voucher telah habis.' };
  if (Number(userRow.points) < Number(voucherRow.point_cost)) {
    return {
      success: false,
      message: `Poin tidak mencukupi. Butuh ${voucherRow.point_cost} poin, poin kamu ${userRow.points}.`
    };
  }

  const code = `VETBIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const redemptionId = `red-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`;
  const now = new Date().toISOString();
  const displayName = userRow.username.split('@')[0] || userRow.username;

  db.exec('BEGIN');
  try {
    const newPoints = Number(userRow.points) - Number(voucherRow.point_cost);
    db.prepare('UPDATE users SET points = ? WHERE id = ?').run(newPoints, userId);

    const newStock = Number(voucherRow.stock) - 1;
    const newStatus = newStock === 0 ? 'Habis' : voucherRow.status;
    db.prepare('UPDATE campus_vouchers SET stock = ?, redeemed_count = redeemed_count + 1, status = ? WHERE id = ?')
      .run(newStock, newStatus, voucherId);

    const minOrderRow = db.prepare('SELECT MIN(sort_order) as minOrder FROM redemption_records').get() as { minOrder: number | null };
    const nextOrder = (minOrderRow?.minOrder ?? 0) - 1;

    db.prepare(`
      INSERT INTO redemption_records (
        id, voucher_id, voucher_title, partner_name, user_name, user_id,
        points_spent, time_ago_text, redeem_code, timestamp, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Baru saja', ?, ?, ?)
    `).run(
      redemptionId,
      voucherRow.id,
      voucherRow.voucher_title,
      voucherRow.partner_name,
      displayName,
      userId,
      voucherRow.point_cost,
      code,
      now,
      nextOrder
    );

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updatedUser = mapUserRow(db.prepare('SELECT * FROM users WHERE id = ?').get(userId));
  const redemption = mapRedemptionRow(db.prepare('SELECT * FROM redemption_records WHERE id = ?').get(redemptionId));
  syncSqlDumpFileToDisk();

  return {
    success: true,
    message: 'Voucher berhasil ditukar!',
    code,
    user: updatedUser,
    redemption
  };
}

export function resetAllDatabase(): void {
  const db = ensureDb();
  db.exec('BEGIN');
  try {
    db.exec(`
      DELETE FROM redemption_records;
      DELETE FROM user_reports;
      DELETE FROM campus_vouchers;
      DELETE FROM campus_bins;
      UPDATE users SET points = 1240, bottles_count = 86, food_wrappers_count = 32, organic_kg = 14, improvement_percent = 22 WHERE username = '2510501272@kampus.ac.id';
    `);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  seedInitialDataIfEmpty(db);
  syncSqlDumpFileToDisk();
}
