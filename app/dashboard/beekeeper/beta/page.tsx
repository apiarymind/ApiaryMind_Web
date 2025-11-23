import { getBetaScenarios } from "../../../../lib/apiServices";
import BetaClient from "./BetaClient";

export default async function BetaPage() {
  const scenarios = await getBetaScenarios();
  return <BetaClient scenarios={scenarios} />;
}
