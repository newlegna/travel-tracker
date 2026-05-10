type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
  className?: string;
};

export function PageHeader({ eyebrow, title, description, className = "" }: PageHeaderProps) {
  return (
    <header className={`space-y-2 ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-moss">{eyebrow}</p>
      <h1 className="max-w-4xl text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {description ? <p className="max-w-3xl text-sm leading-relaxed text-stone-600 sm:text-base">{description}</p> : null}
    </header>
  );
}
