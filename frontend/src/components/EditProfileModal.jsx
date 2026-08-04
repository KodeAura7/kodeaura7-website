import { useState } from 'react';
import Icon from './Icon';
import { adminApi } from '../services/adminApi';

export default function EditProfileModal({ user, onSave, onClose }) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const inputClass = 'w-full bg-[#18181B] border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-primary-500/60 transition-colors';

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setProfileMsg({ type: 'error', text: 'Name is required.' }); return; }
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const updated = await adminApi.updateMe({ name: name.trim(), email: email.trim() });
      onSave(updated);
      setProfileMsg({ type: 'success', text: 'Profile updated.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { setPasswordMsg({ type: 'error', text: 'New password must be at least 8 characters.' }); return; }
    if (newPassword !== confirmPassword) { setPasswordMsg({ type: 'error', text: 'Passwords do not match.' }); return; }
    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await adminApi.changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordMsg({ type: 'success', text: 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Update failed.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const Message = ({ msg }) =>
    msg.text ? (
      <div
        className={`rounded-xl p-3 text-xs border ${
          msg.type === 'error'
            ? 'bg-error-500/10 border-error-500/20 text-error-400'
            : 'bg-success-500/10 border-success-500/20 text-success-400'
        }`}
      >
        {msg.text}
      </div>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#111113] border border-zinc-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <h2 className="text-base font-semibold text-zinc-100">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all">
            <Icon icon="solar:close-circle-linear" width={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Message msg={profileMsg} />
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-primary-500 hover:bg-primary-400 text-white transition-all disabled:opacity-60"
            >
              <Icon icon={savingProfile ? 'solar:loading-linear' : 'solar:floppy-disk-linear'} width={15} className={savingProfile ? 'animate-spin' : ''} />
              {savingProfile ? 'Saving…' : 'Save Changes'}
            </button>
          </form>

          <div className="border-t border-zinc-800" />

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">Change Password</h3>
            <Message msg={passwordMsg} />
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass}
                autoComplete="current-password"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-[#18181B] border border-zinc-700 hover:border-zinc-500 text-zinc-200 transition-all disabled:opacity-60"
            >
              <Icon icon={savingPassword ? 'solar:loading-linear' : 'solar:lock-password-linear'} width={15} className={savingPassword ? 'animate-spin' : ''} />
              {savingPassword ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
