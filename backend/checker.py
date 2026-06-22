import urllib.parse
import re
from keywords import SUSPICIOUS_KEYWORDS

def analyze_url(url: str) -> dict:
    """
    Analyzes a given URL for suspicious keywords and basic red flags.
    Returns a dictionary with safety status, risk score, and reasons.
    """
    reasons = []
    risk_score = 0
    
    # Basic URL parsing
    try:
        parsed_url = urllib.parse.urlparse(url)
        # Handle cases where urlparse might not parse correctly without a scheme
        if not parsed_url.scheme:
            parsed_url = urllib.parse.urlparse('http://' + url)
            
        domain = parsed_url.netloc.lower()
        path = parsed_url.path.lower()
        query = parsed_url.query.lower()
        
        full_url_lower = url.lower()
        
    except ValueError:
        return {
            "url": url,
            "is_safe": False,
            "risk_score": 100,
            "reasons": ["Invalid URL format"]
        }

    # 1. Check for suspicious keywords in the URL
    # We check the entire URL (domain, path, query)
    # Since URL is encoded, we unquote it first to check for human-readable keywords
    unquoted_url = urllib.parse.unquote(full_url_lower)
    
    for keyword in SUSPICIOUS_KEYWORDS:
        if keyword in unquoted_url:
            risk_score += 25
            reasons.append(f"Contains suspicious keyword: '{keyword}'")

    # 2. Check for basic red flags
    
    # Red Flag A: IP address as domain
    # Simple regex to check if the domain looks like an IPv4 address
    if re.match(r"^\d{1,3}(\.\d{1,3}){3}(:\d+)?$", domain):
        risk_score += 30
        reasons.append("Domain is an IP address instead of a hostname")

    # Red Flag B: Excessive hyphens in domain
    if domain.count("-") >= 3:
        risk_score += 15
        reasons.append("Domain contains excessive hyphens (common in phishing)")

    # Red Flag C: Suspicious TLDs
    # A small hardcoded list of TLDs often abused
    suspicious_tlds = {".xyz", ".tk", ".top", ".cc", ".ml", ".gq", ".ga", ".cf", ".pw"}
    if any(domain.endswith(tld) for tld in suspicious_tlds):
        risk_score += 20
        reasons.append("Uses a top-level domain often associated with spam/phishing")

    # Red Flag D: No HTTPS
    if parsed_url.scheme == "http":
        risk_score += 10
        reasons.append("Connection is not secure (HTTP instead of HTTPS)")

    # 3. Calculate final status
    # Cap the score at 100
    risk_score = min(risk_score, 100)
    
    # Threshold decides is_safe (if risk_score >= 10, it's unsafe)
    is_safe = risk_score < 10

    return {
        "url": url,
        "is_safe": is_safe,
        "risk_score": risk_score,
        "reasons": reasons
    }
