'use client';

import type { CardStyles } from '@/types/theme';
import { CardStyleEditor } from './CardStyleEditor';

interface CardStylesEditorProps {
  cards: CardStyles;
  onChange: (cards: CardStyles) => void;
}

export function CardStylesEditor({ cards, onChange }: CardStylesEditorProps) {
  const updateCardStyle = (type: keyof CardStyles, cardStyle: typeof cards.default) => {
    onChange({
      ...cards,
      [type]: cardStyle,
    });
  };

  return (
    <div className="space-y-6">
      {/* Domyślny styl karty */}
      <CardStyleEditor
        cardStyle={cards.default}
        onChange={(style) => updateCardStyle('default', style)}
        title="📦 Styl Domyślny"
        description="Główny styl używany dla większości kart w aplikacji"
      />

      {/* Styl akcentujący */}
      <CardStyleEditor
        cardStyle={cards.accent}
        onChange={(style) => updateCardStyle('accent', style)}
        title="⭐ Styl Akcentujący"
        description="Styl dla kart wymagających większego wyróżnienia"
      />

      {/* Styl featured */}
      <CardStyleEditor
        cardStyle={cards.featured}
        onChange={(style) => updateCardStyle('featured', style)}
        title="🌟 Styl Featured"
        description="Styl dla najbardziej wyróżnionych kart (np. promocje, ważne informacje)"
      />
    </div>
  );
}

