import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusMapCanvas } from '../common/CampusMapCanvas';
import {
  Truck,
  CheckCircle2,
  Check,
  Wine,
  Utensils,
  FileText,
  BatteryCharging,
  ListFilter,
  Map as MapIcon,
  ShieldCheck,
  AlertTriangle,
  User,
  Clock,
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';
import { WasteCategory, UserReport, CampusBin } from '../../types';

export const PetugasRouteView: React.FC = () => {
  const { bins, emptyBin, reports, resolveReport } = useApp();
  const [emptiedCountToday, setEmptiedCountToday] = useState(12);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const [taskFilter, setTaskFilter] = useState<'all' | 'reports' | 'routine'>('all');
  const [selectedUrgentBinId, setSelectedUrgentBinId] = useState<string | null>(null);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // 1. Admin-dispatched reports requiring cleaner action
  const assignedReports = useMemo(() => {
    return reports.filter(
      r => r.assignedToPetugas && r.status !== 'Selesai' && r.status !== 'Ditolak'
    );
  }, [reports]);

  // 2. Urgent bins needing cleaner action (Penuh / Rusak), sorted by distance
  const urgentBins = useMemo(() => {
    return bins
      .filter(b => b.status === 'Penuh' || b.status === 'Rusak')
      .sort((a, b) => a.distanceM - b.distanceM);
  }, [bins]);

  // Combined route bins for map routing (deduplicated)
  const combinedRouteBins = useMemo(() => {
    const binMap = new Map<string, CampusBin>();
    urgentBins.forEach(b => binMap.set(b.id, b));
    assignedReports.forEach(r => {
      const match = bins.find(b => b.id === r.binId);
      if (match) binMap.set(match.id, match);
    });
    return Array.from(binMap.values());
  }, [urgentBins, assignedReports, bins]);

  const totalTasksCount = assignedReports.length + urgentBins.length;

  const getCategoryIcon = (category: WasteCategory) => {
    switch (category) {
      case 'Anorganik':
        return <Wine className="w-4 h-4 text-[#92400E]" />;
      case 'Organik':
        return <Utensils className="w-4 h-4 text-[#166534]" />;
      case 'Kertas':
        return <FileText className="w-4 h-4 text-[#1E40AF]" />;
      case 'E-waste / Baterai':
        return <BatteryCharging className="w-4 h-4 text-[#991B1B]" />;
    }
  };

  const getCategoryTheme = (cat: WasteCategory) => {
    switch (cat) {
      case 'Anorganik':
        return 'bg-[#FFFBEB] border-[#FDE68A]';
      case 'Organik':
        return 'bg-[#ECFDF5] border-[#A7F3D0]';
      case 'Kertas':
        return 'bg-[#EFF6FF] border-[#BFDBFE]';
      case 'E-waste / Baterai':
        return 'bg-[#FEF2F2] border-[#FECACA]';
    }
  };

  const handleEmpty = (binId: string) => {
    emptyBin(binId);
    setEmptiedCountToday(prev => prev + 1);
  };

  const handleResolveTask = (reportId: string) => {
    resolveReport(reportId);
    setEmptiedCountToday(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EFE8] text-[#234629] text-xs font-semibold mb-2">
            <Truck className="w-3.5 h-3.5" />
            Petugas kebersihan · Shift aktif
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A231C] tracking-tight">Rute &amp; Tugas Pembersihan</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Daftar tugas lapangan dari laporan warga yang telah diverifikasi admin kampus &amp; antrean tong penuh.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 self-start sm:self-auto shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sinkronisasi Laporan Admin Real-Time</span>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center p-1 bg-slate-200/80 rounded-2xl mb-4">
        <button
          onClick={() => setMobileTab('list')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'list' ? 'bg-white text-[#234629] shadow-xs' : 'text-slate-600'
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          <span>Daftar Tugas ({totalTasksCount})</span>
        </button>
        <button
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === 'map' ? 'bg-white text-[#234629] shadow-xs' : 'text-slate-600'
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Peta Rute Kampus</span>
        </button>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Assigned Reports & Urgent Bins (5 cols, h-[680px]) */}
        <div className={`lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col h-[680px] ${
          mobileTab === 'map' ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-2 pb-3.5 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-center">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-900">{assignedReports.length}</span>
              <p className="text-[10px] text-blue-700 font-semibold">Tugas Laporan</p>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-center">
              <span className="text-xl sm:text-2xl font-extrabold text-[#CA7426]">{urgentBins.length}</span>
              <p className="text-[10px] text-amber-800 font-semibold">Tong Penuh</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-xl sm:text-2xl font-extrabold text-[#166534]">{emptiedCountToday}</span>
              <p className="text-[10px] text-emerald-700 font-semibold">Selesai Hari Ini</p>
            </div>
          </div>

          {/* Subheader & Task Segmented Filter */}
          <div className="my-3 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTaskFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  taskFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Semua ({totalTasksCount})
              </button>
              <button
                onClick={() => setTaskFilter('reports')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                  taskFilter === 'reports'
                    ? 'bg-white text-blue-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Laporan Admin</span>
                {assignedReports.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                )}
              </button>
              <button
                onClick={() => setTaskFilter('routine')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  taskFilter === 'routine'
                    ? 'bg-white text-amber-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tong Rutin ({urgentBins.length})
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-medium">Urut prioritas</span>
          </div>

          {/* Scrollable Tasks List */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {totalTasksCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">Semua Tugas Selesai!</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Tidak ada laporan aktif dari admin maupun tong penuh yang membutuhkan tindakan saat ini.
                </p>
              </div>
            ) : (
              <>
                {/* Section A: Laporan dari Admin */}
                {(taskFilter === 'all' || taskFilter === 'reports') && assignedReports.length > 0 && (
                  <div className="space-y-2.5">
                    {taskFilter === 'all' && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Tugas Laporan Terverifikasi Admin ({assignedReports.length})</span>
                      </div>
                    )}

                    {assignedReports.map((rep) => {
                      const isSelected = selectedUrgentBinId === rep.binId;
                      return (
                        <div
                          key={rep.id}
                          onClick={() => {
                            setSelectedUrgentBinId(rep.binId);
                            if (window.innerWidth < 1024) setMobileTab('map');
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer bg-white space-y-2.5 ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs bg-blue-50/20'
                              : 'border-slate-200/90 hover:border-blue-300 hover:shadow-2xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                                <AlertTriangle className="w-4 h-4 text-blue-700" />
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 inline-flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-blue-600" />
                                    Diverifikasi Admin
                                  </span>
                                  <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                    {rep.issueType}
                                  </span>
                                </div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 mt-1">
                                  {rep.binName}
                                </h4>
                                <p className="text-[11px] text-slate-500">{rep.location}</p>
                              </div>
                            </div>

                            <span className="text-[10px] text-slate-400 whitespace-nowrap">
                              {rep.timeAgoText}
                            </span>
                          </div>

                          {/* Notes snippet */}
                          {rep.notes && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-xl border border-slate-100">
                              "{rep.notes}"
                            </p>
                          )}

                          {/* Footer with actions */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-500">
                              Pelapor: <strong className="text-slate-700">{rep.reporter}</strong>
                            </span>

                            <div className="flex items-center gap-1.5">
                              {rep.photoUrl && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewPhotoUrl(rep.photoUrl || null);
                                  }}
                                  className="p-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                                  title="Lihat foto bukti"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleResolveTask(rep.id);
                                }}
                                className="py-1.5 px-3 rounded-xl font-bold text-xs text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs active:scale-[0.98] transition-all cursor-pointer flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
                                <span>Selesaikan Tugas</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Section B: Antrean Tong Penuh Rutin */}
                {(taskFilter === 'all' || taskFilter === 'routine') && urgentBins.length > 0 && (
                  <div className="space-y-2.5">
                    {taskFilter === 'all' && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 bg-amber-50/80 px-2.5 py-1 rounded-lg border border-amber-100">
                        <Truck className="w-3.5 h-3.5 text-amber-700" />
                        <span>Antrean Tong Penuh Lapangan ({urgentBins.length})</span>
                      </div>
                    )}

                    {urgentBins.map((bin, index) => {
                      const theme = getCategoryTheme(bin.category);
                      const isSelected = (selectedUrgentBinId || combinedRouteBins[0]?.id) === bin.id;
                      return (
                        <div
                          key={bin.id}
                          onClick={() => {
                            setSelectedUrgentBinId(bin.id);
                            if (window.innerWidth < 1024) setMobileTab('map');
                          }}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-[#234629] bg-[#F4F7F3] ring-1 ring-[#234629]/20 shadow-xs'
                              : 'border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Priority Badge */}
                            <div className="w-7 h-7 rounded-full bg-[#1A231C] text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                              {index + 1}
                            </div>

                            {/* Icon */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${theme}`}>
                              {getCategoryIcon(bin.category)}
                            </div>

                            {/* Info */}
                            <div className="min-w-0">
                              <h4 className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                {bin.name}
                              </h4>
                              <p className="text-[11px] text-slate-500 truncate">
                                {bin.building} · {bin.locationDetail.split(',')[0]}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                                <span className="px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-bold">
                                  {bin.status}
                                </span>
                                <span className="text-slate-400">·</span>
                                <span className="text-slate-500 font-medium">
                                  {bin.distanceM} m
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmpty(bin.id);
                              }}
                              className="py-1.5 px-3 rounded-xl font-bold text-xs text-white bg-[#234629] hover:bg-[#1b3620] shadow-2xs active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap"
                            >
                              Sudah dikosongkan
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bottom helper tip */}
          <div className="pt-3 border-t border-slate-100 mt-2 text-[11px] text-[#92400E] bg-[#FFFBEB] p-2.5 rounded-xl border border-[#FDE68A] flex items-start gap-2">
            <Check className="w-3.5 h-3.5 text-[#CA7426] shrink-0 mt-0.5" />
            <span>
              Tekan <strong>"Selesaikan Tugas"</strong> atau <strong>"Sudah dikosongkan"</strong> setelah membersihkan titik tong.
            </span>
          </div>
        </div>

        {/* Right Column: CampusMapCanvas */}
        <div className={`lg:col-span-7 sticky top-24 ${
          mobileTab === 'list' ? 'hidden lg:block' : 'block'
        }`}>
          <CampusMapCanvas
            bins={bins}
            showRouteLine={true}
            routeBins={combinedRouteBins}
            isCompact={false}
            selectedBinId={selectedUrgentBinId || combinedRouteBins[0]?.id}
            onSelectBin={(b) => setSelectedUrgentBinId(b.id)}
          />
        </div>
      </div>

      {/* Photo Preview Modal if cleaner wants to see photo */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Foto Bukti Laporan Warga</h4>
              <button
                onClick={() => setPreviewPhotoUrl(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center">
              <img src={previewPhotoUrl} alt="Bukti laporan" className="max-h-80 w-auto rounded-xl object-contain shadow-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
