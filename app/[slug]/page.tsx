import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
// import VideoSection from "@/app/components/dashboard/VideoSection"; // DELETED - videos removed

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: pages } = await supabase.from('pages').select('slug');
  return pages?.map(({ slug }) => ({ slug })) || [];
}

export default async function DynamicPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: page } = await supabase
    .from('pages')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (!page) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{page.title}</h1>
      <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: page.content }} />
    </div>
  );
}
