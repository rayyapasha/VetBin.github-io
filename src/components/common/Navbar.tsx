import React, { useState } from 'react';
import { useApp, UserTab } from '../../context/AppContext';
import {
  Menu,
  X,
  Shield,
  MapPin,
  Sparkles,
  AlertCircle,
  Award,
  Truck,
  HelpCircle,
  LogIn,
  LogOut,
  User
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    userTab,
    setUserTab,
    setIsAdminView,
    setAdminTab,
    setIsOnboardingOpen,
    authUser,
    openLoginModal,
    logout
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { id: UserTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'beranda', label: 'Beranda' },
    { id: 'peta', label: 'Peta Tong', icon: <MapPin className="w-4 h-4" /> },
    { id: 'panduan', label: 'Panduan Pilah', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'lapor', label: 'Lapor', icon: <AlertCircle className="w-4 h-4" /> },
    { id: 'poin', label: 'Poin & Dampak', icon: <Award className="w-4 h-4" /> },
    { id: 'petugas', label: 'Petugas', icon: <Truck className="w-4 h-4" /> },
  ];

  const handleOpenAdmin = () => {
    if (authUser?.role === 'admin') {
      setIsAdminView(true);
      setAdminTab('ringkasan');
    } else {
      openLoginModal('admin');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F8F9F5]/90 backdrop-blur-md border-b border-slate-200/70 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setUserTab('beranda');
              setIsAdminView(false);
            }}
            className="flex items-center gap-2 group text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#234629] text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs group-hover:bg-[#1b3620] transition-colors">
              <svg className="w-4 h-4 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
                <path d="m14 16-3 3 3 3" />
                <path d="M8.294 4.5h8.412a1.83 1.83 0 0 1 1.571.879 1.785 1.785 0 0 1 .005 1.784l-2.025 3.51" />
                <path d="m10 8 3-3-3-3" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-extrabold text-xl tracking-tight text-[#234629]">VET</span>
              <span className="font-extrabold text-xl tracking-tight text-[#CA7426]">BIN</span>
            </div>
          </button>
        </div>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map(link => {
            const isActive = userTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setUserTab(link.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'text-[#234629] bg-[#E8EFE8] font-semibold'
                    : 'text-slate-600 hover:text-[#234629] hover:bg-slate-100/70'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right CTA: User Auth + Admin Kampus & Mobile Menu */}
        <div className="flex items-center gap-2">
          {authUser ? (
            <div className="hidden sm:flex items-center gap-1.5">
              {authUser.role === 'user' && (
                <button
                  onClick={() => setUserTab('poin')}
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-all cursor-pointer"
                  title={authUser.username}
                >
                  <User className="w-3.5 h-3.5 text-[#234629]" />
                  <span className="max-w-[110px] truncate">{authUser.username.split('@')[0]}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-[#234629] font-extrabold text-[11px]">
                    {authUser.points}
                  </span>
                </button>
              )}
              <button
                onClick={() => logout()}
                className="flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                title="Keluar dari akun"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => openLoginModal('user')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 transition-all cursor-pointer"
              title="Masuk akun mahasiswa"
            >
              <LogIn className="w-3.5 h-3.5 text-[#234629]" />
              <span>Masuk</span>
            </button>
          )}

          {/* Admin Switcher / Admin Login Button */}
          <button
            onClick={handleOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#234629] bg-[#EAEFEA] hover:bg-[#DCE6DC] border border-[#234629]/20 transition-all cursor-pointer"
            title={authUser?.role === 'admin' ? 'Buka Dashboard Admin Kampus' : 'Login sebagai Admin Kampus'}
          >
            <Shield className="w-4 h-4 text-[#234629]" />
            <span>{authUser?.role === 'admin' ? 'Dashboard Admin' : 'Admin Kampus'}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu navigasi"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in fade-in slide-in-from-top duration-200">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => {
                setUserTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium ${
                userTab === link.id
                  ? 'bg-[#E8EFE8] text-[#234629] font-semibold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{link.label}</span>
              {link.icon}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            {authUser ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/70 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="w-4 h-4 text-[#234629] shrink-0" />
                  <span className="font-bold text-slate-800 truncate">{authUser.username}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-700 font-bold flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  openLoginModal('user');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#234629] hover:bg-[#1b3620]"
              >
                <LogIn className="w-4 h-4 text-emerald-300" />
                <span>Masuk Akun Mahasiswa / User</span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOnboardingOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              Panduan Penggunaan VetBin
            </button>
            <button
              onClick={() => {
                handleOpenAdmin();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-[#234629] bg-[#EAEFEA]"
            >
              <Shield className="w-4 h-4" />
              <span>{authUser?.role === 'admin' ? 'Buka Dashboard Admin Kampus' : 'Masuk Dashboard Admin Kampus'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
