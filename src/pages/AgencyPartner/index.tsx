import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { GridColDef } from "@mui/x-data-grid";
import { Layout, SearchBar, DataTable, Button, Popup, Input, PhoneInput } from "../../components";
import { COLORS, typography } from "../../constants";
import { Edit, Trash } from "../../assets";
import { isValidEmail, extractDigits, isValidDecimalInput } from "../../utils/regex";

// Agency Partner interface
interface AgencyPartner {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  contactNo: string;
  commissionPercentage: string;
  description: string;
}

// Form errors interface
interface FormErrors {
  name?: string;
  contactPerson?: string;
  email?: string;
  contactNo?: string;
  commissionPercentage?: string;
  description?: string;
}

// Mock agency partners data
const mockAgencyPartners: AgencyPartner[] = [
  {
    id: 1,
    name: "IDP",
    contactPerson: "Milind Gupta",
    email: "mgupta@gmail.com",
    contactNo: "919877123462",
    commissionPercentage: "25",
    description: "Serves all universities in USA",
  },
  {
    id: 2,
    name: "Study Abroad",
    contactPerson: "Rajiv Jain",
    email: "jainr@gmail.com",
    contactNo: "919877123462",
    commissionPercentage: "20",
    description: "Universities in UK",
  },
];

const initialFormState: Omit<AgencyPartner, "id"> = {
  name: "",
  contactPerson: "",
  email: "",
  contactNo: "",
  commissionPercentage: "",
  description: "",
};

const AgencyPartner = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyPartners, setAgencyPartners] = useState<AgencyPartner[]>(mockAgencyPartners);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<AgencyPartner | null>(null);
  const [deletingPartner, setDeletingPartner] = useState<AgencyPartner | null>(null);
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // Filter agency partners based on search
  const filteredPartners = agencyPartners.filter(
    (partner) =>
      partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    // Agency Name validation
    if (!formData.name.trim()) {
      errors.name = t("validation.required", "This field is required");
    }

    // Contact Person validation
    if (!formData.contactPerson.trim()) {
      errors.contactPerson = t("validation.required", "This field is required");
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = t("validation.required", "This field is required");
    } else if (!isValidEmail(formData.email)) {
      errors.email = t("validation.invalidEmail", "Please enter a valid email address");
    }

    // Contact Number validation
    if (!formData.contactNo) {
      errors.contactNo = t("validation.required", "This field is required");
    } else if (extractDigits(formData.contactNo).length < 10) {
      errors.contactNo = t("validation.invalidPhone", "Please enter a valid phone number");
    }

    // Commission Percentage validation
    if (!formData.commissionPercentage.trim()) {
      errors.commissionPercentage = t("validation.required", "This field is required");
    } else if (isNaN(Number(formData.commissionPercentage)) || Number(formData.commissionPercentage) < 0 || Number(formData.commissionPercentage) > 100) {
      errors.commissionPercentage = t("validation.invalidPercentage", "Please enter a valid percentage (0-100)");
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenAddPopup = () => {
    setEditingPartner(null);
    setFormData(initialFormState);
    setFormErrors({});
    setIsPopupOpen(true);
  };

  const handleOpenEditPopup = (partner: AgencyPartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      contactPerson: partner.contactPerson,
      email: partner.email,
      contactNo: partner.contactNo,
      commissionPercentage: partner.commissionPercentage,
      description: partner.description,
    });
    setFormErrors({});
    setIsPopupOpen(true);
  };

  const handleOpenDeletePopup = (partner: AgencyPartner) => {
    setDeletingPartner(partner);
    setIsDeletePopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
    setEditingPartner(null);
    setFormData(initialFormState);
    setFormErrors({});
  };

  const handleCloseDeletePopup = () => {
    setIsDeletePopupOpen(false);
    setDeletingPartner(null);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    if (editingPartner) {
      // Update existing partner
      setAgencyPartners((prev) =>
        prev.map((partner) =>
          partner.id === editingPartner.id
            ? { ...partner, ...formData }
            : partner
        )
      );
    } else {
      // Add new partner
      const newPartner: AgencyPartner = {
        id: Math.max(...agencyPartners.map((p) => p.id), 0) + 1,
        ...formData,
      };
      setAgencyPartners((prev) => [...prev, newPartner]);
    }
    handleClosePopup();
  };

  const handleDelete = () => {
    if (deletingPartner) {
      setAgencyPartners((prev) =>
        prev.filter((partner) => partner.id !== deletingPartner.id)
      );
    }
    handleCloseDeletePopup();
  };

  const columns: GridColDef[] = [
    {
      field: "serialNo",
      headerName: t("agencyPartner.no", "No."),
      width: 70,
      sortable: false,
      renderCell: (params) => {
        const index = filteredPartners.findIndex((p) => p.id === params.row.id);
        return (
          <span style={{ color: COLORS.textMuted }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        );
      },
    },
    {
      field: "name",
      headerName: t("agencyPartner.agencyPartnerName", "Agency Partner Name"),
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <span className="font-medium" style={{ color: COLORS.textDark }}>
          {params.value}
        </span>
      ),
    },
    {
      field: "contactPerson",
      headerName: t("agencyPartner.contactPerson", "Contact Person"),
      flex: 1,
      minWidth: 140,
    },
    {
      field: "email",
      headerName: t("agencyPartner.email", "Email"),
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: "contactNo",
      headerName: t("agencyPartner.contactNo", "Contact No."),
      flex: 1,
      minWidth: 140,
      renderCell: (params) => {
        const value = params.value || "";
        // Format: +91 9877123462 (space after country code)
        const formatted = value.length > 2 ? `+${value.slice(0, 2)} ${value.slice(2)}` : `+${value}`;
        return <span>{formatted}</span>;
      },
    },
    {
      field: "commissionPercentage",
      headerName: t("agencyPartner.commissionPercentage", "Commission Percentage"),
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <span>{params.value} %</span>
      ),
    },
    {
      field: "description",
      headerName: t("agencyPartner.description", "Description"),
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: "actions",
      headerName: t("agencyPartner.action", "Action"),
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenEditPopup(params.row)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={t("common.edit", "Edit")}
          >
            <Edit className="h-4 w-4 mt-2" style={{ color: COLORS.accent }} />
          </button>
          <button
            onClick={() => handleOpenDeletePopup(params.row)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title={t("common.delete", "Delete")}
          >
            <Trash className="h-4 w-4 mt-2" style={{ color: COLORS.error }} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout>
      <div
        className="bg-white rounded-lg shadow-sm p-4 md:p-6"
        style={{ backgroundColor: COLORS.surface }}
      >
        {/* Header with Search and Add Button */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          {/* Title with Count */}
          <div className="flex items-center gap-2 shrink-0">
            <h1
              className="text-xl md:text-2xl font-bold"
              style={{ color: COLORS.textDark }}
            >
              {t("agencyPartner.title", "Agency Partner")}
            </h1>
            {searchQuery && (
              <span
                className="text-lg font-medium"
                style={{ color: COLORS.textMuted }}
              >
                ({filteredPartners.length})
              </span>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-96">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={t("agencyPartner.searchPlaceholder", "Search Agency By Name, Contact Person...")}
                tooltip={t("agencyPartner.searchPlaceholder", "Search Agency By Name, Contact Person...")}
              />
            </div>
            <Button
              variant="accent"
              size="md"
              rounded
              onClick={handleOpenAddPopup}
              className="shrink-0"
            >
              {t("agencyPartner.addAgencyPartner", "Add Agency Partner")}
            </Button>
          </div>
        </div>

        {/* DataTable */}
        <div>
          <DataTable
            rows={filteredPartners}
            columns={columns}
            pageSize={10}
            pageSizeOptions={[5, 10, 25]}
          />
        </div>
      </div>

      {/* Add/Edit Agency Partner Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        title={editingPartner 
          ? t("agencyPartner.editAgency", "Edit Agency")
          : t("agencyPartner.addAgency", "Add Agency")
        }
        size="full"
      >
        <div className="space-y-4">
          {/* Row 1: Agency Name, Contact Person */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={<>{t("agencyPartner.agencyName", "Agency Name")} <span style={{ color: COLORS.error }}>*</span></>}
              placeholder={t("agencyPartner.enterAgencyName", "Enter Agency Name")}
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              error={formErrors.name}
              fullWidth
            />
            <Input
              label={<>{t("agencyPartner.contactPersonLabel", "Contact Person")} <span style={{ color: COLORS.error }}>*</span></>}
              placeholder={t("agencyPartner.enterContactPerson", "Enter Contact Person Name")}
              value={formData.contactPerson}
              onChange={(e) => handleInputChange("contactPerson", e.target.value)}
              error={formErrors.contactPerson}
              fullWidth
            />
          </div>

          {/* Row 2: Email, Contact Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={<>{t("agencyPartner.emailLabel", "Email")} <span style={{ color: COLORS.error }}>*</span></>}
              type="email"
              placeholder={t("agencyPartner.enterEmail", "Enter Email Address")}
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              error={formErrors.email}
              fullWidth
            />
            <PhoneInput
              label={<>{t("agencyPartner.contactNumber", "Contact Number")} <span style={{ color: COLORS.error }}>*</span></>}
              placeholder={t("agencyPartner.enterPhoneNumber", "Enter Phone Number")}
              value={formData.contactNo}
              onChange={(value) => handleInputChange("contactNo", value)}
              error={formErrors.contactNo}
              country="in"
              fullWidth
            />
          </div>

          {/* Row 3: Commission Percentage, Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label={<>{t("agencyPartner.commissionPercentageLabel", "Commission Percentage")} <span style={{ color: COLORS.error }}>*</span></>}
              type="number"
              placeholder={t("agencyPartner.enterCommission", "Enter Commission")}
              value={formData.commissionPercentage}
              onChange={(e) => {
                const value = e.target.value;
                // Allow empty, numbers, and decimal numbers only
                if (isValidDecimalInput(value)) {
                  handleInputChange("commissionPercentage", value);
                }
              }}
              onKeyDown={(e) => {
                // Prevent e, E, +, - characters
                if (["e", "E", "+", "-"].includes(e.key)) {
                  e.preventDefault();
                }
              }}
              min="0"
              max="100"
              step="0.01"
              error={formErrors.commissionPercentage}
              rightIcon={<span style={{ color: COLORS.textMuted, fontWeight: typography.fontWeight.medium }}>%</span>}
              fullWidth
            />
            <Input
              inputType="textarea"
              label={t("agencyPartner.descriptionLabel", "Description")}
              placeholder={t("agencyPartner.descriptionPlaceholder", "Description Of Agency")}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              fullWidth
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="cancel"
              size="md"
              rounded
              onClick={handleClosePopup}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="accent"
              size="md"
              rounded
              onClick={handleSubmit}
            >
              {editingPartner 
                ? t("agencyPartner.updateAgency", "Update Agency")
                : t("agencyPartner.addAgency", "Add Agency")
              }
            </Button>
          </div>
        </div>
      </Popup>

      {/* Delete Confirmation Popup */}
      <Popup
        isOpen={isDeletePopupOpen}
        onClose={handleCloseDeletePopup}
        title={t("agencyPartner.deleteAgencyPartner", "Delete Agency Partner")}
        size="sm"
      >
        <div className="space-y-4">
          <p style={{ color: COLORS.textMuted }}>
            {t("agencyPartner.deleteConfirmation", "Are you sure you want to delete")} <strong style={{ color: COLORS.textDark }}>{deletingPartner?.name}</strong>? {t("agencyPartner.deleteWarning", "This action cannot be undone.")}
          </p>
          
          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="cancel"
              size="md"
              rounded
              onClick={handleCloseDeletePopup}
            >
              {t("common.cancel", "Cancel")}
            </Button>
            <Button
              variant="accent"
              size="md"
              rounded
              onClick={handleDelete}
            >
              {t("common.delete", "Delete")}
            </Button>
          </div>
        </div>
      </Popup>
    </Layout>
  );
};

export default AgencyPartner;
