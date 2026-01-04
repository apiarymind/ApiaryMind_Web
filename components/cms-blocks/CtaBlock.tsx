'use client'

import { CtaBlock as CtaBlockType } from '@/app/types/cms-blocks';
import Link from 'next/link';

interface Props {
  block: CtaBlockType;
  preview?: boolean;
}

export function CtaBlockRenderer({ block, preview = false }: Props) {
  const { title, description, buttonText, buttonLink, backgroundColor, textColor } = block.props;

  return (
    <section 
      className="py-12 md:py-16 px-4 md:px-6 rounded-2xl my-8"
      style={backgroundColor ? { backgroundColor } : { backgroundColor: '#F59E0B' }}
    >
      <div className="max-w-2xl mx-auto text-center">
        {title && (
          <h2 
            className="text-3xl md:text-4xl font-bold mb-4"
            style={textColor ? { color: textColor } : { color: '#000000' }}
          >
            {title}
          </h2>
        )}
        {description && (
          <p 
            className="text-lg mb-8"
            style={textColor ? { color: textColor, opacity: 0.9 } : { color: '#000000', opacity: 0.9 }}
          >
            {description}
          </p>
        )}
        {buttonText && buttonLink && (
          <Link
            href={buttonLink}
            className="inline-block px-8 py-4 bg-black hover:bg-gray-800 text-white font-bold rounded-xl transition-all"
          >
            {buttonText}
          </Link>
        )}
      </div>
    </section>
  );
}




