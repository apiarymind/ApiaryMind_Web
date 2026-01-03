import { getActiveSurvey } from '@/app/actions/surveys';
import { getSessionUid } from '@/app/actions/auth-session';
import { getUserAssociations } from '@/app/actions/association-members';
import { GlassCard } from '@/app/components/ui/GlassCard';
import SurveyBannerClient from './SurveyBannerClient';
import SurveyCard from './SurveyCard';

export default async function SurveyBanner() {
  const uid = await getSessionUid();
  const isAuthenticated = !!uid;
  const userAssociationIds = uid ? await getUserAssociations(uid) : [];
  
  const survey = await getActiveSurvey(isAuthenticated, userAssociationIds);

  if (!survey) return null;

  // For non-authenticated users (landing page) - always show as center card
  if (!isAuthenticated) {
    return <SurveyCard survey={survey} />;
  }

  // For authenticated users (dashboard) - show as banner in corner
  return <SurveyBannerClient survey={survey} />;
}
