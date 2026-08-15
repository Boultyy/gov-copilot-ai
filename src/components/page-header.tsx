import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="animate-rise grid grid-cols-[minmax(0,1fr)_auto] items-start gap-6 pb-2 sm:flex sm:items-end sm:justify-between">
      <div className="flex min-w-0 items-start gap-4">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-primary/20 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 ring-1 ring-white/10">
            {icon}
          </span>
        </div>
        <div className="min-w-0 pt-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
            {eyebrow}
          </p>
          <h1 className="truncate font-display text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-xl">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  );
}
