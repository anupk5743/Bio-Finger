import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle2, ExternalLink, ShieldAlert } from 'lucide-react';
import { SlideOver } from '../common/SlideOver';
import { mfs100Service } from '../../services/mfs100.service';
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
      toast.loading('Checking Mantra Client Service at https://localhost:8003/mfs100...', { id: 'diag-toast' });
      const status = await mfs100Service.checkDevice();
      if (onStatusChange) onStatusChange(status);

      if (status.connected) {
        toast.success(`Mantra MFS100 connected successfully! Scanner light will turn on during capture.`, {
          id: 'diag-toast',
          duration: 4000,
        });
        onClose();
      } else {
        toast.error('Mantra Client Service not responding. Follow steps below to ensure driver & service are running.', {
          id: 'diag-toast',
          duration: 5000,
        });
      }
    } catch (err: any) {
      toast.error('Failed to connect to https://localhost:8003/mfs100', { id: 'diag-toast' });
    } finally {
      setIsReconnecting(false);
    }
  };

  return (
    <SlideOver isOpen={isOpen} title="MFS100 Hardware Configuration" onClose={onClose} width="max-w-xl">
      <div className="flex flex-col items-center text-center pt-2 pb-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-brand-primary mb-3 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-indigo-600" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 tracking-tight">
          Mantra MFS100 Biometric Hardware Setup
        </h3>
        <p className="text-xs font-semibold text-slate-700 mt-1">
          Client Service Endpoint: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono">https://localhost:8003/mfs100</code>
        </p>
      </div>

      <div className="space-y-4 text-left mb-6">
        {/* Step 1: Chrome Certificate Authorization */}
        <div className="border border-amber-200 bg-amber-50/70 rounded-xl p-4 shadow-sm">
          <div className="flex items-start space-x-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                1. Allow HTTPS Certificate in Browser (Crucial):
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                Because Mantra uses a self-signed SSL certificate for <code className="font-mono">https://localhost:8003</code>, Chrome blocks it by default until allowed once.
              </p>
              <div className="mt-2.5">
                <a
                  href="https://localhost:8003/mfs100/info"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-colors"
                >
                  <span>Authorize https://localhost:8003</span>
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </a>
                <p className="text-[11px] text-amber-700 mt-1">
                  Click the button above, and if Chrome shows "Your connection is not private", click <strong>Advanced &rarr; Proceed to localhost (unsafe)</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Driver & Service Setup */}
        <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
          <div>
            <h4 className="text-xs font-bold text-slate-900">
              2. Download & Install MFS100 Drivers:
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              If not already installed, download and install both packages from the official Mantra portal:
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href="https://download.mantratecapp.com/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span>Mantra Download Portal</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
            <ul className="text-[11px] text-slate-500 mt-2 list-disc list-inside space-y-0.5">
              <li><strong>MFS100 Driver:</strong> MFS100Driver_9.2.0.0.exe</li>
              <li><strong>MFS100 Client Service:</strong> MFS100ClientService.exe (Runs at port 8003)</li>
            </ul>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-xs font-bold text-slate-900">
              3. Verify Windows Service is Running:
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">Win + R</kbd>, type <code className="text-indigo-600 font-semibold">services.msc</code>. Check that <strong>MFS100 Client Service</strong> status is <strong>Running</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          CLOSE
        </button>

        <button
          type="button"
          onClick={handleReconnect}
          disabled={isReconnecting}
          className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
        >
          {isReconnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          <span>{isReconnecting ? 'TESTING 8003...' : 'CONNECT & TEST DEVICE'}</span>
        </button>
      </div>
    </SlideOver>
  );
};
