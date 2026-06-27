import { useEffect, useState } from 'react';
import Icon from './Icon';
import { api } from '../services/api';

function Field({ field, value, onChange, error }) {
  const wide = field.width === 'full';
  const inputClass =
    'w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all';

  let control;
  if (field.field_type === 'textarea') {
    control = (
      <textarea
        name={field.name}
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={field.placeholder}
        required={field.required}
        className={inputClass + ' resize-none'}
      />
    );
  } else if (field.field_type === 'select') {
    control = (
      <select
        name={field.name}
        value={value}
        onChange={onChange}
        required={field.required}
        className={inputClass}
      >
        <option value="">{field.placeholder || 'Select…'}</option>
        {(field.options || []).map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    );
  } else {
    control = (
      <input
        type={field.field_type}
        name={field.name}
        value={value}
        onChange={onChange}
        placeholder={field.placeholder}
        required={field.required}
        className={inputClass}
      />
    );
  }

  return (
    <div className={`space-y-1.5 ${wide ? 'sm:col-span-2' : ''}`}>
      <label className="text-xs font-medium text-zinc-400 ml-0.5">
        {field.label}
        {field.required && <span className="text-rose-400 ml-0.5">*</span>}
      </label>
      {control}
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
    </div>
  );
}

export default function ContactForm() {
  const [formFields, setFormFields] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle'); // idle | loading | success | error

  useEffect(() => {
    api.contactFormFields()
      .then((fields) => {
        setFormFields(fields);
        const initial = {};
        fields.forEach((f) => { initial[f.name] = ''; });
        setValues(initial);
      })
      .catch(() => {
        // Fall back to static fields if API fails
        setFormFields([
          { id: 'name',    name: 'name',    label: 'Full Name',             field_type: 'text',     placeholder: 'John Doe',                            required: true,  width: 'half', options: [] },
          { id: 'email',   name: 'email',   label: 'Email Address',         field_type: 'email',    placeholder: 'john@company.com',                    required: true,  width: 'half', options: [] },
          { id: 'service', name: 'service', label: 'Service Interested In', field_type: 'text',     placeholder: 'Web Development, Salesforce CRM...', required: false, width: 'full', options: [] },
          { id: 'message', name: 'message', label: 'Project Details',       field_type: 'textarea', placeholder: "Tell us what you're building...",     required: true,  width: 'full', options: [] },
        ]);
        setValues({ name: '', email: '', service: '', message: '' });
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({ ...v, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    (formFields || []).forEach((f) => {
      if (f.required && !values[f.name]?.trim()) {
        errs[f.name] = `${f.label} is required.`;
      }
      if (f.field_type === 'email' && values[f.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values[f.name])) {
        errs[f.name] = 'Please enter a valid email address.';
      }
    });
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus('loading');
    try {
      await api.contact(values);
      setStatus('success');
    } catch (err) {
      setStatus(err.message || 'Something went wrong. Please try again.');
    }
  };

  if (!formFields) {
    return (
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 flex items-center justify-center gap-2 text-zinc-600 min-h-[200px]">
        <Icon icon="solar:loading-linear" width={18} className="animate-spin" />
        <span className="text-sm">Loading form…</span>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 min-h-[240px] text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Icon icon="solar:check-circle-bold" width={24} className="text-emerald-400" />
        </div>
        <h3 className="font-display font-semibold text-lg text-zinc-100">Message Sent!</h3>
        <p className="text-sm text-zinc-400">Thanks! We will be in touch shortly.</p>
        <button onClick={() => { setStatus('idle'); const init = {}; formFields.forEach(f => { init[f.name] = ''; }); setValues(init); }}
          className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[#111113] border border-zinc-800 rounded-3xl p-8 grid grid-cols-1 sm:grid-cols-2 gap-5">
      {formFields.map((field) => (
        <Field
          key={field.id}
          field={field}
          value={values[field.name] ?? ''}
          onChange={handleChange}
          error={errors[field.name]}
        />
      ))}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full inline-flex items-center justify-center gap-2 brand-gradient-bg text-white rounded-xl py-3.5 text-sm font-medium hover:opacity-90 transition-all brand-shadow disabled:opacity-60"
        >
          {status === 'loading'
            ? <><Icon icon="solar:loading-linear" width={16} className="animate-spin" />Sending…</>
            : <>Send Message <Icon icon="solar:arrow-right-linear" width={16} /></>
          }
        </button>
      </div>

      {typeof status === 'string' && !['idle', 'loading', 'success'].includes(status) && (
        <p className="sm:col-span-2 text-xs text-rose-400 flex items-center gap-1.5">
          <Icon icon="solar:danger-circle-linear" width={13} />
          {status}
        </p>
      )}
    </form>
  );
}
