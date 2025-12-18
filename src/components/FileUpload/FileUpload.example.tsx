import { useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import FileUpload from "./FileUpload";
import { Button } from "../index";

/**
 * Helper function to convert File to base64
 */
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Helper function to convert multiple Files to base64
 */
const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map(convertFileToBase64));
};

/**
 * Example 1: Standalone FileUpload (no Formik)
 */
const StandaloneFileUploadExample = () => {
  const [singleFile, setSingleFile] = useState<File | null>(null);
  const [multipleFiles, setMultipleFiles] = useState<File[] | null>(null);

  const handleSingleFileChange = (file: File | File[] | null) => {
    if (file instanceof File) {
      setSingleFile(file);
    } else if (Array.isArray(file) && file.length > 0) {
      setSingleFile(file[0]);
    } else {
      setSingleFile(null);
    }
  };

  const handleMultipleFilesChange = (files: File | File[] | null) => {
    if (Array.isArray(files)) {
      setMultipleFiles(files);
    } else if (files instanceof File) {
      setMultipleFiles([files]);
    } else {
      setMultipleFiles(null);
    }
  };

  const handleSubmit = async () => {
    // Convert single file to base64
    if (singleFile) {
      const base64 = await convertFileToBase64(singleFile);
      const payload = {
        profilePhoto: base64,
      };
      // TODO: Send to backend API
      console.log("Single file payload:", payload);
    }

    // Convert multiple files to base64
    if (multipleFiles && multipleFiles.length > 0) {
      const base64Array = await convertFilesToBase64(multipleFiles);
      const payload = {
        documents: base64Array,
      };
      // TODO: Send to backend API
      console.log("Multiple files payload:", payload);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h2 className="text-xl font-bold">Standalone FileUpload Examples</h2>

      {/* Single File Upload Example */}
      <div className="border p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Single File Upload</h3>
        <FileUpload
          label="Upload Profile Photo"
          accept="image/png,image/jpeg,image/jpg"
          maxSizeMB={5}
          supportedFormats="PNG, JPG"
          value={singleFile}
          onChange={handleSingleFileChange}
          showPreview={true}
          previewSize="md"
          dismissible={false}
          multiple={false}
          required={false}
        />
      </div>

      {/* Multiple File Upload Example */}
      <div className="border p-4 rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Multiple File Upload</h3>
        <FileUpload
          label="Upload Documents"
          accept="image/png,image/jpeg,image/jpg,application/pdf"
          maxSizeMB={10}
          supportedFormats="PNG, JPG, PDF"
          value={multipleFiles}
          onChange={handleMultipleFilesChange}
          showPreview={true}
          previewSize="sm"
          dismissible={true}
          multiple={true}
          required={false}
        />
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSubmit} variant="accent">
          Submit All Files
        </Button>
      </div>
    </div>
  );
};

/**
 * Example 2: FileUpload with Formik + Yup
 */
interface FormData {
  profilePhoto: File | null;
  documents: File[] | null;
  name: string;
  email: string;
}

const FormikFileUploadExample = () => {
  const { t } = useTranslation();

  const formik = useFormik<FormData>({
    initialValues: {
      profilePhoto: null,
      documents: null,
      name: "",
      email: "",
    },
    validationSchema: Yup.object().shape({
      profilePhoto: Yup.mixed()
        .required(t("validation.required"))
        .test("fileSize", t("fileUpload.fileSizeExceeded", { fileName: "", maxSize: 5 }), (file) => {
          if (!file) return false;
          return (file as File).size <= 5 * 1024 * 1024; // 5MB
        }),
      documents: Yup.mixed().nullable(),
      name: Yup.string().required(t("validation.required")),
      email: Yup.string().email(t("validation.invalidEmail")).required(t("validation.required")),
    }),
    onSubmit: async (values) => {
      try {
        // Convert profile photo to base64
        let profilePhotoBase64: string | null = null;
        if (values.profilePhoto) {
          profilePhotoBase64 = await convertFileToBase64(values.profilePhoto);
        }

        // Convert documents to base64 array
        let documentsBase64: string[] | null = null;
        if (values.documents && values.documents.length > 0) {
          documentsBase64 = await convertFilesToBase64(values.documents);
        }

        // Create JSON payload
        const payload = {
          profilePhoto: profilePhotoBase64,
          documents: documentsBase64,
          name: values.name,
          email: values.email,
        };

        // TODO: Send to backend API
        // const response = await fetch("/api/applicant", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify(payload),
        // });
        // const result = await response.json();

        console.log("Payload ready for API:", payload);
      } catch (error) {
        console.error("Error submitting form:", error);
      }
    },
  });

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">FileUpload with Formik + Yup Example</h2>

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        {/* Profile Photo with Formik */}
        <FileUpload
          name="profilePhoto"
          label="Profile Photo (Required)"
          accept="image/png,image/jpeg,image/jpg"
          maxSizeMB={5}
          supportedFormats="PNG, JPG"
          value={formik.values.profilePhoto}
          onChange={(file) => {
            formik.setFieldValue("profilePhoto", file);
            formik.setFieldTouched("profilePhoto", true);
          }}
          error={formik.touched.profilePhoto && formik.errors.profilePhoto ? formik.errors.profilePhoto : undefined}
          showPreview={true}
          previewSize="md"
          multiple={false}
          required={true}
          dismissible={false}
        />

        {/* Documents with Formik */}
        <FileUpload
          name="documents"
          label="Documents (Optional)"
          accept="image/png,image/jpeg,image/jpg,application/pdf"
          maxSizeMB={10}
          supportedFormats="PNG, JPG, PDF"
          value={formik.values.documents}
          onChange={(files) => {
            formik.setFieldValue("documents", files);
            formik.setFieldTouched("documents", true);
          }}
          error={formik.touched.documents && formik.errors.documents ? formik.errors.documents : undefined}
          showPreview={true}
          previewSize="sm"
          multiple={true}
          required={false}
          dismissible={true}
        />

        {/* Other form fields */}
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            type="text"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-2 border rounded"
          />
          {formik.touched.name && formik.errors.name && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            name="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className="w-full px-4 py-2 border rounded"
          />
          {formik.touched.email && formik.errors.email && (
            <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="accent">
            Submit Form
          </Button>
        </div>
      </form>
    </div>
  );
};

/**
 * Main example component showing both usage patterns
 */
const FileUploadExamples = () => {
  return (
    <div className="space-y-12">
      <StandaloneFileUploadExample />
      <hr />
      <FormikFileUploadExample />
    </div>
  );
};

export default FileUploadExamples;
