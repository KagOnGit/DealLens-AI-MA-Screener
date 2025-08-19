import { ReactNode } from 'react';
import { Link as LinkIcon } from 'lucide-react';

interface SectionProps {
  id: string;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Section({ id, title, children, className = '' }: SectionProps) {
  return (
    <section id={id} className={`scroll-mt-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl font-semibold text-white/92">
          {title}
        </h2>
        <a 
          href={`#${id}`} 
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 transition-all focus:opacity-100 focus:ring-2 focus:ring-emerald-500/20"
          aria-label={`Link to ${title} section`}
        >
          <LinkIcon className="w-4 h-4 text-white/45" />
        </a>
      </div>
      <div className="group">
        {children}
      </div>
    </section>
  );
}
