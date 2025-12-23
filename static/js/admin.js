// Admin Panel JavaScript
const API_URL = '/api';

// State
const adminState = {
    tasks: [],
    categories: [],
    stats: {},
    confirmCallback: null
};

// DOM Elements
const elements = {
    // Stats
    adminTotalTasks: document.getElementById('adminTotalTasks'),
    adminCompletedTasks: document.getElementById('adminCompletedTasks'),
    adminPendingTasks: document.getElementById('adminPendingTasks'),
    adminTotalCategories: document.getElementById('adminTotalCategories'),

    // Tables
    tasksTableBody: document.getElementById('tasksTableBody'),
    categoriesGrid: document.getElementById('categoriesGrid'),

    // Forms
    categoryForm: document.getElementById('categoryForm'),
    categoryName: document.getElementById('categoryName'),
    categoryColor: document.getElementById('categoryColor'),

    // Buttons
    deleteAllTasksBtn: document.getElementById('deleteAllTasksBtn'),
    clearTasksBtn: document.getElementById('clearTasksBtn'),
    resetDatabaseBtn: document.getElementById('resetDatabaseBtn'),

    // Database Info
    dbTotalTasks: document.getElementById('dbTotalTasks'),
    dbTotalCategories: document.getElementById('dbTotalCategories'),
    dbLastUpdate: document.getElementById('dbLastUpdate'),

    // Modal
    confirmModal: document.getElementById('confirmModal'),
    confirmTitle: document.getElementById('confirmTitle'),
    confirmMessage: document.getElementById('confirmMessage'),
    confirmBtn: document.getElementById('confirmBtn'),
    cancelBtn: document.getElementById('cancelBtn'),

    // Toast
    toast: document.getElementById('adminToast')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadDashboardData();
    setupTabs();
    setupEventListeners();
}

// Setup Tabs
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    elements.categoryForm.addEventListener('submit', handleAddCategory);
    elements.deleteAllTasksBtn.addEventListener('click', handleDeleteAllTasks);
    elements.clearTasksBtn.addEventListener('click', handleClearTasks);
    elements.resetDatabaseBtn.addEventListener('click', handleResetDatabase);
    elements.cancelBtn.addEventListener('click', hideConfirmModal);
}

// Load Dashboard Data
async function loadDashboardData() {
    try {
        const response = await fetch(`${API_URL}/admin/dashboard`);
        const data = await response.json();

        if (data.basarili) {
            adminState.stats = data.dashboard.istatistikler;
            adminState.tasks = data.dashboard.son_gorevler;
            adminState.categories = data.dashboard.kategoriler;

            renderStats();
            renderTasksTable();
            renderCategories();
            renderDatabaseInfo();
        }
    } catch (error) {
        console.error('Dashboard verileri yüklenemedi:', error);
        showToast('Dashboard verileri yüklenemedi', 'error');
    }
}

// Render Stats
function renderStats() {
    const stats = adminState.stats;
    elements.adminTotalTasks.textContent = stats.toplam || 0;
    elements.adminCompletedTasks.textContent = stats.tamamlanan || 0;
    elements.adminPendingTasks.textContent = stats.bekleyen || 0;
    elements.adminTotalCategories.textContent = adminState.categories.length || 0;
}

// Render Tasks Table
function renderTasksTable() {
    if (adminState.tasks.length === 0) {
        elements.tasksTableBody.innerHTML = '<tr><td colspan="7" class="loading-cell">Görev bulunamadı</td></tr>';
        return;
    }

    const tasksHTML = adminState.tasks.map(task => {
        const priorityClass = task.oncelik === 'yüksek' ? 'high' : task.oncelik === 'düşük' ? 'low' : 'medium';
        const statusClass = task.durum === 'tamamlandı' ? 'completed' : task.durum === 'devam-ediyor' ? 'in-progress' : 'pending';
        const dueDate = task.bitis_tarihi ? new Date(task.bitis_tarihi).toLocaleDateString('tr-TR') : '-';

        return `
            <tr>
                <td>${task.id}</td>
                <td><strong>${escapeHtml(task.baslik)}</strong></td>
                <td>${task.kategori_adi || '-'}</td>
                <td><span class="badge ${priorityClass}">${capitalizeFirst(task.oncelik)}</span></td>
                <td><span class="badge ${statusClass}">${formatStatus(task.durum)}</span></td>
                <td>${dueDate}</td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-primary btn-small" onclick="editTaskAdmin(${task.id})">Düzenle</button>
                        <button class="btn btn-danger btn-small" onclick="deleteTaskAdmin(${task.id})">Sil</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    elements.tasksTableBody.innerHTML = tasksHTML;
}

// Render Categories
function renderCategories() {
    if (adminState.categories.length === 0) {
        elements.categoriesGrid.innerHTML = '<p>Kategori bulunamadı</p>';
        return;
    }

    const categoriesHTML = adminState.categories.map(cat => {
        const taskCount = adminState.stats.kategoriler?.find(c => c.ad === cat.ad)?.gorev_sayisi || 0;

        return `
            <div class="category-card" style="border-left-color: ${cat.renk}">
                <div class="category-header">
                    <div class="category-name">${escapeHtml(cat.ad)}</div>
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${cat.renk}"></div>
                </div>
                <div class="category-count">${taskCount} görev</div>
                <div class="category-actions">
                    <button class="btn btn-primary btn-small" onclick="editCategory(${cat.id})">Düzenle</button>
                    <button class="btn btn-danger btn-small" onclick="deleteCategory(${cat.id})">Sil</button>
                </div>
            </div>
        `;
    }).join('');

    elements.categoriesGrid.innerHTML = categoriesHTML;
}

// Render Database Info
function renderDatabaseInfo() {
    elements.dbTotalTasks.textContent = adminState.stats.toplam || 0;
    elements.dbTotalCategories.textContent = adminState.categories.length || 0;
    elements.dbLastUpdate.textContent = new Date().toLocaleString('tr-TR');
}

// Add Category
async function handleAddCategory(e) {
    e.preventDefault();

    const categoryData = {
        ad: elements.categoryName.value.trim(),
        renk: elements.categoryColor.value
    };

    try {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categoryData)
        });

        const data = await response.json();

        if (data.basarili) {
            showToast(data.mesaj, 'success');
            elements.categoryForm.reset();
            elements.categoryColor.value = '#3498db';
            await loadDashboardData();
        } else {
            showToast(data.hata, 'error');
        }
    } catch (error) {
        console.error('Kategori eklenemedi:', error);
        showToast('Kategori eklenemedi', 'error');
    }
}

// Edit Category
window.editCategory = async function(id) {
    const category = adminState.categories.find(c => c.id === id);
    if (!category) return;

    const newName = prompt('Yeni kategori adı:', category.ad);
    if (!newName || newName === category.ad) return;

    try {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ad: newName })
        });

        const data = await response.json();

        if (data.basarili) {
            showToast(data.mesaj, 'success');
            await loadDashboardData();
        } else {
            showToast(data.hata, 'error');
        }
    } catch (error) {
        console.error('Kategori güncellenemedi:', error);
        showToast('Kategori güncellenemedi', 'error');
    }
};

// Delete Category
window.deleteCategory = function(id) {
    showConfirmModal(
        'Kategoriyi Sil',
        'Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategorideki görevlerin kategorisi kaldırılacaktır.',
        async () => {
            try {
                const response = await fetch(`${API_URL}/categories/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.basarili) {
                    showToast(data.mesaj, 'success');
                    await loadDashboardData();
                } else {
                    showToast(data.hata, 'error');
                }
            } catch (error) {
                console.error('Kategori silinemedi:', error);
                showToast('Kategori silinemedi', 'error');
            }
        }
    );
};

// Delete Task Admin
window.deleteTaskAdmin = function(id) {
    showConfirmModal(
        'Görevi Sil',
        'Bu görevi silmek istediğinizden emin misiniz?',
        async () => {
            try {
                const response = await fetch(`${API_URL}/tasks/${id}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.basarili) {
                    showToast(data.mesaj, 'success');
                    await loadDashboardData();
                } else {
                    showToast(data.hata, 'error');
                }
            } catch (error) {
                console.error('Görev silinemedi:', error);
                showToast('Görev silinemedi', 'error');
            }
        }
    );
};

// Edit Task Admin
window.editTaskAdmin = function(id) {
    window.location.href = `/?edit=${id}`;
};

// Delete All Tasks
function handleDeleteAllTasks() {
    handleClearTasks();
}

// Clear Tasks
function handleClearTasks() {
    showConfirmModal(
        'Tüm Görevleri Sil',
        'TÜM görevleri silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!',
        async () => {
            try {
                const response = await fetch(`${API_URL}/admin/tasks/all`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (data.basarili) {
                    showToast(data.mesaj, 'success');
                    await loadDashboardData();
                } else {
                    showToast(data.hata, 'error');
                }
            } catch (error) {
                console.error('Görevler silinemedi:', error);
                showToast('Görevler silinemedi', 'error');
            }
        }
    );
}

// Reset Database
function handleResetDatabase() {
    showConfirmModal(
        'Veritabanını Sıfırla',
        'VERİTABANINI SIFIRLAMAK istediğinizden emin misiniz? Tüm görevler ve kategoriler silinecek ve varsayılan kategoriler yüklenecektir. Bu işlem geri alınamaz!',
        async () => {
            try {
                const response = await fetch(`${API_URL}/admin/reset`, {
                    method: 'POST'
                });

                const data = await response.json();

                if (data.basarili) {
                    showToast(data.mesaj, 'success');
                    await loadDashboardData();
                } else {
                    showToast(data.hata, 'error');
                }
            } catch (error) {
                console.error('Veritabanı sıfırlanamadı:', error);
                showToast('Veritabanı sıfırlanamadı', 'error');
            }
        }
    );
}

// Show Confirmation Modal
function showConfirmModal(title, message, callback) {
    elements.confirmTitle.textContent = title;
    elements.confirmMessage.textContent = message;
    adminState.confirmCallback = callback;
    elements.confirmModal.classList.add('show');

    // Set up confirm button - save callback reference before hiding
    elements.confirmBtn.onclick = async () => {
        const callbackToExecute = adminState.confirmCallback;
        hideConfirmModal();
        if (callbackToExecute) {
            await callbackToExecute();
        }
    };

    // Close modal when clicking outside
    elements.confirmModal.onclick = (e) => {
        if (e.target === elements.confirmModal) {
            hideConfirmModal();
        }
    };
}

// Hide Confirmation Modal
function hideConfirmModal() {
    elements.confirmModal.classList.remove('show');
    adminState.confirmCallback = null;
}

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
