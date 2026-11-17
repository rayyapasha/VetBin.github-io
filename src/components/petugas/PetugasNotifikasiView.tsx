import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BellRing, CheckCircle2, AlertTriangle, Route, Trash2 } from 'lucide-react';

export const PetugasNotifikasiView: React.FC = () => {
  const {
    bins,
    emptyBin,
    setSelectedBinId,
    setPetugasPetaSubTab,
    setPetugasTab
  } = useApp();

  const [filterType, setFilterType] = useState<'all' | 'Penuh' | 'Rusak'>('all');

  const urgentBins = useMemo(() => {
    return bins
      .filter(b => b.status === 'Penuh' || b.status === 'Rusak')
      .filter(b => (filterType === 'all' ? true : b.status === filterType))
      .sort((a, b) => (a.reportedMinutesAgo ?? 99) - (b.reportedMinutesAgo ?? 99));
  }, [bins, filterType]);

  const fullCount = useMemo(() => bins.filter(b => b.status === 'Penuh').length, [bins]);
  const brokenCount = useMemo(() => bins.filter(b => b.status === 'Rusak').length, [bins]);

  const handleOpenRouteForBin = (binId: string) => {
    setSelectedBinId(binId);
    setPetugasPetaSubTab('rute');
    setPetugasTab('peta-tong');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-semibold text-[#234629] mb-1">
            Beranda (Petugas) / Notifikasi Tong Penuh
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A231C] tracking-tight">
            Notifikasi Tong Penuh
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Daftar peringatan real-time titik tong berstatus penuh dan rusak yang memerlukan pengosongan segera.
          </p>
        </div>

        <div className="flex items-center gap-5 shrink-0">
          <div>
            <p className="text-xs text-slate-500">Tong Penuh</p>
            <p className="text-2xl font-extrabold text-[#CA7426] tabular-nums">{fullCount}</p>
          </div>
          <div className="h-8 w-px bg-slate-200" />
          <div>
            <p className="text-xs text-slate-500">Tong Rusak</p>
            <p className="text-2xl font-extrabold text-rose-700 tabular-nums">{brokenCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua Peringatan ({fullCount + brokenCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Penuh')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterType === 'Penuh' ? 'bg-white text-[#92400E] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tong Penuh ({fullCount})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Rusak')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
              filterType === 'Rusak' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tong Rusak ({brokenCount})
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {urgentBins.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">Tidak ada notifikasi tong penuh</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Seluruh tong sampah kampus saat ini dalam kondisi kosong dan siap digunakan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {urgentBins.map(bin => {
            const isBroken = bin.status === 'Rusak';
            return (
              <div
                key={bin.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isBroken ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-[#CA7426] border border-amber-200'
                    }`}
                  >
                    {isBroken ? <AlertTriangle className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className={`font-bold ${isBroken ? 'text-rose-700' : 'text-[#92400E]'}`}>
                        Peringatan: {bin.status}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500">{bin.category}</span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-500 tabular-nums">
                        {bin.reportedMinutesAgo ? `${bin.reportedMinutesAgo} mnt lalu` : 'Baru dilaporkan'}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{bin.name}</h3>
                    <p className="text-xs text-slate-500">
                      {bin.building} · {bin.locationDetail} · Jarak {bin.distanceM} m · Kapasitas {bin.capacityKg} kg
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenRouteForBin(bin.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Route className="w-3.5 h-3.5 text-[#234629]" />
                    <span>Rute Pengosongan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => emptyBin(bin.id)}
                    className="px-4 py-2 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Sudah Dikosongkan</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
