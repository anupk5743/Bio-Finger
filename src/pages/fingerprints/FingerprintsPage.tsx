
import React, { useCallback, useEffect, useState } from 'react';

import {
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  HelpCircle,
  Cpu,
  Layers,
  ShieldCheck,
} from 'lucide-react';

import { mfs100Service } from '../../services/mfs100.service';
import { DeviceStatus } from '../../types';
import { FingerprintDiagnosticDrawer } from '../../components/fingerprint/FingerprintDiagnosticDrawer';
import toast from 'react-hot-toast';

export const FingerprintsPage: React.FC = () => {
  const [deviceStatus, setDeviceStatus] =
    useState<DeviceStatus | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);

  const checkDevice = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await mfs100Service.checkDevice();

      // Service response alone is not sufficient.
      // Device information must also be returned successfully.
      const connected =
        result.connected === true &&
        result.status === 'READY';

      const status: DeviceStatus = {
        connected,

        status: connected
          ? 'CONNECTED'
          : result.status === 'NOT_RUNNING'
            ? 'SERVICE_NOT_RUNNING'
            : result.status === 'CERT_ERROR'
              ? 'DISCONNECTED'
              : 'DEVICE_NOT_DETECTED',

        deviceName: result.deviceModel || 'Mantra MFS100',

        // Driver installation is not independently verified by /info.
        driverInstalled: false,

        // This indicates whether the local service responded.
        serviceRunning: result.connected === true,

        message: result.message,
        port: result.port || 8003,
        url: result.url || 'https://localhost:8003/mfs100',
      };

      setDeviceStatus(status);

      if (connected) {
        toast.success(
          'MFS100 service responded and device information was received.'
        );
      } else {
        toast.error(result.message || 'MFS100 device is not ready.');
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown device connection error.';

      setDeviceStatus({
        connected: false,
        status: 'SERVICE_NOT_RUNNING',
        deviceName: 'Mantra MFS100',
        driverInstalled: false,
        serviceRunning: false,
        message,
        port: 8003,
        url: 'https://localhost:8003/mfs100',
      });

      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkDevice();
  }, [checkDevice]);

  const isConnected = deviceStatus?.connected === true;

  const handleDiagnosticStatusChange = useCallback(
    (status: DeviceStatus) => {
      // Drawer status is accepted as diagnostic information.
      // Refresh local service status to confirm current readiness.
      setDeviceStatus(status);
      void checkDevice();
    },
    [checkDevice]
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Fingerprint Device Management
          </h1>

          <p className="text-xs text-slate-500 mt-1">
            Windows USB biometric scanner integration,
            Mantra MFS100 service status and diagnostics.
          </p>
        </div>

        <div className="flex items-center space-x-3">

          <button
            type="button"
            onClick={() => setDiagnosticOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm flex items-center space-x-2"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>TROUBLESHOOTING GUIDE</span>
          </button>

          <button
            type="button"
            onClick={() => void checkDevice()}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isLoading ? 'animate-spin' : ''
              }`}
            />

            <span>
              {isLoading ? 'CHECKING...' : 'CHECK STATUS'}
            </span>
          </button>

        </div>
      </div>

      {/* Device Status */}
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-card">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-100">

          <div className="flex items-center space-x-5">

            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                  : 'bg-rose-50 text-rose-500 border border-rose-100'
              }`}
            >
              <Fingerprint className="w-10 h-10" />
            </div>

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h2 className="text-xl font-bold text-slate-900">
                  {deviceStatus?.deviceName ||
                    'Mantra MFS100 Optical Fingerprint Scanner'}
                </h2>

                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {isLoading
                    ? 'CHECKING'
                    : isConnected
                      ? 'DEVICE INFORMATION VERIFIED'
                      : 'NOT READY'}
                </span>

              </div>

              <p className="text-xs text-slate-500 mt-1">
                {deviceStatus?.message ||
                  'Checking local Mantra Client Service...'}
              </p>

            </div>
          </div>

          {!isConnected && !isLoading && (
            <button
              type="button"
              onClick={() => setDiagnosticOpen(true)}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-rose-600 hover:bg-rose-700"
            >
              RESOLVE ISSUE
            </button>
          )}

        </div>

        {/* Device Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-8">

          {/* Model */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <Cpu className="w-4 h-4 text-indigo-500" />
              <span>Target Model</span>
            </div>

            <p className="text-sm font-bold text-slate-900">
              {deviceStatus?.deviceName || 'Mantra MFS100'}
            </p>

            <p className="text-[10px] text-slate-400 mt-0.5">
              Fingerprint Scanner
            </p>

          </div>

          {/* Driver */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Driver State</span>
            </div>

            <p className="text-sm font-bold text-slate-900">
              Not independently verified
            </p>

            <p className="text-[10px] text-slate-400 mt-0.5">
              Verify through Windows Device Manager
            </p>

          </div>

          {/* Service */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              <span>Local Service Bridge</span>
            </div>

            <p className="text-sm font-bold text-slate-900">
              {isLoading
                ? 'Checking...'
                : deviceStatus?.serviceRunning
                  ? 'Responding (Port 8003)'
                  : 'Not reachable'}
            </p>

            <p className="text-[10px] text-slate-400 mt-0.5">
              HTTPS localhost:8003
            </p>

          </div>

          {/* Security */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">

            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 mb-1">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Storage Security</span>
            </div>

            <p className="text-sm font-bold text-slate-900">
              Backend verification required
            </p>

            <p className="text-[10px] text-slate-400 mt-0.5">
              Verify encryption implementation
            </p>

          </div>

        </div>

      </div>

      {/* Security Notice */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-md border border-slate-800 flex items-start space-x-4">

        <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0 mt-0.5" />

        <div>

          <h3 className="text-sm font-bold text-white">
            Biometric Data Privacy
          </h3>

          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Fingerprint templates must be processed and stored
            securely by the backend. Avoid exposing raw biometric
            images or templates through public APIs, browser logs
            or unprotected database access. Encryption must be
            verified in the backend implementation.
          </p>

        </div>

      </div>

      {/* Diagnostic Drawer */}
      <FingerprintDiagnosticDrawer
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onStatusChange={handleDiagnosticStatusChange}
      />

    </div>
  );
};
