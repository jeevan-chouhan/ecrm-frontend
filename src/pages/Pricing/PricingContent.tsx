import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components";
import { COLORS, ROUTES } from "../../constants";
import { Check, Close } from "../../assets";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  monthlyPrice: string;
  monthlySubtext: string;
  annualPrice: string;
  annualSubtext: string;
  studentLimit: string;
  features: PlanFeature[];
  buttonText: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "pro",
    name: "Agency Pro",
    badge: "Most Popular",
    badgeColor: COLORS.badgeGold,
    description: "Designed for growing teams needing collaboration and automation.",
    monthlyPrice: "$50",
    monthlySubtext: "/month billed monthly",
    annualPrice: "$420",
    annualSubtext: "/year billed annually",
    studentLimit: "Up to 50 Students",
    features: [
      { text: "Manual student data entry", included: true },
      { text: "Internal document upload", included: true },
      { text: "Visa status tracking", included: true },
      { text: "Magic links for visa updates & document upload", included: true },
      { text: "Sub-Agent Portal for collaboration", included: true },
      { text: "Morning War Room financial alert modal", included: true },
      { text: "Improved commission visibility", included: true },
      { text: "Faster operational workflows", included: true },
      { text: "Standard support response time", included: true },
    ],
    buttonText: "Start Free 14-Day Trial",
  },
  {
    id: "prime",
    name: "Agency Prime",
    badge: "Best Value",
    badgeColor: COLORS.badgePurple,
    description: "For established agencies requiring unlimited scale and priority support.",
    monthlyPrice: "$250",
    monthlySubtext: "/month billed monthly",
    annualPrice: "$2388",
    annualSubtext: "/year billed annually (2 months free)",
    studentLimit: "Unlimited Students",
    features: [
      { text: "All Pro features", included: true },
      { text: "Fastest & optimized workflows", included: true },
      { text: "Priority Support Badge", included: true },
      { text: "Priority response time", included: true },
      { text: "Dedicated support queue", included: true },
      { text: "Built for scale & stability", included: true },
      { text: "Custom integrations (coming soon)", included: true },
    ],
    buttonText: "Go Prime & Scale Unlimited",
  },
];

interface PricingContentProps {
  showHeader?: boolean;
  maxWidth?: string;
}

const PricingContent = ({ showHeader = true, maxWidth = "max-w-4xl" }: PricingContentProps) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleCardClick = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleButtonClick = (plan: PricingPlan) => {
    setSelectedPlan(plan.id);
    // Navigate to register page with selected plan
    navigate(ROUTES.REGISTER, { state: { selectedPlan: plan.id, planName: plan.name } });
  };

  return (
    <div className={`${maxWidth} mx-auto`}>
      {/* Header */}
      {showHeader && (
        <div className="text-center mb-10">
          <h1
            className="text-3xl md:text-4xl font-bold mb-4"
            style={{ color: COLORS.textDark }}
          >
            Choose The Right Plan For Your Agency
          </h1>
          <p
            className="text-base md:text-lg max-w-2xl mx-auto mb-4"
            style={{ color: COLORS.textMuted }}
          >
            Explore features included in your current plan. Upgrade anytime to unlock more capabilities.
          </p>
          <p className="text-xs" style={{ color: COLORS.textMuted }}>
            * Prices exclude applicable taxes (VAT/GST/Sales Tax), which will be calculated at checkout.
          </p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {pricingPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <div
              key={plan.id}
              onClick={() => handleCardClick(plan.id)}
              className="rounded-2xl p-6 flex flex-col relative transition-all duration-200 hover:shadow-xl cursor-pointer"
              style={{
                backgroundColor: COLORS.surface,
                border: isSelected
                  ? `2px solid ${COLORS.accent}`
                  : `1px solid ${COLORS.border}`,
                boxShadow: isSelected
                  ? `0 8px 30px ${COLORS.accent}25`
                  : "0 4px 20px rgba(0, 0, 0, 0.05)",
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold"
                  style={{
                    backgroundColor: plan.badgeColor,
                    color: plan.badgeColor === COLORS.badgeGold ? COLORS.textDark : "white",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan Name */}
              <h2
                className="text-xl font-bold mb-2 mt-2"
                style={{ color: COLORS.textDark }}
              >
                {plan.name}
              </h2>

              {/* Description */}
              <p
                className="text-sm mb-4 min-h-[48px]"
                style={{ color: COLORS.textMuted }}
              >
                {plan.description}
              </p>

              {/* Monthly Price */}
              <div className="mb-1">
                <span
                  className="text-3xl font-bold"
                  style={{ color: COLORS.textDark }}
                >
                  {plan.monthlyPrice}
                </span>
                <span
                  className="text-sm ml-1"
                  style={{ color: COLORS.textMuted }}
                >
                  {plan.monthlySubtext}
                </span>
              </div>

              {/* Annual Price */}
              <div className="mb-4">
                <span
                  className="text-3xl font-bold"
                  style={{ color: COLORS.textDark }}
                >
                  {plan.annualPrice}
                </span>
                <span
                  className="text-sm ml-1"
                  style={{ color: COLORS.textMuted }}
                >
                  {plan.annualSubtext}
                </span>
              </div>

              {/* Divider */}
              <div
                className="w-full h-px my-4"
                style={{ backgroundColor: COLORS.border }}
              />

              {/* Student Limit */}
              <p
                className="text-sm font-medium mb-4 flex items-center gap-2"
                style={{ color: COLORS.accent }}
              >
                <Check className="h-4 w-4" />
                Limit: {plan.studentLimit}
              </p>

              {/* Features */}
              <ul className="space-y-3 mb-6 grow">
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm"
                    style={{ color: feature.included ? COLORS.textDark : COLORS.textMuted }}
                  >
                    {feature.included ? (
                      <Check className="h-4 w-4 mt-0.5 shrink-0" style={{ color: COLORS.accent }} />
                    ) : (
                      <Close className="h-4 w-4 mt-0.5 shrink-0" style={{ color: COLORS.textMuted }} />
                    )}
                    <span className={!feature.included ? "line-through" : ""}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Button */}
              <Button
                variant="accent"
                size="lg"
                fullWidth
                rounded
                onClick={(e) => {
                  e.stopPropagation();
                  handleButtonClick(plan);
                }}
              >
                {plan.buttonText}
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricingContent;
