import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CampusMapCanvas } from '../common/CampusMapCanvas';
import { CampusBin } from '../../types';
import {
  Map as MapIcon,
  Route,
  CheckCircle2,
  Search,
  AlertTriangle,
  Truck
} from 'lucide-react';

export const PetugasPetaRuteView: React.FC = () => {
  const {
    bins,
    reports,
    selectedBinId,
    setSelectedBinId,
    petugasPetaSubTab,
    setPetugasPetaSubTab,
    emptyBin
  } = useApp();

  const [mapStatusFilter, setMapStatusFilter] = useState<'all' | 'urgent' | 'normal'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const assignedBinIds = useMemo(() => {
    const set = new Set<string>();
    reports.forEach(r => {
      if (r.assignedToPetugas && r.status !== 'Selesai' && r.status !== 'Ditolak') {
        set.add(r.binId);
      }
    });
    return set;
  }, [reports]);

  // Combined ordered route queue (urgent bins + assigned report bins)
  const routeBins = useMemo(() => {
    const map = new Map<string, CampusBin>();
    bins.forEach(b => {
      if (b.status === 'Penuh' || b.status === 'Rusak' || assignedBinIds.has(b.id)) {
        map.set(b.id, b);
      }
    });
    return Array.from(map.values()).sort((a, b) => a.distanceM - b.distanceM);
  }, [bins, assignedBinIds]);

  const filteredMapBins = useMemo(() => {
    return bins.filter(b => {
      if (mapStatusFilter === 'urgent' && b.status === 'Kosong') return false;
      if (mapStatusFilter === 'normal' && b.status !== 'Kosong') return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          b.name.toLowerCase().includes(q) ||
          b.building.toLowerCase().includes(q) ||
          b.locationDetail.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [bins, mapStatusFilter, searchQuery]);

  const activeBin = useMemo(() => {
    const pool = petugasPetaSubTab === 'rute' ? routeBins : filteredMapBins;
    return bins.find(b => b.id === selectedBinId) || pool[0] || bins[0] || null;
  }, [bins, routeBins, filteredMapBins, selectedBinId, petugasPetaSubTab]);

  return (
    <div className="space-y-6">
      {/* Header + Switcher (Peta tong -> Rute pengosongan) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#234629] mb-1">
            Beranda (Petugas) / Peta tong
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A231C] tracking-tight">
            {petugasPetaSubTab === 'rute' ? 'Rute Pengosongan Tong' : 'Peta Tong Kampus'}
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            {petugasPetaSubTab === 'rute'
              ? 'Urutan rute pengosongan prioritas berdasarkan status penuh, laporan admin, dan jarak terdekat.'
              : 'Pantau seluruh titik tong di peta kampus dan periksa status masing-masing lokasi.'}
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPetugasPetaSubTab('peta')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              petugasPetaSubTab === 'peta'
                ? 'bg-white text-[#234629] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Peta tong ({bins.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setPetugasPetaSubTab('rute')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              petugasPetaSubTab === 'rute'
                ? 'bg-white text-[#234629] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Route className="w-3.5 h-3.5" />
            <span>Rute pengosongan ({routeBins.length})</span>
          </button>
        </div>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Queue / Bin List */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 flex flex-col h-[640px]">
          {petugasPetaSubTab === 'peta' ? (
            <>
              <div className="space-y-3 pb-3.5 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari nama tong atau gedung..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#234629]"
                  />
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setMapStatusFilter('all')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      mapStatusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Semua ({bins.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapStatusFilter('urgent')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      mapStatusFilter === 'urgent' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Penuh / Rusak
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapStatusFilter('normal')}
                    className={`flex-1 py-1.5 rounded-lg font-semibold cursor-pointer ${
                      mapStatusFilter === 'normal' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-600'
                    }`}
                  >
                    Kosong
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 mt-1">
                {filteredMapBins.map(bin => {
                  const isSelected = activeBin?.id === bin.id;
                  const isUrgent = bin.status !== 'Kosong';
                  return (
                    <button
                      key={bin.id}
                      type="button"
                      onClick={() => setSelectedBinId(bin.id)}
                      className={`w-full text-left py-3 px-3 rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected ? 'bg-[#EAEFEA]' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className={`font-bold ${isUrgent ? 'text-rose-700' : 'text-emerald-700'}`}>
                            {bin.status}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500">{bin.category}</span>
                          <span className="text-slate-300">·</span>
                          <span className="text-slate-500 tabular-nums">{bin.distanceM} m</span>
                        </div>
                        <p className="font-bold text-sm text-slate-900 truncate mt-0.5">{bin.name}</p>
                        <p className="text-xs text-slate-500 truncate">{bin.building}</p>
                      </div>

                      {isUrgent && (
                        <span className="text-xs font-bold text-[#234629] shrink-0">Pilih</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setPetugasPetaSubTab('rute')}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Route className="w-4 h-4 text-amber-300" />
                  <span>Masuk ke Rute Pengosongan ({routeBins.length})</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="pb-3.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Antrean Rute Pengosongan</h2>
                  <p className="text-xs text-slate-500">Urut prioritas jarak terdekat dari pos</p>
                </div>
                <span className="text-xs font-bold text-[#234629] tabular-nums">
                  {routeBins.length} titik
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mt-3">
                {routeBins.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mb-2" />
                    <h3 className="text-sm font-bold text-slate-900">Rute Pengosongan Selesai</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Tidak ada tong penuh atau tugas laporan yang membutuhkan pengosongan saat ini.
                    </p>
                  </div>
                ) : (
                  routeBins.map((bin, idx) => {
                    const isSelected = activeBin?.id === bin.id;
                    return (
                      <div
                        key={bin.id}
                        onClick={() => setSelectedBinId(bin.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-[#234629] bg-[#F4F7F3]'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-7 h-7 rounded-full bg-[#1A231C] text-white text-xs font-extrabold flex items-center justify-center tabular-nums shrink-0">
                            {idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs">
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span className="font-bold text-rose-700">{bin.status}</span>
                              <span className="text-slate-300">·</span>
                              <span className="text-slate-500 tabular-nums">{bin.distanceM} m</span>
                            </div>
                            <p className="font-bold text-sm text-slate-900 truncate">{bin.name}</p>
                            <p className="text-xs text-slate-500 truncate">{bin.building}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            emptyBin(bin.id);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#234629] hover:bg-[#1b3620] text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Sudah Dikosongkan
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 mt-2 flex items-center gap-2 text-xs text-slate-600">
                <Truck className="w-4 h-4 text-[#234629] shrink-0" />
                <span>Garis rute pada peta menghubungkan seluruh titik yang harus dikosongkan.</span>
              </div>
            </>
          )}
        </div>

        {/* Right Interactive Map */}
        <div className="lg:col-span-7">
          <CampusMapCanvas
            bins={petugasPetaSubTab === 'rute' ? bins : filteredMapBins}
            showRouteLine={petugasPetaSubTab === 'rute' && routeBins.length > 0}
            routeBins={routeBins}
            isCompact={false}
            selectedBinId={activeBin?.id}
            onSelectBin={bin => setSelectedBinId(bin.id)}
          />
        </div>
      </div>
    </div>
  );
};
