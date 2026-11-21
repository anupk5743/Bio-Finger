import React from 'react';
import { Fingerprint as FingerprintIcon, CheckCircle2 } from 'lucide-react';
import { DEFAULT_FINGERPRINTS, PHYSICAL_FINGERPRINT_1 } from '../../assets/fingerprints';

interface BiometricFingerprintViewProps {
  fingerIndex: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  isEnrolled?: boolean;
  qualityScore?: number;
  previewImage?: string | null;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  showQualityBadge?: boolean;
  className?: string;
}

/**
 * Authentic High-Resolution Physical Biometric Fingerprint Patterns
 * Genuine 500 DPI optical sensor friction ridge captures from Mantra MFS100
 */
export const FingerprintPattern: React.FC<{
  type: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  className?: string;
}> = ({ type, className = 'w-full h-full' }) => {
  const imgSrc = DEFAULT_FINGERPRINTS[type] || PHYSICAL_FINGERPRINT_1;

  return (
    <img
      src={imgSrc}
      alt={type}
      className={`${className} object-contain`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};

export const BiometricFingerprintView: React.FC<BiometricFingerprintViewProps> = ({
  fingerIndex,
  isEnrolled = true,
  qualityScore = 88,
  previewImage,
  size = 'md',
  onClick,
  showQualityBadge = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-24 h-32',       // Table rows (uniform dimensions matching video)
    md: 'w-28 h-36 sm:w-32 sm:h-40', // Drawers and Forms
    lg: 'w-full aspect-[3/4] max-w-[220px]', // View Details page
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
        <FingerprintIcon className="w-10 h-10 opacity-35 mb-1.5" />
        <span className="text-xs font-semibold text-slate-400">Not Enrolled</span>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5">Click to Scan</span>
      </div>
    );
  }

  const imageSource = (previewImage && previewImage.startsWith('data:image'))
    ? previewImage
    : (DEFAULT_FINGERPRINTS[fingerIndex] || PHYSICAL_FINGERPRINT_1);

  return (
    <div
      onClick={onClick}
      className={`relative group ${containerDimension} rounded-2xl bg-black border-2 border-slate-900 shadow-md flex flex-col items-center justify-between p-2 mx-auto overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-brand-primary hover:shadow-lg' : ''
      } ${className}`}
      title={`${fingerIndex.replace('_', ' ')} - Enrolled (${qualityScore}% Quality)`}
    >
      {/* Full Biometric Graphic covering container completely */}
      <div className="w-full flex-1 flex items-center justify-center p-0.5 overflow-hidden">
        <img
          src={imageSource}
          alt={fingerIndex}
          className="w-full h-full object-contain filter contrast-125 brightness-105"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>

      {/* Quality Badge matching Screenshot 3 */}
      {showQualityBadge && (
        <div className="w-full bg-black/90 py-1 px-1.5 rounded-lg flex items-center justify-center space-x-1 border border-slate-800">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <span className="text-[11px] font-bold text-emerald-400 font-mono tracking-tight">
            {qualityScore}%
          </span>
        </div>
      )}
    </div>
  );
};
