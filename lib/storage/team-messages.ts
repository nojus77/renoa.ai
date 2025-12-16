import { Buffer } from 'node:buffer';
import { randomUUID } from 'crypto';

const BUCKET_NAME = 'team-messages';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface UploadParams {
  file: File;
  providerId: string;
  userId: string;
}

export function validateTeamMessageFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Only JPG, PNG, GIF, and WebP images are allowed.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File size exceeds 10MB limit.');
  }
}

export async function uploadTeamMessageMedia({ file, providerId, userId }: UploadParams) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }

  const fileExt = file.name.split('.').pop() || file.type.split('/')[1] || 'jpg';
  const path = `provider-${providerId}/${userId}/${Date.now()}-${randomUUID()}.${fileExt}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${path}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': file.type,
      'x-upsert': 'false',
    },
    body: fileBuffer,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to upload file');
  }

  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${path}`;

  return {
    url: publicUrl,
    thumbnailUrl: publicUrl,
  };
}
