import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportService } from '../../services/export.service';
import { useAuth } from '../../context/AuthContext';

export const DownloadsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = async (type: 'students' | 'batches' | 'users', format: 'xlsx' | 'csv') => {
    const key = `${type}-${format}`;
    setDownloading(key);
    try {
      toast.loading(`Generating ${type} ${format.toUpperCase()} export...`, { id: 'export-toast' });
      if (type === 'students') {
        await exportService.exportStudents(format);
      } else if (type === 'batches') {
        await exportService.exportBatches(format);
      } else if (type === 'users') {
        await exportService.exportUsers(format);
      }
      toast.success(`${type.toUpperCase()} exported successfully!`, { id: 'export-toast' });
    } catch (error: any) {
      toast.error('Failed to download export file.', { id: 'export-toast' });
    } finally {
      setDownloading(null);
    }
  };

  const isSuperAdmin = hasRole('SUPER_ADMIN', 'ADMIN');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Download & Data Export</h1>
        <p className="text-xs text-slate-500 mt-1">
          Export verified student records, academic batches, and administrative user lists in Excel or CSV formats.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Student Export Card */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Student Directory Export</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Export all registered student details including batch assignments, registration timestamps, and biometric enrollment status flags.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => handleExport('students', 'xlsx')}
              disabled={downloading === 'students-xlsx'}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4.5 h-4.5" />
              <span>{downloading === 'students-xlsx' ? 'GENERATING...' : 'EXCEL (.XLSX)'}</span>
            </button>
            <button
              onClick={() => handleExport('students', 'csv')}
              disabled={downloading === 'students-csv'}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <FileText className="w-4.5 h-4.5" />
              <span>{downloading === 'students-csv' ? 'GENERATING...' : 'CSV (.CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Batch Export Card */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 mb-4">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Batch Summary Export</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Export all batch codes, active/inactive student distribution counts, creation audit trails, and batch statuses.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
            <button
              onClick={() => handleExport('batches', 'xlsx')}
              disabled={downloading === 'batches-xlsx'}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Download className="w-4.5 h-4.5" />
              <span>{downloading === 'batches-xlsx' ? 'GENERATING...' : 'EXCEL (.XLSX)'}</span>
            </button>
            <button
              onClick={() => handleExport('batches', 'csv')}
              disabled={downloading === 'batches-csv'}
              className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <FileText className="w-4.5 h-4.5" />
              <span>{downloading === 'batches-csv' ? 'GENERATING...' : 'CSV (.CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Users Export Card (RBAC protected) */}
        <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">System Users Export</h3>
            <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
              Export administrative and staff accounts with assigned RBAC roles and activity statuses. Sensitive hashes are strictly excluded.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-2.5">
            {isSuperAdmin ? (
              <>
                <button
                  onClick={() => handleExport('users', 'xlsx')}
                  disabled={downloading === 'users-xlsx'}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Download className="w-4.5 h-4.5" />
                  <span>{downloading === 'users-xlsx' ? 'GENERATING...' : 'EXCEL (.XLSX)'}</span>
                </button>
                <button
                  onClick={() => handleExport('users', 'csv')}
                  disabled={downloading === 'users-csv'}
                  className="w-full py-3 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <FileText className="w-4.5 h-4.5" />
                  <span>{downloading === 'users-csv' ? 'GENERATING...' : 'CSV (.CSV)'}</span>
                </button>
              </>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 text-slate-500 text-sm text-center border border-slate-100 flex items-center justify-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                <span>Requires Super Admin / Admin role</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Security Policy Note */}
      <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start space-x-3 text-xs text-indigo-900">
        <CheckCircle2 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="font-semibold">Security Compliance:</strong> All generated downloads strictly exclude password hashes, JWT session secrets, and raw biometric templates. All export activities are logged in the SQL Server regulatory audit log.
        </p>
      </div>
    </div>
  );
};
