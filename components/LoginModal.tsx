import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// ── Shared form field ───────────────────────────────────────────────────────
const Field: React.FC<{
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  right?: React.ReactNode;
}> = ({ label, type, value, onChange, placeholder, autoComplete, right }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400
                   focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all pr-10"
      />
      {right && <div className="absolute right-3 top-1/2 -translate-y-1/2">{right}</div>}
    </div>
  </div>
);

// ── Password field with show/hide ───────────────────────────────────────────
const PasswordField: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({
  label, value, onChange,
}) => {
  const [show, setShow] = useState(false);
  return (
    <Field
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder="••••••••"
      autoComplete="current-password"
      right={
        <button type="button" onClick={() => setShow((s) => !s)} className="text-slate-400 hover:text-slate-600 transition-colors">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
};

// ── Modal shell ─────────────────────────────────────────────────────────────
const ModalShell: React.FC<{ onClose: () => void; children: React.ReactNode }> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
    <div className="relative animate-fade-in-up max-w-[420px] w-full">
      <button
        onClick={onClose}
        className="absolute -top-12 right-0 sm:-top-4 sm:-right-12 z-[110] p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white"
      >
        <X size={24} />
      </button>
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 w-full">
        {children}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSwitchToSignup }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      // Redirect happens automatically
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-serif font-bold text-slate-900">Welcome back</h2>
        <p className="text-slate-500 text-sm mt-1">Sign in to continue your practice</p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-2.5 mb-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
          <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.6-4.3 7.3-10.5 7.3-17.5z"/>
          <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z"/>
          <path fill="#FBBC05" d="M10.6 28.7A13.8 13.8 0 0 1 10.6 19.3v-6.2H2.5a24 24 0 0 0 0 21.9l8.1-6.3z"/>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.3 2.5 13.1l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or sign in with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <PasswordField label="Password" value={password} onChange={setPassword} />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      {/* Footer */}
      <p className="mt-5 text-center text-sm text-slate-500">
        Don't have an account?{' '}
        <button onClick={onSwitchToSignup} className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
          Sign up free
        </button>
      </p>
    </ModalShell>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP MODAL
// ─────────────────────────────────────────────────────────────────────────────
interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export const SignupModal: React.FC<SignupModalProps> = ({ isOpen, onClose, onSwitchToLogin }) => {
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await signup(name, email, password);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed.');
    }
  };

  if (success) {
    return (
      <ModalShell onClose={onClose}>
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">Check your inbox</h2>
          <p className="text-slate-500 text-sm mb-6">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <button onClick={onSwitchToLogin} className="text-teal-600 font-bold hover:text-teal-700 transition-colors text-sm">
            Back to Sign In →
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-6 text-center">
        <h2 className="text-3xl font-serif font-bold text-slate-900">Begin your journey</h2>
        <p className="text-slate-500 text-sm mt-1">Create your free Yoga Flow account</p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-200 py-2.5 mb-4 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" className="shrink-0">
          <path fill="#4285F4" d="M47.5 24.6c0-1.6-.1-3.2-.4-4.7H24v8.9h13.2c-.6 3-2.3 5.6-4.9 7.3v6h7.9c4.6-4.3 7.3-10.5 7.3-17.5z"/>
          <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.9-6c-2.2 1.5-5 2.3-8.1 2.3-6.2 0-11.5-4.2-13.4-9.9H2.5v6.2C6.5 42.7 14.7 48 24 48z"/>
          <path fill="#FBBC05" d="M10.6 28.7A13.8 13.8 0 0 1 10.6 19.3v-6.2H2.5a24 24 0 0 0 0 21.9l8.1-6.3z"/>
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.5l6.8-6.8C35.9 2.4 30.5 0 24 0 14.7 0 6.5 5.3 2.5 13.1l8.1 6.2C12.5 13.7 17.8 9.5 24 9.5z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400 font-medium">or create with email</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full Name" type="text" value={name} onChange={setName} placeholder="Arjun Sharma" autoComplete="name" />
        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" autoComplete="email" />
        <PasswordField label="Password (min 6 chars)" value={password} onChange={setPassword} />

        {error && (
          <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-2">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-teal-600 font-bold hover:text-teal-700 transition-colors">
          Sign in
        </button>
      </p>
    </ModalShell>
  );
};
