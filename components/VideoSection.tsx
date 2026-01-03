"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getVideos } from "@/app/actions/videos";

interface Video {
  id: string;
  title: string;
  youtube_url: string;
}

export default function VideoSection() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    setLoading(true);
    const data = await getVideos(false); // Only published
    setVideos(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-8">
        <h2 className="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-2">
          🎬 Filmy i Poradniki
        </h2>
        <div className="text-white/60">Ładowanie...</div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-2">
        🎬 Filmy i Poradniki
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map(video => {
          // Extract YouTube ID from URL
          const youtubeIdMatch = video.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
          const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : '';
          
          return (
            <div key={video.id} className="bg-brown-800 border border-brown-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group cursor-pointer" onClick={() => setSelectedVideo(video)}>
              <div className="aspect-video bg-black flex items-center justify-center relative">
                 {youtubeId ? (
                   <>
                     <Image 
                       src={`https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`} 
                       alt={video.title}
                       fill
                       className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                       unoptimized
                     />
                     <div className="absolute inset-0 flex items-center justify-center">
                       <div className="w-12 h-12 bg-amber-500/80 rounded-full flex items-center justify-center text-brown-900 pl-1 group-hover:scale-110 transition-transform">
                         ▶
                       </div>
                     </div>
                   </>
                 ) : (
                   <div className="w-full h-full flex items-center justify-center text-amber-200/50">
                     <div className="text-center">
                       <div className="text-4xl mb-2">▶</div>
                       <div className="text-sm">YouTube Video</div>
                     </div>
                   </div>
                 )}
              </div>
              <div className="p-4">
                 <h3 className="font-bold text-amber-100 mb-2 leading-tight">{video.title}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedVideo(null)}>
           <div className="bg-brown-900 border border-brown-700 rounded-xl overflow-hidden w-full max-w-4xl shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="p-3 border-b border-brown-700 flex justify-between items-center bg-brown-800">
               <h3 className="font-bold text-amber-100">{selectedVideo.title}</h3>
               <button onClick={() => setSelectedVideo(null)} className="text-amber-200 hover:text-white px-2">✕</button>
             </div>
             <div className="aspect-video bg-black">
                {(() => {
                  const youtubeIdMatch = selectedVideo.youtube_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
                  const youtubeId = youtubeIdMatch ? youtubeIdMatch[1] : '';
                  return youtubeId ? (
                    <iframe 
                      width="100%" 
                      height="100%" 
                      src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`} 
                      title={selectedVideo.title}
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-amber-200/50">
                      Nieprawidłowy link YouTube
                    </div>
                  );
                })()}
             </div>
           </div>
        </div>
      )}
    </section>
  );
}
