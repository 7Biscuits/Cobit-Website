/**
 * CoBit - Public Opportunities Section Controller
 * Dynamically fetches published/active opportunities from the backend service
 * and listens for Realtime additions, edits, and deletions.
 */

import { getPublishedOpportunities, subscribeToOpportunities } from './supabase.js';

let cachedOpportunities = [];
let unsubscribeRealtime = null;

/**
 * Initialize the Opportunities section on the public website.
 */
export async function initOpportunities() {
  const container = document.getElementById('opportunitiesContainer');
  if (!container) return;

  // Show loading state initially
  container.innerHTML = `
    <div class="opportunities-loading">
      <div class="opportunities-loading-spinner" aria-hidden="true"></div>
      <p>Loading available opportunities...</p>
    </div>
  `;

  // Fetch opportunities
  await loadOpportunities(container);

  // Subscribe to Realtime backend updates so changes by admin appear automatically
  if (!unsubscribeRealtime) {
    unsubscribeRealtime = subscribeToOpportunities(async (payload) => {
      console.log('[Opportunities] Realtime backend change detected:', payload?.eventType || 'UPDATE');
      await loadOpportunities(container);
    });
  }

  // Also refresh when tab regains focus
  window.addEventListener('focus', () => {
    loadOpportunities(container);
  });
}

/**
 * Fetch and render published opportunities.
 */
async function loadOpportunities(container) {
  try {
    const opps = await getPublishedOpportunities();
    cachedOpportunities = opps || [];
    renderOpportunities(container, cachedOpportunities);
  } catch (err) {
    console.error('Failed to load opportunities from backend:', err);
    // Even on error, if we have no cached data, display the empty state cleanly
    if (!cachedOpportunities || cachedOpportunities.length === 0) {
      renderOpportunities(container, []);
    }
  }
}

/**
 * Render opportunity cards or empty state if none are currently available.
 */
function renderOpportunities(container, list) {
  // Only active/published opportunities should be visible to users
  const activeList = (list || []).filter(o => o.is_published !== false);

  if (activeList.length === 0) {
    container.innerHTML = `
      <div class="opportunities-empty" role="region" aria-label="Opportunities status">
        <div class="opportunities-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
          </svg>
        </div>
        <h3>No Current Openings or Opportunities Available.</h3>
        <p>We regularly launch workshops, mentoring cohorts, student fellowships, and internship drives. Please check back soon or reach out to our team directly.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="opportunities-grid">
      ${activeList.map(opp => renderOpportunityCard(opp)).join('')}
    </div>
  `;
}

/**
 * Render single opportunity card.
 */
function renderOpportunityCard(opp) {
  const title = escapeHTML(opp.title || 'Open Opportunity');
  const desc = escapeHTML(opp.description || '');
  const eligibility = escapeHTML(opp.eligibility || '');
  const requirements = escapeHTML(opp.requirements || '');
  const appLink = (opp.application_link || '').trim();

  const formattedDate = opp.created_at
    ? new Date(opp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  return `
    <article class="opportunity-card" data-id="${opp.id}">
      <div class="opp-card-top">
        <span class="opp-badge-active">
          <span class="opp-badge-dot" aria-hidden="true"></span>
          Active Opening
        </span>
        ${formattedDate ? `<span class="opp-card-date">Posted ${formattedDate}</span>` : ''}
      </div>

      <h3 class="opp-card-title">${title}</h3>
      <p class="opp-card-desc">${desc}</p>

      ${eligibility ? `
        <div class="opp-details-block">
          <span class="opp-details-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Eligibility
          </span>
          <div class="opp-details-val">${eligibility}</div>
        </div>
      ` : ''}

      ${requirements ? `
        <div class="opp-details-block">
          <span class="opp-details-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            Requirements
          </span>
          <div class="opp-details-val">${requirements}</div>
        </div>
      ` : ''}

      <div class="opp-card-footer">
        ${appLink ? `
          <a href="${escapeHTML(appLink)}" class="opp-apply-btn" target="_blank" rel="noopener noreferrer">
            <span>Apply for Opportunity</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        ` : `
          <span class="opp-no-link-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Direct applications: Contact via school coordinator or <a href="#s-contact" onclick="document.querySelector('#site .sn a[data-s=\\'contact\\']')?.click()">enquire here</a>
          </span>
        `}
      </div>
    </article>
  `;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
