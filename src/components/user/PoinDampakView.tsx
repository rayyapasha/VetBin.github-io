import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Award,
  Wine,
  Package,
  Leaf,
  Gift,
  QrCode,
  TrendingUp,
  User,
  Lock,
  LogIn,
  LogOut,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { CampusVoucher } from '../../types';

interface PoinDampakProps {
  onOpenScanModal: () => void;
  onOpenRedeemModal: (v: CampusVoucher) => void;
  onOpenKuponSaya: () => void;
}

export const PoinDampakView: React.FC<PoinDampakProps> = ({
  onOpenScanModal,
  onOpenRedeemModal,
  onOpenKuponSaya
}) => {
  const {
    authUser,
    userProfile,
    loginWithCredentials,
    logout,
    openLoginModal,
    vouchers,
    redemptions,
    showToast
  } = useApp();

  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim() || !passwordInput) {
      setLoginError('Username/email kampus dan password wajib diisi.');
      return;
    }
    setLoginError(null);
    setIsLoggingIn(true);
    try {
      const res = await loginWithCredentials(usernameInput.trim(), passwordInput, 'user');
      if (!res.success) {
        setLoginError(res.error || 'Username atau password salah.');
      } else {
        setUsernameInput('');
        setPasswordInput('');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleScanClick = () => {
    if (!authUser) {
      openLoginModal('user');
      showToast('Masuk Diperlukan', 'Silakan masuk akun terlebih dahulu untuk klaim poin QR.', 'info');
      return;
    }
    onOpenScanModal();
  };

  const handleRedeemClick = (voucher: CampusVoucher) => {
    if (!authUser) {
      openLoginModal('user');
      showToast('Masuk Diperlukan', 'Silakan masuk akun untuk menukar poin dengan voucher.', 'info');
      return;
    }
    onOpenRedeemModal(voucher);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Top Section: Points & Personal Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: Poin Reward */}
        <div className="lg:col-span-5 bg-[#234629] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Poin reward</span>
              </div>
              {authUser && (
                <span className="text-[11px] font-semibold text-emerald-200 bg-white/10 px-2.5 py-1 rounded-full truncate max-w-[190px]">
                  {authUser.username}
                </span>
              )}
            </div>

            <p className="text-emerald-100/80 text-xs sm:text-sm">
              {authUser ? 'Poin kamu saat ini' : 'Masuk akun untuk melihat saldo poin'}
            </p>
            <div className="text-4xl sm:text-6xl font-extrabold tracking-tight mt-1 text-white">
              {userProfile.points.toLocaleString('id-ID')}
            </div>

            <p className="text-xs text-emerald-200/90 mt-4 bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20">
              {authUser
                ? userProfile.points >= 1500
                  ? 'Poinmu cukup untuk menukar semua voucher kantin mitra kampus!'
                  : `Tinggal ${Math.max(0, 1500 - userProfile.points)} poin lagi untuk Voucher Kantin Rp25.000`
                : 'Masuk dengan akun mahasiswa/user di bawah ini untuk mengumpulkan poin dan menukar voucher.'}
            </p>
          </div>

          <div className="mt-6">
            <button
              onClick={handleScanClick}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#CA7426] hover:bg-[#b5641c] shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-200" />
              <span>{authUser ? 'Pindai QR di tong' : 'Masuk & Pindai QR di tong'}</span>
            </button>
          </div>
        </div>

        {/* Right Card: Dampak Pribadimu */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#1A231C]">
              Dampak pribadimu bulan ini
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Manfaat yang terasa nyata setiap kali kamu memilah.
            </p>

            {/* 3 Metrics Cards */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-6">
              <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-slate-200/70 text-center">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                  <Wine className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-3xl font-extrabold text-[#1A231C]">
                  {userProfile.bottlesCount}
                </span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-tight">
                  botol anorganik terpilah
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-slate-200/70 text-center">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center mx-auto mb-2">
                  <Package className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-3xl font-extrabold text-[#1A231C]">
                  {userProfile.foodWrappersCount}
                </span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-tight">
                  bungkus makanan terpilah
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#F8F9F5] border border-slate-200/70 text-center">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto mb-2">
                  <Leaf className="w-4 h-4" />
                </div>
                <span className="text-xl sm:text-3xl font-extrabold text-[#1A231C]">
                  {userProfile.organicKg} kg
                </span>
                <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium leading-tight">
                  sisa makanan organik
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3.5 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] text-xs font-semibold text-[#92400E] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#CA7426] shrink-0" />
            <span>
              {authUser
                ? `Kamu sudah memilah ${userProfile.improvementPercent || 22}% lebih banyak dibanding bulan lalu.`
                : 'Masuk dengan akun mahasiswa untuk mencatat dampak pemilahan sampah pribadimu.'}
            </span>
          </div>
        </div>
      </div>

      {/* Section: Tukar Poinmu */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1A231C]">Tukar poinmu</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Voucher kantin dan diskon cetak dari mitra kampus
            </p>
          </div>

          <button
            onClick={onOpenKuponSaya}
            className="self-start sm:self-auto py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-[#234629] bg-[#E8EFE8] hover:bg-[#dbe6db] border border-[#234629]/20 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <Gift className="w-4 h-4 text-[#234629]" />
            <span>Kupon Saya ({redemptions.length})</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vouchers.slice(7, 10).concat(vouchers.slice(0, 3)).slice(0, 3).map(voucher => {
            const canRedeem = Boolean(authUser) && userProfile.points >= voucher.pointCost && voucher.stock > 0;
            const outOfStock = voucher.stock <= 0;
            return (
              <div
                key={voucher.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#92400E] flex items-center justify-center">
                      <Gift className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                      {voucher.category}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900">{voucher.voucherTitle}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{voucher.description}</p>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <span className="font-extrabold text-sm sm:text-base text-[#92400E]">
                    {voucher.pointCost} poin
                  </span>

                  <button
                    onClick={() => handleRedeemClick(voucher)}
                    disabled={outOfStock || (Boolean(authUser) && !canRedeem)}
                    className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                      outOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : !authUser || canRedeem
                        ? 'bg-[#234629] text-white hover:bg-[#1b3620] shadow-xs active:scale-[0.98]'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {outOfStock ? 'Habis' : !authUser ? 'Masuk untuk Tukar' : 'Tukar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Cara Dapat Poin & Login */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cara Dapat Poin */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs">
          <h3 className="font-bold text-base text-slate-900 mb-4">Cara dapat poin</h3>
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E8EFE8] text-[#234629] font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <p>Pilah dan buang sampah di tong yang tepat</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E8EFE8] text-[#234629] font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <p>Pindai QR yang ada di tong tersebut</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#E8EFE8] text-[#234629] font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <p>Poin masuk, tukar dengan voucher kapan saja</p>
            </div>
          </div>
        </div>

        {/* Account Login / Status Box */}
        <div className="bg-[#F8F9F5] rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          {authUser ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full mb-2">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Akun Aktif Tersinkronisasi</span>
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{authUser.fullName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{authUser.username}</p>
                </div>
                <span className="text-xs font-bold uppercase px-2.5 py-1 rounded-lg bg-[#E8EFE8] text-[#234629]">
                  {authUser.role === 'admin' ? 'Admin' : 'Mahasiswa'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600">
                Semua poin, dampak bulanan, dan riwayat penukaran kupon Anda disimpan secara permanen ke database server dan diperbarui real-time.
              </div>

              <button
                type="button"
                onClick={() => logout()}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          ) : (
            <>
              <div>
                <h3 className="font-bold text-base text-slate-900">Masuk akun untuk fitur poin</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Peta, panduan pilah, dan laporan tetap bebas dipakai tanpa daftar. Masuk untuk menyimpan poin &amp; menukar kupon.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="mt-4 space-y-3">
                <div>
                  <label htmlFor="poin-username-input" className="sr-only">
                    Username atau email kampus
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="poin-username-input"
                      type="text"
                      autoComplete="username"
                      placeholder="Username atau email kampus"
                      value={usernameInput}
                      onChange={e => {
                        setUsernameInput(e.target.value);
                        setLoginError(null);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#234629]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="poin-password-input" className="sr-only">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="poin-password-input"
                      type="password"
                      autoComplete="current-password"
                      placeholder="Password akun"
                      value={passwordInput}
                      onChange={e => {
                        setPasswordInput(e.target.value);
                        setLoginError(null);
                      }}
                      className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#234629]"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#234629] hover:bg-[#1b3620] shadow-xs active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <LogIn className="w-4 h-4 text-emerald-300" />
                  <span>{isLoggingIn ? 'Memproses...' : 'Masuk untuk menukar poin'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
