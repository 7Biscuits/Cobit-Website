/**
 * CoBit - Public Projects Section Controller
 * Dynamically fetches published projects from Supabase and manages project details modal.
 */

import { getPublishedProjects } from './supabase.js';

let cachedProjects = [];
let activeCategory = 'all';

export async function initProjects() {
  const grid = document.getElementById('projectsGrid');
  const filterContainer = document.getElementById('projectFilters');
  const modal = document.getElementById('projectModal');

  if (!grid) return;

  // Setup Light Dismiss for Project Modal per modern web guidelines
  setupModalLightDismiss(modal);

  // Setup category filters
  if (filterContainer) {
    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.pf-btn');
      if (!btn) return;

      filterContainer.querySelectorAll('.pf-btn').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      activeCategory = btn.dataset.category || 'all';
      renderProjects(grid, cachedProjects, activeCategory);
    });
  }

  // Initial loading state
  grid.innerHTML = `
    <div class="projects-loading">
      <div class="projects-loading-spinner" aria-hidden="true"></div>
      <p>Loading CoBit student projects...</p>
    </div>
  `;

  try {
    const projects = await getPublishedProjects();
    cachedProjects = projects || [];
    renderProjects(grid, cachedProjects, activeCategory);
  } catch (err) {
    console.error('Failed to load projects from Supabase:', err);
    grid.innerHTML = `
      <div class="projects-empty">
        <p style="color:#FF7B72;margin-bottom:8px;">Unable to load projects from Supabase.</p>
        <p style="font-size:0.85rem;color:var(--sf);">Please check network connectivity or refresh the page.</p>
      </div>
    `;
  }
}

/**
 * Render project cards according to active category filter.
 */
function renderProjects(container, projects, category) {
  const filtered = category === 'all'
    ? projects
    : projects.filter(p => (p.category || '').toLowerCase() === category.toLowerCase());

  if (!filtered || filtered.length === 0) {
    container.innerHTML = `
      <div class="projects-empty">
        <p>No projects found in this track yet.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const cover = p.cover_image || 'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'600\' height=\'340\' viewBox=\'0 0 600 340\'><rect width=\'100%\' height=\'100%\' fill=\'%23121D28\'/><text x=\'50%\' y=\'50%\' fill=\'%234FA8DE\' font-size=\'20\' font-family=\'sans-serif\' text-anchor=\'middle\' dy=\'.3em\'>CoBit Project</text></svg>';
    const cat = p.category || 'Tech';
    const desc = escapeHTML(p.description || '');

    return `
      <article class="project-card" data-id="${p.id}" tabindex="0" role="button" aria-label="View project details: ${escapeHTML(p.title)}">
        <div class="project-card-thumb-wrap">
          <img class="project-card-thumb" src="${cover}" alt="${escapeHTML(p.title)}" loading="lazy" onerror="this.onerror=null;this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'600\\' height=\\'340\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23121D28\\'/></svg>'">
          <span class="project-card-badge">${cat}</span>
        </div>
        <div class="project-card-content">
          <h3 class="project-card-title">${escapeHTML(p.title)}</h3>
          <p class="project-card-desc">${desc}</p>
          <div class="project-card-footer">
            <span class="project-card-cta">
              Details &amp; Proof
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </span>
            <div class="project-card-links-quick" onclick="event.stopPropagation()">
              ${p.website_link ? `
                <a href="${p.website_link}" target="_blank" rel="noopener noreferrer" title="Live Website" aria-label="Live Demo for ${escapeHTML(p.title)}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                </a>
              ` : ''}
              ${p.github_link ? `
                <a href="${p.github_link}" target="_blank" rel="noopener noreferrer" title="GitHub Source" aria-label="GitHub Repository for ${escapeHTML(p.title)}">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
                </a>
              ` : ''}
            </div>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach click listeners to cards
  container.querySelectorAll('.project-card').forEach(card => {
    const id = card.dataset.id;
    const project = projects.find(p => p.id === id);
    if (!project) return;

    card.addEventListener('click', () => openProjectModal(project));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openProjectModal(project);
      }
    });
  });
}

/**
 * Open Project Details Modal Dialog with Image Gallery, Proof of Work, and Links.
 */
export function openProjectModal(project) {
  const modal = document.getElementById('projectModal');
  if (!modal) return;

  const categoryEl = modal.querySelector('.project-modal-category');
  const titleEl = modal.querySelector('.project-modal-title');
  const descEl = modal.querySelector('.pm-description-text');
  const galleryWrap = modal.querySelector('.pm-gallery');
  const linksWrap = modal.querySelector('.pm-links-section');

  if (categoryEl) categoryEl.textContent = project.category || 'Tech Workshop';
  if (titleEl) titleEl.textContent = project.title;
  if (descEl) descEl.textContent = project.description || '';

  // Consolidate images: cover image + additional proof of work screenshots
  const allImages = [];
  if (project.cover_image) allImages.push({ url: project.cover_image, caption: 'Cover Preview' });
  if (Array.isArray(project.screenshots)) {
    project.screenshots.forEach((shot, i) => {
      if (shot) allImages.push({ url: shot, caption: `Proof of Work / Screenshot ${i + 1}` });
    });
  }

  // Setup Gallery
  if (galleryWrap) {
    if (allImages.length === 0) {
      galleryWrap.style.display = 'none';
    } else {
      galleryWrap.style.display = 'flex';
      const mainImg = galleryWrap.querySelector('.pm-gallery-main-img');
      const countEl = galleryWrap.querySelector('.pm-gallery-count');
      const thumbsWrap = galleryWrap.querySelector('.pm-gallery-thumbs');

      let currentIdx = 0;
      const updateGallery = (idx) => {
        currentIdx = idx;
        if (mainImg) {
          mainImg.src = allImages[idx].url;
          mainImg.alt = allImages[idx].caption;
        }
        if (countEl) {
          countEl.textContent = `${idx + 1} of ${allImages.length}`;
        }
        if (thumbsWrap) {
          thumbsWrap.querySelectorAll('.pm-thumb').forEach((th, i) => {
            th.classList.toggle('active', i === idx);
          });
        }
      };

      if (thumbsWrap) {
        thumbsWrap.innerHTML = allImages.map((img, i) => `
          <button type="button" class="pm-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" aria-label="View ${img.caption}">
            <img src="${img.url}" alt="" loading="lazy">
          </button>
        `).join('');

        thumbsWrap.querySelectorAll('.pm-thumb').forEach(btn => {
          btn.addEventListener('click', () => {
            updateGallery(parseInt(btn.dataset.idx, 10));
          });
        });
      }

      updateGallery(0);
    }
  }

  // Setup External Links (Website & GitHub)
  if (linksWrap) {
    linksWrap.innerHTML = '';
    let hasLinks = false;

    if (project.website_link) {
      hasLinks = true;
      const a = document.createElement('a');
      a.className = 'pm-link-btn primary';
      a.href = project.website_link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        Visit Website / Live Demo
      `;
      linksWrap.appendChild(a);
    }

    if (project.github_link) {
      hasLinks = true;
      const a = document.createElement('a');
      a.className = 'pm-link-btn';
      a.href = project.github_link;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
        Source Code / GitHub
      `;
      linksWrap.appendChild(a);
    }

    linksWrap.style.display = hasLinks ? 'flex' : 'none';
  }

  // Open modal via native HTML5 dialog showModal()
  if (typeof modal.showModal === 'function') {
    modal.showModal();
  } else {
    modal.setAttribute('open', '');
  }
}

/**
 * Configure modal close button & light dismiss fallback
 */
function setupModalLightDismiss(dialog) {
  if (!dialog) return;

  const closeBtn = dialog.querySelector('.project-modal-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      dialog.close();
    });
  }

  // Fallback for browsers without native closedby support
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
      if (!isDialogContent) {
        dialog.close();
      }
    });
  }
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
