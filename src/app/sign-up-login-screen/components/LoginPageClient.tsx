'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, AlertCircle, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { toast } from 'sonner';

interface LoginFormValues {
  username: string;
  password: string;
  remember: boolean;
}

export default function LoginPageClient() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const router = useRouter();

  const { login, isAuthenticated } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
      remember: false,
    },
  });

  // If already authenticated, redirect to root dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = handleSubmit(async (data) => {
    setIsLoading(true);
    setAuthError('');
    try {
      const authed = await login(data.username, data.password);
      toast.success(`Welcome back, ${authed.name}`, {
        description: `Signed in as ${authed.roleTitle} (${authed.roleLevel})`,
      });
      router.push('/');
    } catch (err: any) {
      const msg = err?.message || 'Invalid username or password. Please try again.';
      setAuthError(msg);
      toast.error('Authentication Failed', { description: msg });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div
      className="h-screen overflow-hidden flex items-center justify-center p-4 select-none"
      style={{ background: 'var(--background)' }}
    >
      <div style={{ width: '100%', maxWidth: 440 }}>
        {/* Login Card */}
        <div
          className="rounded-2xl border border-border shadow-2xl transition-all"
          style={{ background: 'var(--card)', padding: '34px 34px 28px' }}
        >
          {/* Logo + Title */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/assets/images/samko_logo.png?v=3"
              alt="SAMKO Logo"
              style={{
                width: 82,
                height: 82,
                objectFit: 'contain',
                filter: 'drop-shadow(0 6px 20px rgba(255,140,0,0.35))',
                marginBottom: 12,
              }}
            />
            <div>
              <h1
                className="font-sans text-foreground font-bold text-center text-2xl tracking-normal antialiased"
                style={{
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                }}
              >
                Admin Login
              </h1>
            </div>
            <p className="text-muted-foreground text-xs mt-1.5 text-center max-w-xs font-medium">
              Operations & Compliance Command Centre
            </p>
          </div>

          {/* Error banner */}
          {authError && (
            <div
              className="mb-4 rounded-xl flex items-center gap-2.5 p-3 animate-shake"
              style={{
                background: 'rgba(244,63,94,0.12)',
                border: '1px solid rgba(244,63,94,0.3)',
                color: 'var(--critical)',
                fontSize: 12,
              }}
            >
              <AlertCircle size={15} className="flex-shrink-0" />
              <span className="font-medium">{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username or email"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  {...register('username', { required: 'Please enter your username or email' })}
                />
              </div>
              {errors.username && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-border text-sm outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary font-medium"
                  style={{ background: 'var(--surface2)', color: 'var(--foreground)' }}
                  {...register('password', { required: 'Please enter your password' })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember me & forgot password */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
                <input
                  type="checkbox"
                  className="rounded accent-primary cursor-pointer w-3.5 h-3.5"
                  {...register('remember')}
                />
                <span>Remember me</span>
              </label>
              <span className="text-[11px] text-muted-foreground italic">Samko SSO Protected</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-[0.99] uppercase tracking-wider mt-2"
              style={{
                background: 'var(--primary)',
                color: '#000',
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
              <span>{isLoading ? 'Verifying...' : 'LOGIN'}</span>
            </button>
          </form>

          {/* Security footnote */}
          <div className="mt-5 pt-3.5 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-400" /> 256-bit SSL Encrypted
            </span>
            <span>SamkoCentral UK v2.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}