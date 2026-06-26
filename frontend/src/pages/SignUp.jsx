import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthButton from '../components/auth/AuthButton';
import AuthCard from '../components/auth/AuthCard';
import AuthInput from '../components/auth/AuthInput';
import FormMessage from '../components/auth/FormMessage';
import PasswordField from '../components/auth/PasswordField';
import Icon from '../components/Icon';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

export default function SignUp() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading
  const [serverError, setServerError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) setFieldErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!values.name.trim()) errs.name = 'Name is required.';
    if (!values.email.trim()) errs.email = 'Email is required.';
    if (values.password.length < 8) errs.password = 'Password must be at least 8 characters.';
    if (values.password !== values.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
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
      const { token, user } = await api.signup(values);
      setSession(token, user);
      navigate('/welcome', { replace: true });
    } catch (err) {
      setStatus('idle');
      setServerError(err.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <AuthCard
      title="Create Account"
      description="Sign up to get started with KodeAura7."
      seoTitle="Sign Up"
      seoPath="/sign-up"
      seoDescription="Create your KodeAura7 account."
    >
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <AuthInput
          label="Full Name"
          icon="solar:user-linear"
          name="name"
          type="text"
          value={values.name}
          onChange={handleChange}
          placeholder="Your name"
          autoComplete="name"
          required
          autoFocus
          error={fieldErrors.name}
        />
        <AuthInput
          label="Email Address"
          icon="solar:letter-linear"
          name="email"
          type="email"
          value={values.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          required
          error={fieldErrors.email}
        />
        <PasswordField
          label="Password"
          name="password"
          value={values.password}
          onChange={handleChange}
          placeholder="Minimum 8 characters"
          autoComplete="new-password"
          error={fieldErrors.password}
        />
        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          value={values.confirmPassword}
          onChange={handleChange}
          placeholder="Repeat your password"
          autoComplete="new-password"
          error={fieldErrors.confirmPassword}
        />
        {serverError && <FormMessage type="error" message={serverError} />}
        <AuthButton loading={status === 'loading'}>
          {status === 'loading' ? 'Creating account…' : <>Create Account <Icon icon="solar:arrow-right-linear" width={16} /></>}
        </AuthButton>
      </form>
      <div className="flex items-center gap-4 my-6">
        <div className="h-px flex-1 bg-zinc-800" />
        <span className="text-xs text-zinc-600 whitespace-nowrap">already have an account?</span>
        <div className="h-px flex-1 bg-zinc-800" />
      </div>
      <Link
        to="/sign-in"
        className="w-full flex items-center justify-center gap-2 bg-zinc-800/60 border border-zinc-700 rounded-xl py-3 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-all"
      >
        Sign In
      </Link>
    </AuthCard>
  );
}
