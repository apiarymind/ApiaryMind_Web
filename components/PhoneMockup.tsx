'use client'

import { useState } from 'react';

interface PhoneMockupProps {
  screenshot: string;
  title: string;
  color: string;
}

export function PhoneMockup({ screenshot, title, color }: PhoneMockupProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="flex flex-col items-center">
      {/* Phone Mockup Frame */}
      <div className="relative w-full max-w-[280px] mx-auto mb-4">
        {/* Phone Frame */}
        <div className="relative bg-gradient-to-b from-gray-800 to-gray-900 rounded-[2.5rem] p-2 shadow-2xl">
          {/* Screen Bezel */}
          <div className="bg-black rounded-[2rem] overflow-hidden">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-10"></div>
            {/* Screen Content */}
            <div className="aspect-[9/19.5] bg-gradient-to-br from-gray-900 to-black relative overflow-hidden">
              {!imageError ? (
                <img 
                  src={screenshot} 
                  alt={title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${color}`}>
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="text-white/60 text-sm">Screenshot aplikacji</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <h3 className="text-lg md:text-xl font-bold mb-2 text-amber-950 dark:text-white text-center">{title}</h3>
    </div>
  );
}


