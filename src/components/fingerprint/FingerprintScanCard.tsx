import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Loader2, Fingerprint as FingerprintIcon } from 'lucide-react';
import { mfs100Service } from '../../services/mfs100.service';
import toast from 'react-hot-toast';
import { FingerprintPattern } from '../biometrics/BiometricFingerprintView';
import { DEFAULT_FINGERPRINTS, PHYSICAL_FINGERPRINT_1 } from '../../assets/fingerprints';

export interface FingerprintData {
  fingerIndex: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  biometricData: string;
  qualityScore: number;
  deviceModel: string;
  scannedAt: string;
  previewImage?: string;
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
  const [isScanning, setIsScanning] = useState<boolean>(false);

  const handleScan = async () => {
    if (isReadOnly) return;
    setIsScanning(true);

    try {
      toast.loading(`Mantra MFS100: Scanner light ON. Place finger on scanner for ${label}...`, { id: 'scan-toast' });
      const result = await mfs100Service.capture(60, 10);

      if (result.success) {
        toast.success(`${label} captured successfully from Mantra MFS100! Quality: ${result.qualityScore}%`, {
          id: 'scan-toast',
          duration: 4000,
        });
        onChange({
          fingerIndex,
          biometricData: result.templateData,
          qualityScore: result.qualityScore,
          deviceModel: 'Mantra MFS100',
          scannedAt: new Date().toISOString(),
          previewImage: result.previewImage,
        });
      } else {
        toast.error(`Scan Failed: ${result.errorDescription}`, {
          id: 'scan-toast',
          duration: 6000,
        });
        if (onDeviceError) onDeviceError();
      }
    } catch (e: any) {
      toast.error('Mantra MFS100 Scanner not responding on https://localhost:8003/mfs100', {
        id: 'scan-toast',
        duration: 6000,
      });
      if (onDeviceError) onDeviceError();
    } finally {
      setIsScanning(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">{label}</span>

      {/* Uniform Biometric Card: same exact w-28 h-36 dimensions for all 3 fingers */}
      {value ? (
        <div className="relative group w-28 h-36 sm:w-32 sm:h-40 rounded-2xl bg-black border-2 border-slate-900 shadow-md flex flex-col items-center justify-between p-2 overflow-hidden transition-all">
          {/* Full Biometric Graphic covering container completely */}
          <div className="w-full flex-1 flex items-center justify-center p-0.5 overflow-hidden">
            {value.previewImage && value.previewImage.startsWith('data:image') ? (
              <img
                src={value.previewImage}
                alt={label}
                className="w-full h-full object-contain filter contrast-125"
              />
            ) : (
              <FingerprintPattern type={fingerIndex} className="w-full h-full object-contain" />
            )}
          </div>

          {/* Quality Score Bar */}
          <div className="w-full bg-black/90 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 border border-slate-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[11px] font-bold text-emerald-400 font-mono">
              {value.qualityScore}%
            </span>
          </div>

          {!isReadOnly && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity p-2.5 z-10">
              <button
                type="button"
                onClick={handleScan}
                className="w-full py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Re-Scan
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-1.5 text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-950/70 border border-rose-800 rounded-lg hover:bg-rose-900 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={!isReadOnly && !isScanning ? handleScan : undefined}
          className={`w-28 h-36 sm:w-32 sm:h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-2.5 transition-all ${isScanning
            ? 'border-brand-primary bg-indigo-50/50 text-brand-primary animate-pulse'
            : isReadOnly
              ? 'border-slate-200 bg-slate-50 text-slate-300 cursor-not-allowed'
              : 'border-slate-300 hover:border-brand-primary bg-white hover:bg-indigo-50/20 text-slate-400 hover:text-brand-primary cursor-pointer'
            }`}
        >
          {isScanning ? (
            <div className="flex flex-col items-center text-center">
              <Loader2 className="w-8 h-8 animate-spin text-brand-primary mb-2" />
              <span className="text-xs font-bold text-brand-primary">Scanning...</span>
              <span className="text-[10px] text-slate-500 mt-1">Place finger on device</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-indigo-100 transition-colors">
                <FingerprintIcon className="w-7 h-7 text-slate-400 group-hover:text-brand-primary transition-colors" />
              </div>
              <span className="text-xs font-bold text-slate-700">Click to Scan</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Mantra MFS100</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
