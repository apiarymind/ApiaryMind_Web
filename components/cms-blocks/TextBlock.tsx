'use client'

import { TextBlock as TextBlockType } from '@/app/types/cms-blocks';

interface Props {
  block: TextBlockType;
  preview?: boolean;
}

export function TextBlockRenderer({ block, preview = false }: Props) {
  const { content, align = 'left', fontSize = 'base', fontWeight = 'normal' } = block.props;

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[align];

  const fontSizeClass = {
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl'
  }[fontSize];

  const fontWeightClass = fontWeight === 'bold' ? 'font-bold' : 'font-normal';

  return (
    <section className="py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <div 
          className={`${alignClass} ${fontSizeClass} ${fontWeightClass} text-amber-950 dark:text-white prose prose-amber dark:prose-invert max-w-none`}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}



