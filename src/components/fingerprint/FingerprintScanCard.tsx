import React, { useState } from 'react';
import { CheckCircle2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { mfs100Service } from '../../services/mfs100.service';
import toast from 'react-hot-toast';
import { useInvertedFingerprint } from '../biometrics/BiometricFingerprintView';

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

/**
 * Pink-Rose-Orange gradient fingerprint icon matching the reference design.
 */
export const GradientFingerprintIcon: React.FC<{ className?: string }> = ({
  className = 'w-24 h-32',
}) => {
  return (
    <svg
      viewBox="0 0 100 130"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="fpPinkOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f43f5e" />
          <stop offset="45%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>
      {/* Outer arches */}
      <path
        d="M50 14 C28 14 14 30 14 54 C14 80 28 106 50 120"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M50 14 C72 14 86 30 86 54 C86 80 72 106 50 120"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.85"
      />
      {/* Second layer arches */}
      <path
        d="M50 24 C33 24 23 37 23 54 C23 75 33 97 50 110"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M50 24 C67 24 77 37 77 54 C77 75 67 97 50 110"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="2.8"
        strokeLinecap="round"
        opacity="0.9"
      />
      {/* Mid arches */}
      <path
        d="M50 34 C39 34 32 44 32 56 C32 70 39 85 50 97"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="2.9"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M50 34 C61 34 68 44 68 56 C68 70 61 85 50 97"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="2.9"
        strokeLinecap="round"
        opacity="0.95"
      />
      {/* Inner loops */}
      <path
        d="M50 44 C44 44 40 50 40 59 C40 68 44 76 50 84"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="3.0"
        strokeLinecap="round"
      />
      <path
        d="M50 44 C56 44 60 50 60 59 C60 68 56 76 50 84"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="3.0"
        strokeLinecap="round"
      />
      {/* Core ridge */}
      <path
        d="M50 54 C48.5 54 47.5 57 47.5 62 C47.5 67 49 71 50 73"
        stroke="url(#fpPinkOrangeGrad)"
        strokeWidth="3.0"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const FingerprintScanCard: React.FC<FingerprintScanCardProps> = ({
  label,
  fingerIndex,
  value,
  onChange,
  onDeviceError,
  isReadOnly = false,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const displayPreview = useInvertedFingerprint(value?.previewImage);

  /**
   * Capture real fingerprint from Mantra MFS100 hardware.
   * Turns on red scanner light physically.
   */
  const handleScan = async () => {
    if (isReadOnly || isScanning) return;

    setIsScanning(true);
    onChange(null);

    toast.loading(`Mantra MFS100: Scanner light ON. Place finger on device...`, {
      id: 'scan-toast',
      duration: 10000,
    });

    try {
      const result = await mfs100Service.capture(55, 10);

      if (!result?.success) {
        throw new Error(result?.errorDescription || 'Fingerprint capture failed.');
      }

      if (
        typeof result.templateData !== 'string' ||
        result.templateData.trim().length === 0
      ) {
        throw new Error('Scanner did not return a valid fingerprint template.');
      }

      if (
        typeof result.previewImage !== 'string' ||
        !result.previewImage.startsWith('data:image/')
      ) {
        throw new Error('Scanner did not return a valid fingerprint image.');
      }

      const qualityScore = Number(result.qualityScore);
      if (!Number.isFinite(qualityScore) || qualityScore < 0 || qualityScore > 100) {
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

      toast.success(`${label} captured & AI HD enhanced! Quality: ${qualityScore}%`, {
        id: 'scan-toast',
        duration: 4000,
      });
    } catch (error: unknown) {
      onChange(null);
      const errorMessage =
        error instanceof Error ? error.message : 'Unable to capture fingerprint.';

      toast.error(errorMessage, {
        id: 'scan-toast',
        duration: 6000,
      });

      onDeviceError?.();
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isScanning || isReadOnly) return;
    onChange(null);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm flex flex-col items-center text-center justify-between transition-all hover:shadow-md w-full">
      {/* Top illustration: Gradient fingerprint or real captured preview */}
      <div className="w-full flex justify-center items-center py-2 min-h-[160px]">
        {isScanning ? (
          <div className="w-[104px] h-[126px] rounded-xl bg-black border border-emerald-500/70 shadow-lg flex flex-col items-center justify-center p-3 animate-pulse">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-2" />
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">Scanning</span>
            <span className="text-[9px] text-slate-400 mt-0.5 font-mono">Place Finger</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center">
            {/* Same box size as table: w-[104px] h-[126px] rounded-xl bg-black */}
            <div className="relative group w-[104px] h-[126px] rounded-xl bg-black border border-black shadow-md flex items-center justify-center p-1 overflow-hidden transition-all hover:scale-[1.02]">
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  src={displayPreview || value.previewImage}
                  alt={`${label} capture`}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Scan ke baad: Percentage aur AI HD show ho */}
            <div className="w-[104px] bg-black/95 py-1 px-1.5 rounded-lg flex items-center justify-between border border-slate-800 mt-2 shadow-sm">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-tight">
                  {value.qualityScore}%
                </span>
              </div>
              <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 font-mono tracking-tight">
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                AI HD
              </span>
            </div>
          </div>
        ) : (
          <GradientFingerprintIcon className="w-24 h-32 drop-shadow-sm" />
        )}
      </div>

      {/* Title matching exact screenshot: e.g. "1. Fingerprint Capture" */}
      <h3 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight mt-2">
        {label}
      </h3>

      {/* Subtitle matching exact screenshot */}
      <p className="text-xs text-slate-500 mt-1 mb-4 leading-relaxed max-w-[200px]">
        {value
          ? `Fingerprint captured (Quality: ${value.qualityScore}%)`
          : 'Capture the fingerprint by clicking the button below.'}
      </p>

      {/* Button: Solid Green CAPTURE button matching exact screenshot */}
      <div className="w-full flex items-center justify-center gap-2">
        <button
          type="button"
          disabled={isReadOnly || isScanning}
          onClick={handleScan}
          className={`w-full py-2.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs sm:text-sm text-white shadow-sm transition-all flex items-center justify-center space-x-2 ${
            isScanning
              ? 'bg-emerald-700 opacity-90 cursor-wait'
              : value
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-[#00a86b] hover:bg-[#008f5b] active:scale-[0.98]'
          } disabled:opacity-50`}
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              <span>SCANNING...</span>
            </>
          ) : value ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              <span>RE-CAPTURE</span>
            </>
          ) : (
            <span>CAPTURE</span>
          )}
        </button>

        {value && !isReadOnly && (
          <button
            type="button"
            onClick={handleClear}
            title="Remove this fingerprint"
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-slate-200 transition-colors"
          >
            <span className="text-xs font-bold px-1">&times;</span>
          </button>
        )}
      </div>
    </div>
  );
};
