// ===== Failures Page =====
async function renderFailuresPage() {
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="page-header flex-between">
            <div>
                <h1 class="page-title">Failure Reports</h1>
                <p class="page-subtitle">Track equipment failures and incidents</p>
            </div>
            <button class="btn btn-secondary" onclick="showFailureModal()">⚠️ Report Failure</button>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Active Failures</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Equipment</th>
                            <th>Severity</th>
                            <th>Description</th>
                            <th>Reported By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="activeFailuresTableBody">
                        <!-- Active failures will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card mt-2">
            <div class="card-header">
                <h3 class="card-title">Resolved Failures</h3>
            </div>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Equipment</th>
                            <th>Severity</th>
                            <th>Description</th>
                            <th>Reported By</th>
                        </tr>
                    </thead>
                    <tbody id="resolvedFailuresTableBody">
                        <!-- Resolved failures will be loaded here -->
                    </tbody>
                </table>
            </div>
        </div>
    `;

    loadFailures();
}

async function loadFailures() {
    try {
        showLoading();
        const allFailures = await API.getFailureReports();

        const activeFailures = allFailures.filter(f => !f.resolved);
        const resolvedFailures = allFailures.filter(f => f.resolved);

        renderActiveFailuresTable(activeFailures);
        renderResolvedFailuresTable(resolvedFailures);
    } catch (error) {
        showAlert('Failed to load failure reports', 'error');
    } finally {
        hideLoading();
    }
}

function renderActiveFailuresTable(failures) {
    const tbody = document.getElementById('activeFailuresTableBody');

    if (failures.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center" style="padding: 2rem; color: var(--text-muted);">No active failures</td></tr>';
        return;
    }

    tbody.innerHTML = failures.map(failure => `
        <tr>
            <td>${formatDateTime(failure.reported_date)}</td>
            <td><strong>${failure.equipment_name}</strong></td>
            <td>${getSeverityBadge(failure.severity)}</td>
            <td>${failure.failure_description}</td>
            <td>${failure.reporter_name}</td>
            <td class="table-actions">
                <button class="btn btn-sm btn-primary" onclick="resolveFailure(${failure.id})">Resolve</button>
            </td>
        </tr>
    `).join('');
}

function renderResolvedFailuresTable(failures) {
    const tbody = document.getElementById('resolvedFailuresTableBody');

    if (failures.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center" style="padding: 2rem; color: var(--text-muted);">No resolved failures</td></tr>';
        return;
    }

    tbody.innerHTML = failures.map(failure => `
        <tr>
            <td>${formatDateTime(failure.reported_date)}</td>
            <td><strong>${failure.equipment_name}</strong></td>
            <td>${getSeverityBadge(failure.severity)}</td>
            <td>${failure.failure_description}</td>
            <td>${failure.reporter_name}</td>
        </tr>
    `).join('');
}

async function showFailureModal() {
    const modalContainer = document.getElementById('modalContainer');

    // Load equipment list
    const equipment = await API.getEquipment();

    modalContainer.innerHTML = `
        <div class="modal-overlay" onclick="closeModal(event)">
            <div class="modal" onclick="event.stopPropagation()">
                <div class="modal-header">
                    <h2 class="modal-title">Report Equipment Failure</h2>
                    <button class="modal-close" onclick="closeModal()">&times;</button>
                </div>
                <form onsubmit="saveFailureReport(event)">
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">Equipment *</label>
                            <select id="failureEquipment" class="form-select" required>
                                <option value="">Select Equipment</option>
                                ${equipment.map(eq => `<option value="${eq.id}">${eq.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Severity *</label>
                            <select id="failureSeverity" class="form-select" required>
                                <option value="">Select Severity</option>
                                <option value="Low">Low - Minor issue, equipment operational</option>
                                <option value="Medium">Medium - Reduced performance</option>
                                <option value="High">High - Critical failure, equipment shutdown</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Failure Description *</label>
                            <textarea id="failureDescription" class="form-textarea" required 
                                      placeholder="Describe the failure in detail..."></textarea>
                        </div>
                        <div class="alert alert-warning">
                            <strong>Note:</strong> High severity failures will automatically set equipment status to "Out of Service"
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                        <button type="submit" class="btn btn-secondary">Submit Report</button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function saveFailureReport(event) {
    event.preventDefault();

    const data = {
        equipment_id: parseInt(document.getElementById('failureEquipment').value),
        severity: document.getElementById('failureSeverity').value,
        failure_description: document.getElementById('failureDescription').value
    };

    try {
        showLoading();
        await API.createFailureReport(data);
        showAlert('Failure report submitted successfully', 'success');
        closeModal();
        loadFailures();
    } catch (error) {
        showAlert(error.message || 'Failed to submit failure report', 'error');
    } finally {
        hideLoading();
    }
}

async function resolveFailure(id) {
    if (!confirm('Mark this failure as resolved?')) {
        return;
    }

    try {
        showLoading();
        await API.updateFailureReport(id, { resolved: true });
        showAlert('Failure marked as resolved', 'success');
        loadFailures();
    } catch (error) {
        showAlert(error.message || 'Failed to resolve failure', 'error');
    } finally {
        hideLoading();
    }
}
