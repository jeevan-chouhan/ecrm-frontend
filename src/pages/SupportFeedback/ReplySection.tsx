import { Button } from "../../components";
import { COLORS } from "../../constants";

export interface ReplySectionProps {
  /** Section heading (e.g. "Reply") */
  title?: string;
  /** Message when there are no replies */
  emptyMessage?: string;
  /** Whether replies are loading */
  isLoading?: boolean;
  /** Message to show while loading */
  loadingMessage?: string;
  /** Reply list or custom content between heading and input */
  children?: React.ReactNode;
  /** Current value of the reply textarea */
  value: string;
  /** Called when the reply text changes */
  onChange: (value: string) => void;
  /** Called when submit button is clicked */
  onSubmit: () => void;
  /** Textarea placeholder */
  placeholder?: string;
  /** Submit button label */
  submitLabel?: string;
  /** Number of textarea rows */
  rows?: number;
  /** Optional class name for the root */
  className?: string;
}

const ReplySection = ({
  title = "Reply",
  emptyMessage = "No replies yet.",
  isLoading = false,
  loadingMessage = "Loading replies...",
  children,
  value,
  onChange,
  onSubmit,
  placeholder = "Type your reply here....",
  submitLabel = "Reply to Response",
  rows = 4,
  className = "",
}: ReplySectionProps) => {
  const showEmptyMessage = !isLoading && !children;
  const showContent = !isLoading && children;

  return (
    <div className={`flex flex-col gap-4 ${className}`.trim()}>
      <h4 className="font-semibold text-sm" style={{ color: COLORS.textDark }}>
        {title}
      </h4>

      {isLoading && (
        <p className="text-sm py-4" style={{ color: COLORS.textMuted }}>
          {loadingMessage}
        </p>
      )}

      {showEmptyMessage && (
        <p className="text-sm py-4" style={{ color: COLORS.textMuted }}>
          {emptyMessage}
        </p>
      )}

      {showContent && <div className="flex-1 overflow-y-auto">{children}</div>}

      {/* Reply input area */}
      <div className="rounded-lg">
        <textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full rounded border p-3 text-sm resize-none focus:outline-none focus:ring-2"
          style={{
            borderColor: COLORS.border,
            color: COLORS.textDark,
          }}
        />
        <div className="flex justify-end mt-3">
          <Button type="button" variant="accent" rounded onClick={onSubmit}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ReplySection;
