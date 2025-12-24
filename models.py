from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class Technician(UserMixin, db.Model):
    """Technician/User model with authentication"""
    __tablename__ = 'technicians'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='technician')  # admin or technician
    is_active = db.Column(db.Boolean, default=True)  # User activation status
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    # Relationships
    maintenance_logs = db.relationship('MaintenanceLog', backref='technician', lazy=True)
    failure_reports = db.relationship('FailureReport', backref='reporter', lazy=True)
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify password"""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login = datetime.utcnow()
        db.session.commit()
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }


class Equipment(db.Model):
    """Equipment registry model"""
    __tablename__ = 'equipment'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # Compressor, Turbine, Generator, etc.
    manufacturer = db.Column(db.String(100))
    model = db.Column(db.String(100))
    serial_number = db.Column(db.String(100), unique=True)
    location = db.Column(db.String(200))
    installation_date = db.Column(db.Date)
    status = db.Column(db.String(30), nullable=False, default='Active')  # Active, Under Maintenance, Out of Service
    
    # Relationships
    maintenance_logs = db.relationship('MaintenanceLog', backref='equipment', lazy=True, cascade='all, delete-orphan')
    failure_reports = db.relationship('FailureReport', backref='equipment', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'name': self.name,
            'type': self.type,
            'manufacturer': self.manufacturer,
            'model': self.model,
            'serial_number': self.serial_number,
            'location': self.location,
            'installation_date': self.installation_date.isoformat() if self.installation_date else None,
            'status': self.status
        }


class MaintenanceLog(db.Model):
    """Maintenance activity log"""
    __tablename__ = 'maintenance_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    technician_id = db.Column(db.Integer, db.ForeignKey('technicians.id'), nullable=False)
    maintenance_type = db.Column(db.String(20), nullable=False)  # Preventive or Corrective
    description = db.Column(db.Text, nullable=False)
    maintenance_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    downtime_hours = db.Column(db.Float, default=0.0)
    next_maintenance_date = db.Column(db.Date)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'equipment_name': self.equipment.name if self.equipment else None,
            'technician_id': self.technician_id,
            'technician_name': self.technician.full_name if self.technician else None,
            'maintenance_type': self.maintenance_type,
            'description': self.description,
            'maintenance_date': self.maintenance_date.isoformat(),
            'downtime_hours': self.downtime_hours,
            'next_maintenance_date': self.next_maintenance_date.isoformat() if self.next_maintenance_date else None
        }


class FailureReport(db.Model):
    """Equipment failure reports"""
    __tablename__ = 'failure_reports'
    
    id = db.Column(db.Integer, primary_key=True)
    equipment_id = db.Column(db.Integer, db.ForeignKey('equipment.id'), nullable=False)
    reported_by = db.Column(db.Integer, db.ForeignKey('technicians.id'), nullable=False)
    failure_description = db.Column(db.Text, nullable=False)
    severity = db.Column(db.String(10), nullable=False)  # Low, Medium, High
    reported_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    resolved = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'equipment_id': self.equipment_id,
            'equipment_name': self.equipment.name if self.equipment else None,
            'reported_by': self.reported_by,
            'reporter_name': self.reporter.full_name if self.reporter else None,
            'failure_description': self.failure_description,
            'severity': self.severity,
            'reported_date': self.reported_date.isoformat(),
            'resolved': self.resolved
        }
