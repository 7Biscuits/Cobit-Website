/**
 * CoBit Private Admin Dashboard Logic
 * Uses Supabase Auth, Projects Table, Admin Profiles, and Supabase Storage for project management.
 */

import {
  supabase,
  getAllProjects,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectMedia,
  getAdminProfile,
  getAllAdminProfiles,
  verifyAdminAccount,
  rejectAdminAccount,
  deleteAdminAccount,
  updateAdminCredentials,
  isOverallAdminEmail,
  getOverallAdminEmail
} from '../js/supabase.js';

// State
let currentUser = null;
let currentAdminProfile = null;
let allProjects = [];
let allAdminProfiles = [];
let editingProjectId = null;
let coverImageUrl = '';
let screenshotUrls = [];
let pendingDeleteId = null;
let isSignUpMode = false;

// DOM Elements - Auth & Sections
const authSection = document.getElementById('authSection');
const pendingSection = document.getElementById('pendingSection');
const dashSection = document.getElementById('dashSection');
const userControls = document.getElementById('userControls');
const userEmailEl = document.getElementById('userEmail');
const btnSignOut = document.getElementById('btnSignOut');
const btnManageAdmins = document.getElementById('btnManageAdmins');
const pendingCountBadge = document.getElementById('pendingCountBadge');
const btnAccountSettings = document.getElementById('btnAccountSettings');

// Pending state controls
const pendingTitle = document.getElementById('pendingTitle');
const pendingDesc = document.getElementById('pendingDesc');
const pendingUserEmail = document.getElementById('pendingUserEmail');
const btnRefreshPendingStatus = document.getElementById('btnRefreshPendingStatus');
const btnPendingSignOut = document.getElementById('btnPendingSignOut');

// Auth Form elements
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authError = document.getElementById('authError');
const tabSignIn = document.getElementById('tabSignIn');
const tabSignUp = document.getElementById('tabSignUp');

// Dashboard controls
const totalCountEl = document.getElementById('totalCount');
const pubCountEl = document.getElementById('pubCount');
const draftCountEl = document.getElementById('draftCount');
const searchInput = document.getElementById('searchInput');
const filterCategory = document.getElementById('filterCategory');
const filterStatus = document.getElementById('filterStatus');
const btnNewProject = document.getElementById('btnNewProject');
const projectsTableBody = document.getElementById('projectsTableBody');
const emptyStateEl = document.getElementById('emptyState');

// Modals
const projectEditorModal = document.getElementById('projectEditorModal');
const projectForm = document.getElementById('projectForm');
const modalTitle = document.getElementById('modalTitle');
const btnSaveProject = document.getElementById('btnSaveProject');
const btnCancelEditor = document.getElementById('btnCancelEditor');
const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const deleteProjectTitleEl = document.getElementById('deleteProjectTitle');

// Account Settings Modal
const accountSettingsModal = document.getElementById('accountSettingsModal');
const accountSettingsForm = document.getElementById('accountSettingsForm');
const accCurrentEmail = document.getElementById('accCurrentEmail');
const accNewEmail = document.getElementById('accNewEmail');
const accNewPassword = document.getElementById('accNewPassword');
const accConfirmPassword = document.getElementById('accConfirmPassword');
const btnSaveAccount = document.getElementById('btnSaveAccount');
const btnCloseAccountModal = document.getElementById('btnCloseAccountModal');
const btnCancelAccountModal = document.getElementById('btnCancelAccountModal');

// Admins Management Modal
const adminsModal = document.getElementById('adminsModal');
const adminsTableBody = document.getElementById('adminsTableBody');

// Image upload elements
const coverFileInput = document.getElementById('coverFileInput');
const coverUrlInput = document.getElementById('coverUrlInput');
const coverPreviewWrap = document.getElementById('coverPreviewWrap');
const screenshotsFileInput = document.getElementById('screenshotsFileInput');
const screenshotsUrlInput = document.getElementById('screenshotsUrlInput');
const screenshotsPreviewWrap = document.getElementById('screenshotsPreviewWrap');

// Toast container
const toastContainer = document.getElementById('toastContainer');

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initAdmin);

async function initAdmin() {
  setupDialogs();
  setupEventListeners();

  if (!supabase) {
    showToast('Supabase configuration missing or invalid. Check your .env file.', 'error');
    const authError = document.getElementById('authError');
    if (authError) {
      authError.textContent = 'Supabase configuration is not loaded. Please ensure .env exists with valid SUPABASE_URL and SUPABASE_ANON_KEY, then run "npm run config" or "npm start".';
      authError.style.display = 'block';
    }
    return;
  }

  // Check initial session
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    await handleAuthState(session?.user || null);
  } catch (err) {
    console.error('Session check error:', err);
    await handleAuthState(null);
  }

  // Listen to auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    await handleAuthState(session?.user || null);
  });
}

/**
 * Handle authentication and role verification state.
 * Prevents unverified admins from using any admin tools until approved by admin@cobit.example.
 */
async function handleAuthState(user) {
  currentUser = user;

  if (!user) {
    currentAdminProfile = null;
    authSection.style.display = 'flex';
    pendingSection.style.display = 'none';
    dashSection.style.display = 'none';
    userControls.style.display = 'none';
    userEmailEl.textContent = '';
    btnManageAdmins.style.display = 'none';
    allProjects = [];
    return;
  }

  userControls.style.display = 'flex';
  userEmailEl.textContent = user.email || 'Admin';

  try {
    // 1. Fetch admin profile to check verification status
    let profile = await getAdminProfile(user.id);

    if (!profile) {
      // Fallback: create initial profile if trigger did not execute
      const isOverall = isOverallAdminEmail(user.email);
      const { data, error: insertErr } = await supabase
        .from('admin_profiles')
        .insert([{
          id: user.id,
          email: user.email,
          is_verified: isOverall,
          verified_at: isOverall ? new Date().toISOString() : null,
          verified_by: isOverall ? 'system' : null
        }])
        .select()
        .single();

      if (!insertErr && data) {
        profile = data;
      } else {
        profile = { id: user.id, email: user.email, is_verified: isOverall };
      }
    }

    currentAdminProfile = profile;

    // 2. Enforce verification check
    if (!profile.is_verified) {
      // User is registered but NOT verified by admin@cobit.example
      authSection.style.display = 'none';
      dashSection.style.display = 'none';
      pendingSection.style.display = 'flex';
      btnManageAdmins.style.display = 'none';
      if (pendingUserEmail) pendingUserEmail.textContent = user.email;

      const overallAdmin = getOverallAdminEmail();
      if (profile.status === 'rejected') {
        if (pendingTitle) pendingTitle.textContent = 'Account Application Rejected';
        if (pendingDesc) pendingDesc.innerHTML = `Your request for admin privileges was rejected by the overall administrator (<strong>${escapeHTML(overallAdmin)}</strong>). You do not have access to admin features.`;
      } else {
        if (pendingTitle) pendingTitle.textContent = 'Account Pending Verification';
        if (pendingDesc) pendingDesc.innerHTML = `Your admin account has been registered, but has not yet been accepted by the overall administrator. To use admin features, your account must be verified by <strong>${escapeHTML(overallAdmin)}</strong>.`;
      }
      return;
    }

    // 3. User is verified -> grant access to dashboard
    authSection.style.display = 'none';
    pendingSection.style.display = 'none';
    dashSection.style.display = 'block';

    // 4. Overall admin privileges (admin@cobit.example)
    const isOverall = isOverallAdminEmail(user.email);
    if (isOverall) {
      btnManageAdmins.style.display = 'inline-flex';
      await refreshAdminsBadge();
    } else {
      btnManageAdmins.style.display = 'none';
    }

    await loadDashboardProjects();
  } catch (err) {
    console.error('Error verifying admin authorization:', err);
    showToast('Failed to verify authorization: ' + err.message, 'error');
  }
}

function setupEventListeners() {
  // Auth Tabs
  tabSignIn.addEventListener('click', () => {
    isSignUpMode = false;
    tabSignIn.classList.add('active');
    tabSignUp.classList.remove('active');
    authTitle.textContent = 'Admin Sign In';
    authSubmitBtn.textContent = 'Sign In';
    authError.style.display = 'none';
  });

  tabSignUp.addEventListener('click', () => {
    isSignUpMode = true;
    tabSignUp.classList.add('active');
    tabSignIn.classList.remove('active');
    authTitle.textContent = 'Register Admin Account';
    authSubmitBtn.textContent = 'Create Admin Account';
    authError.style.display = 'none';
  });

  // Auth Form Submit
  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = isSignUpMode ? 'Registering...' : 'Authenticating...';
    authError.style.display = 'none';

    try {
      if (isSignUpMode) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (data.session) {
          showToast('Account registered! Checking approval status...', 'info');
          await handleAuthState(data.user);
        } else {
          showToast('Account created successfully. Please sign in.', 'success');
          tabSignIn.click();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        showToast('Signed in successfully', 'success');
        await handleAuthState(data.user);
      }
    } catch (err) {
      console.error('Auth error:', err);
      authError.textContent = err.message || 'Authentication failed. Please verify credentials.';
      authError.style.display = 'block';
    } finally {
      authSubmitBtn.disabled = false;
      authSubmitBtn.textContent = isSignUpMode ? 'Create Admin Account' : 'Sign In';
    }
  });

  // Pending View buttons
  if (btnRefreshPendingStatus) {
    btnRefreshPendingStatus.addEventListener('click', async () => {
      btnRefreshPendingStatus.disabled = true;
      btnRefreshPendingStatus.textContent = 'Checking...';
      showToast('Checking approval status...', 'info');
      await handleAuthState(currentUser);
      btnRefreshPendingStatus.disabled = false;
      btnRefreshPendingStatus.textContent = 'Check Status';
    });
  }

  if (btnPendingSignOut) {
    btnPendingSignOut.addEventListener('click', signOutAdmin);
  }

  // Sign out button
  btnSignOut.addEventListener('click', signOutAdmin);

  // Account Settings Modal (Update Email & Password)
  if (btnAccountSettings) {
    btnAccountSettings.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openAccountSettings();
    });
  }
  if (btnCloseAccountModal) {
    btnCloseAccountModal.addEventListener('click', () => accountSettingsModal.close());
  }
  if (btnCancelAccountModal) {
    btnCancelAccountModal.addEventListener('click', () => accountSettingsModal.close());
  }
  if (accountSettingsForm) {
    accountSettingsForm.addEventListener('submit', handleAccountSettingsSave);
  }

  // Manage Admins Modal (For admin@cobit.example)
  if (btnManageAdmins) {
    btnManageAdmins.addEventListener('click', openAdminsModal);
  }

  // Filter & Search
  searchInput.addEventListener('input', renderProjectsTable);
  filterCategory.addEventListener('change', renderProjectsTable);
  filterStatus.addEventListener('change', renderProjectsTable);

  // New Project Button
  btnNewProject.addEventListener('click', () => openProjectEditor(null));

  // Editor Modal Cancel & Delete Cancel
  btnCancelEditor.addEventListener('click', () => projectEditorModal.close());
  btnCancelDelete.addEventListener('click', () => deleteConfirmModal.close());

  // Save Project Form
  projectForm.addEventListener('submit', handleProjectSave);

  // Confirm Delete
  btnConfirmDelete.addEventListener('click', handleProjectDelete);

  // File Upload Handlers (Supabase Storage)
  coverFileInput.addEventListener('change', handleCoverUpload);
  coverUrlInput.addEventListener('input', () => {
    coverImageUrl = coverUrlInput.value.trim();
    renderCoverPreview();
  });

  screenshotsFileInput.addEventListener('change', handleScreenshotsUpload);
  screenshotsUrlInput.addEventListener('change', handleScreenshotsUrlPaste);
}

async function signOutAdmin() {
  try {
    await supabase.auth.signOut();
    showToast('Signed out', 'info');
    await handleAuthState(null);
  } catch (err) {
    console.error('Sign out error:', err);
  }
}

// Dialog light dismiss setup
function setupDialogs() {
  [projectEditorModal, deleteConfirmModal, accountSettingsModal, adminsModal].forEach(dialog => {
    if (!dialog) return;

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isDialogContent = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isDialogContent) dialog.close();
      });
    }
  });
}

// ==========================================
// FEATURE: ACCOUNT SETTINGS (UPDATE EMAIL & PASSWORD)
// ==========================================

async function openAccountSettings() {
  if (!accountSettingsModal) {
    console.error('accountSettingsModal element not found');
    return;
  }

  // Ensure currentUser is populated
  if (!currentUser) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        currentUser = session.user;
      }
    } catch (e) {
      console.warn('Session refresh failed:', e);
    }
  }

  if (!currentUser) {
    showToast('Please sign in first to access account settings.', 'error');
    return;
  }

  if (accCurrentEmail) accCurrentEmail.value = currentUser.email || '';
  if (accNewEmail) accNewEmail.value = '';
  if (accNewPassword) accNewPassword.value = '';
  if (accConfirmPassword) accConfirmPassword.value = '';

  try {
    if (typeof accountSettingsModal.showModal === 'function') {
      accountSettingsModal.showModal();
    } else {
      accountSettingsModal.setAttribute('open', '');
    }
  } catch (err) {
    console.error('Error opening accountSettingsModal:', err);
    accountSettingsModal.setAttribute('open', '');
  }
}

async function handleAccountSettingsSave(e) {
  e.preventDefault();

  const newEmail = accNewEmail ? accNewEmail.value.trim() : '';
  const newPassword = accNewPassword ? accNewPassword.value : '';
  const confirmPassword = accConfirmPassword ? accConfirmPassword.value : '';

  if (!newEmail && !newPassword) {
    showToast('Please enter a new email or password to update.', 'error');
    return;
  }

  if (newPassword) {
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match. Please re-enter.', 'error');
      return;
    }
  }

  if (btnSaveAccount) {
    btnSaveAccount.disabled = true;
    btnSaveAccount.textContent = 'Updating...';
  }

  try {
    const payload = {};
    if (newEmail && newEmail !== currentUser.email) payload.email = newEmail;
    if (newPassword) payload.password = newPassword;

    if (Object.keys(payload).length === 0) {
      showToast('No changes detected.', 'info');
      accountSettingsModal.close();
      return;
    }

    await updateAdminCredentials(payload);

    let msg = 'Account credentials updated successfully!';
    if (payload.email) {
      msg += ' Check your email inbox to confirm the new address.';
      currentUser.email = payload.email;
      if (userEmailEl) userEmailEl.textContent = payload.email;
    }
    showToast(msg, 'success');
    accountSettingsModal.close();
  } catch (err) {
    console.error('Credentials update error:', err);
    const errText = err.message || '';
    if (errText.includes('same_password')) {
      showToast('New password should be different from your current password.', 'error');
    } else {
      showToast('Failed to update credentials: ' + (errText || err), 'error');
    }
  } finally {
    if (btnSaveAccount) {
      btnSaveAccount.disabled = false;
      btnSaveAccount.textContent = 'Update Credentials';
    }
  }
}

// ==========================================
// FEATURE: ADMIN ACCOUNT APPROVALS (admin@cobit.example)
// ==========================================

async function refreshAdminsBadge() {
  if (!isOverallAdminEmail(currentUser?.email)) return;
  try {
    const profiles = await getAllAdminProfiles();
    const pendingCount = profiles.filter(p => !p.is_verified && p.status !== 'rejected').length;
    if (pendingCount > 0) {
      pendingCountBadge.textContent = pendingCount;
      pendingCountBadge.style.display = 'inline-block';
    } else {
      pendingCountBadge.style.display = 'none';
    }
  } catch (err) {
    console.warn('Could not refresh admin approvals badge:', err);
  }
}

async function openAdminsModal() {
  const modalSub = document.querySelector('#adminsModal p');
  if (modalSub) {
    const overallAdmin = getOverallAdminEmail();
    modalSub.innerHTML = `As the overall administrator (<strong>${escapeHTML(overallAdmin)}</strong>), approve or revoke access for newly registered admin accounts.`;
  }
  adminsModal.showModal();
  await loadAdminsList();
}

async function loadAdminsList() {
  adminsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted);">Loading admin accounts...</td></tr>`;

  try {
    allAdminProfiles = await getAllAdminProfiles();
    renderAdminsTable();
    await refreshAdminsBadge();
  } catch (err) {
    console.error('Failed to load admin profiles:', err);
    adminsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--danger);">Error loading admin accounts: ${escapeHTML(err.message)}</td></tr>`;
  }
}

function renderAdminsTable() {
  if (allAdminProfiles.length === 0) {
    adminsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-muted);">No admin profiles found.</td></tr>`;
    return;
  }

  adminsTableBody.innerHTML = allAdminProfiles.map(p => {
    const isRoot = isOverallAdminEmail(p.email);
    const status = p.status || (p.is_verified ? 'approved' : 'pending');

    let badgeHtml = '';
    if (status === 'approved') {
      badgeHtml = `<span class="badge-verified">Approved</span>`;
    } else if (status === 'rejected') {
      badgeHtml = `<span class="badge-rejected">Rejected</span>`;
    } else {
      badgeHtml = `<span class="badge-pending">Pending</span>`;
    }

    let actionsHtml = '';
    if (isRoot) {
      actionsHtml = `<span style="font-size:0.8rem;color:var(--text-muted);">Root Protected</span>`;
    } else if (status === 'approved') {
      actionsHtml = `
        <div class="admins-actions-cell">
          <button type="button" class="btn btn-secondary btn-sm" style="color:var(--danger);border-color:rgba(230,76,76,0.3);" data-action="revoke-admin" data-id="${p.id}" data-email="${escapeHTML(p.email)}">
            Revoke Access
          </button>
        </div>
      `;
    } else if (status === 'rejected') {
      actionsHtml = `
        <div class="admins-actions-cell">
          <button type="button" class="btn btn-primary btn-sm" style="background:var(--success);border-color:var(--success);" data-action="verify-admin" data-id="${p.id}" data-email="${escapeHTML(p.email)}">
            Accept &amp; Verify
          </button>
          <button type="button" class="btn btn-secondary btn-sm" style="color:var(--danger);border-color:rgba(230,76,76,0.3);" data-action="delete-admin" data-id="${p.id}" data-email="${escapeHTML(p.email)}" title="Delete record">
            Remove
          </button>
        </div>
      `;
    } else {
      // Pending state: both Accept & Verify AND Reject options!
      actionsHtml = `
        <div class="admins-actions-cell">
          <button type="button" class="btn btn-primary btn-sm" style="background:var(--success);border-color:var(--success);" data-action="verify-admin" data-id="${p.id}" data-email="${escapeHTML(p.email)}">
            Accept &amp; Verify
          </button>
          <button type="button" class="btn btn-danger btn-sm" data-action="reject-admin" data-id="${p.id}" data-email="${escapeHTML(p.email)}">
            Reject
          </button>
        </div>
      `;
    }

    return `
      <tr data-admin-id="${p.id}">
        <td>
          <strong style="color:#fff;">${escapeHTML(p.email)}</strong>
          ${isRoot ? ' <span style="font-size:0.75rem;color:var(--accent);">(Overall Admin)</span>' : ''}
        </td>
        <td>
          ${badgeHtml}
        </td>
        <td style="color:var(--text-muted);font-size:0.85rem;">
          ${formatDate(p.created_at)}
        </td>
        <td style="text-align: right;">
          ${actionsHtml}
        </td>
      </tr>
    `;
  }).join('');

  // Attach action listeners
  adminsTableBody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const adminId = btn.dataset.id;
      const adminEmail = btn.dataset.email;
      const action = btn.dataset.action;

      btn.disabled = true;
      try {
        if (action === 'verify-admin') {
          await verifyAdminAccount(adminId, true);
          showToast(`Admin account "${adminEmail}" accepted and verified!`, 'success');
        } else if (action === 'reject-admin') {
          await rejectAdminAccount(adminId);
          showToast(`Admin account "${adminEmail}" has been rejected.`, 'info');
        } else if (action === 'revoke-admin') {
          await rejectAdminAccount(adminId);
          showToast(`Access revoked for "${adminEmail}".`, 'info');
        } else if (action === 'delete-admin') {
          await deleteAdminAccount(adminId);
          showToast(`Admin record for "${adminEmail}" removed.`, 'info');
        }
        await loadAdminsList();
      } catch (err) {
        console.error('Error changing admin verification:', err);
        showToast('Action failed: ' + err.message, 'error');
        btn.disabled = false;
      }
    });
  });
}

// ==========================================
// PROJECTS MANAGEMENT & CRUD
// ==========================================

async function loadDashboardProjects() {
  try {
    projectsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-muted);">Loading projects...</td></tr>`;
    allProjects = await getAllProjects();
    updateStats();
    renderProjectsTable();
  } catch (err) {
    console.error('Failed to load projects:', err);
    showToast('Failed to load projects: ' + err.message, 'error');
    projectsTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--danger);">Error loading projects from Supabase.</td></tr>`;
  }
}

function updateStats() {
  const total = allProjects.length;
  const published = allProjects.filter(p => p.is_published).length;
  const drafts = total - published;

  totalCountEl.textContent = total;
  pubCountEl.textContent = published;
  draftCountEl.textContent = drafts;
}

function renderProjectsTable() {
  const query = searchInput.value.trim().toLowerCase();
  const catFilter = filterCategory.value;
  const statusFilter = filterStatus.value;

  const filtered = allProjects.filter(p => {
    const matchesQuery = !query ||
      (p.title && p.title.toLowerCase().includes(query)) ||
      (p.description && p.description.toLowerCase().includes(query));

    const matchesCat = catFilter === 'all' || (p.category || '').toLowerCase() === catFilter.toLowerCase();

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'published' && p.is_published) ||
      (statusFilter === 'draft' && !p.is_published);

    return matchesQuery && matchesCat && matchesStatus;
  });

  if (filtered.length === 0) {
    projectsTableBody.innerHTML = '';
    emptyStateEl.style.display = 'block';
    return;
  }

  emptyStateEl.style.display = 'none';

  projectsTableBody.innerHTML = filtered.map(p => {
    const thumb = p.cover_image || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'40\' viewBox=\'0 0 60 40\'><rect width=\'100%\' height=\'100%\' fill=\'%23121D28\'/></svg>';
    const isPub = !!p.is_published;

    return `
      <tr data-id="${p.id}">
        <td>
          <div class="project-meta-cell">
            <img class="table-thumb" src="${thumb}" alt="" loading="lazy">
            <div class="table-project-info">
              <span class="table-project-title">${escapeHTML(p.title)}</span>
              <div class="table-project-links">
                ${p.website_link ? `<a href="${p.website_link}" target="_blank" rel="noopener">Website ↗</a>` : ''}
                ${p.github_link ? `<a href="${p.github_link}" target="_blank" rel="noopener">GitHub ↗</a>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="category-tag">${escapeHTML(p.category || 'Tech')}</span>
        </td>
        <td>
          <button class="status-toggle-btn" data-id="${p.id}" data-action="toggle-pub" title="Click to toggle publication">
            <span class="status-pill ${isPub ? 'published' : 'draft'}">
              ${isPub ? '● Published' : '○ Draft'}
            </span>
          </button>
        </td>
        <td>
          <span style="font-size:0.82rem;color:var(--text-muted);">${formatDate(p.created_at)}</span>
        </td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" data-id="${p.id}" data-action="edit">Edit</button>
            <button class="btn btn-danger btn-sm" data-id="${p.id}" data-action="delete">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  projectsTableBody.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const action = btn.dataset.action;
      const project = allProjects.find(p => p.id === id);
      if (!project) return;

      if (action === 'toggle-pub') {
        togglePublication(project);
      } else if (action === 'edit') {
        openProjectEditor(project);
      } else if (action === 'delete') {
        promptDeleteProject(project);
      }
    });
  });
}

async function togglePublication(project) {
  const newStatus = !project.is_published;
  try {
    await updateProject(project.id, { is_published: newStatus });
    project.is_published = newStatus;
    updateStats();
    renderProjectsTable();
    showToast(`Project "${project.title}" set to ${newStatus ? 'Published' : 'Draft'}`, 'success');
  } catch (err) {
    console.error('Error toggling publication:', err);
    showToast('Failed to update publication status: ' + err.message, 'error');
  }
}

function openProjectEditor(project = null) {
  editingProjectId = project ? project.id : null;
  modalTitle.textContent = project ? 'Edit Project' : 'Create New Project';
  btnSaveProject.textContent = project ? 'Update Project' : 'Create Project';

  document.getElementById('projTitle').value = project ? project.title : '';
  document.getElementById('projCategory').value = project ? project.category : 'Tech';
  document.getElementById('projPublished').checked = project ? !!project.is_published : true;
  document.getElementById('projDesc').value = project ? project.description : '';
  document.getElementById('projWebsite').value = project ? (project.website_link || '') : '';
  document.getElementById('projGithub').value = project ? (project.github_link || '') : '';

  coverImageUrl = project ? (project.cover_image || '') : '';
  coverUrlInput.value = coverImageUrl;
  renderCoverPreview();

  screenshotUrls = project && Array.isArray(project.screenshots) ? [...project.screenshots] : [];
  screenshotsUrlInput.value = '';
  renderScreenshotsPreview();

  projectEditorModal.showModal();
}

async function handleProjectSave(e) {
  e.preventDefault();

  const title = document.getElementById('projTitle').value.trim();
  const category = document.getElementById('projCategory').value.trim();
  const is_published = document.getElementById('projPublished').checked;
  const description = document.getElementById('projDesc').value.trim();
  const website_link = document.getElementById('projWebsite').value.trim() || null;
  const github_link = document.getElementById('projGithub').value.trim() || null;

  if (!title || !description) {
    showToast('Please fill in both title and description.', 'error');
    return;
  }

  const payload = {
    title,
    category,
    is_published,
    description,
    cover_image: coverImageUrl || null,
    screenshots: screenshotUrls,
    website_link,
    github_link
  };

  btnSaveProject.disabled = true;
  btnSaveProject.textContent = 'Saving...';

  try {
    if (editingProjectId) {
      await updateProject(editingProjectId, payload);
      showToast('Project updated successfully', 'success');
    } else {
      await createProject(payload);
      showToast('Project created successfully', 'success');
    }

    projectEditorModal.close();
    await loadDashboardProjects();
  } catch (err) {
    console.error('Error saving project:', err);
    showToast('Failed to save project: ' + err.message, 'error');
  } finally {
    btnSaveProject.disabled = false;
    btnSaveProject.textContent = editingProjectId ? 'Update Project' : 'Create Project';
  }
}

async function handleCoverUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const dropzonePrompt = coverFileInput.closest('.upload-dropzone').querySelector('.upload-prompt');
  const originalPrompt = dropzonePrompt.textContent;
  dropzonePrompt.textContent = 'Uploading to Supabase Storage...';

  try {
    showToast('Uploading cover image to Supabase Storage...', 'info');
    const publicUrl = await uploadProjectMedia(file);
    coverImageUrl = publicUrl;
    coverUrlInput.value = publicUrl;
    renderCoverPreview();
    showToast('Cover image uploaded successfully!', 'success');
  } catch (err) {
    console.error('Upload error:', err);
    showToast('Failed to upload image: ' + err.message, 'error');
  } finally {
    dropzonePrompt.textContent = originalPrompt;
    coverFileInput.value = '';
  }
}

function renderCoverPreview() {
  if (!coverImageUrl) {
    coverPreviewWrap.innerHTML = '';
    return;
  }
  coverPreviewWrap.innerHTML = `
    <div class="upload-preview-item" style="width:120px;height:75px;">
      <img src="${coverImageUrl}" alt="Cover preview">
      <button type="button" class="btn-remove-preview" title="Remove cover image">&times;</button>
    </div>
  `;
  coverPreviewWrap.querySelector('.btn-remove-preview').addEventListener('click', () => {
    coverImageUrl = '';
    coverUrlInput.value = '';
    renderCoverPreview();
  });
}

async function handleScreenshotsUpload(e) {
  const files = Array.from(e.target.files);
  if (!files || files.length === 0) return;

  const dropzonePrompt = screenshotsFileInput.closest('.upload-dropzone').querySelector('.upload-prompt');
  const originalPrompt = dropzonePrompt.textContent;
  dropzonePrompt.textContent = `Uploading ${files.length} screenshot(s)...`;

  try {
    showToast(`Uploading ${files.length} file(s) to Supabase Storage...`, 'info');
    for (const file of files) {
      const publicUrl = await uploadProjectMedia(file);
      screenshotUrls.push(publicUrl);
    }
    renderScreenshotsPreview();
    showToast('Screenshots uploaded successfully!', 'success');
  } catch (err) {
    console.error('Error uploading screenshots:', err);
    showToast('Failed to upload screenshots: ' + err.message, 'error');
  } finally {
    dropzonePrompt.textContent = originalPrompt;
    screenshotsFileInput.value = '';
  }
}

function handleScreenshotsUrlPaste(e) {
  const val = e.target.value.trim();
  if (!val) return;

  const urls = val.split('\n').map(u => u.trim()).filter(Boolean);
  urls.forEach(u => {
    if (!screenshotUrls.includes(u)) screenshotUrls.push(u);
  });
  renderScreenshotsPreview();
  e.target.value = '';
}

function renderScreenshotsPreview() {
  if (screenshotUrls.length === 0) {
    screenshotsPreviewWrap.innerHTML = '';
    return;
  }

  screenshotsPreviewWrap.innerHTML = screenshotUrls.map((url, i) => `
    <div class="upload-preview-item" data-idx="${i}">
      <img src="${url}" alt="Screenshot preview ${i + 1}">
      <button type="button" class="btn-remove-preview" data-idx="${i}" title="Remove screenshot">&times;</button>
    </div>
  `).join('');

  screenshotsPreviewWrap.querySelectorAll('.btn-remove-preview').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.idx, 10);
      screenshotUrls.splice(idx, 1);
      renderScreenshotsPreview();
    });
  });
}

function promptDeleteProject(project) {
  pendingDeleteId = project.id;
  deleteProjectTitleEl.textContent = `"${project.title}"`;
  deleteConfirmModal.showModal();
}

async function handleProjectDelete() {
  if (!pendingDeleteId) return;

  btnConfirmDelete.disabled = true;
  btnConfirmDelete.textContent = 'Deleting...';

  try {
    await deleteProject(pendingDeleteId);
    showToast('Project deleted successfully', 'success');
    deleteConfirmModal.close();
    await loadDashboardProjects();
  } catch (err) {
    console.error('Error deleting project:', err);
    showToast('Failed to delete project: ' + err.message, 'error');
  } finally {
    btnConfirmDelete.disabled = false;
    btnConfirmDelete.textContent = 'Delete Project';
    pendingDeleteId = null;
  }
}

function showToast(message, type = 'info') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
