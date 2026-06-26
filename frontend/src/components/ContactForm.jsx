import Icon from './Icon';
import { api } from '../services/api';
import { useForm } from '../hooks/useForm';
import { validateContact } from '../utils/validation';

export default function ContactForm() {
  const form = useForm(
    { name: '', email: '', service: '', message: '' },
    validateContact,
    api.contact
  );

  return (
    <form onSubmit={form.handleSubmit} className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Field label="Full Name" error={form.errors.name}>
        <input name="name" value={form.values.name} onChange={form.handleChange} type="text" placeholder="John Doe" className="form-input" />
      </Field>
      <Field label="Email Address" error={form.errors.email}>
        <input name="email" value={form.values.email} onChange={form.handleChange} type="email" placeholder="john@company.com" className="form-input" />
      </Field>
      <Field label="Service Interested In" error={form.errors.service} wide>
        <input name="service" value={form.values.service} onChange={form.handleChange} type="text" placeholder="Web Development, Salesforce CRM..." className="form-input" />
      </Field>
      <Field label="Project Details" error={form.errors.message} wide>
        <textarea name="message" value={form.values.message} onChange={form.handleChange} rows="4" placeholder="Tell us what you're building..." className="form-input resize-none" />
      </Field>
      <button type="submit" className="sm:col-span-2 inline-flex items-center justify-center gap-2 bg-indigo-500 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-indigo-400 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.4)]">
        {form.status === 'loading' ? 'Sending...' : 'Send Message'} <Icon icon="solar:arrow-right-linear" width={16} />
      </button>
      {form.status === 'success' ? <p className="sm:col-span-2 text-xs text-emerald-400">Thanks! We will be in touch shortly.</p> : null}
      {typeof form.status === 'string' && !['idle', 'loading', 'success'].includes(form.status) ? (
        <p className="sm:col-span-2 text-xs text-rose-400">{form.status}</p>
      ) : null}
    </form>
  );
}

function Field({ label, error, wide = false, children }) {
  return (
    <div className={`space-y-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <label className="text-xs font-medium text-zinc-400 ml-0.5">{label}</label>
      {children}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}
