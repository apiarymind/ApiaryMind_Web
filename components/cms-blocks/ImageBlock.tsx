'use client'

import { ImageBlock as ImageBlockType } from '@/app/types/cms-blocks';
import Image from 'next/image';

interface Props {
  block: ImageBlockType;
  preview?: boolean;
}

export function ImageBlockRenderer({ block, preview = false }: Props) {
  const { src, alt, width, height, align = 'center', caption } = block.props;

  const alignClass = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end'
  }[align];

  return (
    <section className="py-8 px-4 md:px-6">
      <div className={`max-w-6xl mx-auto flex ${alignClass}`}>
        <figure>
          <div className="relative" style={{ width: width || 'auto', height: height || 'auto' }}>
            <img
              src={src}
              alt={alt}
              className="rounded-xl shadow-lg"
              style={{ width: width || '100%', height: height || 'auto', objectFit: 'cover' }}
            />
          </div>
          {caption && (
            <figcaption className="text-sm text-amber-900/60 dark:text-gray-400 mt-2 text-center">
              {caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
}


