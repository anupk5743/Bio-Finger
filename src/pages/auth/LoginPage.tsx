import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Fingerprint, Eye, EyeOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const loginSchema = z.object({
  username: z.string().min(1, 'Please enter your email or mobile number'),
  password: z.string().min(1, 'Please enter your password'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: 'admin@biofinger.local',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      toast.success('Welcome back to Bio Finger!');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Invalid credentials or server unreachable';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 sm:p-12 max-w-md w-full shadow-card border border-slate-200/70">
        {/* Shield Logo matching Screenshot 1 */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-18 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-md p-3">
            <Fingerprint className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        {/* Header Text matching Screenshot 1 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome to Bio Finger
          </h1>
          <p className="text-sm text-slate-500 mt-2 font-medium">
            Please sign-in to your account and start the adventure
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email or Mobile Number */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email or Mobile Number
            </label>
            <input
              type="text"
              {...register('username')}
              placeholder="Enter your email or mobile"
              className={`w-full px-4 py-3.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all ${
                errors.username ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-brand-primary'
              }`}
            />
            {errors.username && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.username.message}</p>
            )}
          </div>

          {/* Password with Eye Toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="Enter password"
                className={`w-full px-4 py-3.5 rounded-xl border text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 transition-all pr-12 ${
                  errors.password ? 'border-red-400 bg-red-50/20' : 'border-slate-300 focus:border-brand-primary'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-500 mt-1 font-medium">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button matching Screenshot 1 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-brand-primary-hover shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>LOGIN</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Bio Finger Biometric Security System • v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};
