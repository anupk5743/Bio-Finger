
import React from 'react';
import { Fingerprint as FingerprintIcon, CheckCircle2 } from 'lucide-react';

interface FingerprintPatternProps {
  type: 'FINGER_1' | 'FINGER_2' | 'FINGER_3';
  isEnrolled?: boolean;
  qualityScore?: number;
  className?: string;
}

export const FingerprintPattern: React.FC<FingerprintPatternProps> = ({
  type,
  isEnrolled = false,
  qualityScore,
  className = 'w-full h-full',
}) => {
  return (
    <div
      className={`${className} flex flex-col items-center justify-center rounded-xl bg-black text-white`}
    >
      <FingerprintIcon
        className={`w-16 h-16 ${
          isEnrolled ? 'text-emerald-400' : 'text-slate-500'
        }`}
      />

      <span className="text-xs font-bold mt-3">
        {type.replace('_', ' ')}
      </span>

      {isEnrolled ? (
        <>
          <div className="flex items-center gap-1 mt-2 text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            <span className="text-xs">Enrolled</span>
          </div>

          {typeof qualityScore === 'number' && (
            <span className="text-xs mt-1 text-slate-300">
              Quality: {qualityScore}%
            </span>
          )}
        </>
      ) : (
        <span className="text-xs mt-2 text-slate-400">
          Not Enrolled
        </span>
      )}
    </div>
  );
};
