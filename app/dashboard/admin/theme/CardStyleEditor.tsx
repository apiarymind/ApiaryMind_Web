'use client';

import type { CardStyle } from '@/types/theme';

interface CardStyleEditorProps {
  cardStyle: CardStyle;
  onChange: (cardStyle: CardStyle) => void;
  title: string;
  description?: string;
}

export function CardStyleEditor({ cardStyle, onChange, title, description }: CardStyleEditorProps) {
  const updateField = <K extends keyof CardStyle>(key: K, value: CardStyle[K]) => {
    onChange({
      ...cardStyle,
      [key]: value,
    });
  };

  return (
    <div className="space-y-4 p-4 border border-white/10 rounded-lg">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-text-dark dark:text-amber-100">{title}</h3>
        {description && (
          <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">{description}</p>
        )}
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Border Radius: {cardStyle.borderRadius}px
        </label>
        <input
          type="range"
          min="0"
          max="32"
          step="1"
          value={cardStyle.borderRadius}
          onChange={(e) => updateField('borderRadius', parseInt(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Border Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor obramowania:
        </label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={cardStyle.borderColor}
            onChange={(e) => updateField('borderColor', e.target.value)}
            className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
          />
          <input
            type="text"
            value={cardStyle.borderColor}
            onChange={(e) => updateField('borderColor', e.target.value)}
            className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
            placeholder="#E6D5B8"
          />
        </div>
      </div>

      {/* Border Width */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Szerokość obramowania: {cardStyle.borderWidth}px
        </label>
        <input
          type="range"
          min="0"
          max="8"
          step="1"
          value={cardStyle.borderWidth}
          onChange={(e) => updateField('borderWidth', parseInt(e.target.value))}
          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Kolor tła kafelka:
        </label>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={cardStyle.backgroundColor || ''}
              onChange={(e) => updateField('backgroundColor', e.target.value || null)}
              className="flex-1 bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
              placeholder="rgba(255, 255, 255, 0.7) lub hex, pozostaw puste dla glass"
            />
            {cardStyle.backgroundColor && (
              <input
                type="color"
                value={cardStyle.backgroundColor.startsWith('#') ? cardStyle.backgroundColor : '#FFFFFF'}
                onChange={(e) => {
                  const hex = e.target.value;
                  const r = parseInt(hex.slice(1, 3), 16);
                  const g = parseInt(hex.slice(3, 5), 16);
                  const b = parseInt(hex.slice(5, 7), 16);
                  updateField('backgroundColor', `rgba(${r}, ${g}, ${b}, ${cardStyle.backgroundColorOpacity})`);
                }}
                className="w-16 h-10 rounded border-2 border-white/20 cursor-pointer"
              />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-text-dark dark:text-amber-100">
            <input
              type="checkbox"
              checked={!cardStyle.backgroundColor}
              onChange={(e) => updateField('backgroundColor', e.target.checked ? null : 'rgba(255, 255, 255, 0.7)')}
              className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer"
            />
            <span>Użyj efektu glass (przezroczyste tło)</span>
          </label>
        </div>
      </div>

      {/* Background Opacity */}
      {cardStyle.backgroundColor && (
        <div>
          <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
            Przezroczystość tła: {Math.round(cardStyle.backgroundColorOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={cardStyle.backgroundColorOpacity}
            onChange={(e) => updateField('backgroundColorOpacity', parseFloat(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}

      {/* Opacity dla glass effect */}
      {!cardStyle.backgroundColor && (
        <div>
          <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
            Przezroczystość glass: {Math.round(cardStyle.backgroundColorOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={cardStyle.backgroundColorOpacity}
            onChange={(e) => updateField('backgroundColorOpacity', parseFloat(e.target.value))}
            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
          />
        </div>
      )}

      {/* Blur */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          <input
            type="checkbox"
            checked={cardStyle.blurEnabled}
            onChange={(e) => updateField('blurEnabled', e.target.checked)}
            className="w-4 h-4 rounded border-white/20 accent-primary cursor-pointer"
          />
          <span>Włącz efekt rozmycia (backdrop-blur)</span>
        </label>
        {cardStyle.blurEnabled && (
          <>
            <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2 mt-2">
              Intensywność rozmycia: {cardStyle.blurAmount}px
            </label>
            <input
              type="range"
              min="0"
              max="40"
              step="1"
              value={cardStyle.blurAmount}
              onChange={(e) => updateField('blurAmount', parseInt(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </>
        )}
      </div>

      {/* Box Shadow */}
      <div>
        <label className="block text-sm font-medium text-text-dark dark:text-amber-100 mb-2">
          Cień (Box Shadow):
        </label>
        <input
          type="text"
          value={cardStyle.boxShadow}
          onChange={(e) => updateField('boxShadow', e.target.value)}
          className="w-full bg-white/50 dark:bg-black/40 border border-white/20 rounded px-3 py-2 text-sm text-text-dark dark:text-amber-100 font-mono outline-none focus:border-primary transition-colors"
          placeholder="0 4px 12px rgba(0, 0, 0, 0.1)"
        />
        <p className="text-xs text-text-dark/60 dark:text-amber-200/60 mt-1">
          CSS box-shadow value (np. &quot;0 4px 12px rgba(0, 0, 0, 0.1)&quot;)
        </p>
      </div>
    </div>
  );
}


