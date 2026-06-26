import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthButton from '../components/auth/AuthButton';
import AuthCard from '../components/auth/AuthCard';
import AuthInput from '../components/auth/AuthInput';
import FormMessage from '../components/auth/FormMessage';
import Icon from '../components/Icon';
import { api } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('loading');
    try {
      await api.forgotPassword({ email: email.trim() });
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      setError(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <AuthCard
        title="Check your email"
        seoTitle="Check your email"
        seoPath="/forgot-password"
        seoDescription="Password reset link sent."
      >
        <div className="mt-8 space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.1)]">
              <Icon icon="solar:letter-opened-linear" width={28} className="text-emerald-400" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-zinc-300">
              We sent a reset link to{' '}
              <span className="text-zinc-100 font-medium">{email}</span>
            </p>
            <p className="text-xs text-zinc-600">
              The link expires in 30 minutes. Check your spam folder if it doesn&apos;t arrive.
            </p>
          </div>
          <button
            onClick={() => {
              setStatus('idle');
              setEmail('');
            }}
            className="w-full py-3 rounded-xl bg-zinc-800/60 border border-zinc-700 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
          >
            Try a different email
          </button>
          <div className="text-center">
            <Link
              to="/sign-in"
              className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
            >
              <Icon icon="solar:arrow-left-linear" width={12} /> Back to Sign In
            </Link>
          </div>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot Password"
      description="Enter your admin email and we'll send you a secure reset link."
      seoTitle="Forgot Password"
      seoPath="/forgot-password"
      seoDescription="Reset your KodeAura7 admin password."
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <AuthInput
          label="Email Address"
          icon="solar:letter-linear"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@kodeaura7.in"
          autoComplete="email"
          required
          autoFocus
        />
        {error && <FormMessage type="error" message={error} />}
        <AuthButton loading={status === 'loading'}>
          {status === 'loading' ? 'Sending…' : 'Send Reset Link'}
        </AuthButton>
        <div className="text-center">
          <Link
            to="/sign-in"
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors inline-flex items-center gap-1.5"
          >
            <Icon icon="solar:arrow-left-linear" width={12} /> Back to Sign In
          </Link>
        </div>
      </form>
    </AuthCard>
  );
}
