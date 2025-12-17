import PublicLayout from "../../components/wrapper/PublicLayout";
import { COLORS } from "../../constants";

const TermsAndConditions = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        'By accessing or using our Immigration CRM platform ("Platform"), you agree to be bound by these Terms and Conditions. If you do not agree, you may not use the Platform.',
    },
    {
      title: "2. Services Provided",
      content: `The Platform is designed to help immigration consultants/agencies:
Manage candidate profiles. Track visa and university application statuses. Upload and store supporting documents. Communicate with clients and internal staff. We do not provide legal immigration advice through the Platform.`,
    },
    {
      title: "4. Client Data and Privacy",
      content: `The Platform stores sensitive client information (passport, visa docs, transcripts, etc.). All data is protected using encryption and access control. Agencies must obtain consent from clients before uploading their personal documents.
Refer to our Privacy Policy for complete details.`,
    },
    {
      title: "5. Document Management",
      content: `Uploaded documents are stored in structured folders (e.g., by client or application type). Deleted files may be recoverable from system backup logs or archives for up to 30 days.
Agencies are responsible for uploading valid, authentic, and non-expired documents.`,
    },
    {
      title: "6. Compliance and Legal Use",
      content: `Users must comply with local immigration laws, GDPR, and data protection regulations. The Platform shall not be used to forge, manipulate, or falsify any documents or application details.
Any violation will result in suspension of access and may be reported to authorities.`,
    },
    {
      title: "9. Intellectual Property",
      content:
        "All code, features, designs, and documentation are the intellectual property of [Your Agency/Company Name]. You may not reverse-engineer, copy, or redistribute the system without written consent.",
    },
    {
      title: "10. Termination of Access",
      content:
        "We reserve the right to: Suspend or terminate access for any user violating these terms. Permanently delete data after inactivity of 12 months (with prior notice).",
    },
    {
      title: "11. Limitation of Liability",
      content: `We are not liable for:
Rejected applications or lost opportunities due to incorrect data
Actions taken by immigration authorities or consulates
Third-party delays or service failures (e.g., payment gateways, email providers)`,
    },
    {
      title: "12. Amendments",
      content:
        "We may update these Terms from time to time. Continued use of the Platform after updates constitutes your acceptance of the changes.",
    },
    {
      title: "13. Contact",
      content: "For questions or support, contact: [support@youragency.com]",
    },
  ];

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
            Last Updated: 10-07-2025
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
            {sections.map((section, index) => (
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

