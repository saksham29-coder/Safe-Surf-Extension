from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from checker import analyze_url
from models import db, CheckedURL, UserReport

app = Flask(__name__)
# Enable CORS for all routes so the browser extension can call the API
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///safesite.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# Create tables if they don't exist
with app.app_context():
    db.create_all()

@app.route("/", methods=["GET"])
def index():
    """Health check endpoint to verify backend is running."""
    return jsonify({"status": "Backend Running"}), 200

@app.route("/check", methods=["GET"])
def check():
    """
    Endpoint to check the safety of a given URL.
    Expects a 'url' query parameter.
    Checks cache first.
    """
    url_to_check = request.args.get("url")
    
    if not url_to_check:
        return jsonify({"error": "Missing 'url' query parameter"}), 400

    try:
        # 1. Check cache first
        cached_url = CheckedURL.query.filter_by(url=url_to_check).first()
        if cached_url:
            # If checked within the last 24 hours, return cached version
            if datetime.utcnow() - cached_url.last_checked < timedelta(hours=24):
                return jsonify(cached_url.to_dict()), 200

        # 2. Call the core analysis logic
        result = analyze_url(url_to_check)
        
        # 3. Update or create the cache entry
        if cached_url:
            cached_url.is_safe = result['is_safe']
            cached_url.risk_score = result['risk_score']
            cached_url.reasons = result['reasons']
            cached_url.last_checked = datetime.utcnow()
        else:
            new_check = CheckedURL(
                url=result['url'],
                is_safe=result['is_safe'],
                risk_score=result['risk_score'],
                reasons=result['reasons']
            )
            db.session.add(new_check)
        
        db.session.commit()
        
        return jsonify(result), 200
        
    except Exception as e:
        # Catch unexpected errors to prevent raw stack traces from reaching the client
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500



if __name__ == "__main__":
    # Run the server on port 5001 to avoid conflict
    app.run(debug=True, port=5001)
