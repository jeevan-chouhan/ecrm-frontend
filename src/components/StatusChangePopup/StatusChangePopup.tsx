import { useTranslation } from "react-i18next";
import Popup from "../Popup/Popup";
import Button from "../Button/Button";

interface StatusChangeable {
  name?: string;
  applicantName?: string;
  status: "Active" | "Inactive";
}

interface StatusChangePopupProps {
  isOpen: boolean;
  item: StatusChangeable | null;
  isChanging: boolean;
  onClose: () => void;
  onConfirm: () => void;
  nameKey?: "name" | "applicantName"; // Which property to use for the name
}

const StatusChangePopup = ({
  isOpen,
  item,
  isChanging,
  onClose,
  onConfirm,
  nameKey = "name",
}: StatusChangePopupProps) => {
  const { t } = useTranslation();

  const getName = (): string => {
    if (!item) return "";
    return item[nameKey] || item.applicantName || item.name || "";
  };

  const getCurrentStatus = (): string => {
    return item?.status || "";
  };

  const getNewStatus = (): string => {
    return item?.status === "Active" ? "Inactive" : "Active";
  };

  return (
    <Popup
      isOpen={isOpen}
      onClose={onClose}
      title={t("applicantTracker.confirmStatusChange", "Confirm Status Change")}
      size="sm"
      closeOnOverlayClick={!isChanging}
      closeOnEscape={!isChanging}
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button
            variant="cancel"
            size="sm"
            onClick={onClose}
            disabled={isChanging}
            rounded
          >
            {t("common.cancel", "Cancel")}
          </Button>
          <Button
            variant="accent"
            size="sm"
            onClick={onConfirm}
            isLoading={isChanging}
            rounded
          >
            {t("common.confirm", "Confirm")}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <p className="text-sm text-slate-600 mb-2">
          {item && (
            <>
              {t(
                "applicantTracker.confirmStatusChangeMessage",
                "Are you sure you want to change the status of {{name}} from {{currentStatus}} to {{newStatus}}?",
                {
                  name: getName(),
                  currentStatus: getCurrentStatus(),
                  newStatus: getNewStatus(),
                }
              )}
            </>
          )}
        </p>
      </div>
    </Popup>
  );
};

export default StatusChangePopup;

