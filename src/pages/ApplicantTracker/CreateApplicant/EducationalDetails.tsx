import { Button } from "../../../components";
import { colors } from "../../../constants";

const EducationalDetails = () => {
  const handleSave = () => {
    // TODO: Implement save API call
    console.log("Saving educational details");
  };

  const handleSaveAndNext = () => {
    // TODO: Implement save and navigate to next tab
    console.log("Saving and moving to next tab");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: colors.textDark }}>
          Educational Details
        </h2>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          Educational details form will be implemented here.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: colors.border }}>
        <Button variant="primary" onClick={handleSave}>
          SAVE
        </Button>
        <Button variant="primary" onClick={handleSaveAndNext}>
          SAVE & NEXT
        </Button>
      </div>
    </div>
  );
};

export default EducationalDetails;

