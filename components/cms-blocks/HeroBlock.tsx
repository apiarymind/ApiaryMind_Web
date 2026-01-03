'use client'

import { HeroBlock as HeroBlockType } from '@/app/types/cms-blocks';
import Link from 'next/link';

interface Props {
  block: HeroBlockType;
  preview?: boolean;
}

export function HeroBlockRenderer({ block, preview = false }: Props) {
  const { title, subtitle, description, primaryButtonText, primaryButtonLink, secondaryButtonText, secondaryButtonLink, backgroundImage, backgroundColor } = block.props;

  return (
    <section 
      className="relative py-16 md:py-24 px-4 md:px-6"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {backgroundImage && (
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}
      <div className="relative max-w-4xl mx-auto text-center">
        {title && (
          <h1 className="text-4xl md:text-6xl font-bold text-amber-950 dark:text-white mb-4">
            {title}
          </h1>
        )}
        {subtitle && (
          <h2 className="text-2xl md:text-3xl text-amber-800 dark:text-amber-200 mb-4">
            {subtitle}
          </h2>
        )}
        {description && (
          <p className="text-lg text-amber-900/80 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            {description}
          </p>
        )}
        {(primaryButtonText || secondaryButtonText) && (
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {primaryButtonText && primaryButtonLink && (
              <Link
                href={primaryButtonLink}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all"
              >
                {primaryButtonText}
              </Link>
            )}
            {secondaryButtonText && secondaryButtonLink && (
              <Link
                href={secondaryButtonLink}
                className="px-6 py-3 border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black font-bold rounded-xl transition-all"
              >
                {secondaryButtonText}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}


