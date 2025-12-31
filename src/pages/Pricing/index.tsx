import { useState } from "react";
import PublicLayout from "../../components/wrapper/PublicLayout";
import { Button } from "../../components";
import { COLORS } from "../../constants";

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period?: string;
  buttonText: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$ 0",
    buttonText: "Continue",
  },
  {
    id: "premium",
    name: "Premium",
    price: "$ 299",
    period: "Yearly",
    buttonText: "Pay Now",
  },
];

const Pricing = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const handleCardClick = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleButtonClick = (plan: PricingPlan) => {
    console.log("Selected plan:", plan.name);
    // Handle plan selection logic here
  };

  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
            >
              Choose The Right Plan For Your Agency
            </h1>
            <p
              className="text-sm md:text-base"
              style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
            >
              Explore Features Included In Your Current Plan. Upgrade Anytime To Unlock More Capabilities.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {pricingPlans.map((plan) => {
              const isSelected = selectedPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  onClick={() => handleCardClick(plan.id)}
                  className="rounded-2xl p-6 md:p-8 flex flex-col cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: COLORS.surface,
                    border: `2px solid ${isSelected ? COLORS.accent : COLORS.border}`,
                    boxShadow: isSelected
                      ? `0 4px 20px ${COLORS.accent}30`
                      : "0 4px 20px rgba(0, 0, 0, 0.05)",
                  }}
                >
                  {/* Plan Name */}
                  <h2
                    className="text-lg font-semibold mb-2"
                    style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
                  >
                    {plan.name}
                  </h2>

                  {/* Price */}
                  <div className="mb-6">
                    <span
                      className="text-3xl md:text-4xl font-bold"
                      style={{ color: COLORS.accent, fontFamily: "'Inter', sans-serif" }}
                    >
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span
                        className="text-lg md:text-xl ml-1"
                        style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
                      >
                        / {plan.period}
                      </span>
                    )}
                  </div>

                  {/* Divider */}
                  <div
                    className="w-full h-px mb-6"
                    style={{ backgroundColor: COLORS.border }}
                  />

                  {/* Spacer to push button to bottom */}
                  <div className="grow" />

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
      </div>
    </PublicLayout>
  );
};

export default Pricing;
