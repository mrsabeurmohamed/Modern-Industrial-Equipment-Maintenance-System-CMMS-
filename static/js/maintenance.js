// ===== Maintenance Page =====
async function renderMaintenancePage() {
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="page-header flex-between">
            <div>
                <h1 class="page-title">Maintenance Logs</h1>
                <p class="page-subtitle">Track and manage maintenance activities</p>
            </div>
            <button class="btn btn-primary" onclick="showMaintenanceModal()">➕ Log Maintenance</button>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Maintenance History</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Equipment</th>
                            <th>Type</th>
                            <th>Technician</th>
                            <th>Downtime</th>
                            <th>Next Maintenance</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="maintenanceTableBody">
                        <!-- Maintenance logs will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    loadMaintenanceLogs();
}

async function loadMaintenanceLogs() {
    try {
        showLoading();
        const logs = await API.getMaintenanceLogs();
        renderMaintenanceTable(logs);
    } catch (error) {
        showAlert('Failed to load maintenance logs', 'error');
    } finally {
        hideLoading();
    }
}

function renderMaintenanceTable(logs) {
    const tbody = document.getElementById('maintenanceTableBody');

    if (logs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 2rem; color: var(--text-muted);">No maintenance logs found</td></tr>';
        return;
    }

    tbody.innerHTML = logs.map(log => `
        <tr>
            <td>${formatDateTime(log.maintenance_date)}</td>
            <td><strong>${log.equipment_name}</strong></td>
            <td>${getMaintenanceTypeBadge(log.maintenance_type)}</td>
            <td>${log.technician_name}</td>
            <td>${log.downtime_hours} hrs</td>
            <td>${formatDate(log.next_maintenance_date)}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewMaintenanceDetail(${log.id})">View</button>
            </td>
        </tr>
    `).join('');
}

function viewMaintenanceDetail(id) {
    API.getMaintenanceLogs().then(logs => {
        const log = logs.find(l => l.id === id);
        if (log) {
            showMaintenanceDetailModal(log);
        }
    });
}

function showMaintenanceDetailModal(log) {
    const modalContainer = document.getElementById('modalContainer');

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">Maintenance Log Details</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row mb-2">
                        <div>
                            <strong>Equipment:</strong> ${log.equipment_name}
                        </div>
                        <div>
                            <strong>Type:</strong> ${getMaintenanceTypeBadge(log.maintenance_type)}
                        </div>
                    </div>
                    <div class="form-row mb-2">
                        <div>
                            <strong>Technician:</strong> ${log.technician_name}
                        </div>
                        <div>
                            <strong>Date:</strong> ${formatDateTime(log.maintenance_date)}
                        </div>
                    </div>
                    <div class="form-row mb-2">
                        <div>
                            <strong>Downtime:</strong> ${log.downtime_hours} hours
                        </div>
                        <div>
                            <strong>Next Maintenance:</strong> ${formatDate(log.next_maintenance_date)}
                        </div>
                    </div>
                    <div class="mb-2">
                        <strong>Description:</strong>
                        <p style="margin-top: 0.5rem; color: var(--text-secondary);">${log.description}</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeModal()">Close</button>
                </div>
            </div>
        </div>
    `;
}

async function showMaintenanceModal() {
    const modalContainer = document.getElementById('modalContainer');

    // Load equipment list
    const equipment = await API.getEquipment();

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">Log Maintenance Activity</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form onsubmit="saveMaintenanceLog(event)">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Equipment *</label>
                            <select id="maintenanceEquipment" class="form-select" required>
                                <option value="">Select Equipment</option>
                                ${equipment.map(eq => `<option value="${eq.id}">${eq.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Maintenance Type *</label>
                            <select id="maintenanceType" class="form-select" required>
                                <option value="">Select Type</option>
                                <option value="Preventive">Preventive</option>
                                <option value="Corrective">Corrective</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Description *</label>
                            <textarea id="maintenanceDescription" class="form-textarea" required 
                                      placeholder="Describe the maintenance work performed..."></textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Downtime (hours)</label>
                                <input type="number" id="maintenanceDowntime" class="form-input" 
                                       min="0" step="0.5" value="0">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Next Maintenance Date</label>
                                <input type="date" id="maintenanceNextDate" class="form-input">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Save Log</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function saveMaintenanceLog(event) {
    event.preventDefault();

    const data = {
        equipment_id: parseInt(document.getElementById('maintenanceEquipment').value),
        maintenance_type: document.getElementById('maintenanceType').value,
        description: document.getElementById('maintenanceDescription').value,
        downtime_hours: parseFloat(document.getElementById('maintenanceDowntime').value),
        next_maintenance_date: document.getElementById('maintenanceNextDate').value
    };

    try {
        showLoading();
        await API.createMaintenanceLog(data);
        showAlert('Maintenance log created successfully', 'success');
        closeModal();
        loadMaintenanceLogs();
    } catch (error) {
        showAlert(error.message || 'Failed to save maintenance log', 'error');
    } finally {
        hideLoading();
    }
}
