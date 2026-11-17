import {
  AuthRole,
  AuthUser,
  CampusBin,
  CampusVoucher,
  RedemptionRecord,
  ReportIssueType,
  ReportStatus,
  ReporterRole,
  UserReport,
  VoucherStatus
} from '../types';
import {
  SEED_BINS,
  SEED_REDEMPTIONS,
  SEED_REPORTS,
  SEED_VOUCHERS
} from '../data/campusSeedData';
import { generatePhpMyAdminSqlDump, SqlDumpUserRow } from '../utils/sqlDumpGenerator';

interface StoredUser extends AuthUser {
  password: string;
  createdAt: string;
}

interface StoredSession {
  token: string;
  userId: string;
  expiresAt: number;
}

interface StandaloneDatabase {
  users: StoredUser[];
  sessions: StoredSession[];
  bins: CampusBin[];
  reports: UserReport[];
  vouchers: CampusVoucher[];
  redemptions: RedemptionRecord[];
}

const STORAGE_KEY = 'vetbin_standalone_db_v1';
const BROADCAST_CHANNEL_NAME = 'vetbin_realtime_sync';

function cloneSeed<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function createInitialDb(): StandaloneDatabase {
  const now = new Date().toISOString();
  return {
    users: [
      {
        id: 'usr-admin',
        username: 'Admin',
        password: 'Admin',
        role: 'admin',
        fullName: 'Administrator Sarpras Kampus',
        points: 0,
        bottlesCount: 0,
        foodWrappersCount: 0,
        organicKg: 0,
        improvementPercent: 0,
        createdAt: now
      },
      {
        id: 'usr-2510501272',
        username: '2510501272@kampus.ac.id',
        password: '2510501272@kampus.ac.id',
        role: 'user',
        fullName: 'Mahasiswa (2510501272)',
        points: 1240,
        bottlesCount: 86,
        foodWrappersCount: 32,
        organicKg: 14,
        improvementPercent: 22,
        createdAt: now
      }
    ],
    sessions: [],
    bins: cloneSeed(SEED_BINS),
    reports: cloneSeed(SEED_REPORTS),
    vouchers: cloneSeed(SEED_VOUCHERS),
    redemptions: cloneSeed(SEED_REDEMPTIONS)
  };
}

function loadDb(): StandaloneDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StandaloneDatabase;
      if (parsed && Array.isArray(parsed.bins) && Array.isArray(parsed.users)) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted localStorage and recreate clean seed
  }
  const initial = createInitialDb();
  saveDb(initial);
  return initial;
}

function saveDb(db: StandaloneDatabase): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // ignore quota errors
  }
}

function toPublicUser(u: StoredUser): AuthUser {
  const { password: _pw, createdAt: _ca, ...rest } = u;
  return rest;
}

function emitBroadcast(message: { type: 'STATE_SYNC' | 'USER_UPDATED'; payload?: any; user?: AuthUser }) {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      ch.postMessage(message);
      ch.close();
    }
  } catch {
    // ignore unsupported BroadcastChannel
  }
}

export function subscribeLocalBroadcast(
  handler: (msg: { type: 'STATE_SYNC' | 'USER_UPDATED'; payload?: any; user?: AuthUser }) => void
): () => void {
  if (typeof BroadcastChannel === 'undefined') return () => {};
  const ch = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
  ch.onmessage = (event) => {
    if (event?.data) handler(event.data);
  };
  return () => ch.close();
}

export function localGetFullState() {
  const db = loadDb();
  return {
    bins: db.bins,
    reports: db.reports,
    vouchers: db.vouchers,
    redemptions: db.redemptions
  };
}

export function localAuthenticateUser(username: string, password: string): { token: string; user: AuthUser } | null {
  const db = loadDb();
  const trimmed = username.trim();
  const found = db.users.find(u => u.username === trimmed && u.password === password);
  if (!found) return null;

  const token = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  db.sessions.push({
    token,
    userId: found.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  saveDb(db);
  return { token, user: toPublicUser(found) };
}

export function localRegisterUser(
  username: string,
  password: string,
  fullName?: string
): { token: string; user: AuthUser } | { error: string } {
  const db = loadDb();
  const trimmed = username.trim();
  if (!trimmed || trimmed.length < 3) {
    return { error: 'Username atau email minimal 3 karakter.' };
  }
  if (!password || password.length < 4) {
    return { error: 'Password minimal 4 karakter.' };
  }
  if (trimmed.toLowerCase() === 'admin') {
    return { error: 'Username Admin tidak dapat didaftarkan ulang.' };
  }
  if (db.users.some(u => u.username.toLowerCase() === trimmed.toLowerCase())) {
    return { error: 'Username/email ini sudah terdaftar. Silakan masuk.' };
  }

  const newUser: StoredUser = {
    id: `usr-${Date.now().toString().slice(-6)}`,
    username: trimmed,
    password,
    role: 'user',
    fullName: fullName?.trim() || trimmed.split('@')[0] || trimmed,
    points: 100,
    bottlesCount: 0,
    foodWrappersCount: 0,
    organicKg: 0,
    improvementPercent: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  const token = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  db.sessions.push({
    token,
    userId: newUser.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  saveDb(db);
  return { token, user: toPublicUser(newUser) };
}

export function localGetSessionUser(token?: string | null): AuthUser | null {
  if (!token) return null;
  const db = loadDb();
  const session = db.sessions.find(s => s.token === token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) {
      db.sessions = db.sessions.filter(s => s.token !== token);
      saveDb(db);
    }
    return null;
  }
  const user = db.users.find(u => u.id === session.userId);
  return user ? toPublicUser(user) : null;
}

export function localLogoutSession(token?: string | null): void {
  if (!token) return;
  const db = loadDb();
  db.sessions = db.sessions.filter(s => s.token !== token);
  saveDb(db);
}

export function localCreateBin(binData: Omit<CampusBin, 'id' | 'distanceM'>) {
  const db = loadDb();
  const newBin: CampusBin = {
    ...binData,
    id: `bin-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`,
    distanceM: Math.floor(Math.random() * 200) + 30
  };
  db.bins.unshift(newBin);
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return { bin: newBin, state };
}

export function localUpdateBin(id: string, updates: Partial<CampusBin>) {
  const db = loadDb();
  db.bins = db.bins.map(b => (b.id === id ? { ...b, ...updates } : b));
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localDeleteBin(id: string) {
  const db = loadDb();
  db.bins = db.bins.filter(b => b.id !== id);
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localEmptyBin(id: string) {
  const db = loadDb();
  db.bins = db.bins.map(b =>
    b.id === id ? { ...b, status: 'Kosong', lastEmptied: 'Baru saja', reportedMinutesAgo: undefined } : b
  );
  db.reports = db.reports.map(r =>
    r.binId === id && r.issueType === 'Penuh' && r.status !== 'Ditolak' ? { ...r, status: 'Selesai' } : r
  );
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localCreateReport(data: {
  binId: string;
  issueType: ReportIssueType;
  photoUrl?: string;
  notes?: string;
  reporter?: ReporterRole;
  reportedByUsername?: string;
}) {
  const db = loadDb();
  const bin = db.bins.find(b => b.id === data.binId) || db.bins[0];
  const newReport: UserReport = {
    id: `rep-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`,
    binId: bin.id,
    binName: bin.name,
    category: bin.category,
    location: `${bin.building} · ${bin.locationDetail}`,
    issueType: data.issueType,
    photoUrl: data.photoUrl,
    timestamp: new Date().toISOString(),
    timeAgoText: 'Baru saja',
    reporter: data.reporter || 'Mahasiswa',
    reportedByUsername: data.reportedByUsername,
    status: 'Baru',
    assignedToPetugas: false,
    notes: data.notes?.trim() || `Laporan ${data.issueType.toLowerCase()} pada ${bin.name}`
  };
  db.reports.unshift(newReport);
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return { report: newReport, state };
}

export function localUpdateReportStatus(id: string, status: ReportStatus) {
  const db = loadDb();
  db.reports = db.reports.map(r => (r.id === id ? { ...r, status } : r));
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localDispatchReport(id: string): { report: UserReport | null; state: ReturnType<typeof localGetFullState> } {
  const db = loadDb();
  let target: UserReport | null = null;
  db.reports = db.reports.map(r => {
    if (r.id === id) {
      const updated: UserReport = {
        ...r,
        status: 'Diproses',
        assignedToPetugas: true,
        assignedAt: new Date().toISOString(),
        adminVerificationNote: 'Diverifikasi asli oleh admin & ditugaskan ke petugas kebersihan'
      };
      target = updated;
      return updated;
    }
    return r;
  });

  const rep = db.reports.find(r => r.id === id) || null;
  if (rep) {
    target = rep;
    if (['Penuh', 'Sampah berserakan', 'Bau tidak sedap'].includes(rep.issueType)) {
      db.bins = db.bins.map(b => (b.id === rep.binId ? { ...b, status: 'Penuh', reportedMinutesAgo: 1 } : b));
    } else if (['Rusak', 'Tong rusak', 'Tutup macet'].includes(rep.issueType)) {
      db.bins = db.bins.map(b => (b.id === rep.binId ? { ...b, status: 'Rusak', reportedMinutesAgo: 1 } : b));
    }
  }

  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return { report: target, state };
}

export function localRejectReport(
  id: string,
  reason?: string
): { report: UserReport | null; state: ReturnType<typeof localGetFullState> } {
  const db = loadDb();
  let target: UserReport | null = null;
  db.reports = db.reports.map(r => {
    if (r.id === id) {
      const updated: UserReport = {
        ...r,
        status: 'Ditolak',
        assignedToPetugas: false,
        adminVerificationNote: reason || 'Laporan terindikasi palsu / tidak valid setelah diteliti admin'
      };
      target = updated;
      return updated;
    }
    return r;
  });

  const rep = db.reports.find(r => r.id === id) || null;
  if (rep) {
    target = rep;
    const remaining = db.reports.filter(
      r => r.binId === rep.binId && r.id !== id && (r.status === 'Baru' || r.status === 'Diproses')
    );
    if (remaining.length === 0) {
      db.bins = db.bins.map(b => (b.id === rep.binId ? { ...b, status: 'Kosong' } : b));
    }
  }

  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return { report: target, state };
}

export function localBulkDispatchReports(ids: string[]) {
  const db = loadDb();
  let count = 0;
  const affectedBinIds = new Set<string>();
  const now = new Date().toISOString();

  db.reports = db.reports.map(r => {
    if (ids.includes(r.id) && r.status !== 'Selesai' && r.status !== 'Ditolak') {
      count++;
      affectedBinIds.add(r.binId);
      return {
        ...r,
        status: 'Diproses',
        assignedToPetugas: true,
        assignedAt: now,
        adminVerificationNote: 'Diverifikasi asli (bulk) oleh admin'
      };
    }
    return r;
  });

  db.bins = db.bins.map(b =>
    affectedBinIds.has(b.id) && b.status === 'Kosong' ? { ...b, status: 'Penuh', reportedMinutesAgo: 1 } : b
  );

  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return { count, state };
}

export function localResolveReport(id: string) {
  const db = loadDb();
  let binId: string | null = null;
  db.reports = db.reports.map(r => {
    if (r.id === id) {
      binId = r.binId;
      return { ...r, status: 'Selesai' };
    }
    return r;
  });
  if (binId) {
    db.bins = db.bins.map(b =>
      b.id === binId ? { ...b, status: 'Kosong', lastEmptied: 'Baru saja', reportedMinutesAgo: undefined } : b
    );
  }
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localCreateVoucher(v: Omit<CampusVoucher, 'id' | 'redeemedCount'>) {
  const db = loadDb();
  const newVoucher: CampusVoucher = {
    ...v,
    id: `vouc-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`,
    redeemedCount: 0
  };
  db.vouchers.unshift(newVoucher);
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return { voucher: newVoucher, state };
}

export function localUpdateVoucher(id: string, updates: { stock?: number; toggleStatus?: boolean }) {
  const db = loadDb();
  db.vouchers = db.vouchers.map(v => {
    if (v.id !== id) return v;
    let stock = v.stock;
    let status: VoucherStatus = v.status;
    if (typeof updates.stock === 'number') {
      stock = Math.max(0, updates.stock);
      if (stock === 0) status = 'Habis';
      else if (status === 'Habis') status = 'Aktif';
    }
    if (updates.toggleStatus) {
      status = status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    }
    return { ...v, stock, status };
  });
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localDeleteVoucher(id: string) {
  const db = loadDb();
  db.vouchers = db.vouchers.filter(v => v.id !== id);
  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localAddPoints(userId: string, amount: number, wasteType?: string): AuthUser | null {
  const db = loadDb();
  let updated: AuthUser | null = null;
  db.users = db.users.map(u => {
    if (u.id !== userId) return u;
    let b = u.bottlesCount;
    let w = u.foodWrappersCount;
    let o = u.organicKg;
    if (wasteType?.includes('Anorganik') || wasteType?.includes('Plastik') || wasteType?.includes('Botol')) {
      b += 1;
    } else if (wasteType?.includes('Bungkus') || wasteType?.includes('Makanan')) {
      w += 1;
    } else if (wasteType?.includes('Organik')) {
      o = Math.round((o + 0.5) * 10) / 10;
    } else {
      b += 1;
    }
    const nextUser: StoredUser = {
      ...u,
      points: u.points + amount,
      bottlesCount: b,
      foodWrappersCount: w,
      organicKg: o
    };
    updated = toPublicUser(nextUser);
    return nextUser;
  });

  if (updated) {
    saveDb(db);
    emitBroadcast({ type: 'USER_UPDATED', user: updated });
  }
  return updated;
}

export function localRedeemVoucher(
  userId: string,
  voucherId: string
): { success: boolean; message: string; code?: string; user?: AuthUser; state?: any } {
  const db = loadDb();
  const user = db.users.find(u => u.id === userId);
  const voucher = db.vouchers.find(v => v.id === voucherId);

  if (!user) return { success: false, message: 'Silakan login terlebih dahulu.' };
  if (!voucher) return { success: false, message: 'Voucher tidak ditemukan.' };
  if (voucher.stock <= 0) return { success: false, message: 'Stok voucher telah habis.' };
  if (user.points < voucher.pointCost) {
    return {
      success: false,
      message: `Poin tidak mencukupi. Butuh ${voucher.pointCost} poin, poin kamu ${user.points}.`
    };
  }

  const code = `VETBIN-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  let updatedUser: AuthUser | undefined;

  db.users = db.users.map(u => {
    if (u.id !== userId) return u;
    const next: StoredUser = { ...u, points: u.points - voucher.pointCost };
    updatedUser = toPublicUser(next);
    return next;
  });

  db.vouchers = db.vouchers.map(v => {
    if (v.id !== voucherId) return v;
    const stock = v.stock - 1;
    return {
      ...v,
      stock,
      redeemedCount: v.redeemedCount + 1,
      status: stock === 0 ? 'Habis' : v.status
    };
  });

  db.redemptions.unshift({
    id: `red-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 10)}`,
    voucherId: voucher.id,
    voucherTitle: voucher.voucherTitle,
    partnerName: voucher.partnerName,
    userName: user.username.split('@')[0] || user.username,
    userId: user.id,
    pointsSpent: voucher.pointCost,
    timeAgoText: 'Baru saja',
    redeemCode: code,
    timestamp: new Date().toISOString()
  });

  saveDb(db);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  if (updatedUser) emitBroadcast({ type: 'USER_UPDATED', user: updatedUser });

  return {
    success: true,
    message: 'Voucher berhasil ditukar!',
    code,
    user: updatedUser,
    state
  };
}

export function localResetDatabase() {
  const initial = createInitialDb();
  saveDb(initial);
  const state = localGetFullState();
  emitBroadcast({ type: 'STATE_SYNC', payload: state });
  return state;
}

export function localExportSqlDump(): string {
  const db = loadDb();
  const users: SqlDumpUserRow[] = db.users.map(u => ({
    id: u.id,
    username: u.username,
    passwordHash: `standalone:${u.role}:${u.username}`,
    role: u.role as AuthRole,
    fullName: u.fullName,
    points: u.points,
    bottlesCount: u.bottlesCount,
    foodWrappersCount: u.foodWrappersCount,
    organicKg: u.organicKg,
    improvementPercent: u.improvementPercent,
    createdAt: u.createdAt
  }));

  return generatePhpMyAdminSqlDump({
    databaseName: 'vetbin_db',
    users,
    bins: db.bins,
    reports: db.reports,
    vouchers: db.vouchers,
    redemptions: db.redemptions
  });
}
