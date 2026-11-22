
import React, { useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Fingerprint as FingerprintIcon,
} from 'lucide-react';

import { mfs100Service } from '../../services/mfs100.service';
import toast from 'react-hot-toast';

export interface FingerprintData {
  fingerIndex: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  biometricData: string;
  qualityScore: number;
  deviceModel: string;
  scannedAt: string;
  previewImage: string;
}

interface FingerprintScanCardProps {
  label: string;
  fingerIndex: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  value: FingerprintData | null;
  onChange: (data: FingerprintData | null) => void;
  onDeviceError?: () => void;
  isReadOnly?: boolean;
}

export const FingerprintScanCard: React.FC<FingerprintScanCardProps> = ({
  label,
  fingerIndex,
  value,
  onChange,
  onDeviceError,
  isReadOnly = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);

  /**
   * Capture a real fingerprint using Mantra MFS100.
   * No dummy fingerprint or generated preview is used.
   */
  const handleScan = async () => {
    if (isReadOnly || isScanning) return;

    setIsScanning(true);

    // Clear previous data so a failed re-scan cannot retain old data.
    onChange(null);

    toast.loading(
      `Mantra MFS100: Place your finger on the scanner (${label})...`,
      { id: 'scan-toast' }
    );

    try {
      const result = await mfs100Service.capture(60, 10);

      if (!result?.success) {
        throw new Error(
          result?.errorDescription || 'Fingerprint capture failed.'
        );
      }

      // Accept only actual template data returned by the service.
      if (
        typeof result.templateData !== 'string' ||
        result.templateData.trim().length === 0
      ) {
        throw new Error('Scanner did not return a valid fingerprint template.');
      }

      // The service must return the actual captured image as a data URL.
      if (
        typeof result.previewImage !== 'string' ||
        !result.previewImage.startsWith('data:image/')
      ) {
        throw new Error('Scanner did not return a valid fingerprint image.');
      }

      const qualityScore = Number(result.qualityScore);

      if (
        !Number.isFinite(qualityScore) ||
        qualityScore < 0 ||
        qualityScore > 100
      ) {
        throw new Error('Invalid fingerprint quality score received.');
      }

      const fingerprintData: FingerprintData = {
        fingerIndex,
        biometricData: result.templateData,
        qualityScore,
        deviceModel: 'Mantra MFS100',
        scannedAt: new Date().toISOString(),
        previewImage: result.previewImage,
      };

      onChange(fingerprintData);

      toast.success(
        `${label} captured successfully. Quality: ${qualityScore}%`,
        {
          id: 'scan-toast',
          duration: 4000,
        }
      );
    } catch (error: unknown) {
      onChange(null);

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Unable to capture fingerprint.';

      toast.error(errorMessage, {
        id: 'scan-toast',
        duration: 6000,
      });

      onDeviceError?.();
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (isScanning || isReadOnly) return;

    onChange(null);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
        {label}
      </span>

      {/* Successfully captured real fingerprint */}
      {value ? (
        <div className="relative group w-28 h-36 sm:w-32 sm:h-40 rounded-2xl bg-black border-2 border-slate-900 shadow-md flex flex-col items-center justify-between p-2 overflow-hidden">
          <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
            <img
              src={value.previewImage}
              alt={`${label} actual fingerprint capture`}
              className="w-full h-full object-contain"
            />
          </div>

          {/* Actual capture quality */}
          <div className="w-full bg-black/90 py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 border border-slate-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />

            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              {value.qualityScore}%
            </span>
          </div>

          {!isReadOnly && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2.5 z-10">
              <button
                type="button"
                disabled={isScanning}
                onClick={handleScan}
                className="w-full py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Re-Scan
              </button>

              <button
                type="button"
                disabled={isScanning}
                onClick={handleClear}
                className="w-full py-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-950/70 border border-rose-800 rounded-lg hover:bg-rose-900 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Empty card or scanning state */
        <button
          type="button"
          disabled={isReadOnly || isScanning}
          onClick={handleScan}
          className={`w-28 h-36 sm:w-32 sm:h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2.5 transition-all ${
            isScanning
              ? 'border-indigo-500 bg-indigo-50/50 text-indigo-600 animate-pulse'
              : isReadOnly
                ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 text-slate-400 hover:text-indigo-600 cursor-pointer'
          }`}
        >
          {isScanning ? (
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />

              <span className="text-xs font-bold text-indigo-600">
                Scanning...
              </span>

              <span className="text-[10px] text-slate-500 mt-1">
                Place finger on device
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2">
                <FingerprintIcon className="w-7 h-7 text-slate-400" />
              </div>

              <span className="text-xs font-bold text-slate-700">
                {isReadOnly ? 'Not Enrolled' : 'Click to Scan'}
              </span>

              <span className="text-[10px] text-slate-400 mt-0.5">
                Mantra MFS100
              </span>
            </div>
          )}
        </button>
      )}
    </div>
  );
};
