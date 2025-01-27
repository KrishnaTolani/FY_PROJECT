const API_URL = 'http://localhost:5000/api';
let adminToken = localStorage.getItem('adminToken');

// Show notification function
function showNotification(message, isSuccess = true) {
    const notification = document.createElement('div');
    notification.className = `notification ${isSuccess ? 'success' : 'error'}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Check if admin is logged in
function checkAuth() {
    if (!adminToken) {
        window.location.href = '/admin-login.html';
    }
}

// Add token to all requests
async function makeAuthRequest(url, options = {}) {
    if (!options.headers) {
        options.headers = {};
    }
    options.headers.Authorization = `Bearer ${adminToken}`;
    const response = await fetch(url, options);
    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('adminToken');
        window.location.href = '/admin-login.html';
    }
    return response;
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadSubjects();
    setupEventListeners();

    // Add styles to the page
    const styleSheet = document.createElement("style");
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
});

function setupEventListeners() {
    // Add subject form handler
    document.getElementById('addSubjectForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectName = document.getElementById('subjectName').value.trim();
        if (!subjectName) {
            showNotification('Please enter a subject name', false);
            return;
        }
        await addSubject(subjectName);
    });

    // Upload paper form handler
    document.getElementById('uploadPaperForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const subjectId = document.getElementById('subjectSelect').value;
        const paperTitle = document.getElementById('paperTitle').value.trim();
        const paperFile = document.getElementById('paperFile').files[0];

        if (!subjectId) {
            showNotification('Please select a subject', false);
            return;
        }
        if (!paperTitle) {
            showNotification('Please enter a paper title', false);
            return;
        }
        if (!paperFile) {
            showNotification('Please select a PDF file', false);
            return;
        }

        await uploadPaper(subjectId, paperTitle, paperFile);
    });

    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        logout();
    });
}

function showSection(sectionName) {
    // Hide all sections
    document.getElementById('subjects-section').style.display = 'none';
    document.getElementById('papers-section').style.display = 'none';

    // Show selected section
    document.getElementById(`${sectionName}-section`).style.display = 'block';

    // Update active nav
    document.querySelectorAll('.admin-nav a').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[href="#${sectionName}"]`).classList.add('active');
}

async function loadDashboardStats() {
    try {
        const response = await fetch(`${API_URL}/subjects`);
        const subjects = await response.json();
        
        let totalPapers = 0;
        subjects.forEach(subject => {
            totalPapers += subject.papers.length;
        });

        document.getElementById('totalSubjects').textContent = subjects.length;
        document.getElementById('totalPapers').textContent = totalPapers;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

async function loadSubjects() {
    showLoading();
    try {
        const response = await fetch(`${API_URL}/subjects`);
        const subjects = await response.json();
        updateSubjectsList(subjects);
        updateSubjectDropdown(subjects);
        loadDashboardStats();
    } catch (error) {
        console.error('Error loading stats:', error);
    } finally {
        hideLoading();
    }
}

async function addSubject(name) {
    try {
        const response = await makeAuthRequest(`${API_URL}/subjects`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name })
        });
        
        if (response.ok) {
            document.getElementById('subjectName').value = '';
            await loadSubjects();
            showNotification('Subject added successfully!');
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to add subject', false);
        }
    } catch (error) {
        console.error('Error adding subject:', error);
        showNotification('Failed to add subject', false);
    }
}

async function uploadPaper(subjectId, title, file) {
    showLoading();
    const formData = new FormData();
    formData.append('paper', file);
    formData.append('title', title);

    try {
        const response = await makeAuthRequest(`${API_URL}/subjects/${subjectId}/papers`, {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            document.getElementById('paperTitle').value = '';
            document.getElementById('paperFile').value = '';
            await loadSubjects();
            showNotification('Paper uploaded successfully!');
        } else {
            const data = await response.json();
            showNotification(data.message || 'Failed to upload paper', false);
        }
    } catch (error) {
        console.error('Error uploading paper:', error);
        showNotification('Failed to upload paper', false);
    } finally {
        hideLoading();
    }
}

function updateSubjectsList(subjects) {
    const subjectsList = document.getElementById('subjectsList');
    if (!subjects.length) {
        subjectsList.innerHTML = '<p class="no-subjects">No subjects added yet</p>';
        return;
    }

    subjectsList.innerHTML = subjects.map(subject => `
        <div class="subject-item">
            <div class="item-info">
                <h3>${subject.name}</h3>
                <span class="paper-count">${subject.papers.length} Papers</span>
            </div>
            <div class="papers-list">
                ${subject.papers.map(paper => `
                    <div class="paper-item">
                        <div class="paper-info">
                            <i class="fas fa-file-pdf"></i>
                            <span>${paper.title}</span>
                        </div>
                        <div class="paper-actions">
                            <a href="/uploads/${paper.filePath.split('/').pop()}" 
                               target="_blank" 
                               class="view-btn">
                                <i class="fas fa-eye"></i> View
                            </a>
                            <button onclick="deletePaper('${subject._id}', '${paper._id}')" 
                                    class="delete-btn">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="item-actions">
                <button onclick="deleteSubject('${subject._id}')" class="admin-btn delete-btn">
                    <i class="fas fa-trash"></i> Delete Subject
                </button>
            </div>
        </div>
    `).join('');
}

function updateSubjectDropdown(subjects) {
    const select = document.getElementById('subjectSelect');
    select.innerHTML = '<option value="">Select Subject</option>' +
        subjects.map(subject => 
            `<option value="${subject._id}">${subject.name}</option>`
        ).join('');
}

async function deleteSubject(subjectId) {
    if (!confirm('Are you sure you want to delete this subject and all its papers?')) return;

    try {
        const response = await makeAuthRequest(`${API_URL}/subjects/${subjectId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadSubjects();
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
    }
}

async function deletePaper(subjectId, paperId) {
    if (!confirm('Are you sure you want to delete this paper?')) return;

    try {
        const response = await makeAuthRequest(`${API_URL}/subjects/${subjectId}/papers/${paperId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            await loadSubjects();
        }
    } catch (error) {
        console.error('Error deleting paper:', error);
    }
}

function logout() {
    localStorage.removeItem('adminToken');
    window.location.href = '/index.html';
}

const styles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        z-index: 1000;
        animation: slideIn 0.5s ease;
    }

    .notification.success {
        background: linear-gradient(45deg, #4CAF50, #45a049);
    }

    .notification.error {
        background: linear-gradient(45deg, #ff4444, #cc0000);
    }

    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .papers-list {
        margin-top: 10px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }

    .paper-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px;
        margin: 5px 0;
        background: rgba(255, 255, 255, 0.03);
        border-radius: 6px;
    }

    .paper-info {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #fff;
    }

    .paper-actions {
        display: flex;
        gap: 10px;
    }

    .view-btn {
        padding: 5px 15px;
        border-radius: 5px;
        background: linear-gradient(45deg, #3498db, #2980b9);
        color: white;
        text-decoration: none;
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .paper-count {
        font-size: 0.9em;
        color: #aaa;
        margin-left: 10px;
    }

    .no-subjects {
        text-align: center;
        color: #aaa;
        padding: 20px;
    }
`; 