import PublicLayout from "../../../components/wrapper/PublicLayout";
import { COLORS } from "../../../constants";

const ResetPassword = () => {
  return (
    <PublicLayout>
      <div
        className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4"
        style={{ backgroundColor: COLORS.background }}
      >
        <div
          className="p-8 rounded-lg w-full max-w-md"
          style={{
            backgroundColor: COLORS.surface,
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          }}
        >
          <h1
            className="text-2xl font-bold text-center mb-6"
            style={{ color: COLORS.textDark, fontFamily: "'Inter', sans-serif" }}
          >
            Reset Password
          </h1>
          <p
            className="text-center"
            style={{ color: COLORS.textMuted, fontFamily: "'Inter', sans-serif" }}
          >
            Reset password page coming soon...
          </p>
        </div>
      </div>
    </PublicLayout>
  );
};

export default ResetPassword;
