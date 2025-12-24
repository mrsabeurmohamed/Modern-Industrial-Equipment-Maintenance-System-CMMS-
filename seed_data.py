from app import create_app
from models import db, Technician, Equipment, MaintenanceLog, FailureReport
from datetime import datetime, timedelta

def seed_database():
    """Seed database with sample data"""
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        db.drop_all()
        db.create_all()
        
        print("Seeding database...")
        
        # Create technicians
        admin = Technician(
            full_name='John Smith',
            email='admin@maintenance.com',
            role='admin'
        )
        admin.set_password('admin123')
        
        tech = Technician(
            full_name='Sarah Johnson',
            email='tech@maintenance.com',
            role='technician'
        )
        tech.set_password('tech123')
        
        db.session.add(admin)
        db.session.add(tech)
        db.session.commit()
        
        print("Created 2 technicians")
        
        # Create equipment
        equipment_data = [
            {
                'name': 'Gas Turbine GE-3200',
                'type': 'Turbine',
                'manufacturer': 'General Electric',
                'model': 'GE-3200',
                'serial_number': 'GT-2023-001',
                'location': 'Plant A - Section 1',
                'installation_date': datetime(2020, 3, 15).date(),
                'status': 'Active'
            },
            {
                'name': 'Centrifugal Compressor CC-450',
                'type': 'Compressor',
                'manufacturer': 'Siemens',
                'model': 'CC-450',
                'serial_number': 'CP-2023-002',
                'location': 'Plant A - Section 2',
                'installation_date': datetime(2019, 6, 20).date(),
                'status': 'Active'
            },
            {
                'name': 'Emergency Generator DG-1500',
                'type': 'Generator',
                'manufacturer': 'Caterpillar',
                'model': 'DG-1500',
                'serial_number': 'GN-2023-003',
                'location': 'Plant B - Power House',
                'installation_date': datetime(2021, 1, 10).date(),
                'status': 'Active'
            },
            {
                'name': 'Hydraulic Pump HP-800',
                'type': 'Pump',
                'manufacturer': 'Grundfos',
                'model': 'HP-800',
                'serial_number': 'PM-2023-004',
                'location': 'Plant A - Section 3',
                'installation_date': datetime(2022, 8, 5).date(),
                'status': 'Under Maintenance'
            },
            {
                'name': 'Air Compressor AC-2000',
                'type': 'Compressor',
                'manufacturer': 'Atlas Copco',
                'model': 'AC-2000',
                'serial_number': 'CP-2023-005',
                'location': 'Plant B - Workshop',
                'installation_date': datetime(2018, 11, 12).date(),
                'status': 'Active'
            },
            {
                'name': 'Steam Turbine ST-5000',
                'type': 'Turbine',
                'manufacturer': 'Mitsubishi',
                'model': 'ST-5000',
                'serial_number': 'GT-2023-006',
                'location': 'Plant C - Main Hall',
                'installation_date': datetime(2017, 4, 22).date(),
                'status': 'Active'
            },
            {
                'name': 'Cooling Tower CT-3000',
                'type': 'Cooling System',
                'manufacturer': 'SPX Cooling',
                'model': 'CT-3000',
                'serial_number': 'CS-2023-007',
                'location': 'Plant A - Roof',
                'installation_date': datetime(2020, 9, 30).date(),
                'status': 'Active'
            },
            {
                'name': 'Boiler Feed Pump BFP-1200',
                'type': 'Pump',
                'manufacturer': 'KSB',
                'model': 'BFP-1200',
                'serial_number': 'PM-2023-008',
                'location': 'Plant C - Boiler Room',
                'installation_date': datetime(2019, 2, 14).date(),
                'status': 'Out of Service'
            }
        ]
        
        equipment_list = []
        for eq_data in equipment_data:
            equipment = Equipment(**eq_data)
            equipment_list.append(equipment)
            db.session.add(equipment)
        
        db.session.commit()
        print(f"Created {len(equipment_list)} equipment items")
        
        # Create maintenance logs
        maintenance_data = [
            {
                'equipment_id': 1,
                'technician_id': tech.id,
                'maintenance_type': 'Preventive',
                'description': 'Routine inspection and oil change. All systems functioning normally.',
                'maintenance_date': datetime.utcnow() - timedelta(days=15),
                'downtime_hours': 4.5,
                'next_maintenance_date': (datetime.utcnow() + timedelta(days=75)).date()
            },
            {
                'equipment_id': 2,
                'technician_id': admin.id,
                'maintenance_type': 'Corrective',
                'description': 'Replaced worn bearings and recalibrated pressure sensors.',
                'maintenance_date': datetime.utcnow() - timedelta(days=30),
                'downtime_hours': 8.0,
                'next_maintenance_date': (datetime.utcnow() + timedelta(days=60)).date()
            },
            {
                'equipment_id': 3,
                'technician_id': tech.id,
                'maintenance_type': 'Preventive',
                'description': 'Monthly load test and battery check. Performance within specifications.',
                'maintenance_date': datetime.utcnow() - timedelta(days=7),
                'downtime_hours': 2.0,
                'next_maintenance_date': (datetime.utcnow() + timedelta(days=23)).date()
            },
            {
                'equipment_id': 4,
                'technician_id': tech.id,
                'maintenance_type': 'Corrective',
                'description': 'Seal replacement and hydraulic fluid flush.',
                'maintenance_date': datetime.utcnow() - timedelta(days=2),
                'downtime_hours': 6.5,
                'next_maintenance_date': (datetime.utcnow() + timedelta(days=88)).date()
            },
            {
                'equipment_id': 5,
                'technician_id': admin.id,
                'maintenance_type': 'Preventive',
                'description': 'Filter replacement and condensate drain service.',
                'maintenance_date': datetime.utcnow() - timedelta(days=45),
                'downtime_hours': 3.0,
                'next_maintenance_date': (datetime.utcnow() + timedelta(days=45)).date()
            }
        ]
        
        for maint_data in maintenance_data:
            log = MaintenanceLog(**maint_data)
            db.session.add(log)
        
        db.session.commit()
        print(f"Created {len(maintenance_data)} maintenance logs")
        
        # Create failure reports
        failure_data = [
            {
                'equipment_id': 8,
                'reported_by': tech.id,
                'failure_description': 'Pump motor overheating. Automatic shutdown triggered.',
                'severity': 'High',
                'reported_date': datetime.utcnow() - timedelta(days=1),
                'resolved': False
            },
            {
                'equipment_id': 4,
                'reported_by': tech.id,
                'failure_description': 'Hydraulic leak detected at main seal.',
                'severity': 'Medium',
                'reported_date': datetime.utcnow() - timedelta(days=3),
                'resolved': True
            },
            {
                'equipment_id': 2,
                'reported_by': admin.id,
                'failure_description': 'Unusual vibration and noise during operation.',
                'severity': 'Medium',
                'reported_date': datetime.utcnow() - timedelta(days=31),
                'resolved': True
            },
            {
                'equipment_id': 1,
                'reported_by': tech.id,
                'failure_description': 'Temperature sensor reading inconsistent.',
                'severity': 'Low',
                'reported_date': datetime.utcnow() - timedelta(days=20),
                'resolved': True
            }
        ]
        
        for fail_data in failure_data:
            report = FailureReport(**fail_data)
            db.session.add(report)
        
        db.session.commit()
        print(f"Created {len(failure_data)} failure reports")
        
        print("\nDatabase seeding completed successfully!")
        print("\nLogin Credentials:")
        print("Admin: admin@maintenance.com / admin123")
        print("Technician: tech@maintenance.com / tech123")


if __name__ == '__main__':
    seed_database()
