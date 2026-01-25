'use client'

import { CMSBlock } from '@/app/types/cms-blocks';
import { HeroBlockRenderer } from './HeroBlock';
import { TextBlockRenderer } from './TextBlock';
import { ImageBlockRenderer } from './ImageBlock';
import { VideoBlockRenderer } from './VideoBlock';
import { CtaBlockRenderer } from './CtaBlock';
import { FeaturesBlockRenderer } from './FeaturesBlock';
import { DividerBlockRenderer } from './DividerBlock';
import { SpacerBlockRenderer } from './SpacerBlock';

interface BlockRendererProps {
  block: CMSBlock;
  preview?: boolean;
}

export function BlockRenderer({ block, preview = false }: BlockRendererProps) {
  switch (block.type) {
    case 'hero':
      return <HeroBlockRenderer block={block} preview={preview} />;
    case 'text':
      return <TextBlockRenderer block={block} preview={preview} />;
    case 'image':
      return <ImageBlockRenderer block={block} preview={preview} />;
    case 'video':
      return <VideoBlockRenderer block={block} preview={preview} />;
    case 'cta':
      return <CtaBlockRenderer block={block} preview={preview} />;
    case 'features':
      return <FeaturesBlockRenderer block={block} preview={preview} />;
    case 'divider':
      return <DividerBlockRenderer block={block} preview={preview} />;
    case 'spacer':
      return <SpacerBlockRenderer block={block} preview={preview} />;
    default:
      return null;
  }
}










