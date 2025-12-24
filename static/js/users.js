// ===== Users Management Page (Admin Only) =====
async function renderUsersPage() {
    const mainContent = document.getElementById('mainContent');

    // Check if user is admin
    if (AppState.currentUser.role !== 'admin') {
        mainContent.innerHTML = `
            <div class="page-header">
                <h1 class="page-title">Access Denied</h1>
                <p class="page-subtitle">You don't have permission to access this page</p>
            </div>
        `;
        return;
    }

    mainContent.innerHTML = `
        <div class="page-header flex-between">
            <div>
                <h1 class="page-title">User Management</h1>
                <p class="page-subtitle">Manage technicians and administrators</p>
            </div>
            <button class="btn btn-primary" onclick="showUserModal()">➕ Add User</button>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">All Users</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Created</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="usersTableBody">
                        <!-- Users will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    loadUsers();
}

async function loadUsers() {
    try {
        showLoading();
        const users = await API.getUsers();
        renderUsersTable(users);
    } catch (error) {
        showAlert('Failed to load users', 'error');
    } finally {
        hideLoading();
    }
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 2rem; color: var(--text-muted);">No users found</td></tr>';
        return;
    }

    tbody.innerHTML = users.map(user => `
        <tr>
            <td><strong>${user.full_name}</strong></td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'badge-high' : 'badge-preventive'}">
                    ${user.role.toUpperCase()}
                </span>
            </td>
            <td>
                <span class="badge ${user.is_active ? 'badge-active' : 'badge-outofservice'}">
                    ${user.is_active ? 'Active' : 'Inactive'}
                </span>
            </td>
            <td>${formatDateTime(user.last_login) || 'Never'}</td>
            <td>${formatDate(user.created_at)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline" onclick="editUser(${user.id})">Edit</button>
                <button class="btn btn-sm ${user.is_active ? 'btn-danger' : 'btn-primary'}" 
                        onclick="toggleUserActive(${user.id})"
                        ${user.id === AppState.currentUser.id ? 'disabled' : ''}>
                    ${user.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button class="btn btn-sm btn-danger" 
                        onclick="deleteUserConfirm(${user.id})"
                        ${user.id === AppState.currentUser.id ? 'disabled' : ''}>
                    Delete
                </button>
            </td>
        </tr>
    `).join('');
}

function showUserModal(userId = null) {
    const modalContainer = document.getElementById('modalContainer');
    const isEdit = userId !== null;

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? 'Edit User' : 'Add New User'}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form onsubmit="saveUser(event, ${userId})">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Full Name *</label>
                            <input type="text" id="userName" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email *</label>
                            <input type="email" id="userEmail" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Password ${isEdit ? '(leave blank to keep current)' : '*'}</label>
                            <input type="password" id="userPassword" class="form-input" 
                                   ${isEdit ? '' : 'required'} minlength="6"
                                   placeholder="${isEdit ? 'Leave blank to keep current password' : 'Minimum 6 characters'}">
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Role *</label>
                                <select id="userRole" class="form-select" required>
                                    <option value="technician">Technician</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="userStatus" class="form-select">
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save User</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    if (isEdit) {
        loadUserForEdit(userId);
    }
}

async function loadUserForEdit(userId) {
    try {
        const users = await API.getUsers();
        const user = users.find(u => u.id === userId);

        if (user) {
            document.getElementById('userName').value = user.full_name;
            document.getElementById('userEmail').value = user.email;
            document.getElementById('userRole').value = user.role;
            document.getElementById('userStatus').value = user.is_active.toString();
        }
    } catch (error) {
        showAlert('Failed to load user data', 'error');
        closeModal();
    }
}

async function saveUser(event, userId) {
    event.preventDefault();

    const data = {
        full_name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        is_active: document.getElementById('userStatus').value === 'true'
    };

    const password = document.getElementById('userPassword').value;
    if (password) {
        data.password = password;
    }

    try {
        showLoading();
        if (userId) {
            await API.updateUser(userId, data);
            showAlert('User updated successfully', 'success');
        } else {
            if (!password) {
                showAlert('Password is required for new users', 'error');
                return;
            }
            await API.createUser(data);
            showAlert('User created successfully', 'success');
        }
        closeModal();
        loadUsers();
    } catch (error) {
        showAlert(error.message || 'Failed to save user', 'error');
    } finally {
        hideLoading();
    }
}

function editUser(userId) {
    showUserModal(userId);
}

async function toggleUserActive(userId) {
    try {
        showLoading();
        await API.toggleUserActive(userId);
        showAlert('User status updated', 'success');
        loadUsers();
    } catch (error) {
        showAlert(error.message || 'Failed to update user status', 'error');
    } finally {
        hideLoading();
    }
}

function deleteUserConfirm(userId) {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        deleteUserAction(userId);
    }
}

async function deleteUserAction(userId) {
    try {
        showLoading();
        await API.deleteUser(userId);
        showAlert('User deleted successfully', 'success');
        loadUsers();
    } catch (error) {
        showAlert(error.message || 'Failed to delete user', 'error');
    } finally {
        hideLoading();
    }
}
