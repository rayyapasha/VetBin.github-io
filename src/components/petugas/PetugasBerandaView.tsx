import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Inbox,
  Map as MapIcon,
  BellRing,
  ArrowRight,
  CheckCircle2,
  Route,
  AlertTriangle
} from 'lucide-react';

export const PetugasBerandaView: React.FC = () => {
  const {
    bins,
    reports,
    authUser,
    setPetugasTab,
    setPetugasLaporSubTab,
    setPetugasPetaSubTab,
    setSelectedBinId,
    emptyBin,
    resolveReport
  } = useApp();

  const assignedReports = useMemo(
    () => reports.filter(r => r.assignedToPetugas && r.status !== 'Selesai' && r.status !== 'Ditolak'),
    [reports]
  );

  const urgentBins = useMemo(
    () => bins.filter(b => b.status === 'Penuh' || b.status === 'Rusak').sort((a, b) => a.distanceM - b.distanceM),
    [bins]
  );

  const completedReportsCount = useMemo(
    () => reports.filter(r => r.status === 'Selesai').length,
    [reports]
  );

  const openTerimaLaporan = () => {
    setPetugasLaporSubTab('terima');
    setPetugasTab('lapor');
  };

  const openBuatLaporan = () => {
    setPetugasLaporSubTab('buat');
    setPetugasTab('lapor');
  };

  const openPetaTong = () => {
    setPetugasPetaSubTab('peta');
    setPetugasTab('peta-tong');
  };

  const openRutePengosongan = (binId?: string) => {
    if (binId) setSelectedBinId(binId);
    setPetugasPetaSubTab('rute');
    setPetugasTab('peta-tong');
  };

  const openNotifikasi = () => {
    setPetugasTab('notifikasi');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <p className="text-xs font-semibold text-[#234629] tracking-wide mb-1">
            VetBin · {authUser?.fullName || 'Petugas Kebersihan Kampus'}
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A231C] tracking-tight">
            Beranda (Petugas)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Pusat tugas lapangan untuk menerima laporan, menavigasi rute pengosongan, dan memantau notifikasi tong penuh.
          </p>
        </div>

        {/* Summary Metrics Row */}
        <div className="flex items-center gap-6 shrink-0">
          <div>
            <p className="text-xs text-slate-500 font-medium">Laporan Masuk</p>
            <p className="text-2xl font-extrabold text-[#1A231C] tabular-nums">{assignedReports.length}</p>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Tong Penuh</p>
            <p className="text-2xl font-extrabold text-[#CA7426] tabular-nums">{urgentBins.length}</p>
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-500 font-medium">Terselesaikan</p>
            <p className="text-2xl font-extrabold text-[#166534] tabular-nums">{completedReportsCount}</p>
          </div>
        </div>
      </div>

      {/* 3 Primary Flowchart Branches */}
      <section aria-label="Menu Utama Petugas">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Branch 1: Lapor -> Terima laporan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[#234629] flex items-center justify-center">
                  <Inbox className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {assignedReports.length} aktif
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A231C]">Lapor</h2>
                <p className="text-xs font-semibold text-[#234629] mt-0.5">
                  Sub-menu: Terima laporan
                </p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Terima laporan warga yang telah diverifikasi Admin atau kirim laporan kondisi tong langsung dari lapangan.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={openTerimaLaporan}
                className="w-full py-2.5 px-4 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs sm:text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Buka Terima Laporan</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
              <button
                type="button"
                onClick={openBuatLaporan}
                className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                Kirim Laporan Lapangan
              </button>
            </div>
          </div>

          {/* Branch 2: Peta tong -> Rute pengosongan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/70 text-[#92400E] flex items-center justify-center">
                  <MapIcon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-slate-500 tabular-nums">
                  {bins.length} titik tong
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A231C]">Peta tong</h2>
                <p className="text-xs font-semibold text-[#92400E] mt-0.5">
                  Sub-menu: Rute pengosongan
                </p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Pantau posisi seluruh tong di denah kampus dan ikuti jalur rute pengosongan prioritas terdekat.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => openRutePengosongan()}
                className="w-full py-2.5 px-4 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs sm:text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Buka Rute Pengosongan</span>
                <Route className="w-4 h-4 text-amber-300" />
              </button>
              <button
                type="button"
                onClick={openPetaTong}
                className="w-full py-2 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                Lihat Peta Tong Kampus
              </button>
            </div>
          </div>

          {/* Branch 3: Notifikasi Tong Penuh */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200/70 text-rose-700 flex items-center justify-center">
                  <BellRing className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-rose-700 tabular-nums">
                  {urgentBins.length} perlu tindakan
                </span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1A231C]">Notifikasi Tong Penuh</h2>
                <p className="text-xs font-semibold text-rose-700 mt-0.5">
                  Peringatan real-time lapangan
                </p>
                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                  Daftar peringatan tong berstatus penuh atau rusak agar segera dijadwalkan untuk pengosongan.
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={openNotifikasi}
                className="w-full py-2.5 px-4 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs sm:text-sm font-bold flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Lihat Notifikasi Tong Penuh</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>
              <div className="text-xs text-slate-500 px-1 py-1.5 truncate">
                {urgentBins[0]
                  ? `Prioritas: ${urgentBins[0].name} · ${urgentBins[0].building}`
                  : 'Semua tong terpantau normal'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Priority Queue Summary */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Laporan Terbaru Diterima */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#1A231C]">Terima Laporan Terbaru</h3>
              <p className="text-xs text-slate-500">Laporan terverifikasi admin yang siap ditangani</p>
            </div>
            <button
              type="button"
              onClick={openTerimaLaporan}
              className="text-xs font-bold text-[#234629] hover:underline cursor-pointer whitespace-nowrap"
            >
              Semua ({assignedReports.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {assignedReports.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum ada laporan baru yang tertunda</p>
                <p className="text-xs text-slate-500 mt-0.5">Laporan yang dikirim Admin akan muncul otomatis di sini.</p>
              </div>
            ) : (
              assignedReports.slice(0, 4).map(rep => (
                <div key={rep.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-rose-700">{rep.issueType}</span>
                      <span>·</span>
                      <span>{rep.timeAgoText}</span>
                      <span>·</span>
                      <span>{rep.reporter}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 truncate mt-0.5">{rep.binName}</p>
                    <p className="text-xs text-slate-500 truncate">{rep.location}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openRutePengosongan(rep.binId)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      Rute
                    </button>
                    <button
                      type="button"
                      onClick={() => resolveReport(rep.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#234629] hover:bg-[#1b3620] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Selesai
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Antrean Notifikasi Tong Penuh */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#1A231C]">Peringatan Tong Penuh Terdekat</h3>
              <p className="text-xs text-slate-500">Titik tong berstatus penuh atau rusak di kampus</p>
            </div>
            <button
              type="button"
              onClick={openNotifikasi}
              className="text-xs font-bold text-[#234629] hover:underline cursor-pointer whitespace-nowrap"
            >
              Semua ({urgentBins.length})
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {urgentBins.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">Semua tong berstatus kosong / normal</p>
                <p className="text-xs text-slate-500 mt-0.5">Tidak ada peringatan tong penuh saat ini.</p>
              </div>
            ) : (
              urgentBins.slice(0, 4).map(bin => (
                <div key={bin.id} className="py-3.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="font-bold text-rose-700">{bin.status}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500 tabular-nums">{bin.distanceM} m</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-slate-500">{bin.category}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 truncate mt-0.5">{bin.name}</p>
                    <p className="text-xs text-slate-500 truncate">{bin.building}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openRutePengosongan(bin.id)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer whitespace-nowrap"
                    >
                      Rute
                    </button>
                    <button
                      type="button"
                      onClick={() => emptyBin(bin.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#234629] hover:bg-[#1b3620] text-white text-xs font-bold cursor-pointer whitespace-nowrap"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
