
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  Search,
  Plus,
  Download,
  MoreVertical,
  Fingerprint as FingerprintIcon,
  Trash2,
  Edit,
  Eye,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

import {
  studentService,
  type CreateStudentPayload,
  type UpdateStudentPayload,
  type StudentFingerprint,
} from '../../services/student.service';

import { batchService } from '../../services/batch.service';
import { exportService } from '../../services/export.service';
import { mfs100Service } from '../../services/mfs100.service';

import { Student, Batch } from '../../types';

import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { SlideOver } from '../../components/common/SlideOver';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';

import {
  FingerprintScanCard,
  FingerprintData,
} from '../../components/fingerprint/FingerprintScanCard';

import { BiometricFingerprintView } from '../../components/biometrics/BiometricFingerprintView';
import { StudentDetailsView } from './StudentDetailsView';

// --------------------------------------------------
// FORM VALIDATION
// --------------------------------------------------

const studentSchema = z.object({
  firstName: z.string().trim().min(1, 'First Name is required'),

  lastName: z.string().trim().min(1, 'Last Name is required'),

  mobileNumber: z
    .string()
    .regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),

  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal('')),

  batchId: z.string().min(1, 'Please select a batch'),

  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type StudentFormData = z.infer<typeof studentSchema>;

type FingerIndex =
  | 'FINGER_1'
  | 'FINGER_2'
  | 'FINGER_3';

// --------------------------------------------------
// COMPONENT
// --------------------------------------------------

export const StudentsPage: React.FC = () => {
  // --------------------------------------------------
  // STATES
  // --------------------------------------------------

  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Only newly captured fingerprint data is held here.
  const [finger1, setFinger1] = useState<FingerprintData | null>(null);
  const [finger2, setFinger2] = useState<FingerprintData | null>(null);
  const [finger3, setFinger3] = useState<FingerprintData | null>(null);

  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);

  const [drawerMode, setDrawerMode] = useState<'DIAGNOSTIC' | 'FORM'>('FORM');

  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const navigate = useNavigate();

  const { id: routeStudentId } = useParams<{ id?: string }>();

  // --------------------------------------------------
  // REACT HOOK FORM
  // --------------------------------------------------

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),

    defaultValues: {
      firstName: '',
      lastName: '',
      mobileNumber: '',
      email: '',
      batchId: '',
      status: 'ACTIVE',
    },
  });

  // --------------------------------------------------
  // CLEAR FINGERPRINT STATES
  // --------------------------------------------------

  const clearFingerprintStates = useCallback(() => {
    setFinger1(null);
    setFinger2(null);
    setFinger3(null);
  }, []);

  // --------------------------------------------------
  // ROUTE AND STUDENT DETAILS
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    if (!routeStudentId) {
      setViewingStudent(null);
      return;
    }

    studentService
      .getStudentById(routeStudentId)
      .then((res) => {
        if (!cancelled) {
          setViewingStudent(res);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Student not found');
          navigate('/students');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [routeStudentId, navigate]);

  // --------------------------------------------------
  // LOAD BATCHES
  // --------------------------------------------------

  const loadBatches = useCallback(async () => {
    try {
      const res = await batchService.getBatches({
        limit: 100,
      });

      setBatches(res.data || []);
    } catch {
      toast.error('Failed to load batches');
    }
  }, []);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // --------------------------------------------------
  // LOAD STUDENTS
  // --------------------------------------------------

  const loadStudents = useCallback(async () => {
    setIsLoading(true);

    try {
      const res = await studentService.getStudents({
        page: currentPage,
        limit: 10,
        search,
        batchId: selectedBatch,
      });

      setStudents(res.data || []);
      setTotalPages(res.meta?.totalPages || 1);
      setTotalResults(res.meta?.total || 0);
    } catch {
      toast.error('Failed to fetch students from server');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, search, selectedBatch]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // --------------------------------------------------
  // OPEN ADD STUDENT FORM
  // --------------------------------------------------

  const handleOpenAdd = () => {
    reset({
      firstName: '',
      lastName: '',
      mobileNumber: '',
      email: '',
      batchId: batches[0]?.id || '',
      status: 'ACTIVE',
    });

    clearFingerprintStates();

    setEditingStudent(null);
    setDrawerMode('FORM');
    setActiveMenuId(null);
    setIsAddDrawerOpen(true);
  };

  // --------------------------------------------------
  // CLOSE FORM
  // --------------------------------------------------

  const handleCloseForm = () => {
    setIsAddDrawerOpen(false);
    setEditingStudent(null);
    setDrawerMode('FORM');

    clearFingerprintStates();

    reset({
      firstName: '',
      lastName: '',
      mobileNumber: '',
      email: '',
      batchId: '',
      status: 'ACTIVE',
    });
  };

  // --------------------------------------------------
  // RECONNECT MFS100
  // --------------------------------------------------

  const handleReconnect = async () => {
    if (isReconnecting) return;

    setIsReconnecting(true);

    toast.loading(
      'Checking Mantra MFS100 service on port 8003...',
      { id: 'recon-toast' }
    );

    try {
      const status = await mfs100Service.checkDevice();

      if (status.connected && status.status === 'READY') {
        toast.success(
          status.message,
          { id: 'recon-toast' }
        );

        setDrawerMode('FORM');
      } else {
        toast.error(
          status.message || 'MFS100 scanner is not ready.',
          {
            id: 'recon-toast',
            duration: 5000,
          }
        );
      }
    } catch {
      toast.error(
        'Unable to connect to Mantra MFS100 on port 8003.',
        { id: 'recon-toast' }
      );
    } finally {
      setIsReconnecting(false);
    }
  };

  // --------------------------------------------------
  // OPEN EDIT STUDENT
  // --------------------------------------------------

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);

    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      mobileNumber: student.mobileNumber,
      email: student.email || '',
      batchId: student.batchId,
      status: student.status,
    });

    /*
     * Do not create fake biometric templates.
     *
     * Existing enrollment status is retained in the database.
     * Only newly scanned fingers are submitted during update.
     */

    clearFingerprintStates();

    setDrawerMode('FORM');
    setIsAddDrawerOpen(true);
    setActiveMenuId(null);
  };

  // --------------------------------------------------
  // COLLECT NEWLY CAPTURED FINGERPRINTS
  // --------------------------------------------------

  const getFingerprintsToSave = (): StudentFingerprint[] => {
    const fingerprints: FingerprintData[] = [
      finger1,
      finger2,
      finger3,
    ].filter(
      (finger): finger is FingerprintData => finger !== null
    );

    const receivedIndexes = new Set<string>();

    return fingerprints.map((finger) => {
      if (
        !finger.biometricData ||
        typeof finger.biometricData !== 'string' ||
        !finger.biometricData.trim()
      ) {
        throw new Error(
          `${finger.fingerIndex}: Actual biometric template is missing.`
        );
      }

      if (
        !Number.isFinite(finger.qualityScore) ||
        finger.qualityScore < 0 ||
        finger.qualityScore > 100
      ) {
        throw new Error(
          `${finger.fingerIndex}: Invalid fingerprint quality score.`
        );
      }

      if (
        !finger.deviceModel ||
        !finger.deviceModel.trim()
      ) {
        throw new Error(
          `${finger.fingerIndex}: Scanner device information is missing.`
        );
      }

      if (receivedIndexes.has(finger.fingerIndex)) {
        throw new Error(
          `${finger.fingerIndex}: Duplicate fingerprint detected.`
        );
      }

      receivedIndexes.add(finger.fingerIndex);

      return {
        fingerIndex: finger.fingerIndex,
        biometricData: finger.biometricData,
        qualityScore: finger.qualityScore,
        deviceModel: finger.deviceModel,
        scannedAt: finger.scannedAt,
      };
    });
  };

  // --------------------------------------------------
  // SAVE OR UPDATE STUDENT
  // --------------------------------------------------

  const handleFormSubmit = async (data: StudentFormData) => {
    try {
      const fingerprintsToSave = getFingerprintsToSave();

      if (editingStudent) {
        const updatePayload: UpdateStudentPayload = {
          firstName: data.firstName,
          lastName: data.lastName,
          mobileNumber: data.mobileNumber,
          email: data.email || '',
          batchId: data.batchId,
          status: data.status,
        };

        /*
         * IMPORTANT:
         * Only send fingerprints when new captures exist.
         * Never send an empty array to clear existing enrollment.
         */

        if (fingerprintsToSave.length > 0) {
          updatePayload.fingerprints = fingerprintsToSave;
        }

        await studentService.updateStudent(
          editingStudent.id,
          updatePayload
        );

        toast.success(
          fingerprintsToSave.length > 0
            ? 'Student details and new fingerprint captures updated successfully!'
            : 'Student details updated successfully!'
        );
      } else {
        const createPayload: CreateStudentPayload = {
          firstName: data.firstName,
          lastName: data.lastName,
          mobileNumber: data.mobileNumber,
          email: data.email || '',
          batchId: data.batchId,
          status: data.status,
        };

        if (fingerprintsToSave.length > 0) {
          createPayload.fingerprints = fingerprintsToSave;
        }

        await studentService.createStudent(createPayload);

        toast.success(
          fingerprintsToSave.length > 0
            ? `Student registered with ${fingerprintsToSave.length} actual fingerprint capture(s)!`
            : 'Student registered successfully!'
        );
      }

      handleCloseForm();

      await loadStudents();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : 'Student operation failed')
      );
    }
  };

  // --------------------------------------------------
  // DELETE STUDENT
  // --------------------------------------------------

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;

    try {
      await studentService.deleteStudent(deletingStudent.id);

      toast.success(
        `Student ${deletingStudent.firstName} deleted successfully`
      );

      setDeletingStudent(null);

      await loadStudents();
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      toast.error(
        error.response?.data?.message ||
        'Failed to delete student'
      );
    }
  };

  // --------------------------------------------------
  // EXPORT STUDENTS
  // --------------------------------------------------

  const handleExport = async () => {
    try {
      toast.loading(
        'Generating student list export...',
        { id: 'export-toast' }
      );

      await exportService.exportStudents(
        'xlsx',
        selectedBatch
      );

      toast.success(
        'Export downloaded successfully!',
        { id: 'export-toast' }
      );
    } catch {
      toast.error(
        'Failed to export student records',
        { id: 'export-toast' }
      );
    }
  };

  // --------------------------------------------------
  // STUDENT DETAILS VIEW
  // --------------------------------------------------

  if (viewingStudent) {
    return (
      <StudentDetailsView
        student={viewingStudent}
        onBack={() => {
          setViewingStudent(null);
          navigate('/students');
        }}
      />
    );
  }

  // --------------------------------------------------
  // MAIN PAGE
  // --------------------------------------------------

  return (
    <div className="space-y-6">

      {/* STUDENTS TABLE */}

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* HEADER */}

        <div className="p-6 pb-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100">

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Students List
          </h2>

          <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">

            {/* BATCH FILTER */}

            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white min-w-[170px]"
            >
              <option value="">Select Batch (All)</option>

              {batches.map((batch) => (
                <option key={batch.id} value={batch.id}>
                  {batch.name}
                </option>
              ))}
            </select>

            {/* SEARCH */}

            <div className="relative flex-1 sm:flex-initial sm:min-w-[240px]">

              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Student..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm"
              />

              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />

            </div>

            {/* EXPORT */}

            <button
              type="button"
              onClick={handleExport}
              className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-[#5b52f9] flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              DOWNLOAD
            </button>

            {/* ADD STUDENT */}

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-xl text-sm font-bold text-white bg-brand-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ADD
            </button>

          </div>
        </div>

        {/* TABLE CONTENT */}

        {isLoading ? (
          <TableLoadingSkeleton rows={6} cols={7} />
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description="No student records match your selected criteria."
            actionText="+ ADD STUDENT"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full text-left text-sm">

              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase text-xs bg-slate-50/50">

                  <th className="py-4 px-6">S.NO</th>
                  <th className="py-4 px-6">NAME</th>
                  <th className="py-4 px-6">BATCH</th>
                  <th className="py-4 px-6">STATUS</th>
                  <th className="py-4 px-6 text-center">FINGER 1</th>
                  <th className="py-4 px-6 text-center">FINGER 2</th>
                  <th className="py-4 px-6 text-center">FINGER 3</th>
                  <th className="py-4 px-6 text-right">ACTION</th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {students.map((student, idx) => (

                  <tr
                    key={student.id}
                    className="hover:bg-slate-50/60"
                  >

                    {/* SERIAL NUMBER */}

                    <td className="py-4 px-6 text-slate-500 font-semibold">
                      {(currentPage - 1) * 10 + idx + 1}
                    </td>

                    {/* STUDENT NAME */}

                    <td className="py-4 px-6">

                      <div className="font-bold text-slate-900">
                        {student.firstName} {student.lastName}
                      </div>

                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {student.mobileNumber}
                      </div>

                    </td>

                    {/* BATCH */}

                    <td className="py-4 px-6 font-mono text-slate-800">
                      {student.batchName}
                    </td>

                    {/* STATUS */}

                    <td className="py-4 px-6">
                      <StatusBadge status={student.status} />
                    </td>

                    {/* FINGER 1 */}

                    <td className="py-3 px-4 text-center">

                      <BiometricFingerprintView
                        fingerIndex="FINGER_1"
                        isEnrolled={!!student.finger1?.isEnrolled}
                        qualityScore={student.finger1?.qualityScore ?? 0}
                        showQualityBadge={false}
                        size="sm"
                        onClick={() => navigate(`/students/${student.id}`)}
                      />

                    </td>

                    {/* FINGER 2 */}

                    <td className="py-3 px-4 text-center">

                      <BiometricFingerprintView
                        fingerIndex="FINGER_2"
                        isEnrolled={!!student.finger2?.isEnrolled}
                        qualityScore={student.finger2?.qualityScore ?? 0}
                        showQualityBadge={false}
                        size="sm"
                        onClick={() => navigate(`/students/${student.id}`)}
                      />

                    </td>

                    {/* FINGER 3 */}

                    <td className="py-3 px-4 text-center">

                      <BiometricFingerprintView
                        fingerIndex="FINGER_3"
                        isEnrolled={!!student.finger3?.isEnrolled}
                        qualityScore={student.finger3?.qualityScore ?? 0}
                        showQualityBadge={false}
                        size="sm"
                        onClick={() => navigate(`/students/${student.id}`)}
                      />

                    </td>

                    {/* ACTION MENU */}

                    <td className="py-4 px-6 text-right relative">

                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuId(
                            activeMenuId === student.id
                              ? null
                              : student.id
                          )
                        }
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === student.id && (

                        <div className="absolute right-6 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-left">

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              navigate(`/students/${student.id}`);
                            }}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </button>

                          {/* EDIT */}

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(student)}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </button>

                          {/* DELETE */}

                          <button
                            type="button"
                            onClick={() => {
                              setDeletingStudent(student);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 border-t border-slate-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>

                        </div>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>
        )}

        {/* PAGINATION */}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={10}
          onPageChange={setCurrentPage}
        />

      </div>

      {/* --------------------------------------------------
          STUDENT REGISTRATION / EDIT DRAWER
      -------------------------------------------------- */}

      <SlideOver
        isOpen={isAddDrawerOpen}
        title={
          editingStudent
            ? 'Edit Student Details'
            : 'Student Registration Form'
        }
        onClose={handleCloseForm}
        width="max-w-3xl lg:max-w-4xl"
      >

        {/* DIAGNOSTIC MODE */}

        {drawerMode === 'DIAGNOSTIC' && !editingStudent ? (

          <div className="space-y-6">

            <div className="flex flex-col items-center text-center pt-2 pb-2">

              <div className="w-16 h-16 rounded-2xl bg-white border border-rose-200 flex items-center justify-center text-rose-500 mb-4">
                <AlertTriangle className="w-9 h-9" />
              </div>

              <h3 className="text-xl font-bold text-slate-900">
                Fingerprint Scanner Facing Issue
              </h3>

              <p className="text-sm font-semibold text-slate-800 mt-1">
                Mantra MFS100 Client Service is not responding
              </p>

              <p className="text-xs text-slate-400 mt-1">
                Follow these troubleshooting instructions.
              </p>

            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">

              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  1. Open Services Management
                </h4>

                <p className="text-xs text-slate-600 mt-1">
                  Press Windows + R, type services.msc and press Enter.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-bold text-slate-900">
                  2. Locate MFS100 Client Service
                </h4>

                <p className="text-xs text-slate-600 mt-1">
                  Find the Mantra MFS100 Client Service in the Services window.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-bold text-slate-900">
                  3. Check Service Status
                </h4>

                <p className="text-xs text-slate-600 mt-1">
                  If the service is stopped, start it. If it is already running, check the device connection and service logs.
                </p>
              </div>

              <div className="border-t pt-3">
                <h4 className="text-xs font-bold text-slate-900">
                  4. Official Mantra Support
                </h4>

                <a
                  href="https://www.mantratec.com/download"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline"
                >
                  Mantra Downloads
                </a>
              </div>

            </div>

            <div className="pt-4 border-t flex items-center justify-between">

              <button
                type="button"
                onClick={() => setDrawerMode('FORM')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-brand-primary bg-indigo-50"
              >
                PROCEED TO REGISTRATION
              </button>

              <button
                type="button"
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-brand-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isReconnecting && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}

                {isReconnecting
                  ? 'RECONNECTING...'
                  : 'RECONNECT'}
              </button>

            </div>

          </div>

        ) : (

          // --------------------------------------------------
          // REGISTRATION FORM
          // --------------------------------------------------

          <form
            onSubmit={handleSubmit(handleFormSubmit)}
            className="space-y-5"
          >

            {/* TROUBLESHOOTING NAVIGATION */}

            {!editingStudent && (

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">

                <button
                  type="button"
                  onClick={() => setDrawerMode('DIAGNOSTIC')}
                  className="inline-flex items-center text-xs font-semibold text-slate-500"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  Scanner Troubleshooting Guide
                </button>

                <span className="text-[11px] font-semibold text-slate-500">
                  MFS100 | Port 8003
                </span>

              </div>

            )}

            {/* PERSONAL INFORMATION */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  First Name *
                </label>

                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="Enter First Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm"
                />

                {errors.firstName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.firstName.message}
                  </p>
                )}

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Last Name *
                </label>

                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="Enter Last Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm"
                />

                {errors.lastName && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.lastName.message}
                  </p>
                )}

              </div>

            </div>

            {/* CONTACT INFORMATION */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Mobile Number *
                </label>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  {...register('mobileNumber')}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono"
                />

                {errors.mobileNumber && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.mobileNumber.message}
                  </p>
                )}

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>

                <input
                  type="email"
                  {...register('email')}
                  placeholder="student@example.com (optional)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm"
                />

                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.email.message}
                  </p>
                )}

              </div>

            </div>

            {/* BATCH AND STATUS */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Select Batch *
                </label>

                <select
                  {...register('batchId')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="">-- Choose Batch --</option>

                  {batches.map((batch) => (
                    <option key={batch.id} value={batch.id}>
                      {batch.name} ({batch.status})
                    </option>
                  ))}

                </select>

                {errors.batchId && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.batchId.message}
                  </p>
                )}

              </div>

              <div>

                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Student Status
                </label>

                <select
                  {...register('status')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>

              </div>

            </div>

            {/* BIOMETRIC REGISTRATION - EXACT DESIGN MATCHING SCREENSHOT */}
            <div className="pt-6 border-t border-slate-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 my-2">
                <FingerprintScanCard
                  label="1. Fingerprint Capture"
                  fingerIndex="FINGER_1"
                  value={finger1}
                  onChange={setFinger1}
                  onDeviceError={() => setDrawerMode('DIAGNOSTIC')}
                />

                <FingerprintScanCard
                  label="2. Fingerprint Capture"
                  fingerIndex="FINGER_2"
                  value={finger2}
                  onChange={setFinger2}
                  onDeviceError={() => setDrawerMode('DIAGNOSTIC')}
                />

                <FingerprintScanCard
                  label="3. Fingerprint Capture"
                  fingerIndex="FINGER_3"
                  value={finger3}
                  onChange={setFinger3}
                  onDeviceError={() => setDrawerMode('DIAGNOSTIC')}
                />
              </div>

              {/* Exact Warning text matching screenshot */}
              <div className="mt-6 mb-2 text-left">
                <p className="text-xs text-[#f43f5e] font-medium leading-relaxed">
                  <strong className="font-bold">Warning:</strong> This system utilizes student fingerprint data. Unauthorized access, use, or distribution of this sensitive information for personal or illegal purposes is strictly prohibited and may result in severe legal consequences. Ensure compliance with all applicable laws and regulations when handling this data.
                </p>
              </div>
            </div>

            {/* FORM ACTIONS MATCHING SCREENSHOT (RESET & SUBMIT) */}
            <div className="pt-5 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  reset({
                    firstName: '',
                    lastName: '',
                    mobileNumber: '',
                    email: '',
                    batchId: batches[0]?.id || '',
                    status: 'ACTIVE',
                  });
                  setFinger1(null);
                  setFinger2(null);
                  setFinger3(null);
                  toast.success('Form reset successfully.');
                }}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#f97316] hover:bg-orange-600 shadow-sm transition-all disabled:opacity-50"
              >
                RESET
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#6366f1] hover:bg-indigo-600 shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'SUBMITTING...' : 'SUBMIT'}
              </button>
            </div>

          </form>

        )}

      </SlideOver>

      {/* DELETE CONFIRMATION */}

      <ConfirmationModal
        isOpen={!!deletingStudent}
        title="Confirm Student Deletion"
        message={`Are you sure you want to delete student '${deletingStudent?.firstName} ${deletingStudent?.lastName}'?`}
        confirmLabel="DELETE"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudent(null)}
      />

    </div>
  );
};
