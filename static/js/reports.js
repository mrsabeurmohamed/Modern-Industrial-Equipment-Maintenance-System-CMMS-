// ===== Reports Page =====
async function renderReportsPage() {
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Reports & Analytics</h1>
            <p class="page-subtitle">Comprehensive maintenance and downtime analysis</p>
        </div>

        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Equipment Maintenance History</h3>
            </div>
            <div class="card-body">
                <div class="form-group">
                    <label class="form-label">Select Equipment</label>
                    <select id="reportEquipment" class="form-select" onchange="loadEquipmentReport()">
                        <option value="">Choose equipment...</option>
                    </select>
                </div>
                <div id="equipmentReportContent"></div>
            </div>
        </div>
    `;

    loadEquipmentList();
}

async function loadEquipmentList() {
    try {
        const equipment = await API.getEquipment();
        const select = document.getElementById('reportEquipment');

        select.innerHTML = '<option value="">Choose equipment...</option>' +
            equipment.map(eq => `<option value="${eq.id}">${eq.name}</option>`).join('');
    } catch (error) {
        showAlert('Failed to load equipment list', 'error');
    }
}

async function loadEquipmentReport() {
    const equipmentId = document.getElementById('reportEquipment').value;
    const contentDiv = document.getElementById('equipmentReportContent');

    if (!equipmentId) {
        contentDiv.innerHTML = '';
        return;
    }

    try {
        showLoading();
        const report = await API.getEquipmentReport(equipmentId);
        renderEquipmentReport(report);
    } catch (error) {
        showAlert('Failed to load equipment report', 'error');
    } finally {
        hideLoading();
    }
}

function renderEquipmentReport(report) {
    const contentDiv = document.getElementById('equipmentReportContent');
    const eq = report.equipment;

    contentDiv.innerHTML = `
        <div class="mt-2">
            <h4 style="margin-bottom: 1rem;">Equipment Summary</h4>
            <div class="form-row mb-2">
                <div>
                    <strong>Name:</strong> ${eq.name}
                </div>
                <div>
                    <strong>Type:</strong> ${eq.type}
                </div>
                <div>
                    <strong>Status:</strong> ${getStatusBadge(eq.status)}
                </div>
            </div>
            <div class="form-row mb-2">
                <div>
                    <strong>Total Maintenance Activities:</strong> ${report.total_maintenance_count}
                </div>
                <div>
                    <strong>Total Failures:</strong> ${report.total_failure_count}
                </div>
                <div>
                    <strong>Total Downtime:</strong> ${report.total_downtime.toFixed(1)} hours
                </div>
            </div>

            <h4 style="margin-top: 2rem; margin-bottom: 1rem;">Maintenance History</h4>
            ${report.maintenance_logs.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Technician</th>
                                <th>Description</th>
                                <th>Downtime</th>
                                <th>Next Maintenance</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.maintenance_logs.map(log => `
                                <tr>
                                    <td>${formatDateTime(log.maintenance_date)}</td>
                                    <td>${getMaintenanceTypeBadge(log.maintenance_type)}</td>
                                    <td>${log.technician_name}</td>
                                    <td>${log.description}</td>
                                    <td>${log.downtime_hours} hrs</td>
                                    <td>${formatDate(log.next_maintenance_date)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p style="color: var(--text-muted);">No maintenance records</p>'}

            <h4 style="margin-top: 2rem; margin-bottom: 1rem;">Failure History</h4>
            ${report.failure_reports.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Severity</th>
                                <th>Description</th>
                                <th>Reported By</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${report.failure_reports.map(failure => `
                                <tr>
                                    <td>${formatDateTime(failure.reported_date)}</td>
                                    <td>${getSeverityBadge(failure.severity)}</td>
                                    <td>${failure.failure_description}</td>
                                    <td>${failure.reporter_name}</td>
                                    <td>${failure.resolved ? '<span class="badge badge-active">Resolved</span>' : '<span class="badge badge-outofservice">Open</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<p style="color: var(--text-muted);">No failure reports</p>'}

            <div class="mt-2">
                <button class="btn btn-primary" onclick="window.print()">🖨️ Print Report</button>
            </div>
        </div>
    `;
}
