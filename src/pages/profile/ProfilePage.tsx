import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../services/profile.service';

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
  });

  const getInitials = (first?: string, last?: string) => {
    return `${(first?.[0] || 'A').toUpperCase()}${(last?.[0] || 'K').toUpperCase()}D`;
  };

  const onSubmitPassword = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    try {
      await profileService.changePassword(data);
      toast.success('Password changed successfully! Please keep it secure.');
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const userRole = typeof user?.role === 'string' ? user.role : user?.role?.name || 'USER';

  return (
    <div className="space-y-6">
      {/* 2-column layout matching Screenshot 7 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Account Details Card matching Screenshot 7 */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Account Details</h2>

          {/* Profile Header (Avatar + Name + Role) */}
          <div className="flex items-center space-x-5 mb-8">
            <div className="w-18 h-18 rounded-full bg-[#8a2522] text-white flex items-center justify-center font-bold text-xl shadow-sm flex-shrink-0 p-4">
              {getInitials(user?.firstName, user?.lastName)}
            </div>

            <div>
              <h3 className="text-2xl font-bold text-slate-900">
                {user ? `${user.firstName} ${user.lastName}` : 'Amit koninoom Date.10/05/26'}
              </h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                {userRole}
              </p>
            </div>
          </div>

          {/* Details Fields matching Screenshot 7 */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">First Name</label>
                <div className="px-4 py-3.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-200/60">
                  {user?.firstName || 'Amit koninoom'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Last Name</label>
                <div className="px-4 py-3.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-200/60">
                  {user?.lastName || 'Date.10/05/26'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email address</label>
                <div className="px-4 py-3.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-200/60 font-mono">
                  {user?.email || 'kohinoormishra9415@gmail.com'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mobile</label>
                <div className="px-4 py-3.5 rounded-xl bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-200/60 font-mono">
                  {user?.mobileNumber || '9415977854'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Change Password Card matching Screenshot 7 */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-8">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Change Password</h2>

          <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  {...register('currentPassword')}
                  placeholder="Enter current password"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showCurrentPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>
              )}
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  {...register('newPassword')}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showNewPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3.5 rounded-xl border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Purple Submit Button matching Screenshot 7 */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-5 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    <span>UPDATING...</span>
                  </>
                ) : (
                  <span>CHANGE PASSWORD</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
