import { notFound } from 'next/navigation';
import { getVisualCMSPage } from '@/app/actions/visual-cms';
import { BlockRenderer } from '@/components/cms-blocks/BlockRenderer';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data: page } = await getVisualCMSPage(params.slug);
  
  if (!page) {
    return {
      title: 'Strona nie znaleziona | ApiaryMind',
    };
  }

  return {
    title: `${page.title} | ApiaryMind`,
    description: page.description || '',
  };
}

export default async function VisualCMSPage({ params }: { params: { slug: string } }) {
  const { data: page, error } = await getVisualCMSPage(params.slug);

  if (error || !page) {
    notFound();
  }

  if (!page.published) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Strona nie jest opublikowana</h1>
          <p className="text-white/60">Ta strona nie jest jeszcze dostępna publicznie.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {page.blocks.map((block) => (
        <BlockRenderer key={block.id} block={block} preview={false} />
      ))}
    </div>
  );
}



