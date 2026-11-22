import React from 'react';
import {
  X,
  Phone,
  Layers,
  Fingerprint,
  CheckCircle2,
  AlertTriangle,
  Edit,
  ShieldCheck,
} from 'lucide-react';
import { Student } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { FingerprintPattern } from '../biometrics/BiometricFingerprintView';

interface StudentDetailsModalProps {
  isOpen: boolean;
  student: Student | null;
  onClose: () => void;
  onEdit?: (student: Student) => void;
}

export const StudentDetailsModal: React.FC<StudentDetailsModalProps> = ({
  isOpen,
  student,
  onClose,
  onEdit,
}) => {
  if (!isOpen || !student) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${(firstName?.[0] || 'S').toUpperCase()}${(lastName?.[0] || 'P').toUpperCase()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 overflow-hidden transform transition-all max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Fingerprint className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-bold tracking-tight">
                  {student.firstName} {student.lastName}
                </h3>
                <StatusBadge status={student.status} />
              </div>
              <p className="text-xs text-indigo-200 font-mono mt-0.5">
                Batch: {student.batchName} &bull; Mobile: {student.mobileNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - 2 Columns matching the Video Layout */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Student Info */}
            <div className="lg:col-span-5 space-y-5 bg-slate-50/80 p-5 rounded-2xl border border-slate-200/70">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Student Info
              </h4>

              {/* Circular Purple Avatar + Full Name */}
              <div className="flex flex-col items-center sm:items-start pt-1">
                <div className="w-18 h-18 rounded-full bg-[#5b52f9] text-white flex items-center justify-center font-bold text-2xl shadow-md mb-3">
                  {getInitials(student.firstName, student.lastName)}
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {student.firstName} {student.lastName}
                </h3>
              </div>

              {/* Info Table matching exact video fields */}
              <div className="pt-2 divide-y divide-slate-100 border-t border-slate-200/60 text-sm">
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
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Biometrics Captured
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  3/3 Registered
                </span>
              </div>

              {/* 3 Large Black Biometric Fingerprint Cards side by side */}
              <div className="grid grid-cols-3 gap-3.5 pt-1">
                {/* Card 1: FINGER 1 */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Finger 1
                  </span>
                  <div className="w-full aspect-[3/4] rounded-2xl bg-black border-2 border-slate-900 shadow-md p-2 flex items-center justify-center overflow-hidden">
                    <FingerprintPattern
                      type="FINGER_1"
                      previewImage={student.finger1?.previewImage}
                      seed={`${student.id}_FINGER_1`}
                      isEnrolled={!!student.finger1?.isEnrolled}
                      qualityScore={student.finger1?.qualityScore}
                      className="w-full h-full object-contain filter contrast-125"
                    />
                  </div>
                </div>

                {/* Card 2: FINGER 2 */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Finger 2
                  </span>
                  <div className="w-full aspect-[3/4] rounded-2xl bg-black border-2 border-slate-900 shadow-md p-2 flex items-center justify-center overflow-hidden">
                    <FingerprintPattern
                      type="FINGER_2"
                      previewImage={student.finger2?.previewImage}
                      seed={`${student.id}_FINGER_2`}
                      isEnrolled={!!student.finger2?.isEnrolled}
                      qualityScore={student.finger2?.qualityScore}
                      className="w-full h-full object-contain filter contrast-125"
                    />
                  </div>
                </div>

                {/* Card 3: FINGER 3 */}
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Finger 3
                  </span>
                  <div className="w-full aspect-[3/4] rounded-2xl bg-black border-2 border-slate-900 shadow-md p-2 flex items-center justify-center overflow-hidden">
                    <FingerprintPattern
                      type="FINGER_3"
                      previewImage={student.finger3?.previewImage}
                      seed={`${student.id}_FINGER_3`}
                      isEnrolled={!!student.finger3?.isEnrolled}
                      qualityScore={student.finger3?.qualityScore}
                      className="w-full h-full object-contain filter contrast-125"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Warning Alert matching Video at 00:06-00:10 */}
          <div className="rounded-xl bg-[#fef2f2] border border-red-200 p-4 flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5 stroke-[2.2]" />
            <p className="text-xs leading-relaxed text-red-700 font-medium">
              <span className="font-bold text-red-800">Warning: </span>
              This system utilizes locked fingerprint data. Unauthorized access, use, or distribution of this sensitive information for personal or illegal purposes is strictly prohibited and may result in severe legal consequences. Ensure compliance with all applicable laws and regulations when handling this data.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Biometric Data Encrypted & Verified</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-600 bg-slate-200 hover:bg-slate-300 transition-colors"
            >
              CLOSE
            </button>
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(student);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm flex items-center space-x-1.5 transition-all"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>EDIT STUDENT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
