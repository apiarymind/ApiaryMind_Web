'use client'

import Image from 'next/image';

interface PhoneMockupProps {
  screenshot: string;
  title: string;
  color: string;
}

export function PhoneMockup({ screenshot, title, color }: PhoneMockupProps) {
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
              <Image 
                src={screenshot} 
                alt={title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
      <h3 className="text-lg md:text-xl font-bold mb-2 text-amber-950 dark:text-white text-center">{title}</h3>
    </div>
  );
}



