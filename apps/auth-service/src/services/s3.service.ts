import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env['S3_REGION'] ?? 'us-east-1',
  endpoint: process.env['S3_ENDPOINT'] ?? 'http://localhost:9000',
  credentials: {
    accessKeyId: process.env['S3_ACCESS_KEY'] ?? 'minioadmin',
    secretAccessKey: process.env['S3_SECRET_KEY'] ?? 'minioadmin',
  },
  forcePathStyle: true, // Required for MinIO
});

const BUCKET = process.env['S3_BUCKET'] ?? 'meeting-memory';

/**
 * Returns a presigned PUT URL so the client can upload directly to S3/MinIO.
 * The key format is: avatars/<userId>/<timestamp>.<ext>
 */
export const getAvatarUploadUrl = async (
  userId: string,
  extension: string
): Promise<{ uploadUrl: string; key: string }> => {
  const key = `avatars/${userId}/${Date.now()}.${extension.replace(/^\./, '')}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: `image/${extension.replace(/^\./, '')}`,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 min

  return { uploadUrl, key };
};

/**
 * Returns a presigned GET URL for any S3 key.
 */
export const getSignedReadUrl = async (key: string): Promise<string> => {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
};

/**
 * Converts an S3 key to a public-facing URL (for MinIO dev or public buckets).
 */
export const keyToPublicUrl = (key: string): string => {
  const endpoint = process.env['S3_PUBLIC_ENDPOINT'] ?? process.env['S3_ENDPOINT'] ?? 'http://localhost:9000';
  return `${endpoint}/${BUCKET}/${key}`;
};
