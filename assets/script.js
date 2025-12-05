// Global variables
let allPapers = [];
let filteredPapers = [];
let sortState = {
    column: 'year',  // Default sorting by date
    direction: 'desc'  // Descending order (newest first)
};
let activeFilters = {
    venue: null,
    collection: null
};

// Load and display papers
async function loadPapers() {
    try {
        const response = await fetch('data/collected_papers.json');
        const data = await response.json();
        
        // Convert object to array
        allPapers = Object.values(data);
        filteredPapers = [...allPapers];
        
        // Apply default sort (by date, newest first)
        applySortToFiltered();
        updateStats();
        populateFilters();
        hideLoading();
    } catch (error) {
        console.error('Error loading papers:', error);
        document.getElementById('loading').textContent = 'Error loading papers. Please check the console.';
    }
}

// Display papers in the table
function displayPapers(papers) {
    const tbody = document.getElementById('papers-tbody');
    tbody.innerHTML = '';
    
    if (papers.length === 0) {
        document.getElementById('no-results').style.display = 'block';
        return;
    } else {
        document.getElementById('no-results').style.display = 'none';
    }
    
    papers.forEach(paper => {
        const row = createPaperRow(paper);
        tbody.appendChild(row);
    });
    
    // Add click event listeners to venue and collection tags
    initTagClickListeners();
}

// Create a table row for a paper
function createPaperRow(paper) {
    const tr = document.createElement('tr');
    
    // Name column (title + authors + metadata)
    const nameCell = document.createElement('td');
    nameCell.setAttribute('data-label', 'Paper');
    nameCell.innerHTML = `
        <div class="paper-title">${escapeHtml(paper.title)}</div>
        <div class="paper-authors">${escapeHtml(paper.authors || '')}</div>
        <div class="paper-meta">
            <span><span class="meta-icon">👍</span> ${paper.total_likes || 0}</span>
            <span><span class="meta-icon">👁️</span> ${paper.total_read || 0}</span>
            <span><span class="meta-icon">📊</span> ${(paper.relevance * 100).toFixed(1)}%</span>
        </div>
    `;
    
    // Venue column (first collection as main venue)
    const topicCell = document.createElement('td');
    topicCell.setAttribute('data-label', 'Venue');
    const mainVenue = paper.venue;
    if (mainVenue && mainVenue.name) {
        topicCell.innerHTML = `<button class="topic-tag clickable-tag" style="background-color: ${mainVenue.color}" data-venue="${escapeHtml(mainVenue.name)}">${escapeHtml(formatTopicName(mainVenue.name))}</button>`;
    } else {
        topicCell.innerHTML = `<span class="topic-tag">Uncategorized</span>`;
    }
    
    // Tag column (all collections)
    const tagCell = document.createElement('td');
    tagCell.setAttribute('data-label', 'Tags');
    if (paper.collections && paper.collections.length > 0) {
        tagCell.innerHTML = paper.collections.map(collection => 
            `<button class="collection-tag clickable-tag" style="background-color: ${collection.color}" data-collection="${escapeHtml(collection.name)}">${escapeHtml(formatTopicName(collection.name))}</button>`
        ).join('');
    } else {
        tagCell.innerHTML = `<span class="collection-tag">Preprint</span>`;
    }
    
    // Date column
    const yearCell = document.createElement('td');
    yearCell.setAttribute('data-label', 'Date');
    if (paper.published_date) {
        const date = new Date(paper.published_date);
        const formattedDate = formatDate(date);
        const color = paper.year?.color || '#ddebf4';
        yearCell.innerHTML = `<span class="year-badge" style="background-color: ${color}">${escapeHtml(formattedDate)}</span>`;
    } else {
        yearCell.innerHTML = `<span class="year-badge">N/A</span>`;
    }
    
    // Link column
    const linkCell = document.createElement('td');
    linkCell.className = 'col-link';
    linkCell.setAttribute('data-label', 'Links');
    const link = getArxivLink(paper);
    linkCell.innerHTML = `
        <a href="${link}" target="_blank" class="paper-link">
            ${link}
        </a>
    `;
    
    tr.appendChild(nameCell);
    tr.appendChild(topicCell);
    tr.appendChild(tagCell);
    tr.appendChild(yearCell);
    tr.appendChild(linkCell);
    
    return tr;
}

// Generate rating icons (thumbs up/down based on -1/0/1)
function generateRatingIcons(rating) {
    let html = '<span class="rating-icons">';
    
    // Thumbs up icon
    if (rating === 1) {
        html += '<span class="rating-icon active">👍</span>';
    } else {
        html += '<span class="rating-icon inactive">👍</span>';
    }
    
    // Thumbs down icon
    if (rating === -1) {
        html += '<span class="rating-icon active">👎</span>';
    } else {
        html += '<span class="rating-icon inactive">👎</span>';
    }
    
    html += '</span>';
    return html;
}

// Get arXiv link
function getArxivLink(paper) {
    if (paper.arxiv_id) {
        return `https://arxiv.org/abs/${paper.arxiv_id}`;
    }

    if (paper.url) {
        return paper.url;
    }
    
    return '#';
}

// Format authors - shorten if too long
function formatAuthors(authorsString) {
    if (!authorsString) return '';
    
    // Split by common separators (comma, semicolon, "and")
    const authors = authorsString.split(/,|;|\band\b/g)
        .map(a => a.trim())
        .filter(a => a.length > 0);
    
    if (authors.length === 0) return authorsString;
    
    if (authors.length === 1) {
        // Single author - extract last name
        return extractLastName(authors[0]);
    } else if (authors.length === 2) {
        // Two authors - "LastName1 and LastName2"
        return `${extractLastName(authors[0])} and ${extractLastName(authors[1])}`;
    } else {
        // Three or more - "FirstAuthorLastName et al."
        return `${extractLastName(authors[0])} et al.`;
    }
}

// Extract last name from full name
function extractLastName(fullName) {
    if (!fullName) return '';
    
    // Remove extra spaces
    fullName = fullName.trim();
    
    // Common patterns:
    // "First Last" -> "Last"
    // "First Middle Last" -> "Last"
    // "Last, First" -> "Last"
    
    // Check if comma-separated (Last, First format)
    if (fullName.includes(',')) {
        return fullName.split(',')[0].trim();
    }
    
    // Otherwise assume space-separated, take last word
    const parts = fullName.split(/\s+/);
    return parts[parts.length - 1];
}

// Format topic name
function formatTopicName(topic) {
    return topic.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Format date to readable format
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Update statistics
function updateStats(papers = allPapers) {
    document.getElementById('total-papers').textContent = papers.length;
    
    const uniqueCollections = new Set();
    papers.forEach(paper => {
        if (paper.collections) {
            paper.collections.forEach(collection => uniqueCollections.add(collection.name));
        }
    });
    document.getElementById('total-collections').textContent = uniqueCollections.size;
}

// Populate filter dropdowns
function populateFilters() {
    // Collection filter
    const collectionFilter = document.getElementById('collection-filter');
    const collections = new Set();
    allPapers.forEach(paper => {
        if (paper.collections) {
            paper.collections.forEach(collection => collections.add(collection.name));
        }
    });
    
    Array.from(collections).sort().forEach(collection => {
        const option = document.createElement('option');
        option.value = collection;
        option.textContent = formatTopicName(collection);
        collectionFilter.appendChild(option);
    });
    
    // Year filter
    const yearFilter = document.getElementById('year-filter');
    const years = new Set();
    allPapers.forEach(paper => {
        const year = new Date(paper.published_date).getFullYear();
        years.add(year);
    });
    
    Array.from(years).sort((a, b) => b - a).forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

// Filter papers based on search and filters
function filterPapers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedCollection = document.getElementById('collection-filter').value;
    const selectedYear = document.getElementById('year-filter').value;
    
    filteredPapers = allPapers.filter(paper => {
        // Search filter
        const matchesSearch = !searchTerm || 
            paper.title.toLowerCase().includes(searchTerm) ||
            paper.authors.toLowerCase().includes(searchTerm);
        
        // Venue filter (from active filters)
        const matchesVenue = !activeFilters.venue ||
            (paper.venue && paper.venue.name === activeFilters.venue);
        
        // Collection filter
        const matchesCollection = !selectedCollection ||
            (paper.collections && paper.collections.some(col => col.name === selectedCollection));
        
        // Year filter
        const paperYear = new Date(paper.published_date).getFullYear().toString();
        const matchesYear = !selectedYear || paperYear === selectedYear;
        
        return matchesSearch && matchesVenue && matchesCollection && matchesYear;
    });
    
    // Apply current sort if exists
    applySortToFiltered();
    
    // Update stats with filtered papers
    updateStats(filteredPapers);
}

// Apply current sort state to filtered papers
function applySortToFiltered() {
    if (sortState.direction === null) {
        displayPapers(filteredPapers);
        return;
    }
    
    const sortedPapers = [...filteredPapers].sort((a, b) => {
        let valueA, valueB;
        
        switch (sortState.column) {
            case 'name':
                valueA = a.title.toLowerCase();
                valueB = b.title.toLowerCase();
                break;
            case 'venue':
                valueA = a.venue?.name?.toLowerCase() || '';
                valueB = b.venue?.name?.toLowerCase() || '';
                break;
            case 'tag':
                valueA = a.collections?.[0]?.name?.toLowerCase() || '';
                valueB = b.collections?.[0]?.name?.toLowerCase() || '';
                break;
            case 'year':
                valueA = new Date(a.published_date).getTime();
                valueB = new Date(b.published_date).getTime();
                break;
            case 'link':
                valueA = a.arxiv_id || '';
                valueB = b.arxiv_id || '';
                break;
        }
        
        if (valueA < valueB) return sortState.direction === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortState.direction === 'asc' ? 1 : -1;
        return 0;
    });
    
    displayPapers(sortedPapers);
}

// Sort papers by column
function sortPapers(columnIndex) {
    const columns = ['name', 'venue', 'tag', 'year', 'link'];
    const column = columns[columnIndex];
    
    // Cycle through sort states: null -> asc -> desc -> null
    if (sortState.column === column) {
        if (sortState.direction === null) {
            sortState.direction = 'asc';
        } else if (sortState.direction === 'asc') {
            sortState.direction = 'desc';
        } else {
            sortState.direction = null;
            sortState.column = null;
        }
    } else {
        sortState.column = column;
        sortState.direction = 'asc';
    }
    
    // Update sort indicators
    updateSortIndicators();
    
    // Apply the sort
    applySortToFiltered();
}

// Update sort indicators in table headers
function updateSortIndicators() {
    const headers = document.querySelectorAll('#papers-table th');
    const columns = ['name', 'venue', 'tag', 'year', 'link'];
    
    headers.forEach((header, index) => {
        const column = columns[index];
        let indicator = header.querySelector('.sort-indicator');
        
        // Create indicator if it doesn't exist
        if (!indicator) {
            indicator = document.createElement('span');
            indicator.className = 'sort-indicator';
            header.appendChild(indicator);
        }
        
        // Update indicator
        if (sortState.column === column && sortState.direction !== null) {
            indicator.textContent = sortState.direction === 'asc' ? '▲' : '▼';
            indicator.style.opacity = '1';
        } else {
            indicator.textContent = '▲';
            indicator.style.opacity = '0.2';
        }
    });
}

// Initialize sort event listeners
function initSortListeners() {
    const headers = document.querySelectorAll('#papers-table th');
    headers.forEach((header, index) => {
        header.style.cursor = 'pointer';
        header.addEventListener('click', (e) => {
            // Don't sort if clicking on resizer
            if (e.target.classList.contains('resizer')) return;
            sortPapers(index);
        });
    });
}

// Initialize tag and venue click listeners
function initTagClickListeners() {
    // Venue tag click listeners
    const venueTags = document.querySelectorAll('.topic-tag.clickable-tag');
    venueTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const venueName = tag.getAttribute('data-venue');
            // Set active venue filter
            activeFilters.venue = venueName;
            activeFilters.collection = null;
            filterByVenue(venueName);
            updateActiveFiltersDisplay();
        });
    });
    
    // Collection tag click listeners
    const collectionTags = document.querySelectorAll('.collection-tag.clickable-tag');
    collectionTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const collectionName = tag.getAttribute('data-collection');
            // Set active collection filter
            activeFilters.collection = collectionName;
            activeFilters.venue = null;
            // Update the collection filter dropdown and trigger filter
            document.getElementById('collection-filter').value = collectionName;
            filterPapers();
            updateActiveFiltersDisplay();
        });
    });
}

// Filter by venue (custom filter since venue is not in dropdown)
function filterByVenue(venueName) {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const selectedYear = document.getElementById('year-filter').value;
    
    filteredPapers = allPapers.filter(paper => {
        // Search filter
        const matchesSearch = !searchTerm || 
            paper.title.toLowerCase().includes(searchTerm) ||
            paper.authors.toLowerCase().includes(searchTerm);
        
        // Venue filter
        const matchesVenue = paper.venue && paper.venue.name === venueName;
        
        // Year filter
        const paperYear = new Date(paper.published_date).getFullYear().toString();
        const matchesYear = !selectedYear || paperYear === selectedYear;
        
        return matchesSearch && matchesVenue && matchesYear;
    });
    
    // Clear collection filter when filtering by venue
    document.getElementById('collection-filter').value = '';
    
    // Apply current sort if exists
    applySortToFiltered();
    
    // Update stats with filtered papers
    updateStats(filteredPapers);
}

// Update active filters display
function updateActiveFiltersDisplay() {
    const container = document.getElementById('active-filters');
    
    // Check if any filters are active
    if (!activeFilters.venue && !activeFilters.collection) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }
    
    container.style.display = 'flex';
    container.innerHTML = '';
    
    // Add venue filter badge
    if (activeFilters.venue) {
        const badge = document.createElement('div');
        badge.className = 'filter-badge';
        badge.innerHTML = `
            <span class="filter-label">Venue:</span>
            <span class="filter-value">${escapeHtml(formatTopicName(activeFilters.venue))}</span>
            <button class="filter-remove" data-filter-type="venue" title="Remove filter">×</button>
        `;
        container.appendChild(badge);
    }
    
    // Add collection filter badge
    if (activeFilters.collection) {
        const badge = document.createElement('div');
        badge.className = 'filter-badge';
        badge.innerHTML = `
            <span class="filter-label">Tag:</span>
            <span class="filter-value">${escapeHtml(formatTopicName(activeFilters.collection))}</span>
            <button class="filter-remove" data-filter-type="collection" title="Remove filter">×</button>
        `;
        container.appendChild(badge);
    }
    
    // Add click listeners to remove buttons
    container.querySelectorAll('.filter-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const filterType = btn.getAttribute('data-filter-type');
            clearFilter(filterType);
        });
    });
}

// Clear specific filter
function clearFilter(filterType) {
    if (filterType === 'venue') {
        activeFilters.venue = null;
        // Reset to show all papers with current collection filter
        filterPapers();
    } else if (filterType === 'collection') {
        activeFilters.collection = null;
        // Clear collection dropdown
        document.getElementById('collection-filter').value = '';
        filterPapers();
    }
    updateActiveFiltersDisplay();
}

// Hide loading indicator
function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

// Event listeners
document.getElementById('search-input').addEventListener('input', filterPapers);
document.getElementById('collection-filter').addEventListener('change', (e) => {
    const selectedValue = e.target.value;
    if (selectedValue) {
        activeFilters.collection = selectedValue;
        activeFilters.venue = null;
    } else {
        activeFilters.collection = null;
    }
    filterPapers();
    updateActiveFiltersDisplay();
});
document.getElementById('year-filter').addEventListener('change', filterPapers);

// Column resizing functionality
function initColumnResize() {
    const table = document.getElementById('papers-table');
    const cols = table.querySelectorAll('th');
    const resizers = table.querySelectorAll('.resizer');
    
    // Minimum widths for each column (in pixels)
    const minWidths = {
        0: 300,  // Name column - "Aa Name"
        1: 120,  // Venue column - "≡ Venue"
        2: 140,  // Tag column - "⊙ Tag"
        3: 130,  // Date column - "≋ Date"
        4: 110   // Link column - "🔗 Link"
    };
    
    resizers.forEach((resizer, index) => {
        let startX, startWidth, nextCol, nextStartWidth;
        
        resizer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            startX = e.pageX;
            startWidth = cols[index].offsetWidth;
            
            // Get next column if exists
            nextCol = cols[index + 1];
            if (nextCol) {
                nextStartWidth = nextCol.offsetWidth;
            }
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });
        
        function resize(e) {
            if (!nextCol) {
                // Last column - can't resize
                return;
            }
            
            const deltaX = e.pageX - startX;
            const newWidth = startWidth + deltaX;
            const newNextWidth = nextStartWidth - deltaX;
            
            const minWidth = minWidths[index] || 50;
            const nextMinWidth = minWidths[index + 1] || 50;
            
            // Only resize if both columns stay above their minimum widths
            if (newWidth >= minWidth && newNextWidth >= nextMinWidth) {
                cols[index].style.width = newWidth + 'px';
                nextCol.style.width = newNextWidth + 'px';
            }
        }
        
        function stopResize() {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    });
}

// Initialize
loadPapers().then(() => {
    initColumnResize();
    initSortListeners();
    updateSortIndicators();
});
