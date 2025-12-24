// Ana Sayfa JavaScript
const API_URL = '/api';

// State
const state = {
    tasks: [],
    categories: [],
    editingTaskId: null
};

// DOM Elements
const elements = {
    taskForm: document.getElementById('taskForm'),
    baslik: document.getElementById('baslik'),
    aciklama: document.getElementById('aciklama'),
    kategori: document.getElementById('kategori'),
    oncelik: document.getElementById('oncelik'),
    durum: document.getElementById('durum'),
    bitis_tarihi: document.getElementById('bitis_tarihi'),
    editTaskId: document.getElementById('editTaskId'),
    submitBtn: document.getElementById('submitBtn'),
    cancelBtn: document.getElementById('cancelBtn'),

    tasksList: document.getElementById('tasksList'),
    totalTasks: document.getElementById('totalTasks'),
    completedTasks: document.getElementById('completedTasks'),
    pendingTasks: document.getElementById('pendingTasks'),
    progressPercent: document.getElementById('progressPercent'),
    progressRing: document.getElementById('progressRing'),
    taskCount: document.getElementById('taskCount'),

    // Mobile stats
    mobileTotalTasks: document.getElementById('mobileTotalTasks'),
    mobileCompletedTasks: document.getElementById('mobileCompletedTasks'),
    mobilePendingTasks: document.getElementById('mobilePendingTasks'),

    filterCategory: document.getElementById('filterCategory'),
    filterStatus: document.getElementById('filterStatus'),
    filterPriority: document.getElementById('filterPriority'),

    toast: document.getElementById('toast'),

    // Mobile menu
    mobileMenuBtn: document.getElementById('mobileMenuBtn'),
    mobileMenu: document.getElementById('mobileMenu')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadCategories();
    await loadTasks();
    setupEventListeners();
    setupMobileMenu();
    checkEditMode();
}

// Mobile Menu Setup
function setupMobileMenu() {
    if (elements.mobileMenuBtn && elements.mobileMenu) {
        elements.mobileMenuBtn.addEventListener('click', function() {
            elements.mobileMenu.classList.toggle('active');

            const spans = elements.mobileMenuBtn.querySelectorAll('span');
            if (elements.mobileMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Close menu on link click
        elements.mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                elements.mobileMenu.classList.remove('active');
                const spans = elements.mobileMenuBtn.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }
}

// Event Listeners
function setupEventListeners() {
    elements.taskForm.addEventListener('submit', handleFormSubmit);
    elements.cancelBtn.addEventListener('click', resetForm);

    elements.filterCategory.addEventListener('change', renderTasks);
    elements.filterStatus.addEventListener('change', renderTasks);
    elements.filterPriority.addEventListener('change', renderTasks);
}

// Check Edit Mode (from URL parameter)
function checkEditMode() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
        const task = state.tasks.find(t => t.id === parseInt(editId));
        if (task) {
            startEditTask(task);
        }
        // Clean URL
        window.history.replaceState({}, document.title, '/');
    }
}

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();

        if (data.basarili) {
            state.categories = data.kategoriler;
            renderCategoryOptions();
        }
    } catch (error) {
        console.error('Kategoriler yüklenemedi:', error);
    }
}

// Render Category Options
function renderCategoryOptions() {
    const options = state.categories.map(cat =>
        `<option value="${cat.id}">${cat.ad}</option>`
    ).join('');

    elements.kategori.innerHTML = '<option value="">Seçiniz...</option>' + options;
    elements.filterCategory.innerHTML = '<option value="">Tümü</option>' + options;
}

// Load Tasks
async function loadTasks() {
    try {
        const response = await fetch(`${API_URL}/tasks`);
        const data = await response.json();

        if (data.basarili) {
            state.tasks = data.gorevler;
            renderTasks();
            updateStats();
        }
    } catch (error) {
        console.error('Görevler yüklenemedi:', error);
        elements.tasksList.innerHTML = '<div class="loading">Görevler yüklenemedi</div>';
    }
}

// Render Tasks
function renderTasks() {
    let filteredTasks = [...state.tasks];

    // Apply filters
    const categoryFilter = elements.filterCategory.value;
    const statusFilter = elements.filterStatus.value;
    const priorityFilter = elements.filterPriority.value;

    if (categoryFilter) {
        filteredTasks = filteredTasks.filter(t => t.kategori_id === parseInt(categoryFilter));
    }
    if (statusFilter) {
        filteredTasks = filteredTasks.filter(t => t.durum === statusFilter);
    }
    if (priorityFilter) {
        filteredTasks = filteredTasks.filter(t => t.oncelik === priorityFilter);
    }

    if (filteredTasks.length === 0) {
        elements.tasksList.innerHTML = `
            <div class="empty-state">
                <h3>Görev bulunamadı</h3>
                <p>Henüz görev eklenmemiş veya filtrelerle eşleşen görev yok.</p>
            </div>
        `;
        return;
    }

    const tasksHTML = filteredTasks.map(task => {
        const isCompleted = task.durum === 'tamamlandı';
        const dueDate = task.bitis_tarihi ? new Date(task.bitis_tarihi).toLocaleDateString('tr-TR') : '';

        return `
            <div class="task-card ${isCompleted ? 'completed' : ''}" data-id="${task.id}">
                <div class="task-header">
                    <h3 class="task-title">${escapeHtml(task.baslik)}</h3>
                    <div class="task-badges">
                        ${task.kategori_adi ? `<span class="badge category" style="background-color: ${task.kategori_renk}20; color: ${task.kategori_renk}">${task.kategori_adi}</span>` : ''}
                        <span class="badge priority-${task.oncelik}">${capitalizeFirst(task.oncelik)}</span>
                        <span class="badge status-${task.durum}">${formatStatus(task.durum)}</span>
                    </div>
                </div>
                ${task.aciklama ? `<p class="task-description">${escapeHtml(task.aciklama)}</p>` : ''}
                <div class="task-meta">
                    <span class="task-date">${dueDate ? `Bitiş: ${dueDate}` : ''}</span>
                    <div class="task-actions">
                        ${!isCompleted ? `<button class="btn btn-primary btn-small" onclick="completeTask(${task.id})">Tamamla</button>` : ''}
                        <button class="btn btn-secondary btn-small" onclick="editTask(${task.id})">Düzenle</button>
                        <button class="btn btn-danger btn-small" onclick="deleteTask(${task.id})">Sil</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    elements.tasksList.innerHTML = tasksHTML;
}

// Update Stats
function updateStats() {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.durum === 'tamamlandı').length;
    const pending = state.tasks.filter(t => t.durum === 'beklemede').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update navbar stats
    if (elements.totalTasks) elements.totalTasks.textContent = total;
    if (elements.completedTasks) elements.completedTasks.textContent = completed;
    if (elements.pendingTasks) elements.pendingTasks.textContent = pending;

    // Update mobile stats
    if (elements.mobileTotalTasks) elements.mobileTotalTasks.textContent = total;
    if (elements.mobileCompletedTasks) elements.mobileCompletedTasks.textContent = completed;
    if (elements.mobilePendingTasks) elements.mobilePendingTasks.textContent = pending;

    // Update progress ring (circular)
    if (elements.progressRing) {
        const circumference = 2 * Math.PI * 45; // r=45
        const offset = circumference - (percent / 100) * circumference;
        elements.progressRing.style.strokeDashoffset = offset;
    }

    // Update progress percent text
    if (elements.progressPercent) elements.progressPercent.textContent = percent;

    // Update task count
    if (elements.taskCount) elements.taskCount.textContent = `${total} görev`;
}

// Form Submit
async function handleFormSubmit(e) {
    e.preventDefault();

    const taskData = {
        baslik: elements.baslik.value.trim(),
        aciklama: elements.aciklama.value.trim(),
        kategori_id: elements.kategori.value || null,
        oncelik: elements.oncelik.value,
        durum: elements.durum.value,
        bitis_tarihi: elements.bitis_tarihi.value || null
    };

    if (!taskData.baslik) {
        showToast('Başlık gereklidir', 'error');
        return;
    }

    try {
        const isEditing = state.editingTaskId !== null;
        const url = isEditing ? `${API_URL}/tasks/${state.editingTaskId}` : `${API_URL}/tasks`;
        const method = isEditing ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });

        const data = await response.json();

        if (data.basarili) {
            showToast(data.mesaj, 'success');
            resetForm();
            await loadTasks();
        } else {
            showToast(data.hata, 'error');
        }
    } catch (error) {
        console.error('Görev kaydedilemedi:', error);
        showToast('Görev kaydedilemedi', 'error');
    }
}

// Edit Task
window.editTask = function(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        startEditTask(task);
    }
};

function startEditTask(task) {
    state.editingTaskId = task.id;

    elements.baslik.value = task.baslik;
    elements.aciklama.value = task.aciklama || '';
    elements.kategori.value = task.kategori_id || '';
    elements.oncelik.value = task.oncelik;
    elements.durum.value = task.durum;
    elements.bitis_tarihi.value = task.bitis_tarihi || '';

    elements.submitBtn.textContent = 'Güncelle';
    elements.cancelBtn.style.display = 'inline-block';

    // Scroll to form
    elements.taskForm.scrollIntoView({ behavior: 'smooth' });
}

// Reset Form
function resetForm() {
    elements.taskForm.reset();
    state.editingTaskId = null;
    elements.submitBtn.textContent = 'Görev Ekle';
    elements.cancelBtn.style.display = 'none';
}

// Complete Task
window.completeTask = async function(id) {
    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ durum: 'tamamlandı' })
        });

        const data = await response.json();

        if (data.basarili) {
            showToast('Görev tamamlandı!', 'success');
            await loadTasks();
        } else {
            showToast(data.hata, 'error');
        }
    } catch (error) {
        console.error('Görev tamamlanamadı:', error);
        showToast('Görev tamamlanamadı', 'error');
    }
};

// Delete Task
window.deleteTask = async function(id) {
    if (!confirm('Bu görevi silmek istediğinizden emin misiniz?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/tasks/${id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.basarili) {
            showToast(data.mesaj, 'success');
            await loadTasks();
        } else {
            showToast(data.hata, 'error');
        }
    } catch (error) {
        console.error('Görev silinemedi:', error);
        showToast('Görev silinemedi', 'error');
    }
};

// Show Toast
function showToast(message, type = 'info') {
    elements.toast.textContent = message;
    elements.toast.className = `toast show ${type}`;

    setTimeout(() => {
        elements.toast.classList.remove('show');
    }, 3000);
}

// Helper Functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatStatus(status) {
    const statusMap = {
        'beklemede': 'Beklemede',
        'devam-ediyor': 'Devam Ediyor',
        'tamamlandı': 'Tamamlandı'
    };
    return statusMap[status] || status;
}
