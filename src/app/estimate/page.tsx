import { checkApplicationReadiness } from '@/lib/readiness';
import EstimateClient from './estimate-client';

export default async function EstimateLandingPage() {
  const readiness = await checkApplicationReadiness();
  return <EstimateClient readiness={readiness} />;
}
