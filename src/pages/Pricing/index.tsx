import { useLocation } from "react-router-dom";
import PublicLayout from "../../components/wrapper/PublicLayout";
import { Layout } from "../../components";
import { COLORS, ROUTES } from "../../constants";
import PricingContent from "./PricingContent";

const Pricing = () => {
  const location = useLocation();
  
  // Check if accessed from settings (protected route)
  const isProtectedRoute = location.pathname === ROUTES.SETTINGS_PRICING;

  // Wrapper component based on route
  const Wrapper = isProtectedRoute ? Layout : PublicLayout;

  return (
    <Wrapper>
      <div
        className="min-h-[calc(100vh-4rem)] py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <PricingContent showHeader={true} />
      </div>
    </Wrapper>
  );
};

export default Pricing;
