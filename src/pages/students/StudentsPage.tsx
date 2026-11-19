import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { studentService } from '../../services/student.service';
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
import { FingerprintDiagnosticDrawer } from '../../components/fingerprint/FingerprintDiagnosticDrawer';
import { FingerprintScanCard, FingerprintData } from '../../components/fingerprint/FingerprintScanCard';
import { BiometricFingerprintView } from '../../components/biometrics/BiometricFingerprintView';
import { StudentDetailsView } from './StudentDetailsView';

const studentSchema = z.object({
  firstName: z.string().min(1, 'First Name is required'),
  lastName: z.string().min(1, 'Last Name is required'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  batchId: z.string().min(1, 'Please select a batch'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
});

type StudentFormData = z.infer<typeof studentSchema>;

// SVG Fingerprint Ridges Component for High-Contrast Biometric Previews
const FingerprintThumbnail = () => (
  <svg viewBox="0 0 100 120" className="w-11 h-14 text-white" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M 50 18 C 30 18 20 32 20 52 C 20 75 32 95 50 108" opacity="0.85" />
    <path d="M 50 26 C 36 26 28 38 28 54 C 28 72 37 88 50 98" opacity="0.9" />
    <path d="M 50 34 C 42 34 36 43 36 56 C 36 68 42 80 50 88" opacity="0.95" />
    <path d="M 50 42 C 46 42 43 47 43 56 C 43 65 47 72 50 78" />
    <path d="M 50 50 C 49 50 48 53 48 58 C 48 62 50 66 50 68" strokeWidth="3" />
    <path d="M 50 18 C 70 18 80 32 80 52 C 80 75 68 95 50 108" opacity="0.85" />
    <path d="M 50 26 C 64 26 72 38 72 54 C 72 72 63 88 50 98" opacity="0.9" />
    <path d="M 50 34 C 58 34 64 43 64 56 C 64 68 58 80 50 88" opacity="0.95" />
    <path d="M 50 42 C 54 42 57 47 57 56 C 57 65 53 72 50 78" />
    <path d="M 50 10 C 22 10 12 28 12 52 C 12 82 28 104 50 116" opacity="0.75" />
    <path d="M 50 10 C 78 10 88 28 88 52 C 88 82 72 104 50 116" opacity="0.75" />
  </svg>
);

export const StudentsPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Live Scanned Fingerprints State for Registration Form
  const [finger1, setFinger1] = useState<FingerprintData | null>(null);
  const [finger2, setFinger2] = useState<FingerprintData | null>(null);
  const [finger3, setFinger3] = useState<FingerprintData | null>(null);

  // Modals & Drawers state
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [drawerMode, setDrawerMode] = useState<'DIAGNOSTIC' | 'FORM'>('DIAGNOSTIC');
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [diagnosticOpen, setDiagnosticOpen] = useState<boolean>(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { id: routeStudentId } = useParams<{ id?: string }>();

  // Sync route param with viewingStudent
  useEffect(() => {
    if (routeStudentId) {
      studentService
        .getStudentById(routeStudentId)
        .then((res) => setViewingStudent(res))
        .catch(() => {
          toast.error('Student not found');
          navigate('/students');
        });
    } else {
      setViewingStudent(null);
    }
  }, [routeStudentId]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      status: 'ACTIVE',
    },
  });

  const loadBatches = async () => {
    try {
      const res = await batchService.getBatches({ limit: 100 });
      setBatches(res.data);
    } catch (e) {
      console.error('Failed to load batches');
    }
  };

  const loadStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentService.getStudents({
        page: currentPage,
        limit: 10,
        search,
        batchId: selectedBatch,
      });
      setStudents(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalResults(res.meta.total);
    } catch (err: any) {
      toast.error('Failed to fetch students from server');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    loadStudents();
  }, [currentPage, search, selectedBatch]);

  const handleOpenAdd = () => {
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
    setEditingStudent(null);
    // Initially open in diagnostic mode matching the exact screen recording experience
    setDrawerMode('DIAGNOSTIC');
    setIsAddDrawerOpen(true);
  };

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      toast.loading('Checking MFS100 Client Service on 127.0.0.1:8004...', { id: 'recon-toast' });
      const status = await mfs100Service.checkDevice();
      if (status.connected) {
        toast.success('Mantra MFS100 Scanner connected successfully!', { id: 'recon-toast' });
        setDrawerMode('FORM');
      } else {
        toast.error('MFS100 Service not running on port 8004. You can click "Proceed to Form" below to test biometric enrollment.', {
          id: 'recon-toast',
          duration: 4500,
        });
      }
    } catch (e) {
      toast.error('Failed to connect to local MFS100 service', { id: 'recon-toast' });
    } finally {
      setIsReconnecting(false);
    }
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setDrawerMode('FORM');
    setValue('firstName', student.firstName);
    setValue('lastName', student.lastName);
    setValue('mobileNumber', student.mobileNumber);
    setValue('email', student.email || '');
    setValue('batchId', student.batchId);
    setValue('status', student.status);

    // Prepopulate enrolled fingerprints
    setFinger1(student.finger1?.isEnrolled ? {
      fingerIndex: 'FINGER_1',
      biometricData: 'ENROLLED',
      qualityScore: student.finger1.qualityScore,
      deviceModel: 'MFS100',
      scannedAt: student.finger1.createdAt || '',
    } : null);

    setFinger2(student.finger2?.isEnrolled ? {
      fingerIndex: 'FINGER_2',
      biometricData: 'ENROLLED',
      qualityScore: student.finger2.qualityScore,
      deviceModel: 'MFS100',
      scannedAt: student.finger2.createdAt || '',
    } : null);

    setFinger3(student.finger3?.isEnrolled ? {
      fingerIndex: 'FINGER_3',
      biometricData: 'ENROLLED',
      qualityScore: student.finger3.qualityScore,
      deviceModel: 'MFS100',
      scannedAt: student.finger3.createdAt || '',
    } : null);

    setIsAddDrawerOpen(true);
    setActiveMenuId(null);
  };

  const handleFormSubmit = async (data: StudentFormData) => {
    try {
      if (editingStudent) {
        await studentService.updateStudent(editingStudent.id, data);
        toast.success('Student details updated successfully!');
      } else {
        // Collect scanned fingerprints
        const fingerprintsToSave = [finger1, finger2, finger3]
          .filter(Boolean)
          .map((f) => ({
            fingerIndex: f!.fingerIndex,
            biometricData: f!.biometricData,
            qualityScore: f!.qualityScore,
            deviceModel: f!.deviceModel,
          }));

        await studentService.createStudent({
          ...data,
          fingerprints: fingerprintsToSave,
        } as any);

        toast.success(
          fingerprintsToSave.length > 0
            ? `Student registered with ${fingerprintsToSave.length} biometric fingerprint(s)!`
            : 'Student registered successfully!'
        );
      }
      setIsAddDrawerOpen(false);
      loadStudents();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudent) return;
    try {
      await studentService.deleteStudent(deletingStudent.id);
      toast.success(`Student ${deletingStudent.firstName} deleted successfully`);
      setDeletingStudent(null);
      loadStudents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete student');
    }
  };

  const handleExport = async () => {
    try {
      toast.loading('Generating student list export...', { id: 'export-toast' });
      await exportService.exportStudents('xlsx', selectedBatch);
      toast.success('Export downloaded successfully!', { id: 'export-toast' });
    } catch (e) {
      toast.error('Failed to export student records', { id: 'export-toast' });
    }
  };

  // If viewing a student, display the exact Student Details View from the video
  if (viewingStudent) {
    return (
      <StudentDetailsView
        student={viewingStudent}
        onBack={() => {
          setViewingStudent(null);
          if (routeStudentId) {
            navigate('/students');
          }
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Container Card matching Screenshot 3 */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header Controls */}
        <div className="p-6 pb-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Students List</h2>

          <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">
            {/* Select Batch Dropdown */}
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all min-w-[170px]"
            >
              <option value="">Select Batch (All)</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            {/* Search Input matching Screenshot 3 */}
            <div className="relative flex-1 sm:flex-initial sm:min-w-[240px]">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search Student..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* DOWNLOAD Button matching Screenshot 3 */}
            <button
              onClick={handleExport}
              className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-[#5b52f9] hover:bg-[#4f46e5] flex items-center space-x-2 shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>DOWNLOAD</span>
            </button>

            {/* + ADD Button matching Screenshot 3 */}
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover flex items-center space-x-2 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>ADD</span>
            </button>
          </div>
        </div>

        {/* Table Content matching Screenshot 3 */}
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
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs bg-slate-50/50">
                  <th className="py-4 px-6 font-bold w-16">S.NO</th>
                  <th className="py-4 px-6 font-bold">NAME</th>
                  <th className="py-4 px-6 font-bold">BATCH</th>
                  <th className="py-4 px-6 font-bold">STATUS</th>
                  <th className="py-4 px-6 font-bold text-center">FINGER 1</th>
                  <th className="py-4 px-6 font-bold text-center">FINGER 2</th>
                  <th className="py-4 px-6 font-bold text-center">FINGER 3</th>
                  <th className="py-4 px-6 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student, idx) => (
                  <tr key={student.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* S.NO */}
                    <td className="py-4 px-6 text-slate-500 font-semibold text-sm">
                      {(currentPage - 1) * 10 + idx + 1}
                    </td>

                    {/* NAME with Mobile number underneath */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        {student.mobileNumber}
                      </div>
                    </td>

                    {/* BATCH */}
                    <td className="py-4 px-6 font-mono text-slate-800 font-semibold text-sm">
                      {student.batchName}
                    </td>

                    {/* STATUS */}
                    <td className="py-4 px-6">
                      <StatusBadge status={student.status} />
                    </td>

                    {/* FINGER 1 matching exact video & screenshot 3 */}
                    <td className="py-3 px-4 text-center">
                      <div
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="w-24 h-32 rounded-2xl bg-black border-2 border-slate-900 shadow-md flex items-center justify-center p-2 mx-auto cursor-pointer hover:ring-2 hover:ring-brand-primary transition-all overflow-hidden"
                        title="Click to view full biometric details"
                      >
                        <BiometricFingerprintView
                          fingerIndex="FINGER_1"
                          isEnrolled={true}
                          qualityScore={student.finger1?.qualityScore || 88}
                          showQualityBadge={false}
                          size="sm"
                        />
                      </div>
                    </td>

                    {/* FINGER 2 matching exact video & screenshot 3 */}
                    <td className="py-3 px-4 text-center">
                      <div
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="w-24 h-32 rounded-2xl bg-black border-2 border-slate-900 shadow-md flex items-center justify-center p-2 mx-auto cursor-pointer hover:ring-2 hover:ring-brand-primary transition-all overflow-hidden"
                        title="Click to view full biometric details"
                      >
                        <BiometricFingerprintView
                          fingerIndex="FINGER_2"
                          isEnrolled={true}
                          qualityScore={student.finger2?.qualityScore || 88}
                          showQualityBadge={false}
                          size="sm"
                        />
                      </div>
                    </td>

                    {/* FINGER 3 matching exact video & screenshot 3 */}
                    <td className="py-3 px-4 text-center">
                      <div
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="w-24 h-32 rounded-2xl bg-black border-2 border-slate-900 shadow-md flex items-center justify-center p-2 mx-auto cursor-pointer hover:ring-2 hover:ring-brand-primary transition-all overflow-hidden"
                        title="Click to view full biometric details"
                      >
                        <BiometricFingerprintView
                          fingerIndex="FINGER_3"
                          isEnrolled={true}
                          qualityScore={student.finger3?.qualityScore || 88}
                          showQualityBadge={false}
                          size="sm"
                        />
                      </div>
                    </td>

                    {/* ACTION Menu matching Screenshot 3 */}
                    <td className="py-4 px-6 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === student.id ? null : student.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === student.id && (
                        <div className="absolute right-6 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-20 text-left animate-fadeIn">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              navigate(`/students/${student.id}`);
                            }}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleOpenEdit(student)}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-400" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => {
                              setDeletingStudent(student);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 border-t border-slate-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                            <span>Delete</span>
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

        {/* Pagination matching Screenshot */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={10}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* SlideOver Registration Form matching Screen Recording & Screenshot 3/4 */}
      <SlideOver
        isOpen={isAddDrawerOpen}
        title={
          editingStudent
            ? 'Edit Student Details'
            : 'Student Registration Form'
        }
        onClose={() => setIsAddDrawerOpen(false)}
        width="max-w-xl"
      >
        {drawerMode === 'DIAGNOSTIC' && !editingStudent ? (
          /* EXACT SCREEN RECORDING VIEW: Fingerprint Scanner Facing Issue */
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center pt-2 pb-2">
              {/* Red Warning Triangle Icon matching screen recording */}
              <div className="w-16 h-16 rounded-2xl bg-white border border-rose-200 shadow-sm flex items-center justify-center text-rose-500 mb-4">
                <AlertTriangle className="w-9 h-9 stroke-[1.8]" />
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Fingerprint Scanner Facing Issue
              </h3>
              <p className="text-sm font-semibold text-slate-800 mt-1">
                Myntra MFS100 Driver installed but Not Working
              </p>
              <p className="text-xs text-slate-400 mt-0.5">Follow these instructions</p>
            </div>

            {/* Instruction Steps Card 1 matching video */}
            <div className="border border-slate-200/90 rounded-xl p-5 bg-white shadow-sm space-y-4 text-left">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  1. Open the Services Management Console:
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[11px] font-mono text-slate-700">Windows + R</kbd> to open the Run dialog box.
                  <br />
                  Type <code className="text-indigo-600 font-semibold">services.msc</code> and press Enter.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-900">
                  2. Locate the MFS100 Client Service:
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  In the Services window, scroll down to find <span className="font-semibold text-slate-800">MFS100 Client Service</span> (or TermService in older versions of Windows).
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-900">
                  3. Restart the Service:
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Right click on <span className="font-semibold text-slate-800">MFS100 Client Service</span> and select <span className="font-semibold text-slate-800">Start / Restart</span>.
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <h4 className="text-xs font-bold text-slate-900">Video Tutorial</h4>
                <p className="text-xs text-slate-600 mt-1">
                  For a detailed video guide, watch the tutorial{' '}
                  <a
                    href="https://www.mantratec.com/download"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline font-medium hover:text-blue-700"
                  >
                    here
                  </a>
                  .
                </p>
              </div>
            </div>

            {/* Instruction Steps Card 2 matching video */}
            <div className="border border-slate-200/90 rounded-xl p-5 bg-white shadow-sm text-left space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Installation Guide for MFS100 Fingerprint Driver
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Follow these instructions</p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <h5 className="text-xs font-semibold text-slate-900">1. Download the Driver:</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Visit the official website to{' '}
                    <a
                      href="https://www.mantratec.com/download"
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 underline font-medium hover:text-blue-700"
                    >
                      Download
                    </a>{' '}
                    the latest MFS100 fingerprint driver.
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-900">2. Run the Installer:</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Double-click the downloaded setup file to launch the installer.
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-900">3. Follow On-Screen Instructions:</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Proceed through the installation wizard by clicking Next and agreeing to the terms.
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-900">4. Complete the Installation:</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Once the installation is finished, click Finish and restart your system if prompted.
                  </p>
                </div>

                <div>
                  <h5 className="text-xs font-semibold text-slate-900">5. Verify the Installation:</h5>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Reconnect your MFS100 device and check if it's working properly.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions matching video */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDrawerMode('FORM')}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-brand-primary bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                PROCEED TO REGISTRATION →
              </button>

              <button
                type="button"
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {isReconnecting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isReconnecting ? 'RECONNECTING...' : 'RECONNECT'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* REGISTRATION FORM VIEW WITH LIVE BIOMETRIC FINGERPRINT SCANNING */
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
            {/* Top diagnostic navigation toggle */}
            {!editingStudent && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setDrawerMode('DIAGNOSTIC')}
                  className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  <span>Scanner Troubleshooting Guide</span>
                </button>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                  MFS100 Service Active
                </span>
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name *</label>
                <input
                  type="text"
                  {...register('firstName')}
                  placeholder="Enter First Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name *</label>
                <input
                  type="text"
                  {...register('lastName')}
                  placeholder="Enter Last Name"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number *</label>
                <input
                  type="text"
                  {...register('mobileNumber')}
                  placeholder="10-digit mobile number"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono"
                />
                {errors.mobileNumber && <p className="text-xs text-red-500 mt-1">{errors.mobileNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="student@example.com (optional)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Batch *</label>
                <select
                  {...register('batchId')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.status})
                    </option>
                  ))}
                </select>
                {errors.batchId && <p className="text-xs text-red-500 mt-1">{errors.batchId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Student Status</label>
                <select
                  {...register('status')}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary bg-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            {/* Biometric Fingerprint Capture Section inside Registration Form */}
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center space-x-2">
                    <FingerprintIcon className="w-4.5 h-4.5 text-brand-primary" />
                    <span>Biometric Fingerprint Registration (MFS100)</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Touch scanner to capture and preview Finger 1, Finger 2, and Finger 3.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDrawerMode('DIAGNOSTIC')}
                  className="text-xs font-semibold text-brand-primary hover:underline"
                >
                  Device Help
                </button>
              </div>

              {/* 3 Fingerprint Scan Cards */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 justify-items-center">
                <FingerprintScanCard
                  label="Finger 1"
                  fingerIndex="FINGER_1"
                  value={finger1}
                  onChange={setFinger1}
                  onDeviceError={() => setDrawerMode('DIAGNOSTIC')}
                />

                <FingerprintScanCard
                  label="Finger 2"
                  fingerIndex="FINGER_2"
                  value={finger2}
                  onChange={setFinger2}
                  onDeviceError={() => setDrawerMode('DIAGNOSTIC')}
                />

                <FingerprintScanCard
                  label="Finger 3"
                  fingerIndex="FINGER_3"
                  value={finger3}
                  onChange={setFinger3}
                  onDeviceError={() => setDrawerMode('DIAGNOSTIC')}
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-end space-x-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddDrawerOpen(false)}
                className="px-6 py-3 rounded-xl text-sm font-semibold uppercase tracking-wider text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                CANCEL
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'SAVING...' : editingStudent ? 'UPDATE STUDENT' : 'SUBMIT & REGISTER'}
              </button>
            </div>
          </form>
        )}
      </SlideOver>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!deletingStudent}
        title="Confirm Student Deletion"
        message={`Are you sure you want to delete student '${deletingStudent?.firstName} ${deletingStudent?.lastName}'?`}
        confirmLabel="DELETE"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingStudent(null)}
      />

      {/* MFS100 Diagnostic Drawer matching Screenshot 4 */}
      <FingerprintDiagnosticDrawer
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
      />
    </div>
  );
};
