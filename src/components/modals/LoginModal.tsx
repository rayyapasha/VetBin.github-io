import React, { useState, useEffect } from 'react';
import { useApp, LoginModalMode } from '../../context/AppContext';
import { X, Shield, User, Truck, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    loginModalMode,
    closeLoginModal,
    loginWithCredentials,
    registerWithCredentials
  } = useApp();

  const [roleTab, setRoleTab] = useState<LoginModalMode>(loginModalMode);
  const [authAction, setAuthAction] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isLoginModalOpen) {
      setRoleTab(loginModalMode);
      setAuthAction('login');
      setUsername('');
      setPassword('');
      setFullName('');
      setErrorMsg(null);
      setShowPassword(false);
    }
  }, [isLoginModalOpen, loginModalMode]);

  if (!isLoginModalOpen) return null;

  const handleRoleSwitch = (nextRole: LoginModalMode) => {
    setRoleTab(nextRole);
    setAuthAction('login');
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Username dan password wajib diisi.');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      if (roleTab === 'user' && authAction === 'register') {
        const res = await registerWithCredentials(username.trim(), password, fullName.trim() || undefined);
        if (!res.success) {
          setErrorMsg(res.error || 'Pendaftaran gagal.');
        }
      } else {
        const res = await loginWithCredentials(username.trim(), password, roleTab);
        if (!res.success) {
          setErrorMsg(res.error || 'Username atau password salah.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={closeLoginModal}
    >
      <div
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 relative"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          type="button"
          onClick={closeLoginModal}
          aria-label="Tutup dialog login"
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 3-Role Switcher: Mahasiswa, Petugas, Admin */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl mb-5 mr-8">
          <button
            type="button"
            onClick={() => handleRoleSwitch('user')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              roleTab === 'user'
                ? 'bg-white text-[#234629] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Mahasiswa</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('petugas')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              roleTab === 'petugas'
                ? 'bg-amber-400 text-[#1A231C] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 shrink-0" />
            <span>Petugas</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleSwitch('admin')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              roleTab === 'admin'
                ? 'bg-[#234629] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>Admin</span>
          </button>
        </div>

        <div className="mb-5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${
              roleTab === 'admin'
                ? 'bg-[#234629] text-emerald-300'
                : roleTab === 'petugas'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-[#E8EFE8] text-[#234629]'
            }`}
          >
            {roleTab === 'admin' ? (
              <Shield className="w-6 h-6" />
            ) : roleTab === 'petugas' ? (
              <Truck className="w-6 h-6" />
            ) : (
              <User className="w-6 h-6" />
            )}
          </div>

          <h2 id="login-modal-title" className="text-xl font-extrabold text-slate-900">
            {roleTab === 'admin'
              ? 'Masuk Dashboard Admin Kampus'
              : roleTab === 'petugas'
              ? 'Masuk Portal Petugas Kebersihan'
              : authAction === 'register'
              ? 'Daftar Akun Mahasiswa'
              : 'Masuk Akun Mahasiswa / User'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {roleTab === 'admin'
              ? 'Akses pengelolaan titik tong, verifikasi laporan warga, dan ekspor database.'
              : roleTab === 'petugas'
              ? 'Kelola laporan masuk, peta tong, rute pengosongan, dan notifikasi tong penuh.'
              : authAction === 'register'
              ? 'Buat akun baru untuk mengumpulkan poin pilah sampah & menukar voucher kantin.'
              : 'Masuk untuk mengumpulkan poin QR, memantau dampak pribadi, dan menukar voucher.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {roleTab === 'user' && authAction === 'register' && (
            <div>
              <label
                htmlFor="login-fullname-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Nama Lengkap
              </label>
              <input
                id="login-fullname-input"
                type="text"
                placeholder="Nama lengkap mahasiswa"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#234629] focus:bg-white"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="login-username-input"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              {roleTab === 'admin'
                ? 'Username Admin'
                : roleTab === 'petugas'
                ? 'Username Petugas'
                : 'Username / Email Kampus'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-username-input"
                type="text"
                autoComplete="username"
                placeholder={
                  roleTab === 'admin'
                    ? 'Masukkan username admin'
                    : roleTab === 'petugas'
                    ? 'Masukkan username petugas (Petugas)'
                    : 'Contoh: nim@kampus.ac.id'
                }
                value={username}
                onChange={e => {
                  setUsername(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#234629] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="login-password-input"
              className="block text-xs font-semibold text-slate-700 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                autoComplete={authAction === 'register' ? 'new-password' : 'current-password'}
                placeholder="Masukkan password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#234629] focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(prev => !prev)}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {roleTab === 'petugas' && (
            <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-2">
              Kredensial petugas default: username <strong className="text-slate-700">Petugas</strong> · password{' '}
              <strong className="text-slate-700">Petugas</strong>
            </p>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#234629] hover:bg-[#1b3620] shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {authAction === 'register' ? (
              <UserPlus className="w-4 h-4 text-emerald-300" />
            ) : (
              <LogIn className="w-4 h-4 text-emerald-300" />
            )}
            <span>
              {isSubmitting
                ? 'Memproses...'
                : roleTab === 'admin'
                ? 'Masuk sebagai Admin'
                : roleTab === 'petugas'
                ? 'Masuk sebagai Petugas'
                : authAction === 'register'
                ? 'Daftar & Masuk'
                : 'Masuk Sekarang'}
            </span>
          </button>

          {roleTab === 'user' && (
            <div className="pt-2 text-center text-xs text-slate-500">
              {authAction === 'login' ? (
                <span>
                  Belum punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthAction('register');
                      setErrorMsg(null);
                    }}
                    className="font-bold text-[#234629] hover:underline cursor-pointer"
                  >
                    Daftar akun mahasiswa
                  </button>
                </span>
              ) : (
                <span>
                  Sudah punya akun?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthAction('login');
                      setErrorMsg(null);
                    }}
                    className="font-bold text-[#234629] hover:underline cursor-pointer"
                  >
                    Masuk ke akun
                  </button>
                </span>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
