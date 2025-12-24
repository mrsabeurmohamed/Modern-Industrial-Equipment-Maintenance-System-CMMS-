# 🏭 Industrial CMMS - Equipment Maintenance Log

<div align="center">
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
</div>

---
#### Video Demo: <[URL HERE]([https://youtu.be/ar82ZslhgGI)]>
## 🌟 Overview

The **Industrial Equipment Maintenance Log (CMMS)** is a high-performance, enterprise-ready solution designed for mission-critical industrial environments. It provides a seamless interface for managing assets, tracking maintenance history, and responding to critical equipment failures in real-time.

Built with a **Glassmorphism design language**, the application offers a premium, modern aesthetic combined with robust backend intelligence.

---

## 🚀 Key Features

### 💎 Cutting-Edge UI/UX
- **Modern Dashboard**: Features a high-end "Glassmorphism" design with backdrop blurs and deep shadows.
- **Micro-Animations**: Animated KPI counters and smooth transitions for a premium experience.
- **Interactive Analytics**: Dynamic bar and donut charts powered by Chart.js for downtime and failure analysis.

### 🛠️ Maintenance & Asset Tracking
- **Smart Asset Registry**: Track complex industrial equipment with full maintenance history.
- **Workflow Intelligence**: High-severity failures automatically trigger "Out of Service" status and email alerts.
- **Maintenance Schedulers**: Automated tracking for next-service dates with visual indicators.

### 👥 Enterprise Management
- **User Control Panel**: Admins can manage the entire team, roles, and access status.
- **Role-Based Access**: Specialized views and permissions for Administrators and Technicians.
- **Public Registration**: Built-in signup flow with robust data validation.

### 📧 Smart Alerts (Integrated)
- **Critical Failure Emails**: Instant notifications to admins when assets go down.
- **Routine Summaries**: Daily system health checks delivered to your inbox.

---

## 📸 Presentation

<div align="center">
  <h3>Professional Dashboard</h3>
  <img src="https://via.placeholder.com/800x450.png?text=Dashboard+With+Glassmorphism+and+Charts" alt="Dashboard" width="800">
  
  <p align="center"><i>Real-time KPIs, animated counters, and interactive downtime analysis.</i></p>
</div>

---

## 🛠️ Technical Stack

- **Backend**: Python 3.12, Flask Framework
- **ORM**: SQLAlchemy (Database management)
- **Security**: Flask-Login (Authentication), Werkzeug (Security hashing)
- **Email**: Flask-Mail (SMTP Integration)
- **Frontend**: Vanilla JavaScript (ESNext), Modern CSS (Flexbox/Grid/Filters)
- **Visuals**: Chart.js 4.4, Modern Industrial UI System

---

## ⚙️ Installation & Setup

### 1. Initial Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/industrial-cmms.git

# Enter the project directory
cd industrial-cmms

# Install required packages
pip install -r requirements.txt
```

### 2. Database Initialization
This command prepares the database with realistic industrial assets, logs, and users.
```bash
python seed_data.py
```

### 3. Email Integration (Optional)
Configure your `.env` file for automated alerts:
```bash
MAIL_ENABLED=true
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

### 4. Run the Application
```bash
python app.py
```
Open your browser to: **`http://localhost:5000`**

---

## 🔑 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@maintenance.com` | `admin123` |
| **Technician** | `tech@maintenance.com` | `tech123` |

---

## 🤝 Contributing

We welcome contributions to help improve the Industrial CMMS!

1. **Fork** the repository
2. **Clone** your fork (`git clone ...`)
3. Create a **Feature Branch** (`git checkout -b feature/AmazingFeature`)
4. **Commit** your changes (`git commit -m 'Add AmazingFeature'`)
5. **Push** to the branch (`git push origin feature/AmazingFeature`)
6. Open a **Pull Request**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Powering Industrial Performance</strong> 🏭
</div>

