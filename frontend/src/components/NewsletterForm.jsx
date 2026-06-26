import { api } from '../services/api';
import { useForm } from '../hooks/useForm';
import { validateNewsletter } from '../utils/validation';

export default function NewsletterForm() {
  const form = useForm({ email: '' }, validateNewsletter, api.newsletter);

  return (
    <form onSubmit={form.handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        name="email"
        value={form.values.email}
        onChange={form.handleChange}
        placeholder="Your email"
        className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
      />
      <button className="bg-indigo-500 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-indigo-400 transition-all">
        {form.status === 'loading' ? 'Joining...' : 'Join'}
      </button>
      {form.errors.email ? <p className="text-xs text-rose-400">{form.errors.email}</p> : null}
      {form.status === 'success' ? <p className="text-xs text-emerald-400">You're on the list.</p> : null}
    </form>
  );
}
