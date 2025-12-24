// ===== Global State =====
const AppState = {
    currentUser: null,
    isAuthenticated: false,
    currentPage: 'dashboard'
};

// ===== API Client =====
const API = {
    async request(endpoint, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(`/api${endpoint}`, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    async login(email, password) {
        return this.request('/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    },

    async logout() {
        return this.request('/logout', { method: 'POST' });
    },

    async getCurrentUser() {
        return this.request('/current_user');
    },

    async getEquipment(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/equipment?${params}`);
    },

    async getEquipmentDetail(id) {
        return this.request(`/equipment/${id}`);
    },

    async createEquipment(data) {
        return this.request('/equipment', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateEquipment(id, data) {
        return this.request(`/equipment/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteEquipment(id) {
        return this.request(`/equipment/${id}`, { method: 'DELETE' });
    },

    async getMaintenanceLogs(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/maintenance?${params}`);
    },

    async createMaintenanceLog(data) {
        return this.request('/maintenance', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async getFailureReports(filters = {}) {
        const params = new URLSearchParams(filters);
        return this.request(`/failures?${params}`);
    },

    async createFailureReport(data) {
        return this.request('/failures', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateFailureReport(id, data) {
        return this.request(`/failures/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async getDashboardData() {
        return this.request('/reports/dashboard');
    },

    async getEquipmentReport(id) {
        return this.request(`/reports/equipment/${id}`);
    },

    async getDowntimeReport() {
        return this.request('/reports/downtime');
    },

    // User Management APIs
    async getUsers() {
        return this.request('/users');
    },

    async createUser(data) {
        return this.request('/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    async updateUser(id, data) {
        return this.request(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    async deleteUser(id) {
        return this.request(`/users/${id}`, { method: 'DELETE' });
    },

    async toggleUserActive(id) {
        return this.request(`/users/${id}/toggle-active`, { method: 'PUT' });
    },

    async signup(data) {
        return this.request('/signup', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }
};

// ===== Utility Functions =====
function showLoading() {
    document.getElementById('loadingOverlay').classList.add('active');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

function showAlert(message, type = 'error') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const mainContent = document.getElementById('mainContent');
    mainContent.insertBefore(alertDiv, mainContent.firstChild);

    setTimeout(() => alertDiv.remove(), 5000);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getStatusBadge(status) {
    const statusMap = {
        'Active': 'badge-active',
        'Under Maintenance': 'badge-maintenance',
        'Out of Service': 'badge-outofservice'
    };
    return `<span class="badge ${statusMap[status] || ''}">${status}</span>`;
}

function getSeverityBadge(severity) {
    const severityMap = {
        'Low': 'badge-low',
        'Medium': 'badge-medium',
        'High': 'badge-high'
    };
    return `<span class="badge ${severityMap[severity] || ''}">${severity}</span>`;
}

function getMaintenanceTypeBadge(type) {
    const typeMap = {
        'Preventive': 'badge-preventive',
        'Corrective': 'badge-corrective'
    };
    return `<span class="badge ${typeMap[type] || ''}">${type}</span>`;
}

// ===== Navigation =====
function updateNavigation() {
    const navMenu = document.getElementById('navMenu');
    const navUser = document.getElementById('navUser');

    if (AppState.isAuthenticated) {
        const isAdmin = AppState.currentUser.role === 'admin';

        navMenu.innerHTML = `
            <a href="#dashboard" class="nav-link ${AppState.currentPage === 'dashboard' ? 'active' : ''}">Dashboard</a>
            <a href="#equipment" class="nav-link ${AppState.currentPage === 'equipment' ? 'active' : ''}">Equipment</a>
            <a href="#maintenance" class="nav-link ${AppState.currentPage === 'maintenance' ? 'active' : ''}">Maintenance</a>
            <a href="#failures" class="nav-link ${AppState.currentPage === 'failures' ? 'active' : ''}">Failures</a>
            <a href="#reports" class="nav-link ${AppState.currentPage === 'reports' ? 'active' : ''}">Reports</a>
            ${isAdmin ? `<a href="#users" class="nav-link ${AppState.currentPage === 'users' ? 'active' : ''}">Users</a>` : ''}
        `;

        navUser.innerHTML = `
            <div class="user-info">
                <div class="user-name">${AppState.currentUser.full_name}</div>
                <div class="user-role">${AppState.currentUser.role}</div>
            </div>
            <button class="btn btn-outline btn-sm" onclick="handleLogout()">Logout</button>
        `;
    } else {
        navMenu.innerHTML = '';
        navUser.innerHTML = '';
    }
}

// ===== Authentication =====
async function checkAuth() {
    try {
        const user = await API.getCurrentUser();
        AppState.currentUser = user;
        AppState.isAuthenticated = true;
        updateNavigation();
        return true;
    } catch (error) {
        AppState.currentUser = null;
        AppState.isAuthenticated = false;
        return false;
    }
}

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        showLoading();
        const response = await API.login(email, password);
        AppState.currentUser = response.user;
        AppState.isAuthenticated = true;
        updateNavigation();
        navigateTo('dashboard');
    } catch (error) {
        showAlert(error.message || 'Login failed', 'error');
    } finally {
        hideLoading();
    }
}

async function handleLogout() {
    try {
        showLoading();
        await API.logout();
        AppState.currentUser = null;
        AppState.isAuthenticated = false;
        updateNavigation();
        renderLoginPage();
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        hideLoading();
    }
}

// ===== Login Page =====
function renderLoginPage() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="login-container">
            <div class="login-card">
                <div class="login-header">
                    <div class="login-icon">🏭</div>
                    <h1 class="login-title">Equipment Maintenance Log</h1>
                    <p class="login-subtitle">Industrial CMMS System</p>
                </div>
                <form onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label class="form-label" for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" class="form-input" required 
                               placeholder="admin@maintenance.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" class="form-input" required
                               placeholder="Enter your password">
                    </div>
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        Login
                    </button>
                </form>
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); font-size: 0.875rem; color: var(--text-muted);">
                    <p><strong>Demo Credentials:</strong></p>
                    <p>Admin: admin@maintenance.com / admin123</p>
                    <p>Technician: tech@maintenance.com / tech123</p>
                </div>
            </div>
        </div>
    `;
}

// ===== Routing =====
function navigateTo(page) {
    AppState.currentPage = page;
    updateNavigation();

    const routes = {
        'dashboard': renderDashboard,
        'equipment': renderEquipmentPage,
        'maintenance': renderMaintenancePage,
        'failures': renderFailuresPage,
        'reports': renderReportsPage,
        'users': renderUsersPage
    };

    const renderFunction = routes[page];
    if (renderFunction) {
        renderFunction();
    }
}

// Handle hash navigation
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'dashboard';
    if (AppState.isAuthenticated) {
        navigateTo(hash);
    }
});

// ===== Initialization =====
async function init() {
    const isAuthenticated = await checkAuth();

    if (isAuthenticated) {
        const hash = window.location.hash.slice(1) || 'dashboard';
        navigateTo(hash);
    } else {
        renderLoginPage();
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
