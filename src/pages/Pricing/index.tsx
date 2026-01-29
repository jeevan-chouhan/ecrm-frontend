import { useLocation } from "react-router-dom";
import PublicLayout from "../../components/wrapper/PublicLayout";
import { Layout } from "../../components";
import { COLORS, ROUTES } from "../../constants";
import PricingContent from "./PricingContent";

interface LocationState {
  agencyId?: number;
  stripeLinks?: {
    agencyPrimeLink?: string;
    agencyPrimeYearlyLink?: string;
    agencyProYearlyLink?: string;
  };
}

const Pricing = () => {
  const location = useLocation();
  const state = location.state as LocationState | null;
  
  // Check if accessed from settings (protected route)
  const isProtectedRoute = location.pathname === ROUTES.SETTINGS_PRICING;

  // Wrapper component based on route
  const Wrapper = isProtectedRoute ? Layout : PublicLayout;

  // Get agencyId and stripe links from navigation state (passed from Register page)
  const agencyId = state?.agencyId;
  const stripeLinks = state?.stripeLinks;

  return (
    <Wrapper>
      <div
        className="min-h-[calc(100vh-4rem)] py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <PricingContent showHeader={true} stripeLinks={stripeLinks} agencyId={agencyId} />
      </div>
    </Wrapper>
  );
};

export default Pricing;
