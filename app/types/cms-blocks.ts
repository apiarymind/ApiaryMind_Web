/**
 * CMS Block Types and Interfaces
 */

export type BlockType = 
  | 'hero'
  | 'text'
  | 'image'
  | 'video'
  | 'cta'
  | 'features'
  | 'pricing'
  | 'testimonials'
  | 'gallery'
  | 'divider'
  | 'spacer';

export interface BaseBlock {
  id: string;
  type: BlockType;
  order: number;
}

export interface HeroBlock extends BaseBlock {
  type: 'hero';
  props: {
    title: string;
    subtitle?: string;
    description?: string;
    primaryButtonText?: string;
    primaryButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    backgroundImage?: string;
    backgroundColor?: string;
  };
}

export interface TextBlock extends BaseBlock {
  type: 'text';
  props: {
    content: string;
    align?: 'left' | 'center' | 'right';
    fontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    fontWeight?: 'normal' | 'bold';
  };
}

export interface ImageBlock extends BaseBlock {
  type: 'image';
  props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    align?: 'left' | 'center' | 'right';
    caption?: string;
  };
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  props: {
    youtubeUrl?: string;
    videoUrl?: string;
    title?: string;
    description?: string;
  };
}

export interface CtaBlock extends BaseBlock {
  type: 'cta';
  props: {
    title: string;
    description?: string;
    buttonText: string;
    buttonLink: string;
    backgroundColor?: string;
    textColor?: string;
  };
}

export interface FeaturesBlock extends BaseBlock {
  type: 'features';
  props: {
    title?: string;
    subtitle?: string;
    features: Array<{
      icon?: string;
      title: string;
      description: string;
    }>;
    columns?: 1 | 2 | 3 | 4;
  };
}

export interface PricingBlock extends BaseBlock {
  type: 'pricing';
  props: {
    title?: string;
    subtitle?: string;
    showCta?: boolean;
  };
}

export interface TestimonialsBlock extends BaseBlock {
  type: 'testimonials';
  props: {
    title?: string;
    testimonials: Array<{
      author: string;
      role?: string;
      content: string;
      avatar?: string;
    }>;
  };
}

export interface GalleryBlock extends BaseBlock {
  type: 'gallery';
  props: {
    title?: string;
    images: Array<{
      src: string;
      alt: string;
      caption?: string;
    }>;
    columns?: 2 | 3 | 4;
  };
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  props: {
    style?: 'solid' | 'dashed' | 'dotted';
    color?: string;
    thickness?: number;
  };
}

export interface SpacerBlock extends BaseBlock {
  type: 'spacer';
  props: {
    height: number;
  };
}

export type CMSBlock = 
  | HeroBlock
  | TextBlock
  | ImageBlock
  | VideoBlock
  | CtaBlock
  | FeaturesBlock
  | PricingBlock
  | TestimonialsBlock
  | GalleryBlock
  | DividerBlock
  | SpacerBlock;

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  description?: string;
  blocks: CMSBlock[];
  published: boolean;
  created_at: string;
  updated_at: string;
}










