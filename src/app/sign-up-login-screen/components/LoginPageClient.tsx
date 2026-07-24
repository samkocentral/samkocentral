'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ShieldCheck, Building2, FileText, ClipboardList, Copy, CheckCheck, AlertCircle, Loader2 } from 'lucide-react';
import { MOCK_USERS } from '@/lib/mockData';
import AppLogo from '@/components/ui/AppLogo';
import { toast } from 'sonner';

type FormMode = 'login' | 'signup';

interface LoginFormValues {
  email: string;
  password: string;
  remember: boolean;
}

interface SignupFormValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  agreeTerms: boolean;
}

export default function LoginPageClient() {
  const [mode, setMode] = useState<FormMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [copiedField, setCopiedField] = useState<string>('');
  const router = useRouter();

  const loginForm = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '', remember: false },
  });

  const signupForm = useForm<SignupFormValues>({
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', role: 'Site Manager', agreeTerms: false },
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    });
  };

  const handleCredentialClick = (user: typeof MOCK_USERS[0]) => {
    loginForm.setValue('email', user.email);
    loginForm.setValue('password', user.password);
    setAuthError('');
  };

  // Backend integration point: replace with real auth API call
  const handleLogin = loginForm.handleSubmit(async (data) => {
    setIsLoading(true);
    setAuthError('');
    await new Promise((r) => setTimeout(r, 1200));
    const matched = MOCK_USERS.find(
      (u) => u.email === data.email && u.password === data.password
    );
    if (matched) {
      toast.success(`Welcome back, ${matched.name.split(' ')[0]}`, {
        description: `Signed in as ${matched.role}`,
      });
      router.push('/');
    } else {
      setAuthError('Invalid credentials — use the demo accounts below to sign in');
    }
    setIsLoading(false);
  });

  // Backend integration point: replace with real registration API call
  const handleSignup = signupForm.handleSubmit(async (data) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success('Account created — awaiting admin approval');
    setMode('login');
    setIsLoading(false);
  });

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left brand panel */}
      <div
        className="hidden lg:flex flex-col justify-between"
        style={{
          width: 460,
          minWidth: 460,
          background: 'var(--card)',
          borderRight: '1px solid var(--border)',
          padding: '48px 44px',
        }}
      >
        <div>
          <div className="flex items-center gap-3 mb-12">
            <AppLogo size={36} />
            <div>
              <div
                className="font-head text-primary"
                style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}
              >
                SamkoCentral
              </div>
              <div
                className="text-muted-foreground"
                style={{ fontSize: 9, letterSpacing: '1.6px', textTransform: 'uppercase' }}
              >
                Operations · Compliance · Governance
              </div>
            </div>
          </div>

          <h2
            className="font-head text-foreground"
            style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }}
          >
            One platform.
            <br />
            <span className="text-gold">All your compliance.</span>
          </h2>
          <p className="text-muted-foreground" style={{ fontSize: 14, lineHeight: 1.65, marginBottom: 40 }}>
            Manage documents, certifications, vendor contracts, and operational tasks across every site — before they become a liability.
          </p>

          <div className="flex flex-col gap-4">
            {[
              { icon: <ShieldCheck size={16} />, title: 'Traffic-light compliance tracking', desc: 'Instant visibility on overdue and expiring obligations' },
              { icon: <FileText size={16} />, title: 'Centralised document repository', desc: 'Expiry countdowns, version control, and one-click upload' },
              { icon: <Building2 size={16} />, title: 'Multi-site operations overview', desc: 'Compliance rings and risk ratings across all properties' },
              { icon: <ClipboardList size={16} />, title: 'Priority task management', desc: 'Urgent to low — assigned, tracked, and date-stamped' },
            ].map((f, i) => (
              <div key={`feature-${i}`} className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-lg flex-shrink-0 mt-0.5"
                  style={{
                    width: 32,
                    height: 32,
                    background: 'rgba(232,201,122,0.10)',
                    color: 'var(--primary)',
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <div className="text-foreground font-medium" style={{ fontSize: 13 }}>
                    {f.title}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: 12, marginTop: 1 }}>
                    {f.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div
            className="rounded-xl"
            style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border)',
              padding: '14px 16px',
            }}
          >
            <div className="text-muted-foreground" style={{ fontSize: 11, marginBottom: 6 }}>
              Currently monitoring
            </div>
            <div className="flex gap-6">
              {[
                { val: '6', label: 'Sites' },
                { val: '14', label: 'Documents' },
                { val: '10', label: 'Obligations' },
                { val: '8', label: 'Tasks' },
              ].map((s) => (
                <div key={`stat-${s.label}`}>
                  <div
                    className="font-head text-primary tabular-nums"
                    style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}
                  >
                    {s.val}
                  </div>
                  <div className="text-muted-foreground" style={{ fontSize: 11 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <AppLogo size={32} />
            <span className="font-head text-primary" style={{ fontSize: 16, fontWeight: 800 }}>
              SamkoCentral
            </span>
          </div>

          <div className="mb-8">
            <h1
              className="font-head text-foreground"
              style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}
            >
              {mode === 'login' ? 'Sign in to your account' : 'Create an account'}
            </h1>
            <p className="text-muted-foreground" style={{ fontSize: 13 }}>
              {mode === 'login' ?'Enter your credentials to access the operations dashboard' :'Request access to SamkoCentral — a Group Admin will approve your account'}
            </p>
          </div>

          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-1 mb-7"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
          >
            {(['login', 'signup'] as FormMode[]).map((m) => (
              <button
                key={`mode-${m}`}
                onClick={() => { setMode(m); setAuthError(''); }}
                className="flex-1 rounded-md transition-all duration-150 font-medium"
                style={{
                  padding: '7px 0',
                  fontSize: 13,
                  border: 'none',
                  cursor: 'pointer',
                  background: mode === m ? 'var(--card)' : 'transparent',
                  color: mode === m ? 'var(--foreground)' : 'var(--text2)',
                  fontFamily: 'var(--font-sans)',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Auth error */}
          {authError && (
            <div
              className="flex items-start gap-3 rounded-lg mb-5"
              style={{
                background: 'var(--critical-bg)',
                border: '1px solid rgba(244,63,94,0.25)',
                padding: '11px 14px',
              }}
            >
              <AlertCircle size={15} style={{ color: 'var(--critical)', flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: 'var(--critical)', lineHeight: 1.5 }}>{authError}</p>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} noValidate>
              <div className="flex flex-col gap-5">
                <div>
                  <label className="samko-label" htmlFor="login-email">
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    className="samko-input"
                    placeholder="your@samkocentral.co.uk"
                    autoComplete="email"
                    {...loginForm.register('email', {
                      required: 'Email address is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
                    })}
                  />
                  {loginForm.formState.errors.email && (
                    <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 5 }}>
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="samko-label" htmlFor="login-password" style={{ margin: 0 }}>
                      Password
                    </label>
                    <button
                      type="button"
                      style={{
                        fontSize: 11,
                        color: 'var(--primary)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="samko-input"
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      style={{ paddingRight: 42 }}
                      {...loginForm.register('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text3)',
                        padding: 2,
                      }}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 5 }}>
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="remember-me"
                    type="checkbox"
                    style={{ accentColor: 'var(--primary)', width: 14, height: 14 }}
                    {...loginForm.register('remember')}
                  />
                  <label htmlFor="remember-me" style={{ fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
                    Keep me signed in for 30 days
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="samko-btn-primary w-full flex items-center justify-center gap-2"
                  style={{ padding: '11px 0', fontSize: 14 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign in to SamkoCentral'
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} noValidate>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="samko-label" htmlFor="signup-name">
                    Full name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    className="samko-input"
                    placeholder="Your full name"
                    {...signupForm.register('name', { required: 'Full name is required' })}
                  />
                  {signupForm.formState.errors.name && (
                    <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 5 }}>
                      {signupForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="samko-label" htmlFor="signup-email">
                    Work email address
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    className="samko-input"
                    placeholder="your@samkocentral.co.uk"
                    {...signupForm.register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email' },
                    })}
                  />
                  {signupForm.formState.errors.email && (
                    <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 5 }}>
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="samko-label" htmlFor="signup-role">
                    Requested role
                  </label>
                  <select
                    id="signup-role"
                    className="samko-input"
                    style={{ cursor: 'pointer' }}
                    {...signupForm.register('role')}
                  >
                    <option value="Site Manager">Site Manager</option>
                    <option value="Compliance Officer">Compliance Officer</option>
                    <option value="Read Only">Read Only (Auditor)</option>
                  </select>
                  <p className="text-muted-foreground" style={{ fontSize: 11, marginTop: 5 }}>
                    Group Admin access requires direct approval from the Group Operations Director
                  </p>
                </div>

                <div>
                  <label className="samko-label" htmlFor="signup-password">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      className="samko-input"
                      placeholder="Minimum 8 characters"
                      style={{ paddingRight: 42 }}
                      {...signupForm.register('password', {
                        required: 'Password is required',
                        minLength: { value: 8, message: 'Minimum 8 characters' },
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {signupForm.formState.errors.password && (
                    <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 5 }}>
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="samko-label" htmlFor="signup-confirm">
                    Confirm password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-confirm"
                      type={showConfirm ? 'text' : 'password'}
                      className="samko-input"
                      placeholder="Repeat your password"
                      style={{ paddingRight: 42 }}
                      {...signupForm.register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (v) =>
                          v === signupForm.watch('password') || 'Passwords do not match',
                      })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 2 }}
                    >
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {signupForm.formState.errors.confirmPassword && (
                    <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: 5 }}>
                      {signupForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    style={{ accentColor: 'var(--primary)', width: 14, height: 14, marginTop: 2 }}
                    {...signupForm.register('agreeTerms', { required: 'You must accept the terms to continue' })}
                  />
                  <label htmlFor="agree-terms" style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 }}>
                    I agree to the{' '}
                    <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Terms of Service</span>{' '}
                    and{' '}
                    <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>Privacy Policy</span>
                  </label>
                </div>
                {signupForm.formState.errors.agreeTerms && (
                  <p style={{ fontSize: 11, color: 'var(--critical)', marginTop: -8 }}>
                    {signupForm.formState.errors.agreeTerms.message}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="samko-btn-primary w-full flex items-center justify-center gap-2"
                  style={{ padding: '11px 0', fontSize: 14 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Creating account…
                    </>
                  ) : (
                    'Request access'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Demo credentials */}
          {mode === 'login' && (
            <div
              className="rounded-xl mt-7"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                padding: '14px 16px',
              }}
            >
              <div
                className="font-head text-muted-foreground mb-3"
                style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase' }}
              >
                Demo accounts — click to autofill
              </div>
              <div className="flex flex-col gap-1">
                {MOCK_USERS.map((u) => (
                  <div
                    key={`cred-${u.role}`}
                    className="flex items-center gap-3 rounded-lg cursor-pointer transition-all duration-150"
                    style={{ padding: '8px 10px' }}
                    onClick={() => handleCredentialClick(u)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'var(--surface3)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center font-head flex-shrink-0"
                      style={{
                        width: 26,
                        height: 26,
                        background: 'rgba(232,201,122,0.12)',
                        color: 'var(--primary)',
                        fontSize: 9,
                        fontWeight: 800,
                      }}
                    >
                      {u.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-foreground font-medium truncate" style={{ fontSize: 12 }}>
                        {u.role}
                      </div>
                      <div className="text-muted-foreground truncate" style={{ fontSize: 11 }}>
                        {u.email}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy(u.email, `email-${u.role}`);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text3)',
                        padding: 3,
                      }}
                      aria-label="Copy email"
                    >
                      {copiedField === `email-${u.role}` ? (
                        <CheckCheck size={12} style={{ color: 'var(--ok)' }} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}