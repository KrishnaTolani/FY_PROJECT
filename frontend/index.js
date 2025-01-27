const API_URL = 'http://localhost:5000/api';

// Function to display papers
async function displayPapers(papers) {
    const grid = document.getElementById('papersGrid');
    grid.innerHTML = '';

    if (papers.length === 0) {
        grid.innerHTML = '<div class="no-papers">No question papers found</div>';
        return;
    }

    papers.forEach(paper => {
        const paperCard = document.createElement('div');
        paperCard.className = 'paper-card';
        paperCard.innerHTML = `
            <h3>${paper.subject}</h3>
            <p>Year: ${paper.year}</p>
            <p>Semester: ${paper.semester}</p>
            <p>Downloads: ${paper.downloadCount}</p>
            <a href="${API_URL}/papers/download/${paper._id}" target="_blank" onclick="incrementDownloadCount('${paper._id}')">
                Download Paper
            </a>
        `;
        grid.appendChild(paperCard);
    });
}

// Fetch and display papers
async function fetchPapers() {
    try {
        const grid = document.getElementById('papersGrid');
        grid.innerHTML = '<div class="loading">Loading papers...</div>';

        const response = await fetch(`${API_URL}/papers`);
        const papers = await response.json();
        displayPapers(papers);
    } catch (error) {
        console.error('Error fetching papers:', error);
        const grid = document.getElementById('papersGrid');
        grid.innerHTML = '<div class="error">Failed to load papers. Please try again later.</div>';
    }
}

// Search and filter functionality
async function filterPapers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedYear = document.getElementById('yearFilter').value;
    const selectedSemester = document.getElementById('semesterFilter').value;

    try {
        const response = await fetch(`${API_URL}/papers`);
        const papers = await response.json();
        
        const filteredPapers = papers.filter(paper => {
            const matchesSearch = paper.subject.toLowerCase().includes(searchTerm);
            const matchesYear = !selectedYear || paper.year.toString() === selectedYear;
            const matchesSemester = !selectedSemester || paper.semester.toString() === selectedSemester;
            return matchesSearch && matchesYear && matchesSemester;
        });

        displayPapers(filteredPapers);
    } catch (error) {
        console.error('Error filtering papers:', error);
    }
}

// Add event listeners
document.getElementById('searchInput').addEventListener('input', filterPapers);
document.getElementById('yearFilter').addEventListener('change', filterPapers);
document.getElementById('semesterFilter').addEventListener('change', filterPapers);

// Initial load
fetchPapers();

document.addEventListener('DOMContentLoaded', () => {
    // Fetch and display subjects
    fetchSubjects();

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm) {
            searchSubjects(searchTerm);
        }
    });

    // Enter key handler for search
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.toLowerCase();
            if (searchTerm) {
                window.location.href = `subjects.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });
});

async function fetchSubjects() {
    try {
        const response = await fetch('/api/subjects');
        const subjects = await response.json();
        displaySubjects(subjects);
    } catch (error) {
        console.error('Error fetching subjects:', error);
    }
}

function displaySubjects(subjects) {
    const grid = document.getElementById('subjectsGrid');
    grid.innerHTML = subjects.map(subject => `
        <div class="subject-card glass-effect" onclick="viewSubject('${subject._id}')">
            <div class="subject-icon">
                <i class="fas fa-book"></i>
            </div>
            <h3>${subject.name}</h3>
            <p>${subject.papers.length} Papers</p>
        </div>
    `).join('');
}

function filterSubjects(searchTerm) {
    const cards = document.querySelectorAll('.subject-card');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        card.style.display = title.includes(searchTerm) ? 'block' : 'none';
    });
}

function viewSubject(subjectId) {
    // Navigate to subject detail page
    window.location.href = `/subject.html?id=${subjectId}`;
}

async function searchSubjects(searchTerm) {
    try {
        const response = await fetch(`${API_URL}/subjects/search?term=${encodeURIComponent(searchTerm)}`);
        const subjects = await response.json();
        
        if (subjects.length > 0) {
            // If subjects are found, show quick results
            showQuickSearchResults(subjects);
        }
    } catch (error) {
        console.error('Error searching subjects:', error);
    }
}

function showQuickSearchResults(subjects) {
    const resultsContainer = document.getElementById('searchResults') || createSearchResultsContainer();
    
    resultsContainer.innerHTML = subjects.map(subject => `
        <div class="search-result-item" onclick="goToSubject('${subject._id}', '${subject.name}')">
            <i class="fas fa-book"></i>
            <span>${subject.name}</span>
            <span class="paper-count">${subject.papers.length} Papers</span>
        </div>
    `).join('');
}

function createSearchResultsContainer() {
    const container = document.createElement('div');
    container.id = 'searchResults';
    container.className = 'search-results glass-effect';
    document.querySelector('.search-container').appendChild(container);
    return container;
}

// Add navigation history management
function goToSubject(subjectId, subjectName) {
    sessionStorage.setItem('currentSubject', JSON.stringify({ id: subjectId, name: subjectName }));
    sessionStorage.setItem('previousPage', window.location.pathname);
    window.location.href = `/papers.html?subject=${subjectId}`;
}

// Add back button functionality
function goBack() {
    const previousPage = sessionStorage.getItem('previousPage') || '/index.html';
    window.location.href = previousPage;
} 