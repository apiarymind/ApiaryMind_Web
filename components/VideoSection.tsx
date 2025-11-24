"use client";

import { useState } from "react";

interface Video {
  id: number;
  title: string;
  description: string;
  youtubeId: string;
  category: string;
}

// Przykładowe dane - normalnie pobierane z API
const MOCK_VIDEOS: Video[] = [
  { id: 1, title: "Jak przygotować ule do zimy?", description: "Kompletny poradnik o karmieniu i ocieplaniu.", youtubeId: "dummy1", category: "Poradniki" },
  { id: 2, title: "Wiosenny przegląd pasieki", description: "Co sprawdzić przy pierwszym otwarciu ula.", youtubeId: "dummy2", category: "Poradniki" },
  { id: 3, title: "Obsługa aplikacji ApiaryMind", description: "Szybki start z nowym systemem.", youtubeId: "dummy3", category: "Tutoriale" },
];

export default function VideoSection() {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-amber-500 mb-6 flex items-center gap-2">
        🎬 Filmy i Poradniki
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_VIDEOS.map(video => (
          <div key={video.id} className="bg-brown-800 border border-brown-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow group cursor-pointer" onClick={() => setSelectedVideo(video)}>
            <div className="aspect-video bg-black flex items-center justify-center relative">
               <img 
                 src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`} 
                 alt={video.title}
                 className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                 onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/320x180?text=Video")}
               />
               <div className="absolute inset-0 flex items-center justify-center">
                 <div className="w-12 h-12 bg-amber-500/80 rounded-full flex items-center justify-center text-brown-900 pl-1 group-hover:scale-110 transition-transform">
                   ▶
                 </div>
               </div>
            </div>
            <div className="p-4">
               <div className="text-xs text-amber-500/80 mb-1 uppercase font-bold">{video.category}</div>
               <h3 className="font-bold text-amber-100 mb-2 leading-tight">{video.title}</h3>
               <p className="text-sm text-amber-200/60 line-clamp-2">{video.description}</p>
            </div>
          </div>
        ))}
      </div>

      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedVideo(null)}>
           <div className="bg-brown-900 border border-brown-700 rounded-xl overflow-hidden w-full max-w-4xl shadow-2xl" onClick={e => e.stopPropagation()}>
             <div className="p-3 border-b border-brown-700 flex justify-between items-center bg-brown-800">
               <h3 className="font-bold text-amber-100">{selectedVideo.title}</h3>
               <button onClick={() => setSelectedVideo(null)} className="text-amber-200 hover:text-white px-2">✕</button>
             </div>
             <div className="aspect-video bg-black">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?autoplay=1`} 
                  title={selectedVideo.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
             </div>
             <div className="p-4">
               <p className="text-amber-100/80">{selectedVideo.description}</p>
             </div>
           </div>
        </div>
      )}
    </section>
  );
}
