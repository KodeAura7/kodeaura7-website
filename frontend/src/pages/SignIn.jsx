import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AmbientBackground from '../components/AmbientBackground';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import { useAuth } from '../hooks/useAuth';

export default function SignIn() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState({ email: '', password: '', rememberMe: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setValues((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(values);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="antialiased selection:bg-indigo-500/30 overflow-x-hidden min-h-screen flex items-center justify-center relative">
      <SEO title="Sign In" path="/sign-in" description="KodeAura7 admin portal sign in." />
      <AmbientBackground compact />
      <Link to="/" className="fixed top-6 left-6 inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors z-10 whitespace-nowrap">
        <Icon icon="solar:arrow-left-linear" width={14} /> Back to site
      </Link>
      <div className="max-w-md w-full mx-auto px-6 py-16">
        <div className="fade-up relative bg-[#111113] rounded-3xl p-8 md:p-10 border border-zinc-800 shadow-2xl shadow-black/50">
          <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
              <div className="w-4 h-4 bg-[#09090B] rounded-sm" />
            </div>
            <span className="font-display font-semibold text-lg mt-3">KodeAura7</span>
            <span className="bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">Admin Portal</span>
          </div>
          <h1 className="font-display font-semibold text-2xl text-zinc-100 text-center mb-1">Welcome back</h1>
          <p className="text-sm text-zinc-500 text-center">Sign in to access the KodeAura7 admin dashboard.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-0.5">Email Address</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex">
                  <Icon icon="solar:letter-linear" width={18} />
                </span>
                <input
                  name="email"
                  type="email"
                  value={values.email}
                  onChange={handleChange}
                  placeholder="admin@kodeaura7.in"
                  autoComplete="email"
                  required
                  className="w-full bg-[#18181B] border border-zinc-800 rounded-xl pl-11 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-0.5">Password</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none flex">
                  <Icon icon="solar:lock-password-linear" width={18} />
                </span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={values.password}
                  onChange={handleChange}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#18181B] border border-zinc-800 rounded-xl pl-11 pr-11 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  aria-label="Toggle password"
                >
                  <Icon icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'} width={18} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-zinc-400 cursor-pointer select-none whitespace-nowrap">
                <input
                  name="rememberMe"
                  type="checkbox"
                  checked={values.rememberMe}
                  onChange={handleChange}
                  className="w-3.5 h-3.5 rounded border-zinc-700 bg-[#18181B] accent-indigo-500"
                />
                Remember me
              </label>
              <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors whitespace-nowrap">Forgot password?</a>
            </div>
            {error ? (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <Icon icon="solar:danger-circle-linear" width={14} /> {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : <>Sign In <Icon icon="solar:arrow-right-linear" width={16} /></>}
            </button>
          </form>
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-zinc-800" />
            <span className="text-xs text-zinc-600 whitespace-nowrap">or continue with</span>
            <div className="h-px flex-1 bg-zinc-800" />
          </div>
          <button className="w-full bg-[#18181B] border border-zinc-800 rounded-xl py-3 flex items-center justify-center gap-3 hover:border-zinc-600 hover:bg-zinc-800/50 transition-all text-sm text-zinc-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50">
            <Icon icon="logos:google-icon" width={18} /> Sign in with Google
          </button>
          <div className="text-center mt-6 space-y-0.5">
            <p className="text-xs text-zinc-600">Having trouble accessing your account?</p>
            <p className="text-xs text-zinc-600">Contact support at <a href="mailto:info@kodeaura7.in" className="text-zinc-500 hover:text-zinc-300 transition-colors">info@kodeaura7.in</a></p>
          </div>
          <div className="flex items-center gap-1.5 justify-center mt-4 text-[10px] font-mono text-zinc-700">
            <Icon icon="solar:shield-check-linear" width={13} /> Secured with 256-bit encryption
          </div>
        </div>
      </div>
    </div>
  );
}
