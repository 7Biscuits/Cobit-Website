/**
 * CoBit - Modern Frequently Asked Questions (FAQ) Section Controller
 * Accessible accordion interactions, smooth animations, category filtering, search, and keyboard navigation.
 */

export function initFaqs() {
  const faqSection = document.getElementById('s-faqs');
  if (!faqSection) return;

  const searchInput = document.getElementById('faqSearchInput');
  const searchClearBtn = document.getElementById('faqSearchClear');
  const filterContainer = document.getElementById('faqFilters');
  const toggleAllBtn = document.getElementById('faqToggleAll');
  const countEl = document.getElementById('faqCount');
  const liveStatusEl = document.getElementById('faqLiveStatus');
  const emptyState = document.getElementById('faqEmpty');
  const clearSearchBtn = document.getElementById('faqClearSearch');
  const items = Array.from(faqSection.querySelectorAll('.faq-item'));

  if (!items.length) return;

  let activeCategory = 'all';
  let searchQuery = '';
  let allExpanded = false;

  // Cache text content for fast, case-insensitive searching
  const itemsData = items.map(item => {
    const summary = item.querySelector('.faq-summary');
    const question = item.querySelector('.faq-question')?.textContent || '';
    const answer = item.querySelector('.faq-answer')?.textContent || '';
    const category = item.dataset.category || '';
    return {
      el: item,
      summary,
      category,
      searchText: (question + ' ' + answer).toLowerCase(),
      questionText: question
    };
  });

  // Calculate and display dynamic counts on category pills
  if (filterContainer) {
    const counts = { all: itemsData.length };
    itemsData.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });

    filterContainer.querySelectorAll('.faq-pill, .faq-filter-btn').forEach(btn => {
      const cat = btn.dataset.category;
      const countBadge = btn.querySelector('.faq-pill-count');
      if (countBadge && cat && counts[cat] !== undefined) {
        countBadge.textContent = counts[cat];
      }
    });
  }

  function updateDisplay() {
    const query = searchQuery.trim().toLowerCase();
    let visibleCount = 0;

    itemsData.forEach(data => {
      const matchesCategory = activeCategory === 'all' || data.category === activeCategory;
      const matchesSearch = !query || data.searchText.includes(query);
      const isVisible = matchesCategory && matchesSearch;

      if (isVisible) {
        data.el.hidden = false;
        data.el.style.display = '';
        visibleCount++;

        // If user is actively searching, expand matching questions automatically
        if (query.length >= 2) {
          data.el.removeAttribute('name');
          data.el.open = true;
        } else if (!allExpanded) {
          data.el.setAttribute('name', 'cobit-faq');
        }
      } else {
        data.el.hidden = true;
        data.el.style.display = 'none';
        data.el.open = false;
      }
    });

    // Update toggle all button state
    if (query.length >= 2) {
      allExpanded = true;
      updateToggleAllBtn();
    }

    // Update counter and screen reader live region
    let countText = '';
    if (query) {
      countText = `${visibleCount} ${visibleCount === 1 ? 'result' : 'results'} for "${query}"`;
    } else if (activeCategory === 'all') {
      countText = `Showing all ${visibleCount} questions`;
    } else {
      const activeBtn = filterContainer?.querySelector(`[data-category="${activeCategory}"]`);
      const catName = activeBtn?.querySelector('span')?.textContent.trim() || activeCategory;
      countText = `${visibleCount} ${visibleCount === 1 ? 'question' : 'questions'} in ${catName}`;
    }

    if (countEl) countEl.textContent = countText;
    if (liveStatusEl) liveStatusEl.textContent = countText;

    // Show/hide empty state
    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.hidden = false;
        emptyState.style.display = 'block';
      } else {
        emptyState.hidden = true;
        emptyState.style.display = 'none';
      }
    }

    // Show/hide search clear button
    if (searchClearBtn) {
      searchClearBtn.classList.toggle('visible', searchQuery.length > 0);
    }
  }

  function updateToggleAllBtn() {
    if (!toggleAllBtn) return;
    toggleAllBtn.setAttribute('aria-expanded', allExpanded ? 'true' : 'false');
    const textSpan = toggleAllBtn.querySelector('.toggle-text');
    const iconSpan = toggleAllBtn.querySelector('.toggle-icon');
    if (textSpan) textSpan.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    if (iconSpan) iconSpan.textContent = allExpanded ? '−' : '+';
    toggleAllBtn.setAttribute('aria-label', allExpanded ? 'Collapse all questions' : 'Expand all questions');
  }

  // Toggle All handler
  if (toggleAllBtn) {
    toggleAllBtn.addEventListener('click', () => {
      allExpanded = !allExpanded;
      const visibleItems = items.filter(item => !item.hidden && item.style.display !== 'none');

      visibleItems.forEach(item => {
        if (allExpanded) {
          item.removeAttribute('name');
          item.open = true;
        } else {
          item.open = false;
          item.setAttribute('name', 'cobit-faq');
        }
      });

      updateToggleAllBtn();
    });
  }

  // Filter clicks & Tablist keyboard handling
  if (filterContainer) {
    const filterButtons = Array.from(filterContainer.querySelectorAll('.faq-pill, .faq-filter-btn'));

    filterContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-pill, .faq-filter-btn');
      if (!btn) return;

      filterButtons.forEach(b => {
        b.classList.remove('on');
        b.setAttribute('aria-selected', 'false');
        b.setAttribute('tabindex', '-1');
      });

      btn.classList.add('on');
      btn.setAttribute('aria-selected', 'true');
      btn.setAttribute('tabindex', '0');
      activeCategory = btn.dataset.category || 'all';
      updateDisplay();
    });

    // Arrow keys for category tablist
    filterContainer.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const currentBtn = document.activeElement.closest('.faq-pill, .faq-filter-btn');
      if (!currentBtn) return;

      const idx = filterButtons.indexOf(currentBtn);
      if (idx === -1) return;

      let nextIdx = idx;
      if (e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % filterButtons.length;
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + filterButtons.length) % filterButtons.length;
      } else if (e.key === 'Home') {
        nextIdx = 0;
      } else if (e.key === 'End') {
        nextIdx = filterButtons.length - 1;
      }

      e.preventDefault();
      const targetBtn = filterButtons[nextIdx];
      targetBtn.focus();
      targetBtn.click();
    });
  }

  // Search input handler
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      updateDisplay();
    });
  }

  // Global '/' keyboard shortcut to jump to FAQ search
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      const room = document.getElementById('room');
      if (room && room.classList.contains('open') && searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    }
  });

  // Clear search handlers
  function clearSearch() {
    searchQuery = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    allExpanded = false;
    updateToggleAllBtn();
    items.forEach(item => item.setAttribute('name', 'cobit-faq'));
    updateDisplay();
  }

  if (searchClearBtn) {
    searchClearBtn.addEventListener('click', clearSearch);
  }
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      activeCategory = 'all';
      const allBtn = filterContainer?.querySelector('[data-category="all"]');
      if (allBtn) {
        filterContainer.querySelectorAll('.faq-pill, .faq-filter-btn').forEach(b => {
          b.classList.remove('on');
          b.setAttribute('aria-selected', 'false');
        });
        allBtn.classList.add('on');
        allBtn.setAttribute('aria-selected', 'true');
      }
      clearSearch();
    });
  }

  // Keyboard navigation across <summary> elements (WAI-ARIA accordion pattern)
  faqSection.addEventListener('keydown', (e) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const activeSummary = document.activeElement.closest('.faq-summary');
    if (!activeSummary) return;

    const visibleSummaries = items
      .filter(item => !item.hidden && item.style.display !== 'none')
      .map(item => item.querySelector('.faq-summary'))
      .filter(Boolean);

    const idx = visibleSummaries.indexOf(activeSummary);
    if (idx === -1) return;

    let targetIdx = idx;
    if (e.key === 'ArrowDown') {
      targetIdx = (idx + 1) % visibleSummaries.length;
    } else if (e.key === 'ArrowUp') {
      targetIdx = (idx - 1 + visibleSummaries.length) % visibleSummaries.length;
    } else if (e.key === 'Home') {
      targetIdx = 0;
    } else if (e.key === 'End') {
      targetIdx = visibleSummaries.length - 1;
    }

    e.preventDefault();
    visibleSummaries[targetIdx].focus();
  });

  // Track single open behavior sync
  items.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open && !allExpanded) {
        items.forEach(other => {
          if (other !== item && other.open) {
            other.open = false;
          }
        });
      }
    });
  });

  // Initial render
  updateDisplay();
}
