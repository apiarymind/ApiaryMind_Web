'use client'

import { SpacerBlock as SpacerBlockType } from '@/app/types/cms-blocks';

interface Props {
  block: SpacerBlockType;
  preview?: boolean;
}

export function SpacerBlockRenderer({ block, preview = false }: Props) {
  const { height } = block.props;

  return <div style={{ height: `${height}px` }} />;
}



