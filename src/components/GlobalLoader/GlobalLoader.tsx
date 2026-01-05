import { useAppSelector } from "../../redux/hooks";
import { Spinner } from "../../assets";
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
        className="flex flex-col items-center gap-4 p-8 rounded-2xl"
      >
        <Spinner className="h-12 w-12" style={{ color: COLORS.accent }} />
        {loadingText && (
          <p
            className="text-sm font-medium"
            style={{ color: COLORS.textDark }}
          >
            {loadingText}
          </p>
        )}
      </div>
    </div>
  );
};

export default GlobalLoader;

