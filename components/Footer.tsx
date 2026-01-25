import SocialMediaFooter from './SocialMediaFooter';
import type { AllSocialMedia } from '@/app/actions/get-social-media-all';

export default function Footer({ socialMedia }: { socialMedia: AllSocialMedia[] }) {
  return (
    <footer className="relative z-40 mt-8 pb-4">
      <div className="max-w-6xl mx-auto px-4 py-4 text-sm text-amber-950/50 dark:text-white/50">
        <div className="flex flex-col gap-4 items-center">
          {/* Ikony social media na środku */}
          <div className="flex justify-center">
            <SocialMediaFooter socialMedia={socialMedia} />
          </div>
          
          {/* Linki i copyright na dole */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 w-full">
            <span>© {new Date().getFullYear()} ApiaryMind. Wszystkie prawa zastrzeżone.</span>
            <div className="flex gap-2">
              <a href="/regulamin" className="hover:text-primary transition-colors">Regulamin</a>
              <a href="/polityka-prywatnosci" className="hover:text-primary transition-colors">Polityka prywatności</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

