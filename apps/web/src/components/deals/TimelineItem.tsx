import { ReactNode } from 'react';

interface TimelineItemProps {
  date: string;
  title: string;
  description?: string;
  tag: string;
  tagColor: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  isLast?: boolean;
}

const tagColorMap = {
  'blue': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'orange': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'purple': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'green': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'red': 'bg-red-500/10 text-red-400 border-red-500/20',
  'gray': 'bg-white/5 text-white/65 border-white/10'
} as const;

export function TimelineItem({ date, title, description, tag, tagColor, isLast = false }: TimelineItemProps) {
  const tagStyle = tagColorMap[tagColor] || tagColorMap.gray;
  
  return (
    <div className="relative group">
      {/* Connecting line */}
      {!isLast && (
        <div className="absolute left-3 top-8 w-px h-full bg-white/10" />
      )}
      
      <div className="flex gap-4 hover:bg-white/[0.02] rounded-lg p-3 -m-3 transition-colors">
        {/* Timeline dot */}
        <div className="flex-shrink-0">
          <div className="w-6 h-6 rounded-full bg-white/5 border-2 border-white/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/60" />
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-white/92 text-base">
              {title}
            </h3>
            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${tagStyle}`}>
              {tag}
            </span>
          </div>
          
          {description && (
            <p className="text-white/65 text-sm mb-2 leading-relaxed">
              {description}
            </p>
          )}
          
          <time className="text-xs text-white/45 font-medium">
            {date}
          </time>
        </div>
      </div>
    </div>
  );
}
