"use client";

import { useState } from "react";

// Mock data
const mockVideos = [
  { id: "v1", title: "Jak dodać pasiekę?", description: "Krótki poradnik o dodawaniu pasieki w panelu.", youtubeId: "dQw4w9WgXcQ" },
  { id: "v2", title: "Rejestracja przeglądu", description: "Zobacz jak łatwo dodać przegląd głosowy.", youtubeId: "dQw4w9WgXcQ" },
];

export default function VideoTutorialSection() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-amber-500 mb-6">Poradniki Wideo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockVideos.map((video) => (
          <div key={video.id} className="bg-brown-800 rounded-xl overflow-hidden border border-brown-700 shadow-lg group hover:border-amber-500 transition-all">
            <div
              className="aspect-video bg-black relative cursor-pointer"
              onClick={() => setActiveVideo(video.youtubeId)}
            >
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-amber-500/80 rounded-full flex items-center justify-center pl-1 group-hover:scale-110 transition-transform">
                  ▶
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-amber-100 mb-2">{video.title}</h3>
              <p className="text-sm text-amber-200/60">{video.description}</p>
            </div>
          </div>
        ))}
      </div>

      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setActiveVideo(null)}>
          <div className="w-full max-w-4xl aspect-video relative bg-black rounded-xl overflow-hidden shadow-2xl">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${activeVideo}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
            <button
              className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
              onClick={() => setActiveVideo(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
