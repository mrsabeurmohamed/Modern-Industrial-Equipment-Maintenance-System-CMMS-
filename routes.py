from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from functools import wraps
from datetime import datetime, timedelta
from sqlalchemy import func
from models import db, Technician, Equipment, MaintenanceLog, FailureReport

api = Blueprint('api', __name__)

# Role-based access control decorator
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


# Authentication endpoints
@api.route('/login', methods=['POST'])
def login():
    """User login"""
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400
    
    user = Technician.query.filter_by(email=email).first()
    
    if user and user.check_password(password):
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated. Contact administrator.'}), 403
        
        login_user(user)
        user.update_last_login()
        return jsonify({
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200
    
    return jsonify({'error': 'Invalid credentials'}), 401


@api.route('/logout', methods=['POST'])
@login_required
def logout():
    """User logout"""
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200


@api.route('/current_user', methods=['GET'])
@login_required
def get_current_user():
    """Get current logged-in user"""
    return jsonify(current_user.to_dict()), 200


# User Management endpoints
@api.route('/users', methods=['GET'])
@login_required
@admin_required
def get_users():
    """Get all users (admin only)"""
    users = Technician.query.all()
    return jsonify([user.to_dict() for user in users]), 200


@api.route('/users', methods=['POST'])
@login_required
@admin_required
def create_user():
    """Create new user (admin only)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['full_name', 'email', 'password', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if email already exists
    if Technician.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    user = Technician(
        full_name=data['full_name'],
        email=data['email'],
        role=data['role'],
        is_active=data.get('is_active', True)
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify(user.to_dict()), 201


@api.route('/users/<int:user_id>', methods=['PUT'])
@login_required
@admin_required
def update_user(user_id):
    """Update user (admin only)"""
    user = Technician.query.get_or_404(user_id)
    data = request.get_json()
    
    # Update fields
    if 'full_name' in data:
        user.full_name = data['full_name']
    if 'email' in data:
        # Check if new email is already taken
        existing = Technician.query.filter_by(email=data['email']).first()
        if existing and existing.id != user_id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    if 'role' in data:
        user.role = data['role']
    if 'is_active' in data:
        user.is_active = data['is_active']
    if 'password' in data and data['password']:
        user.set_password(data['password'])
    
    db.session.commit()
    return jsonify(user.to_dict()), 200


@api.route('/users/<int:user_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_user(user_id):
    """Delete user (admin only)"""
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    user = Technician.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({'message': 'User deleted successfully'}), 200


@api.route('/users/<int:user_id>/toggle-active', methods=['PUT'])
@login_required
@admin_required
def toggle_user_active(user_id):
    """Activate/deactivate user (admin only)"""
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot deactivate your own account'}), 400
    
    user = Technician.query.get_or_404(user_id)
    user.is_active = not user.is_active
    db.session.commit()
    return jsonify(user.to_dict()), 200


# Public Signup endpoint
@api.route('/signup', methods=['POST'])
def signup():
    """Public user registration"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['full_name', 'email', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Validate email format
    if '@' not in data['email'] or '.' not in data['email']:
        return jsonify({'error': 'Invalid email format'}), 400
    
    # Check if email already exists
    if Technician.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Validate password length
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    
    # Create new user (default role: technician, requires admin approval)
    user = Technician(
        full_name=data['full_name'],
        email=data['email'],
        role='technician',
        is_active=True  # Can be set to False to require admin approval
    )
    user.set_password(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'message': 'Account created successfully. You can now login.',
        'user': user.to_dict()
    }), 201


# Equipment endpoints
@api.route('/equipment', methods=['GET'])
@login_required
def get_equipment():
    """Get all equipment with optional filters"""
    status = request.args.get('status')
    equipment_type = request.args.get('type')
    
    query = Equipment.query
    
    if status:
        query = query.filter_by(status=status)
    if equipment_type:
        query = query.filter_by(type=equipment_type)
    
    equipment_list = query.all()
    return jsonify([eq.to_dict() for eq in equipment_list]), 200


@api.route('/equipment/<int:equipment_id>', methods=['GET'])
@login_required
def get_equipment_detail(equipment_id):
    """Get equipment details with maintenance history"""
    equipment = Equipment.query.get_or_404(equipment_id)
    
    # Get maintenance logs
    maintenance_logs = MaintenanceLog.query.filter_by(equipment_id=equipment_id).order_by(MaintenanceLog.maintenance_date.desc()).all()
    
    # Get failure reports
    failure_reports = FailureReport.query.filter_by(equipment_id=equipment_id).order_by(FailureReport.reported_date.desc()).all()
    
    return jsonify({
        'equipment': equipment.to_dict(),
        'maintenance_logs': [log.to_dict() for log in maintenance_logs],
        'failure_reports': [report.to_dict() for report in failure_reports]
    }), 200


@api.route('/equipment', methods=['POST'])
@login_required
@admin_required
def create_equipment():
    """Create new equipment (admin only)"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'type']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Parse installation date if provided
    installation_date = None
    if data.get('installation_date'):
        try:
            installation_date = datetime.fromisoformat(data['installation_date']).date()
        except ValueError:
            return jsonify({'error': 'Invalid installation_date format'}), 400
    
    equipment = Equipment(
        name=data['name'],
        type=data['type'],
        manufacturer=data.get('manufacturer'),
        model=data.get('model'),
        serial_number=data.get('serial_number'),
        location=data.get('location'),
        installation_date=installation_date,
        status=data.get('status', 'Active')
    )
    
    db.session.add(equipment)
    db.session.commit()
    
    return jsonify(equipment.to_dict()), 201


@api.route('/equipment/<int:equipment_id>', methods=['PUT'])
@login_required
@admin_required
def update_equipment(equipment_id):
    """Update equipment (admin only)"""
    equipment = Equipment.query.get_or_404(equipment_id)
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        equipment.name = data['name']
    if 'type' in data:
        equipment.type = data['type']
    if 'manufacturer' in data:
        equipment.manufacturer = data['manufacturer']
    if 'model' in data:
        equipment.model = data['model']
    if 'serial_number' in data:
        equipment.serial_number = data['serial_number']
    if 'location' in data:
        equipment.location = data['location']
    if 'status' in data:
        equipment.status = data['status']
    if 'installation_date' in data:
        try:
            equipment.installation_date = datetime.fromisoformat(data['installation_date']).date()
        except ValueError:
            return jsonify({'error': 'Invalid installation_date format'}), 400
    
    db.session.commit()
    return jsonify(equipment.to_dict()), 200


@api.route('/equipment/<int:equipment_id>', methods=['DELETE'])
@login_required
@admin_required
def delete_equipment(equipment_id):
    """Delete equipment (admin only)"""
    equipment = Equipment.query.get_or_404(equipment_id)
    db.session.delete(equipment)
    db.session.commit()
    return jsonify({'message': 'Equipment deleted'}), 200


# Maintenance endpoints
@api.route('/maintenance', methods=['GET'])
@login_required
def get_maintenance_logs():
    """Get all maintenance logs"""
    equipment_id = request.args.get('equipment_id', type=int)
    
    query = MaintenanceLog.query
    
    if equipment_id:
        query = query.filter_by(equipment_id=equipment_id)
    
    logs = query.order_by(MaintenanceLog.maintenance_date.desc()).all()
    return jsonify([log.to_dict() for log in logs]), 200


@api.route('/maintenance', methods=['POST'])
@login_required
def create_maintenance_log():
    """Create maintenance log"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['equipment_id', 'maintenance_type', 'description']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Verify equipment exists
    equipment = Equipment.query.get(data['equipment_id'])
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404
    
    # Parse dates
    maintenance_date = datetime.utcnow()
    if data.get('maintenance_date'):
        try:
            maintenance_date = datetime.fromisoformat(data['maintenance_date'])
        except ValueError:
            return jsonify({'error': 'Invalid maintenance_date format'}), 400
    
    next_maintenance_date = None
    if data.get('next_maintenance_date'):
        try:
            next_maintenance_date = datetime.fromisoformat(data['next_maintenance_date']).date()
        except ValueError:
            return jsonify({'error': 'Invalid next_maintenance_date format'}), 400
    
    # Create maintenance log
    log = MaintenanceLog(
        equipment_id=data['equipment_id'],
        technician_id=current_user.id,
        maintenance_type=data['maintenance_type'],
        description=data['description'],
        maintenance_date=maintenance_date,
        downtime_hours=data.get('downtime_hours', 0.0),
        next_maintenance_date=next_maintenance_date
    )
    
    # Business logic: Update equipment status to Active after maintenance
    equipment.status = 'Active'
    
    db.session.add(log)
    db.session.commit()
    
    return jsonify(log.to_dict()), 201


# Failure report endpoints
@api.route('/failures', methods=['GET'])
@login_required
def get_failure_reports():
    """Get all failure reports"""
    equipment_id = request.args.get('equipment_id', type=int)
    resolved = request.args.get('resolved')
    
    query = FailureReport.query
    
    if equipment_id:
        query = query.filter_by(equipment_id=equipment_id)
    if resolved is not None:
        query = query.filter_by(resolved=resolved.lower() == 'true')
    
    reports = query.order_by(FailureReport.reported_date.desc()).all()
    return jsonify([report.to_dict() for report in reports]), 200


@api.route('/failures', methods=['POST'])
@login_required
def create_failure_report():
    """Create failure report"""
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['equipment_id', 'failure_description', 'severity']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
    
    # Verify equipment exists
    equipment = Equipment.query.get(data['equipment_id'])
    if not equipment:
        return jsonify({'error': 'Equipment not found'}), 404
    
    # Create failure report
    report = FailureReport(
        equipment_id=data['equipment_id'],
        reported_by=current_user.id,
        failure_description=data['failure_description'],
        severity=data['severity'],
        resolved=False
    )
    
    # Business logic: If severity is High, set equipment status to Out of Service
    if data['severity'] == 'High':
        equipment.status = 'Out of Service'
        
        # Send critical failure email alert
        try:
            from flask import current_app
            if current_app.config.get('MAIL_ENABLED'):
                from email_service import send_critical_failure_alert
                send_critical_failure_alert(report, equipment)
        except Exception as e:
            print(f"Email alert error: {str(e)}")
    
    db.session.add(report)
    db.session.commit()
    
    return jsonify(report.to_dict()), 201


@api.route('/failures/<int:failure_id>', methods=['PUT'])
@login_required
def update_failure_report(failure_id):
    """Update failure report (resolve)"""
    report = FailureReport.query.get_or_404(failure_id)
    data = request.get_json()
    
    if 'resolved' in data:
        report.resolved = data['resolved']
    
    db.session.commit()
    return jsonify(report.to_dict()), 200


# Reports endpoints
@api.route('/reports/dashboard', methods=['GET'])
@login_required
def get_dashboard_data():
    """Get dashboard KPIs and analytics"""
    
    # Total equipment by status
    equipment_counts = db.session.query(
        Equipment.status,
        func.count(Equipment.id)
    ).group_by(Equipment.status).all()
    
    equipment_by_status = {status: count for status, count in equipment_counts}
    
    # Active failures
    active_failures = FailureReport.query.filter_by(resolved=False).count()
    
    # Upcoming preventive maintenance (next 30 days)
    today = datetime.utcnow().date()
    upcoming_date = today + timedelta(days=30)
    upcoming_maintenance = MaintenanceLog.query.filter(
        MaintenanceLog.next_maintenance_date.between(today, upcoming_date)
    ).count()
    
    # Total downtime this month
    first_day_of_month = today.replace(day=1)
    total_downtime = db.session.query(
        func.sum(MaintenanceLog.downtime_hours)
    ).filter(
        MaintenanceLog.maintenance_date >= first_day_of_month
    ).scalar() or 0
    
    # Downtime by equipment (for chart)
    downtime_by_equipment = db.session.query(
        Equipment.name,
        func.sum(MaintenanceLog.downtime_hours).label('total_downtime')
    ).join(MaintenanceLog).group_by(Equipment.id).all()
    
    # Failure frequency by equipment
    failures_by_equipment = db.session.query(
        Equipment.name,
        func.count(FailureReport.id).label('failure_count')
    ).join(FailureReport).group_by(Equipment.id).all()
    
    return jsonify({
        'equipment_by_status': equipment_by_status,
        'active_failures': active_failures,
        'upcoming_maintenance': upcoming_maintenance,
        'total_downtime': float(total_downtime),
        'downtime_by_equipment': [
            {'equipment': name, 'downtime': float(downtime)}
            for name, downtime in downtime_by_equipment
        ],
        'failures_by_equipment': [
            {'equipment': name, 'failures': count}
            for name, count in failures_by_equipment
        ]
    }), 200


@api.route('/reports/equipment/<int:equipment_id>', methods=['GET'])
@login_required
def get_equipment_report(equipment_id):
    """Get detailed equipment maintenance history report"""
    equipment = Equipment.query.get_or_404(equipment_id)
    
    # Get all maintenance logs
    maintenance_logs = MaintenanceLog.query.filter_by(
        equipment_id=equipment_id
    ).order_by(MaintenanceLog.maintenance_date.desc()).all()
    
    # Get all failure reports
    failure_reports = FailureReport.query.filter_by(
        equipment_id=equipment_id
    ).order_by(FailureReport.reported_date.desc()).all()
    
    # Calculate total downtime
    total_downtime = sum(log.downtime_hours for log in maintenance_logs)
    
    return jsonify({
        'equipment': equipment.to_dict(),
        'maintenance_logs': [log.to_dict() for log in maintenance_logs],
        'failure_reports': [report.to_dict() for report in failure_reports],
        'total_downtime': total_downtime,
        'total_maintenance_count': len(maintenance_logs),
        'total_failure_count': len(failure_reports)
    }), 200


@api.route('/reports/downtime', methods=['GET'])
@login_required
def get_downtime_report():
    """Get downtime analysis"""
    # Downtime by month
    downtime_by_month = db.session.query(
        func.strftime('%Y-%m', MaintenanceLog.maintenance_date).label('month'),
        func.sum(MaintenanceLog.downtime_hours).label('total_downtime')
    ).group_by('month').order_by('month').all()
    
    return jsonify({
        'downtime_by_month': [
            {'month': month, 'downtime': float(downtime)}
            for month, downtime in downtime_by_month
        ]
    }), 200
