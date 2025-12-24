// ===== Equipment Page =====
async function renderEquipmentPage() {
    const mainContent = document.getElementById('mainContent');

    const isAdmin = AppState.currentUser.role === 'admin';

    mainContent.innerHTML = `
        <div class="page-header flex-between">
            <div>
                <h1 class="page-title">Equipment Registry</h1>
                <p class="page-subtitle">Manage industrial equipment and assets</p>
            </div>
            ${isAdmin ? '<button class="btn btn-primary" onclick="showEquipmentModal()">➕ Add Equipment</button>' : ''}
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Equipment List</h3>
                <div class="flex gap-1">
                    <select id="statusFilter" class="form-select" style="width: auto;" onchange="filterEquipment()">
                        <option value="">All Status</option>
                        <option value="Active">Active</option>
                        <option value="Under Maintenance">Under Maintenance</option>
                        <option value="Out of Service">Out of Service</option>
                    </select>
                </div>
            </div>
            <div class="table-container">
                <table id="equipmentTable">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Type</th>
                            <th>Manufacturer</th>
                            <th>Serial Number</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="equipmentTableBody">
                        <!-- Equipment rows will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    loadEquipment();
}

async function loadEquipment(filters = {}) {
    try {
        showLoading();
        const equipment = await API.getEquipment(filters);
        renderEquipmentTable(equipment);
    } catch (error) {
        showAlert('Failed to load equipment', 'error');
    } finally {
        hideLoading();
    }
}

function renderEquipmentTable(equipment) {
    const tbody = document.getElementById('equipmentTableBody');
    const isAdmin = AppState.currentUser.role === 'admin';

    if (equipment.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 2rem; color: var(--text-muted);">No equipment found</td></tr>';
        return;
    }

    tbody.innerHTML = equipment.map(eq => `
        <tr>
            <td><strong>${eq.name}</strong></td>
            <td>${eq.type}</td>
            <td>${eq.manufacturer || 'N/A'}</td>
            <td>${eq.serial_number || 'N/A'}</td>
            <td>${eq.location || 'N/A'}</td>
            <td>${getStatusBadge(eq.status)}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-outline" onclick="viewEquipmentDetail(${eq.id})">View</button>
                ${isAdmin ? `
                    <button class="btn btn-sm btn-primary" onclick="editEquipment(${eq.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteEquipmentConfirm(${eq.id})">Delete</button>
                ` : ''}
            </td>
        </tr>
    `).join('');
}

function filterEquipment() {
    const status = document.getElementById('statusFilter').value;
    const filters = status ? { status } : {};
    loadEquipment(filters);
}

async function viewEquipmentDetail(id) {
    try {
        showLoading();
        const data = await API.getEquipmentDetail(id);
        showEquipmentDetailModal(data);
    } catch (error) {
        showAlert('Failed to load equipment details', 'error');
    } finally {
        hideLoading();
    }
}

function showEquipmentDetailModal(data) {
    const eq = data.equipment;
    const modalContainer = document.getElementById('modalContainer');

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${eq.name}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row mb-2">
                        <div>
                            <strong>Type:</strong> ${eq.type}
                        </div>
                        <div>
                            <strong>Status:</strong> ${getStatusBadge(eq.status)}
                        </div>
                    </div>
                    <div class="form-row mb-2">
                        <div>
                            <strong>Manufacturer:</strong> ${eq.manufacturer || 'N/A'}
                        </div>
                        <div>
                            <strong>Model:</strong> ${eq.model || 'N/A'}
                        </div>
                    </div>
                    <div class="form-row mb-2">
                        <div>
                            <strong>Serial Number:</strong> ${eq.serial_number || 'N/A'}
                        </div>
                        <div>
                            <strong>Location:</strong> ${eq.location || 'N/A'}
                        </div>
                    </div>
                    <div class="mb-2">
                        <strong>Installation Date:</strong> ${formatDate(eq.installation_date)}
                    </div>

                    <h3 class="mt-2 mb-1">Maintenance History</h3>
                    ${data.maintenance_logs.length > 0 ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Technician</th>
                                        <th>Downtime</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.maintenance_logs.map(log => `
                                        <tr>
                                            <td>${formatDateTime(log.maintenance_date)}</td>
                                            <td>${getMaintenanceTypeBadge(log.maintenance_type)}</td>
                                            <td>${log.technician_name}</td>
                                            <td>${log.downtime_hours} hrs</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p style="color: var(--text-muted);">No maintenance records</p>'}

                    <h3 class="mt-2 mb-1">Failure Reports</h3>
                    ${data.failure_reports.length > 0 ? `
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Severity</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${data.failure_reports.map(report => `
                                        <tr>
                                            <td>${formatDateTime(report.reported_date)}</td>
                                            <td>${getSeverityBadge(report.severity)}</td>
                                            <td>${report.failure_description}</td>
                                            <td>${report.resolved ? '<span class="badge badge-active">Resolved</span>' : '<span class="badge badge-outofservice">Open</span>'}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    ` : '<p style="color: var(--text-muted);">No failure reports</p>'}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;
}

function showEquipmentModal(equipmentId = null) {
    const modalContainer = document.getElementById('modalContainer');
    const isEdit = equipmentId !== null;

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">${isEdit ? 'Edit Equipment' : 'Add Equipment'}</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form onsubmit="saveEquipment(event, ${equipmentId})">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Name *</label>
                            <input type="text" id="equipmentName" class="form-input" required>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Type *</label>
                                <select id="equipmentType" class="form-select" required>
                                    <option value="">Select Type</option>
                                    <option value="Turbine">Turbine</option>
                                    <option value="Compressor">Compressor</option>
                                    <option value="Generator">Generator</option>
                                    <option value="Pump">Pump</option>
                                    <option value="Cooling System">Cooling System</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Status</label>
                                <select id="equipmentStatus" class="form-select">
                                    <option value="Active">Active</option>
                                    <option value="Under Maintenance">Under Maintenance</option>
                                    <option value="Out of Service">Out of Service</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Manufacturer</label>
                                <input type="text" id="equipmentManufacturer" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Model</label>
                                <input type="text" id="equipmentModel" class="form-input">
                            </div>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Serial Number</label>
                                <input type="text" id="equipmentSerial" class="form-input">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Installation Date</label>
                                <input type="date" id="equipmentInstallDate" class="form-input">
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Location</label>
                            <input type="text" id="equipmentLocation" class="form-input">
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Equipment</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    if (isEdit) {
        loadEquipmentForEdit(equipmentId);
    }
}

async function loadEquipmentForEdit(id) {
    try {
        const data = await API.getEquipmentDetail(id);
        const eq = data.equipment;

        document.getElementById('equipmentName').value = eq.name;
        document.getElementById('equipmentType').value = eq.type;
        document.getElementById('equipmentStatus').value = eq.status;
        document.getElementById('equipmentManufacturer').value = eq.manufacturer || '';
        document.getElementById('equipmentModel').value = eq.model || '';
        document.getElementById('equipmentSerial').value = eq.serial_number || '';
        document.getElementById('equipmentLocation').value = eq.location || '';
        if (eq.installation_date) {
            document.getElementById('equipmentInstallDate').value = eq.installation_date;
        }
    } catch (error) {
        showAlert('Failed to load equipment data', 'error');
        closeModal();
    }
}

async function saveEquipment(event, equipmentId) {
    event.preventDefault();

    const data = {
        name: document.getElementById('equipmentName').value,
        type: document.getElementById('equipmentType').value,
        status: document.getElementById('equipmentStatus').value,
        manufacturer: document.getElementById('equipmentManufacturer').value,
        model: document.getElementById('equipmentModel').value,
        serial_number: document.getElementById('equipmentSerial').value,
        location: document.getElementById('equipmentLocation').value,
        installation_date: document.getElementById('equipmentInstallDate').value
    };

    try {
        showLoading();
        if (equipmentId) {
            await API.updateEquipment(equipmentId, data);
            showAlert('Equipment updated successfully', 'success');
        } else {
            await API.createEquipment(data);
            showAlert('Equipment created successfully', 'success');
        }
        closeModal();
        loadEquipment();
    } catch (error) {
        showAlert(error.message || 'Failed to save equipment', 'error');
    } finally {
        hideLoading();
    }
}

function editEquipment(id) {
    showEquipmentModal(id);
}

function deleteEquipmentConfirm(id) {
    if (confirm('Are you sure you want to delete this equipment? This will also delete all associated maintenance logs and failure reports.')) {
        deleteEquipmentAction(id);
    }
}

async function deleteEquipmentAction(id) {
    try {
        showLoading();
        await API.deleteEquipment(id);
        showAlert('Equipment deleted successfully', 'success');
        loadEquipment();
    } catch (error) {
        showAlert(error.message || 'Failed to delete equipment', 'error');
    } finally {
        hideLoading();
    }
}

function closeModal(event) {
    if (event && event.target.classList.contains('modal')) {
        return;
    }
    document.getElementById('modalContainer').innerHTML = '';
}
