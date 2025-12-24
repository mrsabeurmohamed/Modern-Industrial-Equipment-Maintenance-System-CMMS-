from flask import Flask, render_template, jsonify
from flask_cors import CORS
from flask_login import LoginManager
from config import Config
from models import db, Technician
from email_service import mail, init_mail

def create_app():
    """Application factory"""
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)
    init_mail(app)  # Initialize Flask-Mail
    
    # Initialize Flask-Login
    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'api.login' # Fixed: added blueprint prefix
    
    @login_manager.user_loader
    def load_user(user_id):
        return Technician.query.get(int(user_id))

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({'error': 'Unauthorized access'}), 401
    
    # Register blueprints
    from routes import api
    app.register_blueprint(api, url_prefix='/api')
    
    # Main route
    @app.route('/')
    def index():
        return render_template('index.html')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app


if __name__ == '__main__':
    app = create_app()
    print("Equipment Maintenance Log System")
    print("=" * 50)
    print("Server running at: http://localhost:5000")
    print("=" * 50)
    print("\nDefault Login Credentials:")
    print("Admin: admin@maintenance.com / admin123")
    print("Technician: tech@maintenance.com / tech123")
    print("=" * 50)
    app.run(debug=True, host='0.0.0.0', port=5000)
