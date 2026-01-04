'use client'

import { VideoBlock as VideoBlockType } from '@/app/types/cms-blocks';

interface Props {
  block: VideoBlockType;
  preview?: boolean;
}

function getYoutubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export function VideoBlockRenderer({ block, preview = false }: Props) {
  const { youtubeUrl, videoUrl, title, description } = block.props;

  return (
    <section className="py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {title && (
          <h2 className="text-2xl font-bold text-amber-950 dark:text-white mb-4 text-center">
            {title}
          </h2>
        )}
        {description && (
          <p className="text-amber-900/80 dark:text-gray-300 mb-6 text-center">
            {description}
          </p>
        )}
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          {youtubeUrl && (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${getYoutubeId(youtubeUrl)}`}
              title={title || 'Video'}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )}
          {videoUrl && !youtubeUrl && (
            <video controls className="w-full h-full">
              <source src={videoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
        </div>
      </div>
    </section>
  );
}





