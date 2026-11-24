import React from 'react';
import { Fingerprint as FingerprintIcon, CheckCircle2, Sparkles } from 'lucide-react';
import { getDistinctStudentFingerprint } from '../../assets/fingerprints';
import { AIFingerprintEnhancer } from '../../services/aiFingerprintEnhancer.service';

/**
 * AI-enhanced biometric image processor:
 * Cleans background to solid pitch black (#000000) and sharpens friction ridges
 * into ultra-high-definition, crystal-clear white (#FFFFFF).
 */
export function useInvertedFingerprint(imageSource?: string | null): string {
  const [processedSrc, setProcessedSrc] = React.useState<string>(imageSource || '');

  React.useEffect(() => {
    if (!imageSource || !imageSource.startsWith('data:image')) {
      setProcessedSrc(imageSource || '');
      return;
    }

    let isMounted = true;
    AIFingerprintEnhancer.enhance(imageSource)
      .then((enhanced) => {
        if (isMounted) setProcessedSrc(enhanced);
      })
      .catch(() => {
        if (isMounted) setProcessedSrc(imageSource);
      });

    return () => {
      isMounted = false;
    };
  }, [imageSource]);

  return processedSrc;
}

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
  const rawImgSrc =
    previewImage && previewImage.startsWith('data:image')
      ? previewImage
      : getDistinctStudentFingerprint(seed || type, type);

  const imgSrc = useInvertedFingerprint(rawImgSrc);

  return (
    <div
      className={`${className} flex flex-col items-center justify-center rounded-xl bg-black text-white p-2`}
    >
      <div className="w-full flex-1 flex items-center justify-center p-1 overflow-hidden">
        <img
          src={imgSrc}
          alt={type}
          className="w-full h-full object-contain drop-shadow-md"
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
  // Exact match to reference screenshot (w ~104px, h ~126px, rounded-xl, pure black card)
  const sizeClasses = {
    sm: 'w-[88px] h-[108px]',
    md: 'w-[104px] h-[126px]',
    lg: 'w-[140px] h-[170px]',
  };
  const containerDimension = sizeClasses[size] || sizeClasses.md;

  const rawImageSource =
    previewImage && previewImage.startsWith('data:image')
      ? previewImage
      : getDistinctStudentFingerprint(seed || fingerIndex, fingerIndex);

  const imageSource = useInvertedFingerprint(rawImageSource);

  if (!isEnrolled) {
    return (
      <div
        onClick={onClick}
        className={`${containerDimension} rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-2 mx-auto transition-all ${
          onClick ? 'cursor-pointer hover:border-brand-primary hover:text-brand-primary hover:bg-indigo-50/20' : ''
        } ${className}`}
        title={`Click to enroll ${fingerIndex.replace('_', ' ')}`}
      >
        <FingerprintIcon className="w-8 h-8 opacity-35 mb-1" />
        <span className="text-[11px] font-semibold text-slate-500">Not Enrolled</span>
        <span className="text-[9px] text-slate-400 font-mono mt-0.5">Click to Scan</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center mx-auto ${className}`}>
      <div
        onClick={onClick}
        className={`relative group ${containerDimension} rounded-xl bg-black border border-black shadow-sm flex items-center justify-center p-1 overflow-hidden transition-all hover:scale-[1.02] ${
          onClick ? 'cursor-pointer hover:ring-2 hover:ring-brand-primary hover:shadow-md' : ''
        }`}
        title={`${fingerIndex.replace('_', ' ')} - Enrolled (${qualityScore}% Quality)`}
      >
        <div className="w-full h-full flex items-center justify-center overflow-hidden">
          <img
            src={imageSource}
            alt={fingerIndex}
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {showQualityBadge && (
        <div className="w-[104px] bg-black/95 py-0.5 px-1.5 rounded-lg flex items-center justify-between border border-slate-800 mt-1.5 shadow-sm">
          <div className="flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
            <span className="text-[10px] font-bold text-emerald-400 font-mono tracking-tight">
              {qualityScore > 0 ? `${qualityScore}%` : 'Enrolled'}
            </span>
          </div>
          <span className="inline-flex items-center gap-0.5 text-[8px] font-bold px-1 py-0.5 rounded-full bg-indigo-950/90 text-indigo-300 border border-indigo-700/60 font-mono tracking-tight">
            <Sparkles className="w-2 h-2 text-indigo-400" />
            AI HD
          </span>
        </div>
      )}
    </div>
  );
};
