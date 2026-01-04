'use client'

import { CMSBlock } from '@/app/types/cms-blocks';
import { HeroBlock, TextBlock, ImageBlock, VideoBlock, CtaBlock, FeaturesBlock, DividerBlock, SpacerBlock } from '@/app/types/cms-blocks';

interface Props {
  block: CMSBlock;
  onChange: (block: CMSBlock) => void;
}

export function BlockPropertiesEditor({ block, onChange }: Props) {
  const updateProps = (newProps: any) => {
    onChange({
      ...block,
      props: { ...block.props, ...newProps },
    } as CMSBlock);
  };

  switch (block.type) {
    case 'hero':
      return <HeroPropertiesEditor block={block as HeroBlock} onChange={updateProps} />;
    case 'text':
      return <TextPropertiesEditor block={block as TextBlock} onChange={updateProps} />;
    case 'image':
      return <ImagePropertiesEditor block={block as ImageBlock} onChange={updateProps} />;
    case 'video':
      return <VideoPropertiesEditor block={block as VideoBlock} onChange={updateProps} />;
    case 'cta':
      return <CtaPropertiesEditor block={block as CtaBlock} onChange={updateProps} />;
    case 'features':
      return <FeaturesPropertiesEditor block={block as FeaturesBlock} onChange={updateProps} />;
    case 'divider':
      return <DividerPropertiesEditor block={block as DividerBlock} onChange={updateProps} />;
    case 'spacer':
      return <SpacerPropertiesEditor block={block as SpacerBlock} onChange={updateProps} />;
    default:
      return <div className="text-white/60 text-sm">Edytor właściwości dla tego typu bloku</div>;
  }
}

function HeroPropertiesEditor({ block, onChange }: { block: HeroBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">Tytuł</label>
        <input
          type="text"
          value={block.props.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Podtytuł</label>
        <input
          type="text"
          value={block.props.subtitle || ''}
          onChange={(e) => onChange({ subtitle: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Opis</label>
        <textarea
          value={block.props.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Tekst przycisku głównego</label>
        <input
          type="text"
          value={block.props.primaryButtonText || ''}
          onChange={(e) => onChange({ primaryButtonText: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Link przycisku głównego</label>
        <input
          type="text"
          value={block.props.primaryButtonLink || ''}
          onChange={(e) => onChange({ primaryButtonLink: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
    </div>
  );
}

function TextPropertiesEditor({ block, onChange }: { block: TextBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">Treść (HTML)</label>
        <textarea
          value={block.props.content}
          onChange={(e) => onChange({ content: e.target.value })}
          rows={6}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm font-mono"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Wyrównanie</label>
        <select
          value={block.props.align || 'left'}
          onChange={(e) => onChange({ align: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        >
          <option value="left">Lewo</option>
          <option value="center">Środek</option>
          <option value="right">Prawo</option>
        </select>
      </div>
    </div>
  );
}

function ImagePropertiesEditor({ block, onChange }: { block: ImageBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">URL obrazu</label>
        <input
          type="text"
          value={block.props.src}
          onChange={(e) => onChange({ src: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Alt tekst</label>
        <input
          type="text"
          value={block.props.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Podpis</label>
        <input
          type="text"
          value={block.props.caption || ''}
          onChange={(e) => onChange({ caption: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
    </div>
  );
}

function VideoPropertiesEditor({ block, onChange }: { block: VideoBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">URL YouTube</label>
        <input
          type="text"
          value={block.props.youtubeUrl || ''}
          onChange={(e) => onChange({ youtubeUrl: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
          placeholder="https://youtube.com/watch?v=..."
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Tytuł</label>
        <input
          type="text"
          value={block.props.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
    </div>
  );
}

function CtaPropertiesEditor({ block, onChange }: { block: CtaBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">Tytuł</label>
        <input
          type="text"
          value={block.props.title}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Opis</label>
        <textarea
          value={block.props.description || ''}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={2}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Tekst przycisku</label>
        <input
          type="text"
          value={block.props.buttonText}
          onChange={(e) => onChange({ buttonText: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Link przycisku</label>
        <input
          type="text"
          value={block.props.buttonLink}
          onChange={(e) => onChange({ buttonLink: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
    </div>
  );
}

function FeaturesPropertiesEditor({ block, onChange }: { block: FeaturesBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">Tytuł</label>
        <input
          type="text"
          value={block.props.title || ''}
          onChange={(e) => onChange({ title: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
      <div>
        <label className="block text-white/70 mb-1 text-xs">Liczba kolumn</label>
        <select
          value={block.props.columns || 3}
          onChange={(e) => onChange({ columns: parseInt(e.target.value) })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
        </select>
      </div>
      <div className="text-white/60 text-xs">
        Edycja funkcji wymaga rozszerzenia edytora
      </div>
    </div>
  );
}

function DividerPropertiesEditor({ block, onChange }: { block: DividerBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">Styl</label>
        <select
          value={block.props.style || 'solid'}
          onChange={(e) => onChange({ style: e.target.value })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        >
          <option value="solid">Ciągła</option>
          <option value="dashed">Przerywana</option>
          <option value="dotted">Kropkowana</option>
        </select>
      </div>
    </div>
  );
}

function SpacerPropertiesEditor({ block, onChange }: { block: SpacerBlock; onChange: (props: any) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-white/70 mb-1 text-xs">Wysokość (px)</label>
        <input
          type="number"
          value={block.props.height}
          onChange={(e) => onChange({ height: parseInt(e.target.value) || 40 })}
          className="w-full px-2 py-1.5 bg-black/40 border border-white/20 rounded text-white text-sm"
        />
      </div>
    </div>
  );
}




