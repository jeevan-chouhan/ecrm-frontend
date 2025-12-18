# FileUpload Component

A reusable file upload component that works both independently (standalone) and with Formik for API integration. Files are NOT saved locally - they are returned as File objects that can be converted to base64 and sent to your backend API as JSON payload for S3 bucket storage.

## Features

- ✅ **Standalone Mode**: Works independently without Formik
- ✅ **Formik Integration**: Seamlessly integrates with Formik forms
- ✅ **Internal Formik + Yup**: Built-in validation with Formik and Yup
- ✅ **Multiple File Support**: Upload single or multiple files
- ✅ **Drag & Drop**: Drag and drop files to upload
- ✅ **Preview**: Image preview with popup for full-screen view
- ✅ **Validation**: File type and size validation
- ✅ **i18n Support**: Fully internationalized
- ✅ **JSON Payload Ready**: Files can be converted to base64 for JSON API submission

## Usage

### Standalone Mode (Without Formik)

```tsx
import { useState } from "react";
import { FileUpload } from "../../components";

const MyComponent = () => {
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async () => {
    if (file) {
      // Convert file to base64 for JSON payload
      const base64 = await new Promise<string>((resolve, reject) => {
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

      // Send as JSON payload
      const response = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: base64,
          // other fields...
        }),
      });
    }
  };

  return (
    <FileUpload
      value={file}
      onChange={setFile}
      label="Upload Profile Photo"
      accept="image/png,image/jpeg,image/jpg"
      maxSizeMB={5}
      dismissible={false}
    />
  );
};
```

### With Formik (Recommended for Forms)

```tsx
import { useFormik } from "formik";
import * as Yup from "yup";
import { FileUpload } from "../../components";

const MyForm = () => {
  const formik = useFormik({
    initialValues: {
      profilePhoto: null as File | null,
      name: "",
    },
    validationSchema: Yup.object().shape({
      profilePhoto: Yup.mixed().required("Profile photo is required"),
      name: Yup.string().required("Name is required"),
    }),
    onSubmit: async (values) => {
      // Convert file to base64 if exists
      let profilePhotoBase64: string | null = null;
      if (values.profilePhoto) {
        profilePhotoBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === "string") {
              resolve(reader.result);
            } else {
              reject(new Error("Failed to convert file to base64"));
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(values.profilePhoto!);
        });
      }

      // Create JSON payload
      const payload = {
        profilePhoto: profilePhotoBase64,
        name: values.name,
      };

      // Send to backend as JSON
      await fetch("/api/applicant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    },
  });

  return (
    <form onSubmit={formik.handleSubmit}>
      <FileUpload
        name="profilePhoto"
        label="Upload Photo"
        accept="image/png,image/jpeg"
        value={formik.values.profilePhoto}
        onChange={(file) => {
          formik.setFieldValue("profilePhoto", file);
          formik.setFieldTouched("profilePhoto", true);
        }}
        error={formik.touched.profilePhoto && formik.errors.profilePhoto ? formik.errors.profilePhoto : undefined}
        dismissible={false}
      />
      <button type="submit">Submit</button>
    </form>
  );
};
```

### Multiple Files

```tsx
<FileUpload
  value={files}
  onChange={setFiles}
  multiple={true}
  label="Upload Documents"
  accept="application/pdf,image/*"
  maxSizeMB={10}
  dismissible={true}
/>
```

## API Integration

The component returns **File objects** (not saved locally). To send to your backend as JSON payload:

### Convert File to Base64

```tsx
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

// Usage
const handleSubmit = async (file: File | null) => {
  if (file) {
    const base64 = await convertFileToBase64(file);
    
    const payload = {
      file: base64,
      // other fields...
    };

    await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
};
```

### Multiple Files to Base64

```tsx
const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map(convertFileToBase64));
};

// Usage
const handleSubmit = async (files: File[] | null) => {
  if (files && files.length > 0) {
    const base64Array = await convertFilesToBase64(files);
    
    const payload = {
      files: base64Array,
      // other fields...
    };

    await fetch("/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }
};
```

### Backend Integration

Your backend should:
1. Receive the JSON payload with base64 file data
2. Decode base64 and upload to S3 bucket
3. Return the S3 URL or file reference

Example backend endpoint (Node.js/Express):
```javascript
app.post('/api/upload', async (req, res) => {
  const { file, ...otherData } = req.body;
  
  // Decode base64
  const base64Data = file.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Upload to S3
  const s3Url = await uploadToS3(buffer, 'image/jpeg');
  
  res.json({ 
    url: s3Url,
    ...otherData 
  });
});
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | - | Formik field name (optional, for reference) |
| `value` | `File \| File[] \| null` | - | File value (required for controlled component) |
| `onChange` | `(file: File \| File[] \| null) => void` | - | Change handler (required for controlled component) |
| `label` | `string` | "Upload file" | Label text |
| `accept` | `string` | "image/png,image/jpeg,image/jpg" | Accepted file types |
| `maxSizeMB` | `number` | 10 | Maximum file size in MB |
| `multiple` | `boolean` | false | Allow multiple files |
| `showPreview` | `boolean` | true | Show file preview |
| `previewSize` | `"sm" \| "md" \| "lg"` | "md" | Preview thumbnail size |
| `disabled` | `boolean` | false | Disable upload |
| `error` | `string` | - | Error message (for external validation) |
| `dismissible` | `boolean` | true | Show close button to dismiss section |
| `required` | `boolean` | false | Mark field as required (for validation) |
| `supportedFormats` | `string` | "PNG, JPG" | Display text for supported formats |
| `validationSchema` | `Yup.Schema` | - | Custom Yup validation schema |

## Notes

- **No Local Storage**: Files are NOT saved to local server/folders
- **File Objects**: Component returns native File objects
- **JSON Payload**: Files should be converted to base64 for JSON API submission
- **Backend Storage**: Backend team handles S3 bucket storage
- **Internal Validation**: Component uses Formik + Yup internally for validation
- **i18n Ready**: All user-facing strings use i18n translation keys
