import unittest
import json
from app import app, db, CheckedURL, UserReport
from checker import analyze_url
from models import db as models_db

class SafeSiteTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.app = app.test_client()
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()

    def test_index(self):
        response = self.app.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.data), {"status": "Backend Running"})

    def test_check_missing_url(self):
        response = self.app.get('/check')
        self.assertEqual(response.status_code, 400)
        self.assertIn("error", json.loads(response.data))

    def test_check_valid_url(self):
        # Using a safe URL
        response = self.app.get('/check?url=https://www.google.com')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['url'], 'https://www.google.com')
        self.assertTrue(data['is_safe'])
        self.assertTrue(isinstance(data['risk_score'], int))

    def test_check_suspicious_url(self):
        # Using an IP address and http
        response = self.app.get('/check?url=http://192.168.1.1/login')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertFalse(data['is_safe'])
        self.assertTrue(data['risk_score'] > 0)



    def test_analyze_url_function(self):
        result = analyze_url("https://example.com")
        self.assertTrue(result['is_safe'])

        # Assuming 'login' or 'free' is in SUSPICIOUS_KEYWORDS (from keywords.py)
        # Test Red Flags
        result_ip = analyze_url("http://123.123.123.123")
        self.assertFalse(result_ip['is_safe'])

if __name__ == '__main__':
    unittest.main()
