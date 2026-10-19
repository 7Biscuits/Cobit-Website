
import { ENV, isConfigValid, getOverallAdminEmail } from './env.js';

export { getOverallAdminEmail };

const createClient = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase.createClient
  : null;

export const supabase = (createClient && isConfigValid())
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY)
  : null;

if (!isConfigValid()) {
  console.warn(
    '[CoBit] Supabase configuration is missing or incomplete.\n' +
    'Please copy .env.example to .env and run "npm run config" or "npm start".'
  );
}

export async function getPublishedProjects() {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published projects:', error);
    throw error;
  }
  return data || [];
}

export async function getAllProjects() {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all projects:', error);
    throw error;
  }
  return data || [];
}

export async function createProject(projectData) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { data, error } = await supabase
    .from('projects')
    .insert([projectData])
    .select();

  if (error) {
    console.error('Error creating project:', error);
    throw error;
  }
  return data?.[0];
}

export async function updateProject(id, projectData) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const payload = {
    ...projectData,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('projects')
    .update(payload)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating project:', error);
    throw error;
  }
  return data?.[0];
}

export async function deleteProject(id) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
  return true;
}

export async function uploadProjectMedia(file) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  if (!file) throw new Error('No file provided for upload');

  const bucketName = ENV.STORAGE_BUCKET_NAME || 'project-media';
  const fileExt = file.name.split('.').pop();
  const cleanName = file.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  const filePath = `projects/${Date.now()}_${cleanName.slice(0, 20)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (uploadError) {
    console.error('Error uploading media:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}


export function isOverallAdminEmail(email) {
  const rootEmail = getOverallAdminEmail();
  return (email || '').trim().toLowerCase() === rootEmail.toLowerCase();
}

export async function getAdminProfile(userId) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching admin profile:', error);
    return null;
  }
  return data;
}

export async function getAllAdminProfiles() {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching admin profiles:', error);
    throw error;
  }
  return data || [];
}

export async function verifyAdminAccount(adminId, approve = true) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const payload = {
    is_verified: approve,
    status: approve ? 'approved' : 'rejected',
    verified_at: new Date().toISOString(),
    verified_by: getOverallAdminEmail()
  };

  const { data, error } = await supabase
    .from('admin_profiles')
    .update(payload)
    .eq('id', adminId)
    .select();

  if (error) {
    console.error('Error updating admin verification:', error);
    throw error;
  }
  return data?.[0];
}

export async function rejectAdminAccount(adminId) {
  return verifyAdminAccount(adminId, false);
}

export async function deleteAdminAccount(adminId) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const { error } = await supabase
    .from('admin_profiles')
    .delete()
    .eq('id', adminId);

  if (error) {
    console.error('Error deleting admin profile:', error);
    throw error;
  }
  return true;
}

export async function updateAdminCredentials({ email, password }) {
  if (!supabase) throw new Error('Supabase client not initialized. Check your .env configuration.');
  const updates = {};
  if (email && email.trim()) updates.email = email.trim();
  if (password && password.trim()) updates.password = password.trim();

  if (Object.keys(updates).length === 0) {
    throw new Error('Please provide a new email or password to update.');
  }

  const { data, error } = await supabase.auth.updateUser(updates);
  if (error) {
    console.error('Error updating credentials:', error);
    throw error;
  }

  if (updates.email && data.user) {
    try {
      await supabase
        .from('admin_profiles')
        .update({ email: updates.email })
        .eq('id', data.user.id);
    } catch (profileErr) {
      console.warn('Could not update email in admin_profiles:', profileErr);
    }
  }

  return data;
}
