export default function SectionHero({ eyebrow, title, gradient, description, children }) {
  return (
    <section className="pt-32 md:pt-40 pb-16 text-center">
      <div className="max-w-3xl mx-auto px-6">
        <p className="fade-up font-mono text-xs text-zinc-500 tracking-widest uppercase mb-5">{eyebrow}</p>
        <h1 className="fade-up delay-1 font-display font-semibold text-4xl md:text-6xl tracking-tighter leading-[1.05] mb-6">
          {title} <span className="text-gradient">{gradient}</span>
        </h1>
        <p className="fade-up delay-2 text-zinc-400 text-lg leading-relaxed max-w-2xl mx-auto mb-8">{description}</p>
        {children}
      </div>
    </section>
  );
}
