import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { COLORS } from "../../../../constants";
import { universityDetailService } from "../../../../services";
import type { UniversityInfoData, UniversityInfoResponse } from "../../../../services";

interface CollegeInfoTabProps {
  universityId: string | undefined;
}

// Info Item Component - displays label on top, value below
const InfoItem = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div>
    <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
      {label}
    </p>
    <p className="text-sm" style={{ color: COLORS.textDark }}>
      {value ?? "-"}
    </p>
  </div>
);

// Official website as clickable link
const WebsiteLink = ({
  label,
  url,
}: {
  label: string;
  url?: string | null;
}) => {
  const href = url?.trim();
  if (!href) {
    return (
      <div>
        <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: COLORS.textDark }}>
          -
        </p>
      </div>
    );
  }
  const displayUrl = href.startsWith("http") ? href : `https://${href}`;
  return (
    <div>
      <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
        {label}
      </p>
      <a
        href={displayUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm underline hover:opacity-80"
        style={{ color: COLORS.primary }}
      >
        {displayUrl}
      </a>
    </div>
  );
};

const CollegeInfoTab = ({ universityId }: CollegeInfoTabProps) => {
  const { t } = useTranslation();
  const [info, setInfo] = useState<UniversityInfoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchCacheRef = useRef<{ key: string; promise: Promise<UniversityInfoResponse> } | null>(null);

  useEffect(() => {
    if (!universityId) {
      setLoading(false);
      return;
    }
    const key = String(universityId);
    let promise: Promise<UniversityInfoResponse>;
    if (fetchCacheRef.current?.key === key) {
      promise = fetchCacheRef.current.promise;
    } else {
      promise = universityDetailService.getCollegeInfo(universityId);
      fetchCacheRef.current = { key, promise };
      promise.finally(() => {
        fetchCacheRef.current = null;
      });
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    promise
      .then((res) => {
        if (!cancelled && res?.data) setInfo(res.data);
      })
      .catch(() => {
        if (!cancelled) setError(t("collegeInfo.fetchError", "Failed to load college information."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [universityId, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12" style={{ color: COLORS.textMuted }}>
        {t("common.loading", "Loading...")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-4 text-sm" style={{ color: COLORS.error }}>
        {error}
      </div>
    );
  }

  if (!info) {
    return (
      <div className="py-4 text-sm" style={{ color: COLORS.textMuted }}>
        {t("collegeInfo.noData", "No college information available.")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          {/* Row 1: Description (full width) */}
          <div className="col-span-2">
            <p className="text-xs font-medium mb-1" style={{ color: COLORS.textMuted }}>
              {t("collegeInfo.description", "Description")}
            </p>
            <p className="text-sm" style={{ color: COLORS.textDark }}>
              {info.description ?? "-"}
            </p>
          </div>

          {/* Row 2: DLI Number | Official Website */}
          <div>
            <InfoItem
              label={t("collegeInfo.dliNumber", "DLI Number")}
              value={info.dliNumber}
            />
          </div>
          <div>
            <WebsiteLink
              label={t("collegeInfo.officialWebsite", "Official Website")}
              url={info.website}
            />
          </div>

          {/* Row 3: Contact Number | Email */}
          <div>
            <InfoItem
              label={t("collegeInfo.contactNumber", "Contact Number")}
              value={info.contactNumber}
            />
          </div>
          <div>
            <InfoItem
              label={t("collegeInfo.email", "Email")}
              value={info.email}
            />
          </div>

          {/* Row 4: Address (optional - show when present) */}
          {info.address != null && info.address.trim() !== "" && (
            <div className="col-span-2">
              <InfoItem
                label={t("collegeInfo.address", "Address")}
                value={info.address}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollegeInfoTab;
