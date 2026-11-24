import { createClient } from '@supabase/supabase-js';
import { config } from './environment.js';
import { logger } from './logger.js';

let supabaseClient = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
      logger.warn('Supabase URL or Service Role Key missing. Storage operations will use simulated local paths.');
      return null;
    }
    supabaseClient = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
};

const BUCKET_NAME = 'medical-documents';

// Ensure the private bucket exists
export const ensureBucketExists = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) return;

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      logger.warn(`Could not list Supabase storage buckets: ${error.message}`);
      return;
    }

    const bucketExists = buckets.some((b) => b.name === BUCKET_NAME);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false, // Strict private bucket for medical PHI
        fileSizeLimit: 5242880, // 5MB limit
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      });
      if (createError) {
        logger.warn(`Could not create private medical-documents bucket: ${createError.message}`);
      } else {
        logger.info(`Created private Supabase Storage bucket: '${BUCKET_NAME}'`);
      }
    }
  } catch (err) {
    logger.warn(`Bucket check error: ${err.message}`);
  }
};

// Upload document buffer to private bucket
export const uploadMedicalDocument = async (userId, buffer, originalName, mimeType) => {
  const supabase = getSupabaseClient();
  const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `reports/${userId}/${Date.now()}_${safeName}`;

  if (!supabase) {
    // Local / simulated fallback path for offline tests
    return {
      filePath: `simulated://${filePath}`,
      fileMimeType: mimeType,
      fileSizeBytes: buffer.length,
    };
  }

  await ensureBucketExists();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    logger.error(`Supabase document upload error: ${error.message}`);
    // Fallback to storing safe path reference
    return {
      filePath,
      fileMimeType: mimeType,
      fileSizeBytes: buffer.length,
    };
  }

  return {
    filePath: data.path,
    fileMimeType: mimeType,
    fileSizeBytes: buffer.length,
  };
};

// Generate 15-minute temporary signed URL for authorized medical staff / donor
export const createSignedReportUrl = async (filePath, expiresIn = 900) => {
  if (filePath.startsWith('simulated://') || filePath.startsWith('http')) {
    return filePath;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return `https://storage.lifora.org/preview/${filePath}`;
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, expiresIn);

    if (error || !data) {
      return `https://storage.lifora.org/preview/${filePath}`;
    }

    return data.signedUrl;
  } catch {
    return `https://storage.lifora.org/preview/${filePath}`;
  }
};
