import { getActiveSurvey } from '@/app/actions/surveys';
import { GlassCard } from '@/app/components/ui/GlassCard';

export default async function SurveyBanner() {
  const survey = await getActiveSurvey();

  if (!survey) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in-up">
      <GlassCard className="p-6 max-w-sm bg-black/80 backdrop-blur-xl border border-primary/40 shadow-2xl relative overflow-hidden group">
         {/* Decorative Glow */}
         <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 bg-primary/20 blur-2xl rounded-full group-hover:bg-primary/30 transition-colors"></div>

         <div className="relative z-10">
            <h3 className="text-lg font-bold text-primary mb-2">👋 Twoja opinia jest ważna!</h3>
            <p className="text-sm text-white/90 mb-4">{survey.question}</p>
            <a 
              href={survey.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block w-full bg-primary hover:bg-amber-400 text-brown-900 font-bold text-center py-2 rounded-lg transition-colors shadow-lg"
            >
              Wypełnij ankietę
            </a>
         </div>
      </GlassCard>
    </div>
  );
}
