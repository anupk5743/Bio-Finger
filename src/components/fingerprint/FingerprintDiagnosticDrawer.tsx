import React, { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { SlideOver } from '../common/SlideOver';
import { fingerprintService } from '../../services/fingerprint.service';
import toast from 'react-hot-toast';

interface FingerprintDiagnosticDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (status: any) => void;
}

export const FingerprintDiagnosticDrawer: React.FC<FingerprintDiagnosticDrawerProps> = ({
  isOpen,
  onClose,
  onStatusChange,
}) => {
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const status = await fingerprintService.getDeviceStatus();
      if (onStatusChange) onStatusChange(status);

      if (status.connected) {
        toast.success('MFS100 Scanner connected successfully!');
        onClose();
      } else {
        toast.error(status.message || 'MFS100 Scanner still not responding.');
      }
    } catch (err: any) {
      toast.error('Failed to probe device service on 127.0.0.1:8004');
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <SlideOver isOpen={isOpen} title="Student Registration Form" onClose={onClose} width="max-w-lg">
      <div className="flex flex-col items-center text-center pt-4 pb-6">
        {/* Warning Icon Box matching Screenshot 4 */}
        <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mb-5 shadow-sm">
          <AlertTriangle className="w-10 h-10" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Fingerprint Scanner Facing Issue
        </h3>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          Myntra MFS100 Driver installed but Not Working
        </p>
        <p className="text-xs text-slate-400 mt-0.5">Follow these instructions</p>
      </div>

      {/* Instruction Steps matching Screenshot 4 */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm space-y-5 text-left mb-6">
        <div>
          <h4 className="text-xs font-bold text-slate-900">
            1. Open the Services Management Console:
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono">Windows + R</kbd> to open the Run dialog box.
            <br />
            Type <code className="text-indigo-600 font-semibold">services.msc</code> and press Enter.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-900">
            2. Locate the MFS100 Client Service:
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            In the Services window, scroll down to find <span className="font-semibold text-slate-700">MFS100 Client Service</span> (or TermService in older versions of Windows).
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-900">
            3. Restart the Service:
          </h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Right click on <span className="font-semibold text-slate-700">MFS100 Client Service</span> and select <span className="font-semibold text-slate-700">Start / Restart</span>.
          </p>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-900">Video Tutorial</h4>
          <p className="text-xs text-slate-500 mt-1">
            For a detailed video guide, check the service driver documentation.
          </p>
        </div>
      </div>

      {/* Driver Installation Guide */}
      <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm text-left mb-8">
        <h4 className="text-xs font-bold text-slate-900 mb-1">
          Installation Guide for MFS100 Fingerprint Driver
        </h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          Ensure official Mantra MFS100 Driver & RD Service are installed on Windows, running locally on port 8004.
        </p>
      </div>

      {/* Bottom Reconnect Button matching Screenshot 4 */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isReconnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          <span>{isReconnecting ? 'RECONNECTING...' : 'RECONNECT'}</span>
        </button>
      </div>
    </SlideOver>
  );
};
