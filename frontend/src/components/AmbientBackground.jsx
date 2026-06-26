export default function AmbientBackground({ compact = false }) {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <div className="absolute inset-0 bg-grid opacity-[0.05]" />
      <div className={`${compact ? 'top-[8%]' : 'top-[-10%]'} absolute left-[8%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full filter blur-[120px] animate-blob`} />
      <div className={`${compact ? 'bottom-[6%]' : 'top-[5%]'} absolute right-[6%] w-[420px] h-[420px] bg-cyan-600/10 rounded-full filter blur-[120px] animate-blob animation-delay-2000`} />
    </div>
  );
}
