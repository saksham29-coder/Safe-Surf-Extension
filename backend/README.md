# Safe Site Checker Backend

This is the Python Flask backend for the Safe Site Checker browser extension. It analyzes URLs and returns a safety risk score.

## Setup Instructions

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   ```

2. **Activate the virtual environment:**
   - **Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     source venv/bin/activate
     ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server:**
   ```bash
   python app.py
   ```
   The server will start on `http://127.0.0.1:5000`.

## API Endpoints

### `GET /`
Health check to verify the server is running.
**Response:**
```json
{
  "status": "Backend Running"
}
```

### `GET /check?url=<value>`
Analyzes the provided URL for safety.

**Example Request:**
```bash
curl "http://127.0.0.1:5000/check?url=http://free-money-now.xyz/claim"
```

**Example Response:**
```json
{
  "is_safe": false,
  "reasons": [
    "Contains suspicious keyword: 'free money'",
    "Uses a top-level domain often associated with spam/phishing",
    "Connection is not secure (HTTP instead of HTTPS)"
  ],
  "risk_score": 55,
  "url": "http://free-money-now.xyz/claim"
}
```
