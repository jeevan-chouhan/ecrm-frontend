import PublicHeader from "../Header/PublicHeader";
import { COLORS } from "../../../constants";
import type { ReactNode } from "react";

interface PublicLayoutProps {
  children: ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: COLORS.background }}
    >
      <PublicHeader />
      {/* Add padding-top to account for fixed header */}
      <main className="pt-16">{children}</main>
    </div>
  );
};

export default PublicLayout;

