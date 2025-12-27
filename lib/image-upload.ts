import imageCompression from 'browser-image-compression';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_COMPRESSED_SIZE = 1; // 1MB after compression
export const MAX_DIMENSION = 1920;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImage(file: File): ImageValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Only JPG, PNG, and WebP images are allowed',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Image must be under 5MB',
    };
  }

  return { valid: true };
}

export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_COMPRESSED_SIZE,
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    // Return original file if compression fails
    return file;
  }
}

export async function validateAndCompressImage(file: File): Promise<{
  file: File | null;
  error?: string;
}> {
  const validation = validateImage(file);
  if (!validation.valid) {
    return { file: null, error: validation.error };
  }

  const compressedFile = await compressImage(file);
  return { file: compressedFile };
}
