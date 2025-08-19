import { ReactNode } from 'react';

interface DealDetailLayoutProps {
  children: ReactNode;
  aside?: ReactNode;
}

export function DealDetailLayout({ children, aside }: DealDetailLayoutProps) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="prose prose-invert max-w-none text-[17px] md:text-[18px] leading-7 md:leading-8 text-white/92">
            {children}
          </div>
        </div>
        
        {/* Sticky Aside */}
        {aside && (
          <div className="lg:col-span-4">
            <div className="sticky top-6">
              {aside}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
