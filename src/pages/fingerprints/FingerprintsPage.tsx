import React, { useEffect, useState } from 'react';
import {
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { fingerprintService } from '../../services/fingerprint.service';
import { mfs100Service } from '../../services/mfs100.service';
import { DeviceStatus } from '../../types';
import { FingerprintDiagnosticDrawer } from '../../components/fingerprint/FingerprintDiagnosticDrawer';
import toast from 'react-hot-toast';

export const FingerprintsPage: React.FC = () => {
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [diagnosticOpen, setDiagnosticOpen] = useState<boolean>(false);

  const checkDevice = async () => {
    setIsLoading(true);
    try {
      const clientStatus = await mfs100Service.checkDevice();
      if (clientStatus.connected) {
        setDeviceStatus({
          connected: true,
          status: 'CONNECTED',
          deviceName: 'Mantra MFS100',
          driverInstalled: true,
          serviceRunning: true,
          message: clientStatus.message,
        });
        toast.success(`Mantra MFS100 Scanner connected on port ${clientStatus.port}!`);
      } else {
        try {
          const backendStatus = await fingerprintService.getDeviceStatus();
          setDeviceStatus(backendStatus);
        } catch {
          setDeviceStatus({
            connected: false,
            status: 'SERVICE_NOT_RUNNING',
            deviceName: 'Mantra MFS100',
            driverInstalled: false,
            serviceRunning: false,
            message: 'Mantra MFS100 Service not detected. Virtual Biometric Mode active.',
          });
        }
      }
    } catch (error) {
      setDeviceStatus({
        connected: false,
        status: 'SERVICE_NOT_RUNNING',
        deviceName: 'Mantra MFS100',
        driverInstalled: false,
        serviceRunning: false,
        message: 'Mantra MFS100 Service not detected. Virtual Biometric Mode active.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkDevice();
  }, []);

  const isConnected = deviceStatus?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Fingerprint Device Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Windows USB Biometric Scanner integration, Mantra MFS100 bridge status, and diagnostics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setDiagnosticOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center space-x-2 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Troubleshooting Guide</span>
          </button>

          <button
            onClick={checkDevice}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm flex items-center space-x-2 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'SCANNING...' : 'CHECK STATUS'}</span>
          </button>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">
          <div className="flex items-center space-x-5">
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-rose-50 text-rose-500 border border-rose-100'
              }`}
            >
              <Fingerprint className="w-10 h-10" />
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <h2 className="text-xl font-bold text-slate-900">
                  {deviceStatus?.deviceName || 'Mantra MFS100 Optical Fingerprint Scanner'}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isConnected ? 'ONLINE & READY' : 'OFFLINE / DISCONNECTED'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {deviceStatus?.message || 'Probing local Windows device client service...'}
              </p>
            </div>
          </div>

          {!isConnected && (
            <button
              onClick={() => setDiagnosticOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-colors flex-shrink-0"
            >
              RESOLVE ISSUE
            </button>
          )}
        </div>

        {/* Diagnostic Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-8">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>Target Model</span>
            </div>
            <p className="text-sm font-bold text-slate-900">Mantra MFS100</p>
            <p className="text-[10px] text-slate-400 mt-0.5">500 DPI Optical Sensor</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Driver State</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {deviceStatus?.driverInstalled ? 'Installed' : 'Verification Needed'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">MFS100 Driver v9.2+</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Local Service Bridge</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {deviceStatus?.serviceRunning ? 'Active (Port 8004)' : 'Stopped / Not Reachable'}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">127.0.0.1:8004 (HTTPS/HTTP)</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Encryption Algorithm</span>
            </div>
            <p className="text-sm font-bold text-slate-900">AES-256-GCM</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Rest-at-rest encrypted storage</p>
          </div>
        </div>
      </div>

      {/* Biometric Security Standards Notice */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-md border border-slate-800 flex items-start space-x-4">
        <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">
            Biometric Data Privacy & Architectural Isolation
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            In compliance with strict biometric information privacy guidelines, web browsers cannot directly claim low-level USB peripheral access without a local Windows client bridge. All captured fingerprint templates are encrypted using <strong>AES-256-GCM</strong> prior to SQL Server persistence. Raw fingerprint images are never exposed over public or unprotected student APIs.
          </p>
        </div>
      </div>

      {/* Troubleshooting Drawer */}
      <FingerprintDiagnosticDrawer
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onStatusChange={(status) => setDeviceStatus(status)}
      />
    </div>
  );
};
