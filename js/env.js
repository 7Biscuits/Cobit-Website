/**
 * CoBit Client Environment Configuration
 * 
 * Safely accesses public, client-side configuration variables.
 * Populated by `js/env-config.js` (generated from `.env` via `scripts/generate-env.js`).
 * 
 * SECURITY:
 * Never put privileged secrets (service role keys, database passwords) here!
 */

const runtimeEnv = (typeof window !== 'undefined' && window.__ENV__) ? window.__ENV__ : {};

export const ENV = {
  SUPABASE_URL: (runtimeEnv.SUPABASE_URL || '').trim(),
  SUPABASE_ANON_KEY: (runtimeEnv.SUPABASE_ANON_KEY || '').trim(),
  OVERALL_ADMIN_EMAIL: (runtimeEnv.OVERALL_ADMIN_EMAIL || 'admin@cobit.example').trim().toLowerCase(),
  STORAGE_BUCKET_NAME: (runtimeEnv.STORAGE_BUCKET_NAME || 'project-media').trim(),
};

/**
 * Check whether valid, non-placeholder Supabase configuration is present.
 */
export function isConfigValid() {
  if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) return false;
  if (ENV.SUPABASE_URL.includes('your-project-id')) return false;
  if (ENV.SUPABASE_ANON_KEY.includes('your-public-anon-key')) return false;
  return true;
}

/**
 * Returns the designated overall administrator email.
 */
export function getOverallAdminEmail() {
  return ENV.OVERALL_ADMIN_EMAIL || 'admin@cobit.example';
}
