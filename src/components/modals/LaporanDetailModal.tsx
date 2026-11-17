import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserReport } from '../../types';
import { StatusBadge, CategoryPill } from '../common/StatusBadge';
import { X, CheckCircle2, Clock, MapPin, User, FileText, AlertCircle, Send, Truck, ShieldAlert, ShieldCheck, CheckCheck } from 'lucide-react';

interface LaporanDetailModalProps {
  report: UserReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const LaporanDetailModal: React.FC<LaporanDetailModalProps> = ({ report, isOpen, onClose }) => {
  const { dispatchReportToPetugas, rejectFalseReport, resolveReport } = useApp();

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-3">
          <StatusBadge status={report.status} />
          <span className="text-xs text-slate-500 font-mono font-medium">ID: {report.id}</span>
          {report.assignedToPetugas && (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-600" />
              <span>Di Halaman Petugas</span>
            </span>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 leading-snug">
          Laporan: Tong {report.issueType}
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">Dilaporkan {report.timeAgoText}</p>

        <div className="mt-5 space-y-3.5 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Titik Tong:</span>
              <span className="font-bold text-slate-900">{report.binName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Kategori:</span>
              <CategoryPill category={report.category} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Lokasi:</span>
              <span className="font-medium text-slate-800">{report.location}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
              <span className="text-slate-500">Pelapor:</span>
              <span className="font-semibold text-slate-800">{report.reporter}</span>
            </div>
          </div>

          <div>
            <h5 className="font-semibold text-slate-700 mb-1">Catatan Pelapor:</h5>
            <p className="p-3 bg-white border border-slate-200 rounded-xl text-slate-600 italic">
              "{report.notes || 'Tidak ada catatan tambahan.'}"
            </p>
          </div>

          {report.photoUrl && (
            <div>
              <h5 className="font-semibold text-slate-700 mb-1">Foto Bukti Terlampir:</h5>
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-48">
                <img src={report.photoUrl} alt="Foto bukti" className="w-full h-full object-cover max-h-48" />
              </div>
            </div>
          )}

          {report.adminVerificationNote && (
            <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-0.5">Status Verifikasi Admin:</span>
              <span>{report.adminVerificationNote}</span>
            </div>
          )}
        </div>

        {/* Admin Verification & Dispatch Actions */}
        <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">Tindakan Admin Kampus:</span>
            <span className="text-[11px] text-slate-400">Filter asli atau tolak spam</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {report.status !== 'Diproses' && report.status !== 'Selesai' && (
              <button
                type="button"
                onClick={() => {
                  dispatchReportToPetugas(report.id);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#234629] hover:bg-[#1b3620] shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-emerald-300" />
                <span>Kirim ke Petugas</span>
              </button>
            )}

            {report.status !== 'Ditolak' && report.status !== 'Selesai' && (
              <button
                type="button"
                onClick={() => {
                  rejectFalseReport(report.id);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Tolak Laporan Palsu</span>
              </button>
            )}

            {report.status !== 'Selesai' && (
              <button
                type="button"
                onClick={() => {
                  resolveReport(report.id);
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4 text-emerald-600" />
                <span>Tandai Selesai</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
