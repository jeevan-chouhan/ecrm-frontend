import { Link } from "react-router-dom";
import { COLORS, ROUTES } from "../../constants";
import { Button } from "../../components";

/**
 * 404 Not Found Page
 */
const NotFound = () => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="text-center">
        <h1
          className="text-9xl font-bold mb-4"
          style={{ color: COLORS.accent }}
        >
          404
        </h1>
        <h2
          className="text-2xl font-semibold mb-2"
          style={{ color: COLORS.textDark }}
        >
          Page Not Found
        </h2>
        <p
          className="text-base mb-8"
          style={{ color: COLORS.textMuted }}
        >
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link to={ROUTES.DASHBOARD}>
          <Button variant="accent" size="lg" rounded>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;

