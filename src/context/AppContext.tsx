import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  AuthUser,
  CampusBin,
  CampusVoucher,
  UserReport,
  RedemptionRecord,
  UserImpactProfile,
  BinStatus,
  ReportStatus,
  ReportIssueType,
  ReporterRole
} from '../types';
import {
  INITIAL_BINS,
  INITIAL_REPORTS,
  INITIAL_VOUCHERS,
  INITIAL_REDEMPTIONS
} from '../data/initialData';

export type UserTab = 'beranda' | 'peta' | 'panduan' | 'lapor' | 'poin' | 'petugas';
export type AdminTab = 'ringkasan' | 'titik-tong' | 'qrcode' | 'mitra' | 'laporan';
export type LoginModalMode = 'user' | 'admin';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'error';
  title: string;
  message?: string;
}

interface BackendStatePayload {
  bins: CampusBin[];
  reports: UserReport[];
  vouchers: CampusVoucher[];
  redemptions: RedemptionRecord[];
}

interface AppContextType {
  // Navigation
  isAdminView: boolean;
  setIsAdminView: (val: boolean) => void;
  userTab: UserTab;
  setUserTab: (tab: UserTab) => void;
  adminTab: AdminTab;
  setAdminTab: (tab: AdminTab) => void;

  // Auth & Login Modal
  authUser: AuthUser | null;
  authToken: string | null;
  isAuthLoading: boolean;
  isLoginModalOpen: boolean;
  loginModalMode: LoginModalMode;
  openLoginModal: (mode?: LoginModalMode) => void;
  closeLoginModal: () => void;
  loginWithCredentials: (
    username: string,
    password: string,
    expectedRole?: LoginModalMode
  ) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  registerWithCredentials: (
    username: string,
    password: string,
    fullName?: string
  ) => Promise<{ success: boolean; user?: AuthUser; error?: string }>;
  logout: () => Promise<void>;

  // Selected bin / Quick Action context
  selectedBinId: string | null;
  setSelectedBinId: (id: string | null) => void;
  targetReportBinId: string | null;
  setTargetReportBinId: (id: string | null) => void;

  // Bins Database
  bins: CampusBin[];
  addBin: (bin: Omit<CampusBin, 'id' | 'distanceM'>) => Promise<CampusBin | null>;
  updateBin: (id: string, updates: Partial<CampusBin>) => Promise<void>;
  deleteBin: (id: string) => Promise<void>;
  emptyBin: (id: string) => Promise<void>;
  markBinReported: (id: string, status: BinStatus) => void;

  // Reports Database
  reports: UserReport[];
  addReport: (reportData: {
    binId: string;
    issueType: ReportIssueType;
    photoUrl?: string;
    notes?: string;
    reporter?: ReporterRole;
  }) => Promise<UserReport | null>;
  updateReportStatus: (id: string, status: ReportStatus) => Promise<void>;
  dispatchReportToPetugas: (id: string) => Promise<void>;
  rejectFalseReport: (id: string, reason?: string) => Promise<void>;
  bulkDispatchReports: (ids: string[]) => Promise<void>;
  resolveReport: (id: string) => Promise<void>;
  exportCsv: () => void;
  exportSqlDump: () => Promise<void>;

  // Vouchers & Rewards
  vouchers: CampusVoucher[];
  addVoucher: (v: Omit<CampusVoucher, 'id' | 'redeemedCount'>) => Promise<void>;
  updateVoucherStock: (id: string, newStock: number) => Promise<void>;
  toggleVoucherStatus: (id: string) => Promise<void>;
  deleteVoucher: (id: string) => Promise<void>;
  redeemVoucher: (voucherId: string) => Promise<{ success: boolean; message: string; code?: string }>;
  redemptions: RedemptionRecord[];

  // User Profile / Points
  userProfile: UserImpactProfile;
  addPoints: (amount: number, wasteType?: string) => Promise<boolean>;

  // Simple Onboarding Modal
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (val: boolean) => void;

  // Toast notifications
  toasts: ToastMessage[];
  showToast: (title: string, message?: string, type?: 'success' | 'info' | 'error') => void;
  dismissToast: (id: string) => void;

  // Reset to default sample
  resetDatabase: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AUTH_TOKEN_STORAGE_KEY = 'vetbin_auth_token';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation state
  const [isAdminViewState, setIsAdminViewState] = useState<boolean>(false);
  const [userTab, setUserTab] = useState<UserTab>('beranda');
  const [adminTab, setAdminTab] = useState<AdminTab>('ringkasan');

  // Auth state
  const [authToken, setAuthToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(Boolean(authToken));
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [loginModalMode, setLoginModalMode] = useState<LoginModalMode>('user');

  const authTokenRef = useRef<string | null>(authToken);
  const authUserRef = useRef<AuthUser | null>(authUser);

  useEffect(() => {
    authTokenRef.current = authToken;
  }, [authToken]);

  useEffect(() => {
    authUserRef.current = authUser;
  }, [authUser]);

  // Onboarding Modal (closed by default)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Selected bin cross-linking
  const [selectedBinId, setSelectedBinId] = useState<string | null>('bin-1');
  const [targetReportBinId, setTargetReportBinId] = useState<string | null>('bin-1');

  // Authoritative state (synced with SQLite DB + WebSocket)
  const [bins, setBins] = useState<CampusBin[]>(INITIAL_BINS);
  const [reports, setReports] = useState<UserReport[]>(INITIAL_REPORTS);
  const [vouchers, setVouchers] = useState<CampusVoucher[]>(INITIAL_VOUCHERS);
  const [redemptions, setRedemptions] = useState<RedemptionRecord[]>(INITIAL_REDEMPTIONS);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback(
    (title: string, message?: string, type: 'success' | 'info' | 'error' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts(prev => [...prev, { id, title, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const applyServerState = useCallback((payload?: BackendStatePayload) => {
    if (!payload) return;
    if (Array.isArray(payload.bins)) setBins(payload.bins);
    if (Array.isArray(payload.reports)) setReports(payload.reports);
    if (Array.isArray(payload.vouchers)) setVouchers(payload.vouchers);
    if (Array.isArray(payload.redemptions)) setRedemptions(payload.redemptions);
  }, []);

  const persistToken = useCallback((token: string | null) => {
    authTokenRef.current = token;
    setAuthToken(token);
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore storage failure
    }
  }, []);

  const apiFetch = useCallback(
    async <T = any>(url: string, options: RequestInit = {}): Promise<T> => {
      const headers = new Headers(options.headers || {});
      if (options.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      if (authTokenRef.current && !headers.has('Authorization')) {
        headers.set('Authorization', `Bearer ${authTokenRef.current}`);
      }

      const response = await fetch(url, { ...options, headers });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Permintaan gagal (${response.status})`);
      }
      return data as T;
    },
    []
  );

  // Initial load: fetch authoritative DB state + verify existing auth token
  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok && active) {
          const data = await res.json();
          applyServerState(data);
        }
      } catch (err) {
        console.error('Failed to load initial state:', err);
      }

      const existingToken = authTokenRef.current;
      if (existingToken) {
        try {
          const meRes = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${existingToken}` }
          });
          if (meRes.ok && active) {
            const meData = await meRes.json();
            setAuthUser(meData.user || null);
          } else if (active) {
            persistToken(null);
            setAuthUser(null);
          }
        } catch {
          if (active) {
            setAuthUser(null);
          }
        }
      }
      if (active) {
        setIsAuthLoading(false);
      }
    };

    loadInitial();
    return () => {
      active = false;
    };
  }, [applyServerState, persistToken]);

  // Real-time WebSocket synchronization
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        ws = new WebSocket(wsUrl);
      } catch {
        reconnectTimer = setTimeout(connect, 3000);
        return;
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'STATE_SYNC' && message.payload) {
            applyServerState(message.payload);
          } else if (message.type === 'USER_UPDATED' && message.user) {
            if (authUserRef.current && message.user.id === authUserRef.current.id) {
              setAuthUser(message.user);
            }
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!unmounted) {
          reconnectTimer = setTimeout(connect, 2500);
        }
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      unmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
    };
  }, [applyServerState]);

  // Auth modal & actions
  const openLoginModal = useCallback((mode: LoginModalMode = 'user') => {
    setLoginModalMode(mode);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const setIsAdminView = useCallback(
    (val: boolean) => {
      if (!val) {
        setIsAdminViewState(false);
        return;
      }
      if (authUserRef.current?.role === 'admin') {
        setIsAdminViewState(true);
      } else {
        setLoginModalMode('admin');
        setIsLoginModalOpen(true);
        showToast(
          'Login Admin Diperlukan',
          'Silakan masuk menggunakan akun Admin Kampus untuk membuka dashboard.',
          'info'
        );
      }
    },
    [showToast]
  );

  const loginWithCredentials = async (
    username: string,
    password: string,
    expectedRole?: LoginModalMode
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (expectedRole === 'admin' && data.user.role !== 'admin') {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.token}` }
        }).catch(() => {});
        const msg = 'Akun ini merupakan akun Mahasiswa/User biasa, bukan akun Admin Kampus.';
        return { success: false, error: msg };
      }

      persistToken(data.token);
      setAuthUser(data.user);
      setIsLoginModalOpen(false);

      if (data.user.role === 'admin' && expectedRole === 'admin') {
        setIsAdminViewState(true);
        setAdminTab('ringkasan');
        showToast('Login Admin Berhasil', `Selamat datang, ${data.user.fullName}.`);
      } else {
        showToast('Berhasil Masuk', `Selamat datang, ${data.user.username}!`);
      }

      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Username atau password salah.' };
    }
  };

  const registerWithCredentials = async (
    username: string,
    password: string,
    fullName?: string
  ): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: AuthUser }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password, fullName })
      });
      persistToken(data.token);
      setAuthUser(data.user);
      setIsLoginModalOpen(false);
      showToast('Akun Berhasil Dibuat', `Selamat datang, ${data.user.username}! (+100 poin awal)`);
      return { success: true, user: data.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Pendaftaran gagal.' };
    }
  };

  const logout = async () => {
    try {
      if (authTokenRef.current) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authTokenRef.current}` }
        });
      }
    } catch {
      // ignore network error during logout
    }
    persistToken(null);
    setAuthUser(null);
    setIsAdminViewState(false);
    setUserTab('beranda');
    showToast('Berhasil Keluar', 'Sesi akun Anda telah ditutup.', 'info');
  };

  // Derived UserProfile for consumer views
  const userProfile: UserImpactProfile = authUser
    ? {
        nimOrEmail: authUser.username,
        isLoggedIn: true,
        points: authUser.points,
        bottlesCount: authUser.bottlesCount,
        foodWrappersCount: authUser.foodWrappersCount,
        organicKg: authUser.organicKg,
        improvementPercent: authUser.improvementPercent
      }
    : {
        nimOrEmail: 'Tamu Kampus',
        isLoggedIn: false,
        points: 0,
        bottlesCount: 0,
        foodWrappersCount: 0,
        organicKg: 0,
        improvementPercent: 0
      };

  // ==================== BINS ACTIONS ====================

  const addBin = async (binData: Omit<CampusBin, 'id' | 'distanceM'>): Promise<CampusBin | null> => {
    try {
      const data = await apiFetch<{ bin: CampusBin; state: BackendStatePayload }>('/api/bins', {
        method: 'POST',
        body: JSON.stringify(binData)
      });
      applyServerState(data.state);
      showToast(
        'Titik Tong Ditambahkan',
        `${data.bin.name} (${data.bin.building}) berhasil disimpan ke database dan QR Code siap dicetak.`
      );
      return data.bin;
    } catch (err: any) {
      showToast('Gagal Menambah Tong', err.message, 'error');
      return null;
    }
  };

  const updateBin = async (id: string, updates: Partial<CampusBin>) => {
    try {
      const data = await apiFetch<{ bin: CampusBin; state: BackendStatePayload }>(`/api/bins/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      applyServerState(data.state);
      showToast('Titik Tong Diperbarui', 'Perubahan data tong berhasil disimpan ke database.');
    } catch (err: any) {
      showToast('Gagal Memperbarui Tong', err.message, 'error');
    }
  };

  const deleteBin = async (id: string) => {
    const target = bins.find(b => b.id === id);
    try {
      const data = await apiFetch<{ ok: boolean; state: BackendStatePayload }>(`/api/bins/${id}`, {
        method: 'DELETE'
      });
      applyServerState(data.state);
      showToast('Titik Tong Dihapus', `${target?.name || 'Tong'} telah dihapus dari database.`, 'info');
    } catch (err: any) {
      showToast('Gagal Menghapus Tong', err.message, 'error');
    }
  };

  const emptyBin = async (id: string) => {
    try {
      const data = await apiFetch<{ bin: CampusBin; state: BackendStatePayload }>(`/api/bins/${id}/empty`, {
        method: 'POST'
      });
      applyServerState(data.state);
      showToast('Tong Dikosongkan', 'Status tong kembali Kosong dan tersimpan secara real-time.');
    } catch (err: any) {
      showToast('Gagal Memperbarui Status', err.message, 'error');
    }
  };

  const markBinReported = (id: string, status: BinStatus) => {
    setBins(prev => prev.map(b => (b.id === id ? { ...b, status, reportedMinutesAgo: 1 } : b)));
  };

  // ==================== REPORTS ACTIONS ====================

  const addReport = async (reportData: {
    binId: string;
    issueType: ReportIssueType;
    photoUrl?: string;
    notes?: string;
    reporter?: ReporterRole;
  }): Promise<UserReport | null> => {
    try {
      const data = await apiFetch<{ report: UserReport; state: BackendStatePayload }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(reportData)
      });
      applyServerState(data.state);
      showToast(
        'Laporan Terkirim!',
        'Laporan berhasil disimpan ke database dan menunggu verifikasi admin sebelum diteruskan ke petugas.'
      );
      return data.report;
    } catch (err: any) {
      showToast('Gagal Mengirim Laporan', err.message, 'error');
      return null;
    }
  };

  const updateReportStatus = async (id: string, status: ReportStatus) => {
    try {
      const data = await apiFetch<{ report: UserReport; state: BackendStatePayload }>(`/api/reports/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      applyServerState(data.state);
      showToast('Status Laporan Diperbarui', `Laporan ditandai sebagai: ${status}`);
    } catch (err: any) {
      showToast('Gagal Memperbarui Laporan', err.message, 'error');
    }
  };

  const dispatchReportToPetugas = async (id: string) => {
    try {
      const data = await apiFetch<{ report: UserReport; state: BackendStatePayload }>(`/api/reports/${id}/dispatch`, {
        method: 'POST'
      });
      applyServerState(data.state);
      showToast(
        'Laporan Diteruskan ke Petugas!',
        `Tugas "${data.report.binName} · ${data.report.issueType}" kini aktif di halaman petugas secara real-time.`,
        'success'
      );
    } catch (err: any) {
      showToast('Gagal Meneruskan Laporan', err.message, 'error');
    }
  };

  const rejectFalseReport = async (id: string, reason?: string) => {
    try {
      const data = await apiFetch<{ report: UserReport; state: BackendStatePayload }>(`/api/reports/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      applyServerState(data.state);
      showToast(
        'Laporan Ditolak (Palsu)',
        `Laporan ${data.report.binName} ditolak dan tidak diteruskan ke petugas kebersihan.`,
        'info'
      );
    } catch (err: any) {
      showToast('Gagal Menolak Laporan', err.message, 'error');
    }
  };

  const bulkDispatchReports = async (ids: string[]) => {
    if (ids.length === 0) {
      showToast('Pilih Laporan', 'Centang minimal satu laporan untuk dikirimkan ke petugas.', 'info');
      return;
    }
    try {
      const data = await apiFetch<{ count: number; state: BackendStatePayload }>('/api/reports/bulk-dispatch', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      applyServerState(data.state);
      showToast('Tugas Diteruskan!', `${data.count} laporan diverifikasi dan dikirim ke halaman petugas.`);
    } catch (err: any) {
      showToast('Gagal Mengirim Tugas', err.message, 'error');
    }
  };

  const resolveReport = async (id: string) => {
    try {
      const data = await apiFetch<{ report: UserReport; state: BackendStatePayload }>(`/api/reports/${id}/resolve`, {
        method: 'POST'
      });
      applyServerState(data.state);
      showToast('Tugas Diselesaikan', 'Laporan telah ditandai Selesai dan kondisi tong dibersihkan.');
    } catch (err: any) {
      showToast('Gagal Menyelesaikan Tugas', err.message, 'error');
    }
  };

  const exportCsv = () => {
    const headers = 'ID,Waktu,Jenis Masalah,Titik Tong,Kategori,Lokasi,Pelapor,Status,Catatan\n';
    const rows = reports.map(
      r =>
        `"${r.id}","${r.timeAgoText}","${r.issueType}","${r.binName}","${r.category}","${r.location}","${r.reporter}","${r.status}","${(r.notes || '').replace(/"/g, '""')}"`
    );
    const csvContent = headers + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `vetbin_laporan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Ekspor Berhasil', 'File laporan CSV berhasil diunduh.');
  };

  const exportSqlDump = async () => {
    try {
      const headers = new Headers();
      if (authTokenRef.current) {
        headers.set('Authorization', `Bearer ${authTokenRef.current}`);
      }
      const response = await fetch('/api/database/export-sql', { headers });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal mengekspor SQL dump.');
      }
      const sqlText = await response.text();
      const blob = new Blob([sqlText], { type: 'application/sql;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `vetbin_phpmyadmin_${new Date().toISOString().slice(0, 10)}.sql`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast(
        'Ekspor SQL phpMyAdmin Berhasil',
        'File vetbin_phpmyadmin.sql siap diimpor langsung ke phpMyAdmin / MySQL.'
      );
    } catch (err: any) {
      showToast('Gagal Ekspor SQL', err.message, 'error');
    }
  };

  // ==================== VOUCHERS & POINTS ACTIONS ====================

  const addVoucher = async (v: Omit<CampusVoucher, 'id' | 'redeemedCount'>) => {
    try {
      const data = await apiFetch<{ voucher: CampusVoucher; state: BackendStatePayload }>('/api/vouchers', {
        method: 'POST',
        body: JSON.stringify(v)
      });
      applyServerState(data.state);
      showToast('Mitra / Voucher Ditambahkan', `${data.voucher.voucherTitle} dari ${data.voucher.partnerName} aktif.`);
    } catch (err: any) {
      showToast('Gagal Menambah Voucher', err.message, 'error');
    }
  };

  const updateVoucherStock = async (id: string, newStock: number) => {
    try {
      const data = await apiFetch<{ voucher: CampusVoucher; state: BackendStatePayload }>(`/api/vouchers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ stock: newStock })
      });
      applyServerState(data.state);
      showToast('Stok Diperbarui', 'Stok voucher berhasil diperbarui di database.');
    } catch (err: any) {
      showToast('Gagal Memperbarui Stok', err.message, 'error');
    }
  };

  const toggleVoucherStatus = async (id: string) => {
    try {
      const data = await apiFetch<{ voucher: CampusVoucher; state: BackendStatePayload }>(`/api/vouchers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ toggleStatus: true })
      });
      applyServerState(data.state);
    } catch (err: any) {
      showToast('Gagal Mengubah Status Voucher', err.message, 'error');
    }
  };

  const deleteVoucher = async (id: string) => {
    const target = vouchers.find(v => v.id === id);
    try {
      const data = await apiFetch<{ ok: boolean; state: BackendStatePayload }>(`/api/vouchers/${id}`, {
        method: 'DELETE'
      });
      applyServerState(data.state);
      showToast('Voucher Dihapus', `${target?.voucherTitle || 'Voucher'} berhasil dihapus dari database.`, 'info');
    } catch (err: any) {
      showToast('Gagal Menghapus Voucher', err.message, 'error');
    }
  };

  const redeemVoucher = async (
    voucherId: string
  ): Promise<{ success: boolean; message: string; code?: string }> => {
    if (!authUserRef.current) {
      openLoginModal('user');
      showToast('Login Diperlukan', 'Silakan masuk akun untuk menukar poin dengan voucher.', 'info');
      return { success: false, message: 'Login diperlukan' };
    }

    try {
      const data = await apiFetch<{
        success: boolean;
        message: string;
        code?: string;
        user?: AuthUser;
        state: BackendStatePayload;
      }>(`/api/vouchers/${voucherId}/redeem`, {
        method: 'POST'
      });

      if (data.user) {
        setAuthUser(data.user);
      }
      applyServerState(data.state);
      const targetVoucher = vouchers.find(v => v.id === voucherId);
      showToast(
        'Voucher Berhasil Ditukar!',
        `Gunakan kode ${data.code} di kasir ${targetVoucher?.partnerName || 'mitra kampus'}.`
      );
      return { success: true, message: data.message, code: data.code };
    } catch (err: any) {
      showToast('Penukaran Gagal', err.message, 'error');
      return { success: false, message: err.message };
    }
  };

  const addPoints = async (amount: number, wasteType?: string): Promise<boolean> => {
    if (!authUserRef.current) {
      openLoginModal('user');
      showToast('Login Diperlukan', 'Silakan masuk terlebih dahulu untuk mengklaim poin scan QR.', 'info');
      return false;
    }

    try {
      const data = await apiFetch<{ user: AuthUser }>('/api/points/scan', {
        method: 'POST',
        body: JSON.stringify({ amount, wasteType })
      });
      setAuthUser(data.user);
      showToast(`+${amount} Poin Berhasil Ditambahkan!`, 'Terima kasih sudah memilah sampah di tong yang tepat!');
      return true;
    } catch (err: any) {
      showToast('Gagal Menambah Poin', err.message, 'error');
      return false;
    }
  };

  const resetDatabase = async () => {
    try {
      const data = await apiFetch<{ ok: boolean; state: BackendStatePayload }>('/api/database/reset', {
        method: 'POST'
      });
      applyServerState(data.state);
      showToast('Database Direset', 'Semua data telah dikembalikan ke kondisi awal.');
    } catch (err: any) {
      showToast('Gagal Mereset Database', err.message, 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAdminView: isAdminViewState,
        setIsAdminView,
        userTab,
        setUserTab,
        adminTab,
        setAdminTab,
        authUser,
        authToken,
        isAuthLoading,
        isLoginModalOpen,
        loginModalMode,
        openLoginModal,
        closeLoginModal,
        loginWithCredentials,
        registerWithCredentials,
        logout,
        selectedBinId,
        setSelectedBinId,
        targetReportBinId,
        setTargetReportBinId,
        bins,
        addBin,
        updateBin,
        deleteBin,
        emptyBin,
        markBinReported,
        reports,
        addReport,
        updateReportStatus,
        dispatchReportToPetugas,
        rejectFalseReport,
        bulkDispatchReports,
        resolveReport,
        exportCsv,
        exportSqlDump,
        vouchers,
        addVoucher,
        updateVoucherStock,
        toggleVoucherStatus,
        deleteVoucher,
        redeemVoucher,
        redemptions,
        userProfile,
        addPoints,
        toasts,
        showToast,
        dismissToast,
        resetDatabase,
        isOnboardingOpen,
        setIsOnboardingOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
