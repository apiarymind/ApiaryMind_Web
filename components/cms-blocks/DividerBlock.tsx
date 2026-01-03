'use client'

import { DividerBlock as DividerBlockType } from '@/app/types/cms-blocks';

interface Props {
  block: DividerBlockType;
  preview?: boolean;
}

export function DividerBlockRenderer({ block, preview = false }: Props) {
  const { style = 'solid', color = '#D97706', thickness = 1 } = block.props;

  const borderStyle = {
    solid: 'solid',
    dashed: 'dashed',
    dotted: 'dotted'
  }[style];

  return (
    <section className="py-4 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        <hr
          style={{
            borderStyle,
            borderColor: color,
            borderWidth: `${thickness}px 0 0 0`,
            margin: 0
          }}
        />
      </div>
    </section>
  );
}


