import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import AuthButton from '../components/auth/AuthButton';
import AuthCard from '../components/auth/AuthCard';
import FormMessage from '../components/auth/FormMessage';
import PasswordField from '../components/auth/PasswordField';
import Icon from '../components/Icon';
import { api } from '../services/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [values, setValues] = useState({ password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (status !== 'success') return;
    const timer = setTimeout(() => navigate('/sign-in', { replace: true }), 3000);
    return () => clearTimeout(timer);
  }, [status, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!values.password || values.password.length < 8) {
      errs.password = 'Password must be at least 8 characters.';
    }
    if (values.password !== values.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }
    setServerError('');
    setStatus('loading');
    try {
      await api.resetPassword({
        token,
        password: values.password,
        confirmPassword: values.confirmPassword
      });
      setStatus('success');
    } catch (err) {
      setStatus('idle');
      setServerError(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <AuthCard
        title="Password Updated"
        seoTitle="Password Updated"
        seoPath="/reset-password"
        seoDescription="Your password has been reset."
      >
        <div className="mt-8 space-y-5">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-success-500/10 border border-success-500/20 flex items-center justify-center shadow-[0_0_24px_rgba(16,185,129,0.1)]">
              <Icon icon="solar:shield-check-linear" width={28} className="text-success-400" />
            </div>
          </div>
          <div className="text-center space-y-2">
            <p className="text-sm text-zinc-300">Your password has been updated successfully.</p>
            <p className="text-xs text-zinc-600">Redirecting you to Sign In in a moment…</p>
          </div>
          <Link
            to="/sign-in"
            replace
            className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-400 transition-all shadow-[0_0_20px_rgba(51, 112, 246,0.2)]"
          >
            Sign In now <Icon icon="solar:arrow-right-linear" width={16} />
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset Password"
      description="Choose a new password for your admin account."
      seoTitle="Reset Password"
      seoPath="/reset-password"
      seoDescription="Set a new password for your KodeAura7 admin account."
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <PasswordField
          label="New Password"
          name="password"
          value={values.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          autoFocus
          error={fieldErrors.password}
        />
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={values.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your new password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
        {serverError && <FormMessage type="error" message={serverError} />}
        <AuthButton loading={status === 'loading'}>
          {status === 'loading' ? 'Updating…' : 'Update Password'}
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
