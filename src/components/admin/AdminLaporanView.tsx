import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserReport, ReportIssueType } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import {
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Send,
  ShieldAlert,
  CheckCheck,
  Truck,
  Clock,
  Filter,
  Database
} from 'lucide-react';

interface LaporanProps {
  onOpenReportDetail: (report: UserReport) => void;
}

export const AdminLaporanView: React.FC<LaporanProps> = ({ onOpenReportDetail }) => {
  const {
    reports,
    dispatchReportToPetugas,
    rejectFalseReport,
    bulkDispatchReports,
    resolveReport,
    exportCsv,
    exportSqlDump,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('Semua');
  const [selectedReportIds, setSelectedReportIds] = useState<string[]>([]);

  const filterOptions = [
    'Semua',
    'Perlu Verifikasi (Baru)',
    'Di Petugas (Diproses)',
    'Selesai',
    'Laporan Palsu (Ditolak)',
    'Penuh',
    'Rusak',
    'Bau tidak sedap',
    'Tutup macet',
    'Sampah berserakan'
  ];

  const baruCount = reports.filter(r => r.status === 'Baru').length;
  const diPetugasCount = reports.filter(r => r.status === 'Diproses' || (r.assignedToPetugas && r.status !== 'Selesai' && r.status !== 'Ditolak')).length;
  const selesaiCount = reports.filter(r => r.status === 'Selesai').length;
  const ditolakCount = reports.filter(r => r.status === 'Ditolak').length;

  const getIssueDotColor = (issue: ReportIssueType) => {
    switch (issue) {
      case 'Penuh':
        return 'bg-red-500';
      case 'Rusak':
      case 'Tong rusak':
        return 'bg-orange-500';
      case 'Bau tidak sedap':
        return 'bg-amber-500';
      case 'Tutup macet':
        return 'bg-purple-500';
      case 'Sampah berserakan':
        return 'bg-rose-500';
      case 'Salah pilah':
        return 'bg-indigo-500';
      case 'Label salah':
        return 'bg-blue-500';
      default:
        return 'bg-slate-500';
    }
  };

  const filteredReports = useMemo(() => {
    return reports.filter(rep => {
      let matchFilter = true;
      if (selectedFilter === 'Perlu Verifikasi (Baru)') {
        matchFilter = rep.status === 'Baru';
      } else if (selectedFilter === 'Di Petugas (Diproses)') {
        matchFilter = rep.status === 'Diproses' || Boolean(rep.assignedToPetugas && rep.status !== 'Selesai' && rep.status !== 'Ditolak');
      } else if (selectedFilter === 'Selesai') {
        matchFilter = rep.status === 'Selesai';
      } else if (selectedFilter === 'Laporan Palsu (Ditolak)') {
        matchFilter = rep.status === 'Ditolak';
      } else if (selectedFilter !== 'Semua') {
        matchFilter = rep.issueType.toLowerCase() === selectedFilter.toLowerCase();
      }

      const matchSearch =
        rep.binName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rep.issueType.toLowerCase().includes(searchQuery.toLowerCase());

      return matchFilter && matchSearch;
    });
  }, [reports, selectedFilter, searchQuery]);

  const toggleSelectReport = (id: string) => {
    setSelectedReportIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkDispatch = () => {
    if (selectedReportIds.length === 0) {
      showToast('Pilih Laporan', 'Centang minimal satu laporan untuk dikirimkan ke petugas.', 'info');
      return;
    }
    bulkDispatchReports(selectedReportIds);
    setSelectedReportIds([]);
  };

  const handleBulkReject = () => {
    if (selectedReportIds.length === 0) {
      showToast('Pilih Laporan', 'Centang minimal satu laporan untuk ditolak sebagai palsu.', 'info');
      return;
    }
    selectedReportIds.forEach(id => rejectFalseReport(id, 'Ditolak massal oleh admin'));
    setSelectedReportIds([]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A231C]">Laporan Pengguna &amp; Verifikasi</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Saring laporan warga kampus: teruskan laporan valid ke petugas kebersihan atau tolak laporan palsu
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={exportCsv}
            className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            onClick={() => exportSqlDump()}
            className="py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold text-[#234629] bg-[#E8EFE8] hover:bg-[#dce6dc] border border-[#234629]/20 shadow-2xs transition-all flex items-center gap-2 cursor-pointer"
            title="Unduh file .sql kompatibel untuk diimpor ke phpMyAdmin / MySQL"
          >
            <Database className="w-4 h-4 text-[#234629]" />
            <span>Unduh .SQL (phpMyAdmin)</span>
          </button>

          {selectedReportIds.length > 0 && (
            <>
              <button
                onClick={handleBulkDispatch}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#234629] hover:bg-[#1b3620] shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-300" />
                <span>Kirim ({selectedReportIds.length}) ke Petugas</span>
              </button>
              <button
                onClick={handleBulkReject}
                className="py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Tolak ({selectedReportIds.length}) Palsu</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Total Laporan Masuk</p>
          <div className="text-3xl font-extrabold text-[#1A231C] mt-1">{reports.length}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Terekam di sistem kampus</span>
          </div>
        </div>

        <div className={`p-5 rounded-2xl border shadow-2xs ${
          baruCount > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200/80'
        }`}>
          <p className="text-xs font-semibold text-amber-800">Perlu Verifikasi (Baru)</p>
          <div className="text-3xl font-extrabold text-amber-900 mt-1">{baruCount}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-700 mt-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{baruCount > 0 ? 'Menunggu persetujuan admin' : 'Semua telah diverifikasi'}</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Ditugaskan ke Petugas</p>
          <div className="text-3xl font-extrabold text-blue-700 mt-1">{diPetugasCount}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 mt-2">
            <Truck className="w-3.5 h-3.5" />
            <span>Aktif di rute pembersihan</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <p className="text-xs text-slate-500 font-medium">Terselesaikan</p>
          <div className="text-3xl font-extrabold text-[#166534] mt-1">{selesaiCount}</div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 mt-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{Math.round((selesaiCount / Math.max(1, reports.length)) * 100)}% terselesaikan</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari titik tong, lokasi, pelapor, atau masalah..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#234629] focus:bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Menampilkan <strong>{filteredReports.length}</strong> dari {reports.length} laporan</span>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {filterOptions.map(opt => {
            const isSelected = selectedFilter === opt;
            return (
              <button
                key={opt}
                onClick={() => setSelectedFilter(opt)}
                className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#234629] text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table: Laporan Masuk */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-slate-900">Daftar Verifikasi &amp; Penugasan Laporan</h3>
            <p className="text-xs text-slate-500 mt-0.5">Admin meninjau laporan warga sebelum ditugaskan ke petugas kebersihan lapangan</p>
          </div>
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
            {filteredReports.length} laporan
          </span>
        </div>

        {filteredReports.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">Tidak ada laporan yang sesuai filter</p>
            <p className="text-xs text-slate-400 mt-1">Coba ganti filter status atau ubah kata kunci pencarian.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedFilter('Semua');
              }}
              className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#234629] bg-[#E8EFE8] hover:bg-[#dce6dc] rounded-xl cursor-pointer"
            >
              <span>Reset Filter</span>
            </button>
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards (< md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredReports.map(rep => (
                <div key={rep.id} className="p-4 hover:bg-slate-50/60 transition-colors space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedReportIds.includes(rep.id)}
                        onChange={() => toggleSelectReport(rep.id)}
                        className="rounded text-[#234629] focus:ring-[#234629] mt-0.5"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full ${getIssueDotColor(rep.issueType)}`} />
                          <h4 className="font-bold text-sm text-slate-900 capitalize">{rep.issueType}</h4>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">{rep.binName}</p>
                        <p className="text-[11px] text-slate-400">{rep.location}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={rep.status} size="sm" />
                      {rep.assignedToPetugas && rep.status !== 'Selesai' && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                          Di Petugas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pl-6">
                    <span>Pelapor: <strong className="text-slate-600">{rep.reporter}</strong></span>
                    <span>{rep.timeAgoText}</span>
                  </div>

                  {rep.notes && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100 ml-6">
                      "{rep.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100 pl-6 flex-wrap">
                    <button
                      onClick={() => onOpenReportDetail(rep)}
                      className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                    >
                      Detail
                    </button>

                    {rep.status === 'Baru' && (
                      <>
                        <button
                          onClick={() => dispatchReportToPetugas(rep.id)}
                          className="py-1.5 px-3 rounded-lg text-xs font-bold text-white bg-[#234629] hover:bg-[#1b3620] shadow-2xs flex items-center gap-1 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Kirim ke Petugas</span>
                        </button>
                        <button
                          onClick={() => rejectFalseReport(rep.id)}
                          className="py-1.5 px-2.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>Tolak Palsu</span>
                        </button>
                      </>
                    )}

                    {rep.status === 'Diproses' && (
                      <button
                        onClick={() => resolveReport(rep.id)}
                        className="py-1.5 px-3 rounded-lg text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Selesaikan</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Desktop Table (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#FAFBF9] border-b border-slate-100 text-slate-400 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-8">
                      <input
                        type="checkbox"
                        checked={selectedReportIds.length === filteredReports.length && filteredReports.length > 0}
                        onChange={e => {
                          if (e.target.checked) setSelectedReportIds(filteredReports.map(r => r.id));
                          else setSelectedReportIds([]);
                        }}
                        className="rounded text-[#234629] focus:ring-[#234629]"
                      />
                    </th>
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4">Masalah</th>
                    <th className="py-3.5 px-4">Titik Tong &amp; Lokasi</th>
                    <th className="py-3.5 px-4">Pelapor</th>
                    <th className="py-3.5 px-4">Status &amp; Verifikasi</th>
                    <th className="py-3.5 px-4 text-right">Tindakan Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredReports.map(rep => (
                    <tr key={rep.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={selectedReportIds.includes(rep.id)}
                          onChange={() => toggleSelectReport(rep.id)}
                          className="rounded text-[#234629] focus:ring-[#234629]"
                        />
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{rep.timeAgoText}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${getIssueDotColor(rep.issueType)}`} />
                          <span className="capitalize">{rep.issueType}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{rep.binName}</div>
                        <div className="text-[11px] text-slate-400">{rep.location}</div>
                        {rep.notes && (
                          <div className="text-[11px] text-slate-500 italic line-clamp-1 max-w-xs mt-0.5">
                            &ldquo;{rep.notes}&rdquo;
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{rep.reporter}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <StatusBadge status={rep.status} size="sm" />
                          {rep.assignedToPetugas && rep.status !== 'Selesai' && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              Di Petugas
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-xs">
                          {rep.status === 'Baru' && (
                            <>
                              <button
                                onClick={() => dispatchReportToPetugas(rep.id)}
                                title="Kirimkan laporan ini ke daftar tugas petugas kebersihan"
                                className="text-white bg-[#234629] hover:bg-[#1b3620] font-bold px-2.5 py-1.5 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Send className="w-3.5 h-3.5 text-emerald-300" />
                                <span>Kirim ke Petugas</span>
                              </button>

                              <button
                                onClick={() => rejectFalseReport(rep.id)}
                                title="Tolak laporan sebagai palsu atau spam"
                                className="text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold px-2 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Tolak Palsu</span>
                              </button>
                            </>
                          )}

                          {rep.status === 'Diproses' && (
                            <button
                              onClick={() => resolveReport(rep.id)}
                              className="text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Selesaikan</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenReportDetail(rep)}
                            className="text-slate-600 hover:text-slate-900 font-medium px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                          >
                            Detail
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
