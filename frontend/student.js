document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();
});

async function loadSubjects() {
    try {
        // Try to fetch from server first
        const response = await fetch('/api/subjects');
        if (response.ok) {
            const subjects = await response.json();
            displaySubjects(subjects);
            // Cache the subjects data
            localStorage.setItem('cachedSubjects', JSON.stringify(subjects));
            // Cache paper URLs for offline access
            cacheSubjectsData(subjects);
        } else {
            loadCachedSubjects();
        }
    } catch (error) {
        loadCachedSubjects();
    }
}

function loadCachedSubjects() {
    const cachedData = localStorage.getItem('cachedSubjects');
    if (cachedData) {
        const subjects = JSON.parse(cachedData);
        displaySubjects(subjects);
        showOfflineNotification();
    }
}

function displaySubjects(subjects) {
    const subjectsContainer = document.getElementById('subjectsGrid');
    subjectsContainer.innerHTML = subjects.map(subject => `
        <div class="subject-card glass-effect">
            <h3>${subject.name}</h3>
            <div class="papers-list">
                ${subject.papers.map(paper => `
                    <div class="paper-item">
                        <div class="paper-info">
                            <i class="fas fa-file-pdf"></i>
                            <span>${paper.title}</span>
                        </div>
                        <a href="${paper.staticPath}" 
                           class="download-btn"
                           download="${paper.title}.pdf"
                           data-paper-id="${paper._id}"
                           onclick="trackDownload(event, '${paper._id}')">
                            <i class="fas fa-download"></i> Download
                        </a>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.innerHTML = `
        <i class="fas fa-wifi-slash"></i>
        You're viewing cached content. Papers are still accessible offline.
    `;
    document.body.appendChild(notification);
}

async function trackDownload(event, paperId) {
    try {
        await fetch(`/api/papers/${paperId}/download`, {
            method: 'POST'
        });
    } catch (error) {
        // If offline, just allow the download without tracking
        console.log('Offline download');
    }
} 