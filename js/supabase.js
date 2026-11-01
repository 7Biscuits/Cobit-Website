
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

// ============================================================
// Opportunities Service (Backend Database & Realtime API)
// ============================================================

const LOCAL_STORAGE_OPPS_KEY = 'cobit_opportunities_cache';
const OPP_BROADCAST_CHANNEL = 'cobit_opportunities_updates';

function getLocalOpportunities() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_OPPS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveLocalOpportunities(opps) {
  try {
    localStorage.setItem(LOCAL_STORAGE_OPPS_KEY, JSON.stringify(opps));
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel(OPP_BROADCAST_CHANNEL);
      bc.postMessage({ type: 'opportunities_updated', timestamp: Date.now() });
      bc.close();
    }
  } catch (e) {
    console.warn('Could not save opportunities to localStorage:', e);
  }
}

function notifyOpportunityChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cobit_opportunity_changed'));
  }
}

/**
 * Fetch all published opportunities for public display on the website.
 * Only active/published opportunities are returned.
 */
export async function getPublishedOpportunities() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
      if (error && error.code !== 'PGRST205') {
        console.error('Error fetching published opportunities from Supabase:', error);
      }
    } catch (err) {
      console.warn('Supabase fetch failed for opportunities:', err);
    }
  }

  // Graceful fallback to local cache
  const local = getLocalOpportunities();
  if (local && Array.isArray(local)) {
    return local.filter(o => o.is_published !== false);
  }
  return [];
}

/**
 * Fetch all opportunities (published + drafts) for the admin dashboard.
 */
export async function getAllOpportunities() {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        saveLocalOpportunities(data);
        return data;
      }
      if (error && error.code !== 'PGRST205') {
        console.error('Error fetching all opportunities from Supabase:', error);
      }
    } catch (err) {
      console.warn('Supabase query failed for opportunities:', err);
    }
  }

  const local = getLocalOpportunities();
  return local || [];
}

/**
 * Create a new opportunity in the database.
 */
export async function createOpportunity(oppData) {
  const payload = {
    title: (oppData.title || '').trim(),
    description: (oppData.description || '').trim(),
    eligibility: (oppData.eligibility || '').trim(),
    requirements: (oppData.requirements || '').trim(),
    application_link: (oppData.application_link || '').trim(),
    is_published: oppData.is_published !== undefined ? !!oppData.is_published : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .insert([payload])
        .select();

      if (!error && data?.[0]) {
        notifyOpportunityChange();
        return data[0];
      }
      if (error && error.code !== 'PGRST205') {
        throw error;
      }
    } catch (err) {
      console.warn('Could not insert opportunity to Supabase, falling back to local:', err);
    }
  }

  const newRecord = {
    id: 'opp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
    ...payload
  };
  const current = getLocalOpportunities() || [];
  current.unshift(newRecord);
  saveLocalOpportunities(current);
  notifyOpportunityChange();
  return newRecord;
}

/**
 * Edit/update an existing opportunity in the database.
 */
export async function updateOpportunity(id, oppData) {
  const payload = {
    ...oppData,
    updated_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('opportunities')
        .update(payload)
        .eq('id', id)
        .select();

      if (!error && data?.[0]) {
        notifyOpportunityChange();
        return data[0];
      }
      if (error && error.code !== 'PGRST205') {
        throw error;
      }
    } catch (err) {
      console.warn('Could not update opportunity in Supabase, falling back to local:', err);
    }
  }

  const current = getLocalOpportunities() || [];
  const idx = current.findIndex(o => o.id === id);
  if (idx !== -1) {
    current[idx] = { ...current[idx], ...payload };
    saveLocalOpportunities(current);
    notifyOpportunityChange();
    return current[idx];
  }
  throw new Error('Opportunity not found with ID: ' + id);
}

/**
 * Delete an opportunity from the database.
 */
export async function deleteOpportunity(id) {
  if (supabase) {
    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);

      if (!error) {
        notifyOpportunityChange();
        return true;
      }
      if (error && error.code !== 'PGRST205') {
        throw error;
      }
    } catch (err) {
      console.warn('Could not delete opportunity in Supabase, falling back to local:', err);
    }
  }

  const current = getLocalOpportunities() || [];
  const filtered = current.filter(o => o.id !== id);
  saveLocalOpportunities(filtered);
  notifyOpportunityChange();
  return true;
}

/**
 * Subscribe to Realtime opportunity additions, edits, publications, and removals.
 */
export function subscribeToOpportunities(callback) {
  let supabaseChannel = null;

  if (supabase && typeof supabase.channel === 'function') {
    try {
      supabaseChannel = supabase
        .channel('public:opportunities_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'opportunities' }, (payload) => {
          callback(payload);
        })
        .subscribe();
    } catch (e) {
      console.warn('Could not establish Supabase Realtime channel for opportunities:', e);
    }
  }

  let bc = null;
  if (typeof BroadcastChannel !== 'undefined') {
    try {
      bc = new BroadcastChannel(OPP_BROADCAST_CHANNEL);
      bc.onmessage = () => callback({ eventType: 'BROADCAST_UPDATE' });
    } catch (e) {}
  }

  const storageHandler = (e) => {
    if (e.key === LOCAL_STORAGE_OPPS_KEY) {
      callback({ eventType: 'STORAGE_UPDATE' });
    }
  };
  window.addEventListener('storage', storageHandler);

  const customHandler = () => callback({ eventType: 'LOCAL_DISPATCH' });
  window.addEventListener('cobit_opportunity_changed', customHandler);

  return function unsubscribe() {
    if (supabaseChannel && supabase) {
      try { supabase.removeChannel(supabaseChannel); } catch (e) {}
    }
    if (bc) {
      try { bc.close(); } catch (e) {}
    }
    window.removeEventListener('storage', storageHandler);
    window.removeEventListener('cobit_opportunity_changed', customHandler);
  };
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
