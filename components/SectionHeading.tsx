
import React from 'react';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  light?: boolean;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ 
  title, 
  subtitle, 
  align = 'center',
  light = false
}) => {
  const alignmentClass = align === 'center' ? 'text-center mx-auto' : 'text-left';
  const titleColor = light ? 'text-white' : 'text-slate-900';
  const subtitleColor = light ? 'text-teal-50' : 'text-teal-700';

  return (
    <div className={`mb-8 max-w-3xl ${alignmentClass}`}>
      <h2 className={`text-3xl md:text-5xl font-serif font-bold mb-3 ${titleColor} tracking-tight`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-base md:text-xl font-light ${subtitleColor}`}>
          {subtitle}
        </p>
      )}
      <div className={`h-1.5 w-16 bg-teal-600 mt-4 ${align === 'center' ? 'mx-auto' : ''} ${light ? 'bg-white' : ''}`}></div>
    </div>
  );
};
