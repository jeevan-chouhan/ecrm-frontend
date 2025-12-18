/**
 * Utility functions for file upload API integration
 * These functions help prepare File objects for sending to backend as JSON payload (base64) for S3 bucket storage
 */

/**
 * Converts a File to base64 string
 * @param file - File object to convert
 * @returns Promise that resolves to base64 string (data URL format)
 */
export const convertFileToBase64 = (file: File): Promise<string> => {
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
 * Converts multiple Files to base64 string array
 * @param files - Array of File objects to convert
 * @returns Promise that resolves to array of base64 strings (data URL format)
 */
export const convertFilesToBase64 = async (files: File[]): Promise<string[]> => {
  return Promise.all(files.map(convertFileToBase64));
};

/**
 * Creates a JSON payload with file(s) converted to base64
 * @param file - Single File or array of Files
 * @param fieldName - Field name for the file(s) in payload (default: 'file')
 * @returns Promise that resolves to object with base64 file data
 */
export const createFilePayload = async (
  file: File | File[] | null,
  fieldName: string = "file"
): Promise<Record<string, string | string[] | null>> => {
  if (!file) {
    return { [fieldName]: null };
  }

  if (Array.isArray(file)) {
    const base64Array = await convertFilesToBase64(file);
    return { [fieldName]: base64Array };
  } else {
    const base64 = await convertFileToBase64(file);
    return { [fieldName]: base64 };
  }
};

/**
 * Creates a complete JSON payload with file(s) and additional fields
 * @param file - Single File or array of Files
 * @param additionalData - Additional key-value pairs to include in payload
 * @param fieldName - Field name for the file(s) in payload (default: 'file')
 * @returns Promise that resolves to complete payload object
 */
export const createPayloadWithFile = async (
  file: File | File[] | null,
  additionalData: Record<string, any> = {},
  fieldName: string = "file"
): Promise<Record<string, any>> => {
  const filePayload = await createFilePayload(file, fieldName);
  return {
    ...filePayload,
    ...additionalData,
  };
};

/**
 * Example API call function for uploading file to backend as JSON payload
 * Backend will handle S3 bucket storage
 * 
 * @example
 * ```typescript
 * const handleSubmit = async (file: File, name: string) => {
 *   const payload = await createPayloadWithFile(
 *     file,
 *     { name },
 *     'profilePhoto'
 *   );
 *   
 *   const response = await fetch('/api/applicant', {
 *     method: 'POST',
 *     headers: {
 *       'Content-Type': 'application/json',
 *     },
 *     body: JSON.stringify(payload),
 *   });
 * };
 * ```
 */
export const uploadFileToBackend = async (
  file: File | File[] | null,
  endpoint: string,
  additionalData?: Record<string, any>,
  fieldName: string = "file",
  options?: RequestInit
): Promise<Response> => {
  const payload = await createPayloadWithFile(file, additionalData, fieldName);

  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    body: JSON.stringify(payload),
    ...options,
  });
};

/**
 * Gets file metadata for preview or display purposes
 * Does NOT upload the file, just extracts information
 */
export const getFileMetadata = (file: File) => {
  return {
    name: file.name,
    size: file.size,
    sizeMB: (file.size / (1024 * 1024)).toFixed(2),
    type: file.type,
    lastModified: new Date(file.lastModified),
  };
};
