import React from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Student } from '../../types';
import { FingerprintPattern } from '../../components/biometrics/BiometricFingerprintView';

interface StudentDetailsViewProps {
  student: Student;
  onBack: () => void;
}

export const StudentDetailsView: React.FC<StudentDetailsViewProps> = ({
  student,
  onBack,
}) => {
  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName?.[0] || 'S').toUpperCase()}${(lastName?.[0] || 'P').toUpperCase()}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Navigation: ← Student Details matching exact video at 00:05 */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Back to Students List"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
        </button>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Student Details
        </h1>
      </div>

      {/* Main White Card Container matching exact video at 00:05-00:10 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Student Info */}
          <div className="lg:col-span-4 xl:col-span-3 space-y-5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Student Info
            </h2>

            {/* Circular Purple Avatar + Full Name matching video */}
            <div className="flex flex-col items-center sm:items-start pt-1">
              <div className="w-20 h-20 rounded-full bg-[#5b52f9] text-white flex items-center justify-center font-bold text-2xl shadow-md mb-3">
                {getInitials(student.firstName, student.lastName)}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {student.firstName} {student.lastName}
              </h3>
            </div>

            {/* Info Table matching exact video fields */}
            <div className="pt-2 divide-y divide-slate-100 border-t border-slate-100 text-sm">
              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Mobile No.</span>
                <span className="font-bold text-slate-800 font-mono">
                  {student.mobileNumber}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Batch Name:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {student.batchName}
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Status:</span>
                <span className="inline-flex items-center text-sm font-semibold text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 inline-block"></span>
                  Active
                </span>
              </div>

              <div className="py-2.5 flex items-center justify-between">
                <span className="text-slate-500 font-medium">Address:</span>
                <span className="font-semibold text-slate-700">
                  {student.email ? student.email.split('@')[0] : 'Maholi'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Biometrics Captured matching exact video */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Biometrics Captured
            </h2>

            {/* 3 Large Black Biometric Fingerprint Cards side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Card 1: FINGER 1 */}
              <div className="w-full aspect-[3/4] max-w-[220px] mx-auto sm:mx-0 rounded-2xl bg-black border-2 border-slate-900 shadow-lg p-2.5 flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02]">
                <FingerprintPattern
                  type="FINGER_1"
                  className="w-full h-full object-contain filter contrast-125"
                />
              </div>

              {/* Card 2: FINGER 2 */}
              <div className="w-full aspect-[3/4] max-w-[220px] mx-auto sm:mx-0 rounded-2xl bg-black border-2 border-slate-900 shadow-lg p-2.5 flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02]">
                <FingerprintPattern
                  type="FINGER_2"
                  className="w-full h-full object-contain filter contrast-125"
                />
              </div>

              {/* Card 3: FINGER 3 */}
              <div className="w-full aspect-[3/4] max-w-[220px] mx-auto sm:mx-0 rounded-2xl bg-black border-2 border-slate-900 shadow-lg p-2.5 flex items-center justify-center overflow-hidden transition-transform hover:scale-[1.02]">
                <FingerprintPattern
                  type="FINGER_3"
                  className="w-full h-full object-contain filter contrast-125"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Warning Alert Banner matching exact text from video at 00:06-00:10 */}
        <div className="mt-8 rounded-xl bg-[#fef2f2] border border-red-200/90 p-4 sm:p-5 flex items-start space-x-3.5">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 stroke-[2.2]" />
          <p className="text-xs sm:text-[13px] leading-relaxed text-red-700 font-medium">
            <span className="font-bold text-red-800">Warning: </span>
            This system utilizes locked fingerprint data. Unauthorized access, use, or distribution of this sensitive information for personal or illegal purposes is strictly prohibited and may result in severe legal consequences. Ensure compliance with all applicable laws and regulations when handling this data.
          </p>
        </div>
      </div>
    </div>
  );
};
