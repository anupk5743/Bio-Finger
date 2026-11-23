import React from 'react';
import { Fingerprint as FingerprintIcon, CheckCircle2 } from 'lucide-react';
import { getDistinctStudentFingerprint } from '../../assets/fingerprints';

export interface FingerprintPatternProps {
  type: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  previewImage?: string | null;
  seed?: string;
  isEnrolled?: boolean;
  qualityScore?: number;
  className?: string;
}

export const FingerprintPattern: React.FC<FingerprintPatternProps> = ({
  type,
  previewImage,
  seed,
  isEnrolled = false,
  qualityScore,
  className = 'w-full h-full',
}) => {
  const imgSrc =
    previewImage && previewImage.startsWith('data:image')
      ? previewImage
      : getDistinctStudentFingerprint(seed || type, type);

  return (
    <div
      className={`${className} flex flex-col items-center justify-center rounded-xl bg-black text-white p-2`}
    >
      <div className="w-full flex-1 flex items-center justify-center p-1 overflow-hidden">
        <img
          src={imgSrc}
          alt={type}
          className="w-full h-full object-contain filter contrast-125 brightness-105"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      <span className="text-xs font-bold mt-2">
        {type.replace('_', ' ')}
      </span>

      {isEnrolled ? (
        <>
          <div className="flex items-center gap-1 mt-1.5 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-xs font-semibold">Enrolled</span>
          </div>

          {typeof qualityScore === 'number' && qualityScore > 0 && (
            <span className="text-xs mt-0.5 text-slate-300 font-mono">
              Quality: {qualityScore}%
            </span>
          )}
        </>
      ) : (
        <span className="text-xs mt-1 text-slate-400">
          Not Enrolled
        </span>
      )}
    </div>
  );
};

export interface BiometricFingerprintViewProps {
  fingerIndex: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  isEnrolled?: boolean;
  qualityScore?: number;
  previewImage?: string | null;
  seed?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showQualityBadge?: boolean;
  className?: string;
}

export const BiometricFingerprintView: React.FC<BiometricFingerprintViewProps> = ({
  fingerIndex,
  isEnrolled = true,
  qualityScore = 88,
  previewImage,
  seed,
  size = 'md',
  onClick,
  showQualityBadge = true,
  className = '',
}) => {
  // Enhanced, larger sizes for clear ridge visibility in the table
  const sizeClasses = {
    sm: 'w-28 h-38',
    md: 'w-32 h-44 sm:w-36 sm:h-48',
    lg: 'w-40 h-54 sm:w-48 sm:h-60',
  };
  const containerDimension = sizeClasses[size] || sizeClasses.md;

  if (!isEnrolled) {
    return (
      <div
        onClick={onClick}
        className={`${containerDimension} rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-2 mx-auto transition-all ${
          onClick ? 'cursor-pointer hover:border-brand-primary hover:text-brand-primary hover:bg-indigo-50/20' : ''
        } ${className}`}
        title={`Click to enroll ${fingerIndex.replace('_', ' ')}`}
      >
        <FingerprintIcon className="w-12 h-12 opacity-35 mb-2" />
        <span className="text-xs font-semibold text-slate-500">Not Enrolled</span>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5">Click to Scan</span>
      </div>
    );
  }

  // Use the actual live scanned image if available; otherwise use deterministic authentic fingerprint for this student
  const imageSource =
    previewImage && previewImage.startsWith('data:image')
      ? previewImage
      : getDistinctStudentFingerprint(seed || fingerIndex, fingerIndex);

  return (
    <div
      onClick={onClick}
      className={`relative group ${containerDimension} rounded-2xl bg-black border-2 border-slate-900 shadow-md flex flex-col items-center justify-between p-2 mx-auto overflow-hidden transition-all hover:scale-[1.02] ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-brand-primary hover:shadow-lg' : ''
      } ${className}`}
      title={`${fingerIndex.replace('_', ' ')} - Enrolled (${qualityScore}% Quality)`}
    >
      <div className="w-full flex-1 flex items-center justify-center p-0.5 overflow-hidden">
        <img
          src={imageSource}
          alt={fingerIndex}
          className="w-full h-full object-contain filter contrast-125 brightness-105"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      {showQualityBadge && (
        <div className="w-full bg-black/90 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 border border-slate-800 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-bold text-emerald-400 font-mono tracking-tight">
            {qualityScore > 0 ? `${qualityScore}%` : 'Enrolled'}
          </span>
        </div>
      )}
    </div>
  );
};
