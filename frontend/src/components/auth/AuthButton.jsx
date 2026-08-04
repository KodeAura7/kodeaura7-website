export default function AuthButton({ loading, children }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 bg-primary-500 text-white rounded-xl py-3.5 text-sm font-medium hover:bg-primary-400 transition-all shadow-[0_0_20px_rgba(51, 112, 246,0.2)] hover:shadow-[0_0_30px_rgba(51, 112, 246,0.4)] focus:outline-none focus:ring-2 focus:ring-primary-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
