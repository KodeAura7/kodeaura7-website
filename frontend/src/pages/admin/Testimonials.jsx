import { useEffect, useState } from 'react';
import Icon from '../../components/Icon';
import { adminApi } from '../../services/adminApi';

function StarRow({ rating }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon
          key={i}
          icon={i < rating ? 'solar:star-bold' : 'solar:star-linear'}
          width={13}
          className={i < rating ? 'text-amber-400' : 'text-zinc-700'}
        />
      ))}
    </span>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(null);

  const load = () => {
    setError('');
    adminApi.testimonials().then(setItems).catch((err) => setError(err.message));
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (id, current) => {
    setToggling(id);
    try {
      const updated = await adminApi.updateTestimonialVisibility(id, !current);
      setItems((prev) => prev.map((t) => (t.id === id ? { ...t, visible: updated.visible } : t)));
    } catch (err) {
      setError(err.message);
    } finally {
      setToggling(null);
    }
  };

  const shown = items ? items.filter((t) => t.visible).length : 0;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-semibold text-2xl text-zinc-100">Testimonials</h1>
        <p className="text-sm text-zinc-500 mt-1">
          {items ? `${items.length} total · ${shown} visible on site` : '—'}
        </p>
      </div>

      {error ? (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-sm text-rose-400 mb-4">{error}</div>
      ) : null}

      <div className="bg-[#111113] border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#18181B] border-b border-zinc-800">
                {['Name', 'Designation', 'Rating', 'Review', 'Submitted', 'Visible'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {!items ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-600">Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-zinc-600">No reviews submitted yet.</td></tr>
              ) : (
                items.map((t) => (
                  <tr key={t.id} className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-zinc-200 font-medium">{t.name}</p>
                      <p className="text-[11px] text-zinc-600 font-mono">{t.user_email}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap text-xs">{t.designation}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><StarRow rating={t.rating} /></td>
                    <td className="px-4 py-3 text-zinc-400 max-w-xs">
                      <p className="line-clamp-2 text-xs leading-relaxed">{t.review}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 font-mono text-xs whitespace-nowrap">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(t.id, t.visible)}
                        disabled={toggling === t.id}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
                          t.visible ? 'bg-emerald-500' : 'bg-zinc-700'
                        }`}
                        title={t.visible ? 'Hide from site' : 'Show on site'}
                      >
                        <span
                          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                            t.visible ? 'translate-x-4' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
