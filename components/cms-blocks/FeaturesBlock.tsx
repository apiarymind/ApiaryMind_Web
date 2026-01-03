'use client'

import { FeaturesBlock as FeaturesBlockType } from '@/app/types/cms-blocks';

interface Props {
  block: FeaturesBlockType;
  preview?: boolean;
}

export function FeaturesBlockRenderer({ block, preview = false }: Props) {
  const { title, subtitle, features, columns = 3 } = block.props;

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns];

  return (
    <section className="py-12 md:py-16 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-amber-950 dark:text-white mb-4 text-center">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="text-lg text-amber-900/80 dark:text-gray-300 mb-12 text-center max-w-2xl mx-auto">
            {subtitle}
          </p>
        )}
        <div className={`grid ${gridCols} gap-6 md:gap-8`}>
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/60 dark:bg-white/5 backdrop-blur-md border border-amber-900/10 dark:border-white/10 rounded-xl p-6 shadow-lg"
            >
              {feature.icon && (
                <div className="text-4xl mb-4">{feature.icon}</div>
              )}
              <h3 className="text-xl font-bold text-amber-950 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-amber-900/70 dark:text-gray-300">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}



