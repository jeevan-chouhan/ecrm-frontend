import PublicLayout from "../../components/wrapper/PublicLayout";
import { COLORS, termsAndConditions } from "../../constants";

const TermsAndConditions = () => {
  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
          >
            Terms & Conditions
          </h1>
          <p
            className="text-sm"
            style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
          >
            Last Updated: 10 Jul 2025
          </p>
        </div>

        {/* Content */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            backgroundColor: COLORS.surface,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <div className="space-y-6">
            {termsAndConditions.map((section, index) => (
              <div key={index}>
                <h2
                  className="text-sm font-semibold mb-2"
                  style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
                >
                  {section.title}
                </h2>
                <p
                  className="text-sm leading-relaxed whitespace-pre-line"
                  style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
                >
                  {section.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
};

export default TermsAndConditions;
