import { Button } from "../../../components";
import { COLORS } from "../../../constants";

const WorkExperience = () => {
  const handleSave = () => {
    // TODO: Implement save API call
    console.log("Saving work experience");
  };

  const handleSaveAndNext = () => {
    // TODO: Implement save and navigate to next tab
    console.log("Saving and moving to next tab");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-4" style={{ color: COLORS.textDark }}>
          Work Experience
        </h2>
        <p className="text-sm" style={{ color: COLORS.textMuted }}>
          Work experience form will be implemented here.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 mt-6 pt-6 border-t" style={{ borderColor: COLORS.border }}>
        <Button variant="accent" onClick={handleSave}>
          SAVE
        </Button>
        <Button variant="accent" onClick={handleSaveAndNext}>
          SAVE & NEXT
        </Button>
      </div>
    </div>
  );
};

export default WorkExperience;

