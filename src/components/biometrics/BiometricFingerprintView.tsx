import React from 'react';
import { Fingerprint as FingerprintIcon, CheckCircle2 } from 'lucide-react';

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
 * Authentic High-Resolution SVG Fingerprint Patterns replicating the Video & Screenshot 3
 * Generates full-coverage white ridges on deep black background
 */
export const FingerprintPattern: React.FC<{
  type: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  className?: string;
}> = ({ type, className = 'w-full h-full' }) => {
  if (type === 'FINGER_1') {
    // Whorl pattern (matching Finger 1 in video & screenshot)
    return (
      <svg
        viewBox="0 0 140 180"
        className={className}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 70 88 A 6 7 0 1 1 70 74 A 6 7 0 1 1 70 88" strokeWidth="3.2" />
        <path d="M 70 96 A 14 15 0 1 1 70 66 A 14 15 0 1 1 70 96" />
        <path d="M 70 105 A 22 24 0 1 1 70 57 A 22 24 0 1 1 70 105" />
        <path d="M 70 115 A 31 34 0 1 1 70 47 A 31 34 0 1 1 70 115" />
        <path d="M 70 125 A 40 44 0 1 1 70 37 A 40 44 0 1 1 70 125" />
        <path d="M 70 136 A 49 54 0 1 1 70 28 A 49 54 0 1 1 70 136" />
        <path d="M 70 148 A 58 64 0 1 1 70 20 A 58 64 0 1 1 70 148" />
        <path d="M 70 160 A 66 73 0 1 1 70 14 A 66 73 0 1 1 70 160" />
        <path d="M 12 165 C 25 155 45 150 70 150 C 95 150 115 155 128 165" />
        <path d="M 10 175 C 25 162 48 158 70 158 C 92 158 115 162 130 175" />
        <path d="M 20 40 C 35 22 52 14 70 14 C 88 14 105 22 120 40" />
        <path d="M 14 60 C 10 75 10 105 14 125" />
        <path d="M 126 60 C 130 75 130 105 126 125" />
      </svg>
    );
  }

  if (type === 'FINGER_2') {
    // Left-loop pattern (matching Finger 2 in video & screenshot)
    return (
      <svg
        viewBox="0 0 140 180"
        className={className}
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M 64 88 C 64 78 72 74 76 74 C 80 74 84 78 84 88 C 84 110 55 130 35 150" strokeWidth="3.2" />
        <path d="M 58 96 C 58 74 70 66 78 66 C 86 66 92 74 92 96 C 92 120 62 142 40 162" />
        <path d="M 52 105 C 52 70 68 58 80 58 C 92 58 100 70 100 105 C 100 128 70 152 45 174" />
        <path d="M 46 115 C 46 66 66 50 82 50 C 98 50 108 66 108 115 C 108 136 78 162 50 180" />
        <path d="M 40 125 C 40 60 64 42 84 42 C 104 42 116 60 116 125" />
        <path d="M 34 135 C 34 54 62 34 86 34 C 110 34 124 54 124 135" />
        <path d="M 28 145 C 28 48 60 26 88 26 C 116 26 132 48 132 145" />
        <path d="M 22 155 C 22 42 58 18 90 18 C 122 18 138 42 138 155" />
        <path d="M 12 165 C 15 130 20 100 30 75" />
        <path d="M 8 175 C 12 140 18 110 24 85" />
        <path d="M 60 178 C 80 165 105 160 130 168" />
        <path d="M 70 185 C 90 175 110 172 135 178" />
      </svg>
    );
  }

  // FINGER_3: Right-loop / Tented Arch pattern (matching Finger 3 in video & screenshot)
  return (
    <svg
      viewBox="0 0 140 180"
      className={className}
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M 76 88 C 76 78 68 74 64 74 C 60 74 56 78 56 88 C 56 110 85 130 105 150" strokeWidth="3.2" />
      <path d="M 82 96 C 82 74 70 66 62 66 C 54 66 48 74 48 96 C 48 120 78 142 100 162" />
      <path d="M 88 105 C 88 70 72 58 60 58 C 48 58 40 70 40 105 C 40 128 70 152 95 174" />
      <path d="M 94 115 C 94 66 74 50 58 50 C 42 50 32 66 32 115 C 32 136 62 162 90 180" />
      <path d="M 100 125 C 100 60 76 42 56 42 C 36 42 24 60 24 125" />
      <path d="M 106 135 C 106 54 78 34 54 34 C 30 34 16 54 16 135" />
      <path d="M 112 145 C 112 48 80 26 52 26 C 24 26 8 48 8 145" />
      <path d="M 118 155 C 118 42 82 18 50 18 C 18 18 2 42 2 155" />
      <path d="M 128 165 C 125 130 120 100 110 75" />
      <path d="M 132 175 C 128 140 122 110 116 85" />
      <path d="M 80 178 C 60 165 35 160 10 168" />
    </svg>
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
    sm: 'w-24 h-32',       // Table rows (uniform dimensions)
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

  return (
    <div
      onClick={onClick}
      className={`relative group ${containerDimension} rounded-2xl bg-black border-2 border-slate-900 shadow-md flex flex-col items-center justify-between p-2 mx-auto overflow-hidden transition-all ${
        onClick ? 'cursor-pointer hover:ring-2 hover:ring-brand-primary hover:shadow-lg' : ''
      } ${className}`}
      title={`${fingerIndex.replace('_', ' ')} - Enrolled (${qualityScore}% Quality)`}
    >
      {/* Full Biometric Graphic covering container completely */}
      <div className="w-full flex-1 flex items-center justify-center p-1 overflow-hidden">
        {previewImage && previewImage.startsWith('data:image') ? (
          <img
            src={previewImage}
            alt={fingerIndex}
            className="w-full h-full object-contain filter contrast-125 brightness-110"
          />
        ) : (
          <FingerprintPattern type={fingerIndex} className="w-full h-full object-contain" />
        )}
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

