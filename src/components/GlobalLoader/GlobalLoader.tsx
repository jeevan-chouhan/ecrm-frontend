import { useAppSelector } from "../../redux/hooks";
import LogoImage  from "../../assets/LogoImage.png";
import { COLORS } from "../../constants";

const GlobalLoader = () => {
  const { isLoading, loadingText } = useAppSelector((state) => state.loader);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div
        className="flex flex-col items-center gap-4 p-8"
      >
        {/* Logo with spinning border around it */}
        <div className="relative">
          {/* Spinning ring around logo */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              width: "88px",
              height: "88px",
              top: "-8px",
              left: "-8px",
              border: `3px solid transparent`,
              borderTopColor: COLORS.accent,
              borderRightColor: COLORS.accent,
              animationDuration: "1s",
            }}
          />
          {/* Logo Image in center */}
          <img
            src={LogoImage}
            alt="AgencyOS Logo"
            className="h-18 w-18 object-contain rounded-lg"
            style={{ width: "72px", height: "72px" }}
          />
        </div>
        {loadingText && (
          <p
            className="text-sm font-medium text-white"
          >
            {loadingText}
          </p>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;

