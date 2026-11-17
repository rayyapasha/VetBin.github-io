import React, { useMemo, useState } from 'react';
import { useApp, PetugasTab } from '../../context/AppContext';
import {
  Home,
  Inbox,
  Map as MapIcon,
  BellRing,
  Truck,
  Menu,
  X,
  LogOut,
  User
} from 'lucide-react';

export const PetugasSidebar: React.FC = () => {
  const {
    petugasTab,
    setPetugasTab,
    setPetugasLaporSubTab,
    setPetugasPetaSubTab,
    reports,
    bins,
    authUser,
    logout
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const pendingAssignedCount = useMemo(
    () => reports.filter(r => r.assignedToPetugas && r.status !== 'Selesai' && r.status !== 'Ditolak').length,
    [reports]
  );

  const urgentBinsCount = useMemo(
    () => bins.filter(b => b.status === 'Penuh' || b.status === 'Rusak').length,
    [bins]
  );

  const menuItems: {
    id: PetugasTab;
    label: string;
    sublabel?: string;
    badge?: number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'beranda',
      label: 'Beranda',
      sublabel: 'Beranda Petugas',
      icon: <Home className="w-4 h-4 shrink-0" />
    },
    {
      id: 'lapor',
      label: 'Lapor',
      sublabel: 'Terima laporan',
      badge: pendingAssignedCount,
      icon: <Inbox className="w-4 h-4 shrink-0" />
    },
    {
      id: 'peta-tong',
      label: 'Peta Tong',
      sublabel: 'Rute pengosongan',
      icon: <MapIcon className="w-4 h-4 shrink-0" />
    },
    {
      id: 'notifikasi',
      label: 'Notifikasi Tong Penuh',
      sublabel: 'Peringatan penuh',
      badge: urgentBinsCount,
      icon: <BellRing className="w-4 h-4 shrink-0" />
    }
  ];

  const handleSelectTab = (id: PetugasTab) => {
    if (id === 'lapor') setPetugasLaporSubTab('terima');
    if (id === 'peta-tong') setPetugasPetaSubTab('peta');
    setPetugasTab(id);
    setMobileMenuOpen(false);
  };

  const currentLabel = menuItems.find(m => m.id === petugasTab)?.label || 'Beranda';

  return (
    <>
      {/* Mobile & Tablet Header (< lg) */}
      <div className="lg:hidden sticky top-0 z-40 bg-[#234629] text-white border-b border-[#1b3620] px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-white cursor-pointer"
            aria-label="Toggle menu petugas"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-baseline gap-0.5">
            <span className="font-extrabold text-lg tracking-tight text-white">VET</span>
            <span className="font-extrabold text-lg tracking-tight text-[#E58B35]">BIN</span>
          </div>
          <span className="text-xs text-emerald-200 font-semibold truncate max-w-[160px]">
            Petugas · {currentLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 text-xs font-semibold transition-all border border-rose-500/30 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar</span>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end sm:justify-start"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-[#234629] text-white w-full max-h-[85vh] overflow-y-auto p-5 rounded-t-3xl sm:rounded-none sm:h-full sm:max-w-xs shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-emerald-900/60 mb-4">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-300" />
                <span className="font-bold text-sm tracking-wide text-emerald-100">Portal Petugas</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Tutup menu petugas"
                className="p-1.5 rounded-full bg-emerald-900/60 text-emerald-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Menu Navigasi Petugas Mobile" className="space-y-1.5">
              {menuItems.map(item => {
                const isActive = petugasTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-emerald-950/80 text-white shadow-inner border border-emerald-700/50'
                        : 'text-emerald-100/80 hover:text-white hover:bg-emerald-900/40'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.icon}
                      <div className="min-w-0">
                        <div className="truncate">{item.label}</div>
                        {item.sublabel && (
                          <div className="text-[11px] font-normal text-emerald-200/70 truncate">
                            {item.sublabel}
                          </div>
                        )}
                      </div>
                    </div>
                    {typeof item.badge === 'number' && item.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-400 text-[#1A231C] text-xs font-extrabold tabular-nums shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-emerald-900/60 space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-emerald-950/60 text-xs text-emerald-100">
                <User className="w-4 h-4 text-emerald-300 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold truncate">{authUser?.fullName || 'Petugas Kebersihan'}</p>
                  <p className="text-[11px] text-emerald-300/80 truncate">{authUser?.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-rose-100 text-xs font-bold flex items-center justify-center gap-2 border border-rose-500/30 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (>= lg) */}
      <aside className="hidden lg:flex w-64 bg-[#234629] text-white flex-col min-h-screen shrink-0 border-r border-[#1b3620]">
        <div className="p-6 border-b border-emerald-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white text-[#234629] flex items-center justify-center font-bold shadow-xs">
              <Truck className="w-4 h-4 text-[#234629]" />
            </div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-extrabold text-xl tracking-tight text-white">VET</span>
              <span className="font-extrabold text-xl tracking-tight text-[#E58B35]">BIN</span>
            </div>
          </div>
          <p className="text-xs text-emerald-200/80 font-medium mt-2">
            Portal Petugas Kebersihan
          </p>
        </div>

        <nav aria-label="Menu Navigasi Petugas Desktop" className="flex-1 p-4 space-y-1.5">
          {menuItems.map(item => {
            const isActive = petugasTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-emerald-950/80 text-white font-semibold shadow-inner border border-emerald-700/40'
                    : 'text-emerald-100/80 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {item.icon}
                  <div className="min-w-0">
                    <div className="truncate leading-snug">{item.label}</div>
                    {item.sublabel && (
                      <div className="text-[11px] font-normal text-emerald-200/65 truncate">
                        {item.sublabel}
                      </div>
                    )}
                  </div>
                </div>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-400 text-[#1A231C] text-xs font-extrabold tabular-nums shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-emerald-900/50 space-y-2.5">
          <button
            type="button"
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-900/80 text-rose-100 text-xs font-semibold transition-all border border-rose-500/30 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-emerald-950/40">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-[#1A231C] flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="text-xs min-w-0">
              <p className="font-bold text-white truncate">{authUser?.fullName || 'Petugas Kampus'}</p>
              <p className="text-emerald-300/75 text-[11px] truncate">{authUser?.username || 'Petugas'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
