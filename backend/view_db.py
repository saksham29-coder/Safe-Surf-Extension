from app import app, db
from models import CheckedURL, UserReport

def print_database_records():
    with app.app_context():
        print("=== Checked URLs in Database ===")
        urls = CheckedURL.query.all()
        if not urls:
            print("No URLs have been checked yet.")
        for u in urls:
            print(f"ID: {u.id} | URL: {u.url} | Safe: {u.is_safe} | Score: {u.risk_score} | Checked: {u.last_checked}")
            print(f"  Reasons: {u.reasons}")
            print("-" * 50)
            
        print("\n=== User Reports in Database ===")
        reports = UserReport.query.all()
        if not reports:
            print("No user reports found.")
        for r in reports:
            print(f"ID: {r.id} | URL: {r.url} | Reported Safe: {r.reported_is_safe} | Time: {r.timestamp}")
            print("-" * 50)

if __name__ == "__main__":
    print_database_records()
