import { useFormik } from "formik";
import * as Yup from "yup";
import { Button, Popup, Input, Select, PhoneInput } from "../../../components";
import { Close } from "../../../assets";
import {
  COLORS,
  roleOptions,
  adminOptions,
  countryOptions,
} from "../../../constants";

// Form values interface
export interface AddMemberFormValues {
  name: string;
  email: string;
  contactNumber: string;
  role: string;
  adminId: string;
  assignedCountry: string;
}

// Component props interface
interface AddMemberProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: AddMemberFormValues) => void;
}

// Validation schema using Yup
const validationSchema = Yup.object().shape({
  name: Yup.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .required("Name is required"),
  email: Yup.string()
    .trim()
    .email("Please enter a valid email")
    .required("Email is required"),
  contactNumber: Yup.string()
    .min(8, "Contact number must be at least 8 digits")
    .required("Contact number is required"),
  role: Yup.string().required("Role is required"),
  adminId: Yup.string().required("Admin is required"),
  assignedCountry: Yup.string().required("Assigned country is required"),
});

// Initial form values
const initialValues: AddMemberFormValues = {
  name: "",
  email: "",
  contactNumber: "",
  role: "counselor",
  adminId: "",
  assignedCountry: "",
};

const AddMember = ({ isOpen, onClose, onSubmit }: AddMemberProps) => {
  // Formik hook
  const formik = useFormik<AddMemberFormValues>({
    initialValues,
    validationSchema,
    validateOnBlur: true,
    validateOnChange: true,
    onSubmit: (values, { resetForm }) => {
      onSubmit(values);
      resetForm();
      onClose();
    },
  });

  // Handle close and reset form
  const handleClose = () => {
    formik.resetForm();
    onClose();
  };

  // Role options with default label
  const addMemberRoleOptions = roleOptions.map((opt) => ({
    ...opt,
    label: opt.value === "counselor" ? `Role - ${opt.label}` : opt.label,
  }));

  return (
    <Popup isOpen={isOpen} onClose={handleClose} size="full" showCloseButton={false}>
      <form onSubmit={formik.handleSubmit}>
        {/* Header with title and close button */}
        <div className="flex items-center justify-between mb-6">
          <h2
            className="text-xl font-semibold"
            style={{ color: COLORS.textDark }}
          >
            Add new member
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-100"
            style={{ color: COLORS.textMuted }}
          >
            <Close className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Row 1: Name, Email */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              name="name"
              label={<>Name <span style={{ color: COLORS.error }}>*</span></>}
              placeholder="Name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
              fullWidth
            />
            <Input
              name="email"
              label={<>Email <span style={{ color: COLORS.error }}>*</span></>}
              placeholder="Email"
              type="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
              fullWidth
            />
          </div>

          {/* Row 2: Contact Number, Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneInput
              label={<>Contact Number <span style={{ color: COLORS.error }}>*</span></>}
              placeholder="Contact Number"
              value={formik.values.contactNumber}
              onChange={(value) => formik.setFieldValue("contactNumber", value)}
              onBlur={() => formik.setFieldTouched("contactNumber", true)}
              error={
                formik.touched.contactNumber && formik.errors.contactNumber
                  ? formik.errors.contactNumber
                  : undefined
              }
              fullWidth
            />
            <Input
              label="System Generated Password"
              placeholder="System Generated Password"
              disabled
              fullWidth
            />
          </div>

          {/* Row 3: Role, Admin */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={<>Role <span style={{ color: COLORS.error }}>*</span></>}
              options={addMemberRoleOptions}
              value={formik.values.role}
              onChange={(value) => formik.setFieldValue("role", value)}
              placeholder="Role - Counselor"
              error={formik.touched.role && formik.errors.role ? formik.errors.role : undefined}
              fullWidth
            />
            <Select
              label={<>Admin <span style={{ color: COLORS.error }}>*</span></>}
              options={adminOptions}
              value={formik.values.adminId}
              onChange={(value) => formik.setFieldValue("adminId", value)}
              placeholder="Select Admin"
              error={formik.touched.adminId && formik.errors.adminId ? formik.errors.adminId : undefined}
              fullWidth
            />
          </div>

          {/* Row 4: Assigned Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label={<>Assigned Country <span style={{ color: COLORS.error }}>*</span></>}
              options={countryOptions}
              value={formik.values.assignedCountry}
              onChange={(value) => formik.setFieldValue("assignedCountry", value)}
              placeholder="Select Assigned Country"
              error={
                formik.touched.assignedCountry && formik.errors.assignedCountry
                  ? formik.errors.assignedCountry
                  : undefined
              }
              fullWidth
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <Button type="button" variant="cancel" rounded onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" variant="accent" rounded>
            Add
          </Button>
        </div>
      </form>
    </Popup>
  );
};

export default AddMember;

