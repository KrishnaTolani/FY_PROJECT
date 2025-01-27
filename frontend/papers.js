document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const subjectId = urlParams.get('subject');
    
    if (subjectId) {
        fetchPapers(subjectId);
        const subjectData = JSON.parse(sessionStorage.getItem('currentSubject'));
        if (subjectData) {
            document.getElementById('subjectTitle').textContent = subjectData.name;
        }
    }
});

async function fetchPapers(subjectId) {
    try {
        const response = await fetch(`/api/subjects/${subjectId}/papers`);
        const papers = await response.json();
        displayPapers(papers);
    } catch (error) {
        console.error('Error fetching papers:', error);
    }
}

function displayPapers(papers) {
    const papersList = document.getElementById('papersList');
    
    if (papers.length === 0) {
        papersList.innerHTML = '<p class="no-papers">No papers available for this subject.</p>';
        return;
    }

    papersList.innerHTML = papers.map(paper => `
        <div class="paper-item">
            <div class="paper-icon">
                <i class="fas fa-file-pdf"></i>
            </div>
            <div class="paper-info">
                <h4 class="paper-title">${paper.title || 'Question Paper'}</h4>
            </div>
            <a href="/api/papers/download/${paper._id}" 
               class="download-btn" 
               target="_blank"
               onclick="handleDownload(event, '${paper._id}')">
                <i class="fas fa-download"></i> Download
            </a>
        </div>
    `).join('');
}

function handleDownload(event, paperId) {
    // This will open the PDF in a new tab
    event.preventDefault();
    window.open(`/api/papers/view/${paperId}`, '_blank');
} 