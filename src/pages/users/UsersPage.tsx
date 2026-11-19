import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  Calendar,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { userService } from '../../services/user.service';
import { User, RoleType } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Pagination } from '../../components/common/Pagination';
import { SlideOver } from '../../components/common/SlideOver';
import { ConfirmationModal } from '../../components/common/ConfirmationModal';
import { TableLoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { EmptyState } from '../../components/common/EmptyState';
import { useAuth } from '../../context/AuthContext';

const createUserSchema = z
  .object({
    firstName: z.string().min(1, 'First Name is required').max(100),
    lastName: z.string().min(1, 'Last Name is required').max(100),
    email: z.string().email('Invalid email address'),
    mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm password'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER']),
    status: z.enum(['ACTIVE', 'INACTIVE']),
    validUntilPreset: z.string().optional(),
    customValidUntil: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

const editUserSchema = z.object({
  firstName: z.string().min(1, 'First Name is required').max(100),
  lastName: z.string().min(1, 'Last Name is required').max(100),
  email: z.string().email('Invalid email address'),
  mobileNumber: z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'VIEWER']),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  validUntilPreset: z.string().optional(),
  customValidUntil: z.string().optional(),
});

export const UsersPage: React.FC = () => {
  const { user: currentUser, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResults, setTotalResults] = useState<number>(0);

  // Drawers & Modals
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Validity Preset selection state
  const [validityType, setValidityType] = useState<string>('PERMANENT');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<any>({
    resolver: zodResolver(editingUser ? editUserSchema : createUserSchema),
    defaultValues: {
      status: 'ACTIVE',
      role: 'ADMIN',
      validUntilPreset: 'PERMANENT',
      customValidUntil: '',
    },
  });

  const selectedPreset = watch('validUntilPreset', 'PERMANENT');

  // Verify Admin credentials access
  const isAuthorizedAdmin = hasRole('SUPER_ADMIN', 'ADMIN');

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await userService.getUsers({
        page: currentPage,
        limit: 10,
        search,
        role: roleFilter,
        status: statusFilter,
      });
      setUsers(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalResults(res.meta.total);
    } catch (err: any) {
      toast.error('Failed to load users from database');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorizedAdmin) {
      loadUsers();
    }
  }, [currentPage, search, roleFilter, statusFilter, isAuthorizedAdmin]);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setValidityType('PERMANENT');
    reset({
      firstName: '',
      lastName: '',
      email: '',
      mobileNumber: '',
      password: '',
      confirmPassword: '',
      role: 'ADMIN',
      status: 'ACTIVE',
      validUntilPreset: 'PERMANENT',
      customValidUntil: '',
    });
    setIsAddDrawerOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setValue('firstName', user.firstName);
    setValue('lastName', user.lastName);
    setValue('email', user.email);
    setValue('mobileNumber', user.mobileNumber);
    setValue('role', user.role.name);
    setValue('status', user.status);

    if (user.validUntil) {
      const dateStr = new Date(user.validUntil).toISOString().split('T')[0];
      setValidityType('CUSTOM');
      setValue('validUntilPreset', 'CUSTOM');
      setValue('customValidUntil', dateStr);
    } else {
      setValidityType('PERMANENT');
      setValue('validUntilPreset', 'PERMANENT');
      setValue('customValidUntil', '');
    }

    setIsAddDrawerOpen(true);
  };

  const computeValidityDate = (preset: string, customDate?: string): string | null => {
    if (preset === 'PERMANENT') return null;
    const now = new Date();
    if (preset === '7_DAYS') {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === '30_DAYS') {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === '90_DAYS') {
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === '1_YEAR') {
      return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (preset === 'CUSTOM' && customDate) {
      // End of day
      const d = new Date(customDate);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    }
    return null;
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const computedValidUntil = computeValidityDate(data.validUntilPreset, data.customValidUntil);

      const payload: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        mobileNumber: data.mobileNumber,
        role: data.role,
        status: data.status,
        validUntil: computedValidUntil,
      };

      if (!editingUser) {
        payload.password = data.password;
        payload.confirmPassword = data.confirmPassword;
        await userService.createUser(payload);
        toast.success(`User '${data.firstName} ${data.lastName}' created successfully!`);
      } else {
        await userService.updateUser(editingUser.id, payload);
        toast.success(`User '${data.firstName} ${data.lastName}' updated successfully!`);
      }

      setIsAddDrawerOpen(false);
      loadUsers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    }
  };

  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await userService.updateStatus(user.id, newStatus);
      toast.success(
        newStatus === 'ACTIVE'
          ? `User '${user.firstName}' is now ACTIVE!`
          : `User '${user.firstName}' has been DEACTIVATED!`
      );
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update user status');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;
    try {
      await userService.deleteUser(deletingUser.id);
      toast.success(`User '${deletingUser.firstName} ${deletingUser.lastName}' deleted successfully!`);
      setDeletingUser(null);
      loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getInitials = (first?: string, last?: string) => {
    return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
  };

  // Access Control Guard
  if (!isAuthorizedAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-12 text-center shadow-sm max-w-2xl mx-auto mt-8">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-4">
          <Shield className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Only administrator credentials (<strong>SUPER_ADMIN</strong> and <strong>ADMIN</strong>) have permission to add, update, and delete administrative user accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Table Card Container */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Header Controls */}
        <div className="p-6 pb-5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">User Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Admin control center: Add, update, delete accounts & manage validity duration
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3.5 w-full lg:w-auto">
            {/* Filter by Role */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="OPERATOR">Operator</option>
              <option value="VIEWER">Viewer</option>
            </select>

            {/* Filter by Status */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search user name, email, mobile..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
              <Search className="w-4.5 h-4.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* + ADD USER Button (Admin Credentials) */}
            <button
              onClick={handleOpenAdd}
              className="px-5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover flex items-center space-x-2 shadow-sm transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>ADD USER</span>
            </button>
          </div>
        </div>

        {/* User Table */}
        {isLoading ? (
          <TableLoadingSkeleton rows={5} cols={7} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="No user accounts match the current filter criteria."
            actionText="+ ADD USER"
            onAction={handleOpenAdd}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase tracking-wider text-xs bg-slate-50/50">
                  <th className="py-4 px-6 font-bold w-16">S.NO</th>
                  <th className="py-4 px-6 font-bold">USER NAME</th>
                  <th className="py-4 px-6 font-bold">EMAIL</th>
                  <th className="py-4 px-6 font-bold">MOBILE</th>
                  <th className="py-4 px-6 font-bold">ROLE</th>
                  <th className="py-4 px-6 font-bold">STATUS</th>
                  <th className="py-4 px-6 font-bold">ACTIVE UNTIL (VALIDITY)</th>
                  <th className="py-4 px-6 font-bold text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u, idx) => {
                  const isExpired = u.validUntil && new Date(u.validUntil) < new Date();
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* S.NO */}
                      <td className="py-4 px-6 text-slate-500 font-semibold text-sm">
                        {(currentPage - 1) * 10 + idx + 1}
                      </td>

                      {/* USER NAME with Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-[#8a2522] text-white flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                            {getInitials(u.firstName, u.lastName)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">
                              {u.firstName} {u.lastName}
                            </div>
                            {currentUser?.id === u.id && (
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="py-4 px-6 text-slate-700 font-mono text-sm">
                        {u.email}
                      </td>

                      {/* MOBILE NUMBER */}
                      <td className="py-4 px-6 text-slate-700 font-mono text-sm">
                        {u.mobileNumber}
                      </td>

                      {/* ROLE BADGE */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {u.role.name}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-6">
                        <StatusBadge status={u.status} />
                      </td>

                      {/* ACTIVE UNTIL (VALIDITY) */}
                      <td className="py-4 px-6">
                        {u.validUntil ? (
                          <div>
                            <div
                              className={`text-xs font-bold font-mono ${
                                isExpired ? 'text-rose-600' : 'text-slate-800'
                              }`}
                            >
                              {new Date(u.validUntil).toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            {isExpired ? (
                              <span className="inline-flex items-center space-x-1 mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Expired</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                {Math.max(
                                  0,
                                  Math.ceil(
                                    (new Date(u.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                                  )
                                )}{' '}
                                days left
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                            Permanent
                          </span>
                        )}
                      </td>

                      {/* ACTION BUTTONS (Direct Update, Activate/Deactivate, Delete) */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* UPDATE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(u)}
                            title="Update user details and validity"
                            className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 shadow-sm flex items-center space-x-1.5 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>

                          {/* STATUS TOGGLE BUTTON */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'ACTIVE' ? 'Deactivate user account' : 'Activate user account'}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm flex items-center space-x-1.5 transition-all ${
                              u.status === 'ACTIVE'
                                ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80'
                            }`}
                          >
                            {u.status === 'ACTIVE' ? (
                              <>
                                <UserX className="w-3.5 h-3.5" />
                                <span>Deactivate</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Activate</span>
                              </>
                            )}
                          </button>

                          {/* DELETE BUTTON */}
                          {currentUser?.id !== u.id && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              title="Delete user"
                              className="px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 shadow-sm flex items-center space-x-1.5 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={totalResults}
          pageSize={10}
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>

      {/* SlideOver Form (Create / Update User with Validity Period) */}
      <SlideOver
        isOpen={isAddDrawerOpen}
        title={editingUser ? 'Update User Account' : 'Create New User Account'}
        onClose={() => setIsAddDrawerOpen(false)}
        width="max-w-xl"
      >
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name *</label>
              <input
                type="text"
                {...register('firstName')}
                placeholder="Enter First Name"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{String(errors.firstName.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name *</label>
              <input
                type="text"
                {...register('lastName')}
                placeholder="Enter Last Name"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{String(errors.lastName.message || '')}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                {...register('email')}
                placeholder="user@example.com"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{String(errors.email.message || '')}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile Number *</label>
              <input
                type="text"
                {...register('mobileNumber')}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono"
              />
              {errors.mobileNumber && (
                <p className="text-xs text-red-500 mt-1">{String(errors.mobileNumber.message || '')}</p>
              )}
            </div>
          </div>

          {!editingUser && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password *</label>
                <input
                  type="password"
                  {...register('password')}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                {errors.password && (
                  <p className="text-xs text-red-500 mt-1">{String(errors.password.message || '')}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password *</label>
                <input
                  type="password"
                  {...register('confirmPassword')}
                  placeholder="Confirm password"
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 mt-1">{String(errors.confirmPassword.message || '')}</p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Assigned Role *</label>
              <select
                {...register('role')}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
              >
                <option value="SUPER_ADMIN">SUPER_ADMIN (Full System Access)</option>
                <option value="ADMIN">ADMIN (Manager)</option>
                <option value="OPERATOR">OPERATOR (Registration & Biometrics)</option>
                <option value="VIEWER">VIEWER (Read-Only)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Account Status</label>
              <select
                {...register('status')}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 bg-white"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* ACTIVE VALIDITY DURATION / EXPIRATION SETTING */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-sm font-bold text-slate-900 mb-1.5 flex items-center space-x-1.5">
              <Clock className="w-4.5 h-4.5 text-brand-primary" />
              <span>Active User Validity (Account Expiry Duration)</span>
            </label>
            <p className="text-xs text-slate-500 mb-3">
              Configure how long this user will remain active before automatic expiry.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
              {[
                { id: 'PERMANENT', label: 'Permanent' },
                { id: '7_DAYS', label: '7 Days' },
                { id: '30_DAYS', label: '30 Days' },
                { id: '90_DAYS', label: '90 Days' },
                { id: '1_YEAR', label: '1 Year' },
                { id: 'CUSTOM', label: 'Custom Date' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setValidityType(opt.id);
                    setValue('validUntilPreset', opt.id);
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                    selectedPreset === opt.id
                      ? 'border-brand-primary bg-indigo-50/70 text-brand-primary shadow-xs'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {selectedPreset === 'CUSTOM' && (
              <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 animate-fadeIn">
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-brand-primary" />
                  <span>Select Expiry Date:</span>
                </label>
                <input
                  type="date"
                  {...register('customValidUntil')}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>
            )}
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
              {isSubmitting ? 'SAVING...' : editingUser ? 'UPDATE USER' : 'CREATE USER'}
            </button>
          </div>
        </form>
      </SlideOver>

      {/* Delete User Modal */}
      <ConfirmationModal
        isOpen={!!deletingUser}
        title="Confirm User Deletion"
        message={`Are you sure you want to delete user '${deletingUser?.firstName} ${deletingUser?.lastName}'? Their access will be revoked immediately.`}
        confirmLabel="DELETE"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
};
