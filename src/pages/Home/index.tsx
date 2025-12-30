import { Link } from "react-router-dom";
import { COLORS, hexToRgba } from "../../constants";
import { Button } from "../../components";
import { images, Chart, Pipeline, Customize, UserPlus, Admin, Form } from "../../assets";
import PublicHeader from "../../components/wrapper/Header/PublicHeader";

interface FeatureItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBg?: string;
  iconColor?: string;
}

const FeatureItem = ({
  icon,
  title,
  description,
  iconBg = COLORS.accent,
  iconColor = COLORS.textWhite,
}: FeatureItemProps) => (
  <div className="flex items-start gap-4">
    <div
      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
      style={{ backgroundColor: iconBg, color: iconColor }}
    >
      {icon}
    </div>
    <div>
      <h4
        className="font-semibold text-base mb-1"
        style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
      >
        {title}
      </h4>
      <p
        className="text-sm leading-relaxed"
        style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
      >
        {description}
      </p>
    </div>
  </div>
);

const Home = () => {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      {/* Public Header */}
      <PublicHeader />

      {/* Hero Section */}
      <section
        className="pt-24 pb-16 md:pt-32 md:pb-24 px-4 md:px-8 lg:px-12"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            {/* Left Content */}
            <div className="order-2 md:order-1">
              <h1
                className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
                style={{
                  color: COLORS.textDark,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Streamline Student Applications with Edu
                <span style={{ color: COLORS.accent }}>_Immigration_</span>CRM
              </h1>
              <p
                className="text-base md:text-lg mb-8 leading-relaxed"
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Manage your immigration agency efficiently with our comprehensive
                CRM solution. Track applications, manage candidates, and
                streamline your workflow.
              </p>
              <Link to="/register">
                <Button
                  variant="accent"
                  size="lg"
                  style={{
                    boxShadow: `0 4px 14px ${hexToRgba(COLORS.accent, 0.4)}`,
                  }}
                >
                  Try our Freemium model
                </Button>
              </Link>
            </div>

            {/* Right Content - Hero Image */}
            <div className="order-1 md:order-2">
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
                }}
              >
                <img
                  src={images.heroImage}
                  alt="CRM Dashboard Preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 1 - Unified Application Dashboard */}
      <section className="py-16 md:py-24 px-4 md:px-8 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Content */}
            <div>
              <h2
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{
                  color: COLORS.textDark,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Unified Application Dashboard
              </h2>
              <p
                className="text-base mb-8 leading-relaxed"
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Gain complete visibility into your admissions pipeline. Track
                every application from initial inquiry to final enrollment.
              </p>

              <div className="space-y-6">
                <FeatureItem
                  icon={<Chart className="w-5 h-5" />}
                  title="Real-time Insights"
                  description="Monitor application statuses, deadlines, and key metrics at a glance."
                />
                <FeatureItem
                  icon={<Pipeline className="w-5 h-5" />}
                  title="Pipeline Management"
                  description="Visualize and move applications through custom stages effortlessly."
                  iconBg={COLORS.secondary}
                />
                <FeatureItem
                  icon={<Customize className="w-5 h-5" />}
                  title="Customizable Views"
                  description="Filter and sort data to focus on what matters most to you."
                  iconBg={COLORS.accent}
                />
              </div>
            </div>

            {/* Right Content - Dashboard Image */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
              }}
            >
              <img
                src={images.dashboardPreview}
                alt="Dashboard Preview"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section 2 - Easy Candidate & Admin Management */}
      <section
        className="py-16 md:py-24 px-4 md:px-8 lg:px-12"
        style={{ backgroundColor: COLORS.surface }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Left Content - Form Image */}
            <div
              className="rounded-2xl overflow-hidden order-2 md:order-1"
              style={{
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.1)",
              }}
            >
              <img
                src={images.formPreview}
                alt="Form Preview"
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Right Content */}
            <div className="order-1 md:order-2">
              <h2
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{
                  color: COLORS.textDark,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Easy Candidate & Admin Management
              </h2>
              <p
                className="text-base mb-8 leading-relaxed"
                style={{
                  color: COLORS.textMuted,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Adding new candidates and administrators is quick and
                straightforward.
              </p>

              <div className="space-y-6">
                <FeatureItem
                  icon={<UserPlus className="w-5 h-5" />}
                  title="Add Candidates Instantly"
                  description="Quickly create new candidate profiles with essential details."
                  iconBg={COLORS.accent}
                />
                <FeatureItem
                  icon={<Admin className="w-5 h-5" />}
                  title="Manage Administrators"
                  description="Onboard new team members and define their roles and permissions."
                  iconBg={COLORS.secondary}
                />
                <FeatureItem
                  icon={<Form className="w-5 h-5" />}
                  title="Structured Data Entry"
                  description="Intuitive forms guide you through adding all necessary information."
                  iconBg={COLORS.accent}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-8 px-4 md:px-8 lg:px-12 border-t"
        style={{
          backgroundColor: COLORS.surface,
          borderColor: COLORS.border,
        }}
      >
        <div className="max-w-7xl mx-auto text-center">
          <p
            className="text-sm"
            style={{
              color: COLORS.textMuted,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            © {new Date().getFullYear()} Edu_Immigration_CRM. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
