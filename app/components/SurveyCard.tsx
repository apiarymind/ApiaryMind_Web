'use client';

import { useState } from 'react';
import BuiltInSurveyForm from './BuiltInSurveyForm';
import { Survey } from '@/app/actions/surveys';
import { Gift, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface SurveyCardProps {
  survey: Survey;
}

export default function SurveyCard({ survey }: SurveyCardProps) {
  const isBuiltIn = survey.is_built_in || !survey.link;

  // For external surveys, show link button
  if (!isBuiltIn) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-8 md:pt-10">
        <div className="relative rounded-2xl p-6 md:p-12 overflow-hidden text-center border backdrop-blur-md transition-colors
                        bg-white/60 border-amber-900/10 text-amber-900/80
                        dark:bg-white/5 dark:border-white/10 dark:text-white/70">
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-amber-500 text-black font-bold text-[10px] md:text-xs px-3 py-1 rounded-full mb-4 md:mb-6 flex items-center gap-2 shadow-lg">
              <Gift size={12} className="md:w-3.5 md:h-3.5" /> ANKIETA
            </div>
            <h2 className="text-2xl md:text-5xl font-bold mb-4 md:mb-6 text-amber-950 dark:text-white drop-shadow-sm">
              {survey.question || survey.title}
            </h2>
            <Link
              href={survey.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 md:px-10 md:py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold text-base md:text-lg rounded-xl transition-all hover:scale-105 shadow-lg flex items-center gap-2"
            >
              Wypełnij ankietę <ArrowRight size={18} className="md:w-5 md:h-5" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // For built-in surveys, show form immediately
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pb-16 md:pb-24 pt-8 md:pt-10">
      <div className="relative rounded-2xl p-8 md:p-12 overflow-hidden border backdrop-blur-md transition-colors
                      bg-white/60 border-amber-900/10 text-amber-900/80
                      dark:bg-white/5 dark:border-white/10 dark:text-white/70">
        <div className="relative z-10">
          <BuiltInSurveyForm
            surveyId={survey.id}
            question={survey.question || survey.title}
            onClose={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

