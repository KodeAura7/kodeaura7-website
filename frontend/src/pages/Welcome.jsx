import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AmbientBackground from '../components/AmbientBackground';
import ContactStatusBadge from '../components/ContactStatusBadge';
import Icon from '../components/Icon';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="text-amber-400 transition-transform hover:scale-110"
        >
          <Icon
            icon={(hovered || value) >= star ? 'solar:star-bold' : 'solar:star-linear'}
            width={22}
          />
        </button>
      ))}
      {(hovered || value) > 0 ? (
        <span className="ml-2 text-xs text-zinc-500 self-center">{STAR_LABELS[hovered || value]}</span>
      ) : null}
    </div>
  );
}

export default function Welcome() {
  const { user, logout } = useAuth();
  const [contacts, setContacts] = useState(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [contactsError, setContactsError] = useState('');
  const [selected, setSelected] = useState(null);

  const [subscribed, setSubscribed] = useState(null);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterWorking, setNewsletterWorking] = useState(false);

  const [review, setReview] = useState({ designation: '', rating: 0, review: '' });
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [reviewExists, setReviewExists] = useState(false);

  useEffect(() => {
    api
      .myContacts()
      .then(setContacts)
      .catch((err) => setContactsError(err.message))
      .finally(() => setLoadingContacts(false));

    api
      .newsletterStatus()
      .then(({ subscribed: s }) => setSubscribed(s))
      .catch(() => setSubscribed(null))
      .finally(() => setNewsletterLoading(false));

    api
      .myTestimonial()
      .then((data) => {
        if (data) {
          setReview({ designation: data.designation, rating: data.rating, review: data.review });
          setReviewExists(true);
        }
      })
      .catch(() => null)
      .finally(() => setReviewLoading(false));
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!review.rating) { setReviewMsg({ type: 'error', text: 'Please select a star rating.' }); return; }
    setReviewSaving(true);
    setReviewMsg({ type: '', text: '' });
    try {
      await api.submitTestimonial({ name: user?.name, ...review });
      setReviewExists(true);
      setReviewMsg({ type: 'success', text: reviewExists ? 'Review updated! It will appear on site once approved.' : 'Review submitted! It will appear on site once approved by an admin.' });
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.message });
    } finally {
      setReviewSaving(false);
    }
  };

  const handleNewsletterToggle = async () => {
    setNewsletterWorking(true);
    try {
      if (subscribed) {
        await api.newsletterUnsubscribe();
        setSubscribed(false);
      } else {
        await api.newsletterSubscribe();
        setSubscribed(true);
      }
    } catch {
      // silently ignore — status stays unchanged
    } finally {
      setNewsletterWorking(false);
    }
  };

  return (
    <div className="antialiased min-h-screen bg-[#09090B] flex flex-col relative overflow-hidden">
      <AmbientBackground compact />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-zinc-800/60 bg-[#09090B]/80 backdrop-blur-sm">
        <Logo />
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-semibold select-none">
              {user?.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span className="text-sm text-zinc-300 font-medium">{user?.name}</span>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-rose-400 transition-colors border border-zinc-800 hover:border-rose-500/30 rounded-lg px-3 py-1.5"
          >
            <Icon icon="solar:logout-2-linear" width={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative z-10 px-6 py-10 max-w-3xl mx-auto w-full">
        {/* Profile card */}
        <div className="text-center mb-10 fade-up">
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
              <span className="font-display font-semibold text-2xl text-white select-none">
                {user?.name?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono mb-1">Welcome back</p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-zinc-100 mb-1.5">{user?.name}</h1>
          <p className="text-sm text-zinc-600">{user?.email}</p>

          <div className="mt-6">
            <Link
              to="/"
              className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors inline-flex items-center gap-1.5"
            >
              <Icon icon="solar:arrow-left-linear" width={12} />
              Back to site
            </Link>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mb-8 fade-up">
          <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Icon icon="solar:letter-linear" width={18} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-200">Newsletter</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {newsletterLoading
                    ? 'Checking status…'
                    : subscribed
                    ? 'You are subscribed to updates.'
                    : 'Subscribe to receive updates.'}
                </p>
              </div>
            </div>
            {!newsletterLoading && subscribed !== null ? (
              <button
                onClick={handleNewsletterToggle}
                disabled={newsletterWorking}
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-medium transition-all disabled:opacity-60 ${
                  subscribed
                    ? 'border border-zinc-700 hover:border-rose-500/40 text-zinc-400 hover:text-rose-400 bg-[#18181B]'
                    : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                }`}
              >
                <Icon
                  icon={newsletterWorking ? 'solar:loading-linear' : subscribed ? 'solar:bell-off-linear' : 'solar:bell-linear'}
                  width={14}
                  className={newsletterWorking ? 'animate-spin' : ''}
                />
                {newsletterWorking ? 'Working…' : subscribed ? 'Unsubscribe' : 'Subscribe'}
              </button>
            ) : null}
          </div>
        </div>

        {/* Leave a Review */}
        <div className="mb-8 fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-zinc-100">
              {reviewExists ? 'Your Review' : 'Leave a Review'}
            </h2>
            {reviewExists ? (
              <span className="text-xs font-mono text-zinc-600">You can update anytime</span>
            ) : null}
          </div>

          {reviewLoading ? (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-600">Loading…</div>
          ) : (
            <form onSubmit={handleReviewSubmit} className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Your Name</label>
                  <input
                    type="text"
                    value={user?.name ?? ''}
                    readOnly
                    className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400">Designation / Role <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    value={review.designation}
                    onChange={(e) => setReview((p) => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. CEO at Acme Inc."
                    required
                    className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Rating <span className="text-rose-500">*</span></label>
                <StarPicker value={review.rating} onChange={(v) => setReview((p) => ({ ...p, rating: v }))} />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-400">Your Review <span className="text-rose-500">*</span></label>
                <textarea
                  value={review.review}
                  onChange={(e) => setReview((p) => ({ ...p, review: e.target.value }))}
                  placeholder="Share your experience with KodeAura7… (minimum 20 characters)"
                  required
                  rows={4}
                  className="w-full bg-[#18181B] border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 transition-all resize-none"
                />
              </div>

              {reviewMsg.text ? (
                <p className={`text-xs flex items-center gap-1.5 ${reviewMsg.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  <Icon icon={reviewMsg.type === 'error' ? 'solar:danger-circle-linear' : 'solar:check-circle-linear'} width={14} />
                  {reviewMsg.text}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={reviewSaving}
                className="inline-flex items-center gap-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] disabled:opacity-60"
              >
                <Icon icon={reviewSaving ? 'solar:loading-linear' : 'solar:star-linear'} width={15} className={reviewSaving ? 'animate-spin' : ''} />
                {reviewSaving ? 'Submitting…' : reviewExists ? 'Update Review' : 'Submit Review'}
              </button>

              <p className="text-[11px] text-zinc-600">Reviews are reviewed by our team before appearing on the website.</p>
            </form>
          )}
        </div>

        {/* My Contact Requests */}
        <div className="fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg text-zinc-100">My Contact Requests</h2>
            {contacts ? (
              <span className="text-xs font-mono text-zinc-600">{contacts.length} request{contacts.length !== 1 ? 's' : ''}</span>
            ) : null}
          </div>

          {contactsError ? (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400">{contactsError}</div>
          ) : loadingContacts ? (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-600">Loading…</div>
          ) : !contacts || contacts.length === 0 ? (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl p-8 text-center">
              <Icon icon="solar:inbox-linear" width={28} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-600">No contact requests yet.</p>
              <Link to="/" className="mt-3 inline-block text-xs text-indigo-500 hover:text-indigo-400 transition-colors">
                Go to contact form
              </Link>
            </div>
          ) : (
            <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#18181B] border-b border-zinc-800">
                      {['Service', 'Status', 'Submitted', 'Updated'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                          {h}
                        </th>
                      ))}
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {contacts.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => setSelected(c)}
                        className="hover:bg-zinc-800/30 transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-3 text-zinc-200 whitespace-nowrap max-w-[160px] truncate">{c.service}</td>
                        <td className="px-4 py-3 whitespace-nowrap"><ContactStatusBadge status={c.status} /></td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                          {new Date(c.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                          {c.updated_at ? new Date(c.updated_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Icon icon="solar:eye-linear" width={14} className="text-zinc-600" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Read-only detail modal */}
      {selected ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-[#111113] border border-zinc-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="font-display font-semibold text-lg text-zinc-100">{selected.service}</h3>
                <div className="mt-1"><ContactStatusBadge status={selected.status} /></div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-zinc-500 hover:text-zinc-200 transition-colors"
              >
                <Icon icon="solar:close-circle-linear" width={20} />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-3">
                <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs uppercase tracking-wider pt-0.5">Message</dt>
                <dd className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{selected.message}</dd>
              </div>
              <div className="flex gap-3 pt-1 border-t border-zinc-800">
                <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs uppercase tracking-wider pt-1">Submitted</dt>
                <dd className="text-zinc-400 font-mono text-xs pt-1">{new Date(selected.created_at).toLocaleString()}</dd>
              </div>
              {selected.updated_at ? (
                <div className="flex gap-3">
                  <dt className="w-20 shrink-0 text-zinc-500 font-mono text-xs uppercase tracking-wider pt-0.5">Updated</dt>
                  <dd className="text-zinc-400 font-mono text-xs">{new Date(selected.updated_at).toLocaleString()}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </div>
      ) : null}
    </div>
  );
}
