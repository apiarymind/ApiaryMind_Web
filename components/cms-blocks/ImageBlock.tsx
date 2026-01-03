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
            {width && height ? (
              <Image
                src={src}
                alt={alt || ''}
                width={typeof width === 'string' ? parseInt(width) : width}
                height={typeof height === 'string' ? parseInt(height) : height}
                className="rounded-xl shadow-lg object-cover"
                unoptimized
              />
            ) : (
              <div className="relative w-full" style={{ minHeight: '200px' }}>
                <Image
                  src={src}
                  alt={alt || ''}
                  fill
                  className="rounded-xl shadow-lg object-cover"
                  unoptimized
                />
              </div>
            )}
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



