import { useState } from 'react';
import Icon from '../Icon';
import { adminApi } from '../../services/adminApi';

const ENV_LABELS = {
  production: 'Production',
  staging: 'Staging / Sandbox',
};

const ENV_URLS = {
  production: 'kodeaura7.in',
  staging: 'staging.kodeaura7.in',
};

const CONFIG_LABELS = {
  about: 'About Page',
  branding: 'Branding',
  contact_form: 'Contact Form',
};

// mode: 'records' (contacts/newsletter/services/etc.) | 'config' (about/branding/contact_form)
export default function MigrateModal({ objectName, selectedIds, onClose, onSuccess, mode = 'records' }) {
  const [targetEnv, setTargetEnv] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const isConfig = mode === 'config';
  const configLabel = CONFIG_LABELS[objectName] || objectName;

  const handleMigrate = async () => {
    if (!targetEnv) return;
    setLoading(true);
    setError('');
    try {
      let res;
      if (isConfig) {
        res = await adminApi.syncConfig(objectName, targetEnv);
      } else {
        res = await adminApi.migrateRecords([...selectedIds], objectName, targetEnv);
      }
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111113] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-500/15 border border-primary-500/25 flex items-center justify-center">
              <Icon icon="solar:transfer-horizontal-bold-duotone" width={18} className="text-primary-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {isConfig ? `Sync ${configLabel}` : 'Migrate Records'}
              </h2>
              <p className="text-[11px] text-zinc-500">
                {isConfig
                  ? `Push entire ${configLabel} config to another environment`
                  : `${selectedIds.size} record${selectedIds.size !== 1 ? 's' : ''} selected`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all">
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {result ? (
            /* Success state */
            <div className="space-y-4">
              <div className="bg-success-500/10 border border-success-500/20 rounded-xl p-4 text-center">
                <Icon icon="solar:check-circle-bold" width={32} className="text-success-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-success-400">
                  {isConfig ? 'Sync Complete' : 'Migration Complete'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  {result.created} created · {result.updated} updated in{' '}
                  <span className="text-zinc-200 font-medium">{ENV_LABELS[result.targetEnv]}</span>
                </p>
              </div>
              <button onClick={() => { onSuccess?.(); onClose(); }}
                className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-sm font-medium transition-all">
                Done
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-zinc-400 mb-3">Select target environment</p>
                <div className="space-y-2">
                  {Object.entries(ENV_LABELS).map(([env, label]) => (
                    <label key={env}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        targetEnv === env
                          ? 'bg-primary-500/10 border-primary-500/30'
                          : 'bg-[#18181B] border-zinc-800 hover:border-zinc-700'
                      }`}>
                      <input type="radio" name="env" value={env}
                        checked={targetEnv === env} onChange={() => setTargetEnv(env)}
                        className="accent-primary-500" />
                      <div>
                        <p className={`text-sm font-medium ${targetEnv === env ? 'text-primary-300' : 'text-zinc-200'}`}>{label}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">{ENV_URLS[env]}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-warning-500/8 border border-warning-500/20 rounded-xl p-3.5 flex gap-3">
                <Icon icon="solar:danger-triangle-linear" width={15} className="text-warning-400 mt-0.5 shrink-0" />
                <div className="text-[11px] text-zinc-400 leading-relaxed">
                  {isConfig
                    ? `The entire ${configLabel} configuration will be overwritten in ${ENV_LABELS[targetEnv] || '…'}.`
                    : `Records will be created or updated in the target environment. The source field of selected records here will be updated to "Migrated to ${targetEnv || '…'}".`
                  }
                </div>
              </div>

              {error && (
                <div className="bg-error-500/10 border border-error-500/20 rounded-xl p-3 text-sm text-error-400 flex gap-2 items-start">
                  <Icon icon="solar:danger-circle-linear" width={15} className="mt-0.5 shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-300 text-sm font-medium transition-all">
                  Cancel
                </button>
                <button onClick={handleMigrate} disabled={!targetEnv || loading}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
                  {loading ? (
                    <><Icon icon="solar:loading-linear" width={15} className="animate-spin" />{isConfig ? 'Syncing…' : 'Migrating…'}</>
                  ) : (
                    <><Icon icon="solar:transfer-horizontal-linear" width={15} />
                    {isConfig ? 'Sync' : `Migrate${!isConfig && selectedIds?.size > 0 ? ` (${selectedIds.size})` : ''}`}</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
