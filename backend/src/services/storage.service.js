const supabase = require('../config/supabase');

const BUCKET = 'doctor-images';

/**
 * Upload a buffer to Supabase Storage and return the public URL.
 * path: e.g. "doctor-uuid/profile.jpg"
 */
const uploadDoctorImage = async (path, buffer, mimeType) => {
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
};

module.exports = { uploadDoctorImage };
