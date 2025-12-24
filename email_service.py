"""
Email Service for CMMS System
Handles email notifications for critical failures and maintenance reminders
"""
from flask_mail import Mail, Message
from flask import current_app
from datetime import datetime, timedelta

mail = Mail()

def init_mail(app):
    """Initialize Flask-Mail with app"""
    mail.init_app(app)

def send_critical_failure_alert(failure_report, equipment):
    """
    Send email alert for critical (high severity) failures
    
    Args:
        failure_report: FailureReport object
        equipment: Equipment object
    """
    try:
        # Get admin emails
        from models import Technician
        admins = Technician.query.filter_by(role='admin', is_active=True).all()
        admin_emails = [admin.email for admin in admins]
        
        if not admin_emails:
            print("No admin emails found for critical failure alert")
            return
        
        subject = f"🚨 CRITICAL FAILURE: {equipment.name}"
        
        body = f"""
CRITICAL EQUIPMENT FAILURE ALERT

Equipment: {equipment.name}
Type: {equipment.type}
Location: {equipment.location}
Serial Number: {equipment.serial_number}

Failure Details:
- Severity: HIGH
- Description: {failure_report.failure_description}
- Reported By: {failure_report.reporter.full_name}
- Reported Date: {failure_report.reported_date.strftime('%Y-%m-%d %H:%M')}

Current Status: {equipment.status}

IMMEDIATE ACTION REQUIRED

Please log in to the CMMS system to review and address this critical failure.

---
Equipment Maintenance Log System
Industrial CMMS
"""
        
        msg = Message(
            subject=subject,
            recipients=admin_emails,
            body=body
        )
        
        mail.send(msg)
        print(f"Critical failure alert sent to {len(admin_emails)} admins")
        
    except Exception as e:
        print(f"Error sending critical failure alert: {str(e)}")


def send_maintenance_reminder(maintenance_log, equipment):
    """
    Send email reminder for upcoming maintenance
    
    Args:
        maintenance_log: MaintenanceLog object
        equipment: Equipment object
    """
    try:
        # Get all active technicians
        from models import Technician
        technicians = Technician.query.filter_by(is_active=True).all()
        tech_emails = [tech.email for tech in technicians]
        
        if not tech_emails:
            print("No technician emails found for maintenance reminder")
            return
        
        days_until = (maintenance_log.next_maintenance_date - datetime.utcnow().date()).days
        
        subject = f"📅 Maintenance Reminder: {equipment.name} - Due in {days_until} days"
        
        body = f"""
SCHEDULED MAINTENANCE REMINDER

Equipment: {equipment.name}
Type: {equipment.type}
Location: {equipment.location}

Maintenance Details:
- Type: {maintenance_log.maintenance_type}
- Scheduled Date: {maintenance_log.next_maintenance_date.strftime('%Y-%m-%d')}
- Days Until Due: {days_until}
- Last Maintenance: {maintenance_log.maintenance_date.strftime('%Y-%m-%d')}
- Performed By: {maintenance_log.technician.full_name}

Description of Last Maintenance:
{maintenance_log.description}

Please schedule and complete this maintenance activity before the due date.

---
Equipment Maintenance Log System
Industrial CMMS
"""
        
        msg = Message(
            subject=subject,
            recipients=tech_emails,
            body=body
        )
        
        mail.send(msg)
        print(f"Maintenance reminder sent to {len(tech_emails)} technicians")
        
    except Exception as e:
        print(f"Error sending maintenance reminder: {str(e)}")


def send_daily_summary():
    """
    Send daily summary email to admins
    Includes active failures and upcoming maintenance
    """
    try:
        from models import Technician, FailureReport, MaintenanceLog, Equipment
        from datetime import date
        
        # Get admin emails
        admins = Technician.query.filter_by(role='admin', is_active=True).all()
        admin_emails = [admin.email for admin in admins]
        
        if not admin_emails:
            print("No admin emails found for daily summary")
            return
        
        # Get active failures
        active_failures = FailureReport.query.filter_by(resolved=False).all()
        
        # Get upcoming maintenance (next 7 days)
        today = date.today()
        upcoming_date = today + timedelta(days=7)
        upcoming_maintenance = MaintenanceLog.query.filter(
            MaintenanceLog.next_maintenance_date.between(today, upcoming_date)
        ).all()
        
        subject = f"📊 Daily CMMS Summary - {today.strftime('%Y-%m-%d')}"
        
        # Build failure summary
        failure_summary = ""
        if active_failures:
            failure_summary = "\nACTIVE FAILURES:\n" + "-" * 50 + "\n"
            for failure in active_failures:
                equipment = Equipment.query.get(failure.equipment_id)
                failure_summary += f"""
• {equipment.name} ({equipment.type})
  Severity: {failure.severity}
  Description: {failure.failure_description}
  Reported: {failure.reported_date.strftime('%Y-%m-%d')}
"""
        else:
            failure_summary = "\n✅ No active failures\n"
        
        # Build maintenance summary
        maintenance_summary = ""
        if upcoming_maintenance:
            maintenance_summary = "\nUPCOMING MAINTENANCE (Next 7 Days):\n" + "-" * 50 + "\n"
            for maint in upcoming_maintenance:
                equipment = Equipment.query.get(maint.equipment_id)
                days_until = (maint.next_maintenance_date - today).days
                maintenance_summary += f"""
• {equipment.name} ({equipment.type})
  Type: {maint.maintenance_type}
  Due Date: {maint.next_maintenance_date.strftime('%Y-%m-%d')} ({days_until} days)
  Location: {equipment.location}
"""
        else:
            maintenance_summary = "\n✅ No upcoming maintenance scheduled\n"
        
        body = f"""
DAILY CMMS SUMMARY
{today.strftime('%A, %B %d, %Y')}
{"=" * 50}

{failure_summary}

{maintenance_summary}

SYSTEM STATISTICS:
- Total Active Failures: {len(active_failures)}
- Upcoming Maintenance Tasks: {len(upcoming_maintenance)}

---
Equipment Maintenance Log System
Industrial CMMS
"""
        
        msg = Message(
            subject=subject,
            recipients=admin_emails,
            body=body
        )
        
        mail.send(msg)
        print(f"Daily summary sent to {len(admin_emails)} admins")
        
    except Exception as e:
        print(f"Error sending daily summary: {str(e)}")


def check_and_send_maintenance_reminders():
    """
    Check for upcoming maintenance and send reminders
    Should be called daily via scheduler
    """
    try:
        from models import MaintenanceLog, Equipment
        from datetime import date, timedelta
        
        # Get maintenance due in 7 days
        target_date = date.today() + timedelta(days=7)
        
        upcoming_maintenance = MaintenanceLog.query.filter(
            MaintenanceLog.next_maintenance_date == target_date
        ).all()
        
        for maint in upcoming_maintenance:
            equipment = Equipment.query.get(maint.equipment_id)
            send_maintenance_reminder(maint, equipment)
            
        print(f"Checked maintenance reminders: {len(upcoming_maintenance)} reminders sent")
        
    except Exception as e:
        print(f"Error checking maintenance reminders: {str(e)}")
