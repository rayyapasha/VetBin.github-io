import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ReportIssueType } from '../../types';
import { validateReportSubmission } from '../../utils/reportUtils';
import {
  Inbox,
  Send,
  Search,
  CheckCircle2,
  Route,
  Camera,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';

const PETUGAS_ISSUE_OPTIONS: ReportIssueType[] = [
  'Penuh',
  'Tong rusak',
  'Tutup macet',
  'Bau tidak sedap',
  'Sampah berserakan',
  'Label salah',
  'Lainnya'
];

export const PetugasLaporView: React.FC = () => {
  const {
    bins,
    reports,
    petugasLaporSubTab,
    setPetugasLaporSubTab,
    setPetugasTab,
    setPetugasPetaSubTab,
    setSelectedBinId,
    resolveReport,
    addReport,
    showToast
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'done'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  // Field report form state
  const [selectedFormBinId, setSelectedFormBinId] = useState<string>(bins[0]?.id || 'bin-1');
  const [issueType, setIssueType] = useState<ReportIssueType>('Penuh');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const incomingReports = useMemo(() => {
    return reports.filter(r => {
      if (r.status === 'Ditolak') return false;
      const isForPetugas = Boolean(r.assignedToPetugas) || r.reporter === 'Petugas';
      if (!isForPetugas) return false;

      if (statusFilter === 'active' && r.status === 'Selesai') return false;
      if (statusFilter === 'done' && r.status !== 'Selesai') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          r.binName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.issueType.toLowerCase().includes(q) ||
          (r.notes || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [reports, statusFilter, searchQuery]);

  const activeCount = useMemo(
    () => reports.filter(r => Boolean(r.assignedToPetugas) && r.status !== 'Selesai' && r.status !== 'Ditolak').length,
    [reports]
  );

  const handleAcceptAndRoute = (binId: string, binName: string) => {
    setSelectedBinId(binId);
    setPetugasPetaSubTab('rute');
    setPetugasTab('peta-tong');
    showToast('Laporan Diterima', `Menavigasi ke rute pengosongan untuk ${binName}.`, 'info');
  };

  const handleCreateFieldReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateReportSubmission({
      binId: selectedFormBinId,
      issueType,
      notes
    });
    if (!validation.isValid) {
      setFormError(validation.errorMessage || 'Lengkapi data laporan lapangan.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const created = await addReport({
        binId: selectedFormBinId,
        issueType,
        notes: notes.trim() || `Temuan lapangan petugas: ${issueType}`,
        reporter: 'Petugas'
      });
      if (created) {
        setNotes('');
        setPetugasLaporSubTab('terima');
        setStatusFilter('all');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Sub-Navigation (Lapor -> Terima laporan) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#234629] mb-1">
            Beranda (Petugas) / Lapor
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A231C] tracking-tight">
            Lapor &amp; Terima Laporan
          </h1>
          <p className="text-sm text-slate-600 mt-0.5">
            Terima tugas laporan dari Admin atau laporkan temuan kondisi tong di lapangan.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setPetugasLaporSubTab('terima')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              petugasLaporSubTab === 'terima'
                ? 'bg-white text-[#234629] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>Terima laporan ({activeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setPetugasLaporSubTab('buat')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              petugasLaporSubTab === 'buat'
                ? 'bg-white text-[#234629] shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Laporan</span>
          </button>
        </div>
      </div>

      {petugasLaporSubTab === 'terima' ? (
        <div className="space-y-4">
          {/* Search & Status Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari lokasi gedung, titik tong, atau masalah..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#234629] focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === 'active' ? 'bg-white text-[#234629] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Perlu Ditangani
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('done')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === 'done' ? 'bg-white text-[#234629] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Selesai
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                  statusFilter === 'all' ? 'bg-white text-[#234629] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua
              </button>
            </div>
          </div>

          {/* Incoming Reports List */}
          {incomingReports.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">Tidak ada laporan pada filter ini</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
                Laporan yang diverifikasi dan dikirim Admin ke petugas akan langsung masuk ke daftar Terima laporan.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingReports.map(rep => {
                const isDone = rep.status === 'Selesai';
                return (
                  <div
                    key={rep.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2 text-xs flex-wrap">
                        {rep.assignedToPetugas ? (
                          <span className="inline-flex items-center gap-1 font-bold text-blue-800">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                            Dikirim Admin
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-600">Laporan Lapangan</span>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="inline-flex items-center gap-1 font-bold text-rose-700">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {rep.issueType}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{rep.timeAgoText}</span>
                        <span className="text-slate-300">·</span>
                        <span className={`font-bold ${isDone ? 'text-emerald-700' : 'text-amber-700'}`}>
                          Status: {rep.status}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{rep.binName}</h3>
                      <p className="text-xs text-slate-500">{rep.location} · Pelapor: {rep.reporter}</p>

                      {rep.notes && (
                        <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 mt-1">
                          {rep.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      {rep.photoUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewPhotoUrl(rep.photoUrl || null)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>Foto Bukti</span>
                        </button>
                      )}

                      {!isDone && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAcceptAndRoute(rep.binId, rep.binName)}
                            className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-bold text-slate-800 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <Route className="w-3.5 h-3.5 text-[#234629]" />
                            <span>Terima &amp; Buka Rute</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => resolveReport(rep.id)}
                            className="px-4 py-2 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Tandai Selesai</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Kirim Laporan Lapangan Form */
        <form onSubmit={handleCreateFieldReport} className="bg-white rounded-2xl border border-slate-200 p-6 max-w-2xl space-y-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Buat Laporan Temuan Lapangan</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Laporkan tong yang ditemukan rusak, penuh, atau butuh perbaikan langsung ke sistem Admin.
            </p>
          </div>

          <div>
            <label htmlFor="petugas-bin-select" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Titik Tong
            </label>
            <select
              id="petugas-bin-select"
              value={selectedFormBinId}
              onChange={e => setSelectedFormBinId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#234629]"
            >
              {bins.map(bin => (
                <option key={bin.id} value={bin.id}>
                  {bin.name} — {bin.building} ({bin.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Masalah</label>
            <div className="flex flex-wrap gap-2">
              {PETUGAS_ISSUE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setIssueType(opt)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                    issueType === opt
                      ? 'bg-[#234629] text-white border-[#234629]'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="petugas-notes-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Kondisi Lapangan
            </label>
            <textarea
              id="petugas-notes-input"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Contoh: Tutup tong terlepas / sampah meluap di selasar gedung..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#234629]"
            />
          </div>

          {formError && (
            <p className="text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#234629] hover:bg-[#1b3620] text-white text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <Send className="w-4 h-4 text-emerald-300" />
              <span>{isSubmitting ? 'Mengirim...' : 'Kirim Laporan Lapangan'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPetugasLaporSubTab('terima')}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Photo Preview Modal */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-sm text-slate-800">Foto Bukti Laporan</h4>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                aria-label="Tutup foto bukti"
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 flex items-center justify-center">
              <img src={previewPhotoUrl} alt="Foto bukti laporan" className="max-h-80 w-auto rounded-xl object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
