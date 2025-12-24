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

    // Dashboard
    recentTasksList: document.getElementById('recentTasksList'),
    categoriesOverview: document.getElementById('categoriesOverview'),

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
    modalClose: document.getElementById('modalClose'),

    // Toast
    toast: document.getElementById('adminToast'),

    // Sidebar & Mobile
    sidebar: document.querySelector('.sidebar'),
    menuToggle: document.getElementById('menuToggle'),
    sidebarOverlay: document.getElementById('sidebarOverlay')
};

// Initialize
document.addEventListener('DOMContentLoaded', init);

async function init() {
    await loadDashboardData();
    setupSidebarNav();
    setupMobileMenu();
    setupEventListeners();
}

// Setup Sidebar Navigation
function setupSidebarNav() {
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;

            // Update nav items
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');

            // Update tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`${tabName}-tab`).classList.add('active');

            // Close mobile sidebar
            closeMobileSidebar();
        });
    });

    // Handle "View All" links
    document.querySelectorAll('.view-all').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;

            // Find and click the corresponding nav item
            const targetNav = document.querySelector(`.nav-item[data-tab="${tabName}"]`);
            if (targetNav) {
                targetNav.click();
            }
        });
    });
}

// Setup Mobile Menu
function setupMobileMenu() {
    if (elements.menuToggle) {
        elements.menuToggle.addEventListener('click', toggleMobileSidebar);
    }

    if (elements.sidebarOverlay) {
        elements.sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }
}

function toggleMobileSidebar() {
    elements.sidebar.classList.toggle('active');
    elements.sidebarOverlay.classList.toggle('active');
    elements.menuToggle.classList.toggle('active');
}

function closeMobileSidebar() {
    elements.sidebar.classList.remove('active');
    elements.sidebarOverlay.classList.remove('active');
    if (elements.menuToggle) {
        elements.menuToggle.classList.remove('active');
    }
}

// Setup Event Listeners
function setupEventListeners() {
    if (elements.categoryForm) {
        elements.categoryForm.addEventListener('submit', handleAddCategory);
    }
    if (elements.deleteAllTasksBtn) {
        elements.deleteAllTasksBtn.addEventListener('click', handleDeleteAllTasks);
    }
    if (elements.clearTasksBtn) {
        elements.clearTasksBtn.addEventListener('click', handleClearTasks);
    }
    if (elements.resetDatabaseBtn) {
        elements.resetDatabaseBtn.addEventListener('click', handleResetDatabase);
    }
    if (elements.cancelBtn) {
        elements.cancelBtn.addEventListener('click', hideConfirmModal);
    }
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', hideConfirmModal);
    }
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
            renderRecentTasks();
            renderCategoriesOverview();
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
    if (elements.adminTotalTasks) elements.adminTotalTasks.textContent = stats.toplam || 0;
    if (elements.adminCompletedTasks) elements.adminCompletedTasks.textContent = stats.tamamlanan || 0;
    if (elements.adminPendingTasks) elements.adminPendingTasks.textContent = stats.bekleyen || 0;
    if (elements.adminTotalCategories) elements.adminTotalCategories.textContent = adminState.categories.length || 0;
}

// Render Recent Tasks (Dashboard)
function renderRecentTasks() {
    if (!elements.recentTasksList) return;

    if (adminState.tasks.length === 0) {
        elements.recentTasksList.innerHTML = '<p class="empty-text">Henüz görev yok</p>';
        return;
    }

    // Show only last 5 tasks
    const recentTasks = adminState.tasks.slice(0, 5);

    const tasksHTML = recentTasks.map(task => {
        const statusClass = task.durum === 'tamamlandı' ? 'completed' : task.durum === 'devam-ediyor' ? 'in-progress' : 'pending';
        const priorityClass = task.oncelik === 'yüksek' ? 'high' : task.oncelik === 'düşük' ? 'low' : 'medium';

        return `
            <div class="recent-task-item">
                <div class="task-info">
                    <span class="task-title">${escapeHtml(task.baslik)}</span>
                    <div class="task-meta">
                        ${task.kategori_adi ? `<span class="task-category" style="color: ${task.kategori_renk}">${task.kategori_adi}</span>` : ''}
                        <span class="task-priority ${priorityClass}">${capitalizeFirst(task.oncelik)}</span>
                    </div>
                </div>
                <span class="task-status ${statusClass}">${formatStatus(task.durum)}</span>
            </div>
        `;
    }).join('');

    elements.recentTasksList.innerHTML = tasksHTML;
}

// Render Categories Overview (Dashboard)
function renderCategoriesOverview() {
    if (!elements.categoriesOverview) return;

    if (adminState.categories.length === 0) {
        elements.categoriesOverview.innerHTML = '<p class="empty-text">Henüz kategori yok</p>';
        return;
    }

    const categoriesHTML = adminState.categories.map(cat => {
        const taskCount = adminState.stats.kategoriler?.find(c => c.ad === cat.ad)?.gorev_sayisi || 0;

        return `
            <div class="category-overview-item">
                <div class="category-color" style="background: ${cat.renk}"></div>
                <span class="category-name">${escapeHtml(cat.ad)}</span>
                <span class="category-count">${taskCount} görev</span>
            </div>
        `;
    }).join('');

    elements.categoriesOverview.innerHTML = categoriesHTML;
}

// Render Tasks Table
function renderTasksTable() {
    if (!elements.tasksTableBody) return;

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
    if (!elements.categoriesGrid) return;

    if (adminState.categories.length === 0) {
        elements.categoriesGrid.innerHTML = '<p class="empty-text">Kategori bulunamadı</p>';
        return;
    }

    const categoriesHTML = adminState.categories.map(cat => {
        const taskCount = adminState.stats.kategoriler?.find(c => c.ad === cat.ad)?.gorev_sayisi || 0;

        return `
            <div class="category-card" style="border-left-color: ${cat.renk}">
                <div class="category-header">
                    <div class="category-name">${escapeHtml(cat.ad)}</div>
                    <div class="category-color-dot" style="background: ${cat.renk}"></div>
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
    if (elements.dbTotalTasks) elements.dbTotalTasks.textContent = adminState.stats.toplam || 0;
    if (elements.dbTotalCategories) elements.dbTotalCategories.textContent = adminState.categories.length || 0;
    if (elements.dbLastUpdate) elements.dbLastUpdate.textContent = new Date().toLocaleString('tr-TR');
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
            elements.categoryColor.value = '#667eea';
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
    window.location.href = `/app?edit=${id}`;
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

    // Set up confirm button
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

    // Close on escape key
    document.addEventListener('keydown', handleEscapeKey);
}

function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        hideConfirmModal();
    }
}

// Hide Confirmation Modal
function hideConfirmModal() {
    elements.confirmModal.classList.remove('show');
    adminState.confirmCallback = null;
    document.removeEventListener('keydown', handleEscapeKey);
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
