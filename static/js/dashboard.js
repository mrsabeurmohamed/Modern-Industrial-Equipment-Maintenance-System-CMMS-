// ===== Enhanced Dashboard Page =====
async function renderDashboard() {
    const mainContent = document.getElementById('mainContent');

    mainContent.innerHTML = `
        <div class="page-header">
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Real-time equipment maintenance overview and analytics</p>
        </div>

        <!-- Quick Actions -->
        <div class="quick-actions">
            <button class="quick-action-btn" onclick="navigateTo('failures'); setTimeout(() => document.querySelector('.btn-secondary')?.click(), 100)">
                ⚠️ Report Failure
            </button>
            <button class="quick-action-btn" onclick="navigateTo('maintenance'); setTimeout(() => document.querySelector('.btn-primary')?.click(), 100)">
                🔧 Log Maintenance
            </button>
            <button class="quick-action-btn" onclick="navigateTo('equipment')">
                📊 View Equipment
            </button>
        </div>

        <div class="kpi-grid" id="kpiGrid">
            <!-- KPIs will be loaded here -->
        </div>

        <div class="chart-container-enhanced">
            <h3 class="card-title mb-1">Downtime Analysis</h3>
            <div class="chart-wrapper">
                <canvas id="downtimeChart"></canvas>
            </div>
        </div>

        <div class="chart-container-enhanced">
            <h3 class="card-title mb-1">Failure Distribution</h3>
            <div class="chart-wrapper">
                <canvas id="failureChart"></canvas>
            </div>
        </div>
    `;

    try {
        showLoading();
        const data = await API.getDashboardData();
        renderKPIs(data);
        renderDowntimeChart(data.downtime_by_equipment);
        renderFailureChart(data.failures_by_equipment);
    } catch (error) {
        showAlert('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

// Animated counter function
function animateCounter(element, target, duration = 1000) {
    const start = 0;
    const increment = target / (duration / 16); // 60 FPS
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = Math.round(target);
            clearInterval(timer);
        } else {
            element.textContent = Math.round(current);
        }
    }, 16);
}

function renderKPIs(data) {
    const kpiGrid = document.getElementById('kpiGrid');

    const totalEquipment = Object.values(data.equipment_by_status).reduce((a, b) => a + b, 0);
    const activeEquipment = data.equipment_by_status['Active'] || 0;
    const lastMonthFailures = 0; // Would come from historical data
    const failureTrend = data.active_failures > lastMonthFailures ? 'up' : 'down';

    kpiGrid.innerHTML = `
        <div class="kpi-card" style="border-left-color: var(--primary-light);">
            <div class="kpi-icon">⚙️</div>
            <div class="kpi-label">Total Equipment</div>
            <div class="kpi-value" data-target="${totalEquipment}">0</div>
            <div class="kpi-trend up">
                <span>↑ 100%</span> Operational
            </div>
        </div>

        <div class="kpi-card" style="border-left-color: var(--status-active);">
            <div class="kpi-icon">✅</div>
            <div class="kpi-label">Active Equipment</div>
            <div class="kpi-value" data-target="${activeEquipment}">0</div>
            <div class="kpi-trend up">
                <span>↑ ${((activeEquipment / totalEquipment) * 100).toFixed(0)}%</span> Active Rate
            </div>
        </div>

        <div class="kpi-card ${data.active_failures > 0 ? 'critical-alert' : ''}" style="border-left-color: var(--status-outofservice);">
            <div class="kpi-icon">⚠️</div>
            <div class="kpi-label">Active Failures</div>
            <div class="kpi-value" data-target="${data.active_failures}">0</div>
            <div class="kpi-trend ${failureTrend}">
                <span>${failureTrend === 'up' ? '↑' : '↓'}</span> ${data.active_failures > 0 ? 'Requires Attention' : 'All Clear'}
            </div>
        </div>

        <div class="kpi-card" style="border-left-color: var(--status-maintenance);">
            <div class="kpi-icon">📅</div>
            <div class="kpi-label">Upcoming Maintenance</div>
            <div class="kpi-value" data-target="${data.upcoming_maintenance}">0</div>
            <div class="kpi-trend">
                <span>📆</span> Next 30 Days
            </div>
        </div>

        <div class="kpi-card" style="border-left-color: var(--secondary-color);">
            <div class="kpi-icon">⏱️</div>
            <div class="kpi-label">Downtime This Month</div>
            <div class="kpi-value" data-target="${data.total_downtime.toFixed(1)}">0</div>
            <div class="kpi-trend">
                <span style="font-size: 0.75rem; color: var(--text-muted);">hours</span>
            </div>
        </div>
    `;

    // Animate all counters
    document.querySelectorAll('.kpi-value').forEach(el => {
        const target = parseFloat(el.getAttribute('data-target'));
        animateCounter(el, target);
    });
}

function renderDowntimeChart(data) {
    const ctx = document.getElementById('downtimeChart');

    if (data.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No downtime data available</p>';
        return;
    }

    // Create gradient
    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(249, 115, 22, 0.8)');
    gradient.addColorStop(1, 'rgba(249, 115, 22, 0.2)');

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item.equipment),
            datasets: [{
                label: 'Downtime (hours)',
                data: data.map(item => item.downtime),
                backgroundColor: gradient,
                borderColor: 'rgba(249, 115, 22, 1)',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            size: 14,
                            weight: '600'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(249, 115, 22, 0.5)',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function (context) {
                            return `Downtime: ${context.parsed.y.toFixed(1)} hours`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#cbd5e1',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: 'rgba(71, 85, 105, 0.2)',
                        drawBorder: false
                    }
                },
                x: {
                    ticks: {
                        color: '#cbd5e1',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}

function renderFailureChart(data) {
    const ctx = document.getElementById('failureChart');

    if (data.length === 0) {
        ctx.parentElement.innerHTML = '<p class="text-center" style="color: var(--text-muted); padding: 2rem;">No failure data available</p>';
        return;
    }

    const colors = [
        'rgba(239, 68, 68, 0.9)',
        'rgba(245, 158, 11, 0.9)',
        'rgba(59, 130, 246, 0.9)',
        'rgba(16, 185, 129, 0.9)',
        'rgba(139, 92, 246, 0.9)',
        'rgba(236, 72, 153, 0.9)'
    ];

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.equipment),
            datasets: [{
                label: 'Failures',
                data: data.map(item => item.failures),
                backgroundColor: colors.slice(0, data.length),
                borderColor: 'rgba(30, 41, 59, 0.8)',
                borderWidth: 3,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: '#f1f5f9',
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} failures (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true,
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        }
    });
}
