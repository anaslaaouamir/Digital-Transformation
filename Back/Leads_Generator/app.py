"""
=============================================================
  PROSPECTION AGENT
  pip install flask requests python-dotenv
  python app.py  →  http://localhost:5000
=============================================================
"""

import os, csv, random, time, threading, uuid
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_file
import requests as req

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

API_KEY             = os.getenv("GOOGLE_API_KEY", "")
PLACES_SEARCH_URL   = "https://maps.googleapis.com/maps/api/place/textsearch/json"
PLACES_DETAILS_URL  = "https://maps.googleapis.com/maps/api/place/details/json"

app  = Flask(__name__)
jobs = {}   # in-memory job store  { job_id: { status, progress, log, leads, ... } }


# ─── SCORING ──────────────────────────────────────────────────────────────────

def compute_score(business: dict) -> tuple[int, str]:
    score = 40
    has_website = bool(business.get("website"))

    if has_website:
        score += 12
    else:
        score += 5    # no website = max opportunity
        score += 10   # no social media signal
        score += 8    # no CMS/tech

    rating = float(business.get("rating") or 0)
    if rating >= 4.0:
        score += 10
    elif rating >= 3.5:
        score += 5

    reviews = int(business.get("user_ratings_total") or 0)
    if reviews > 100:
        score += 8
    elif reviews > 30:
        score += 5

    price_level = int(business.get("price_level") or 0)
    if price_level >= 3 and reviews > 200:
        score += 8    # 50+ employees
    elif reviews > 50 or price_level == 2:
        score += 12   # 10-50 employees (ideal)

    score += random.randint(0, 5)
    score  = min(score, 100)

    if score >= 80:
        temperature = "HOT"
    elif score >= 65:
        temperature = "WARM"
    else:
        temperature = "COLD"

    return score, temperature


# ─── SCRAPING + SCORING JOB (runs in background thread) ──────────────────────

def run_job(job_id: str, city: str, category: str, max_results: int):
    job = jobs[job_id]
    job.update(status="running", log=[], leads=[], progress=0)

    def log(msg: str):
        job["log"].append(msg)

    try:
        # ── Phase 1: Search ──────────────────────────────────────────────────
        log(f"Searching for '{category}' in {city}...")
        raw_places = []
        params = {
            "query":    f"{category} in {city}",
            "key":      API_KEY,
            "language": "fr",
        }

        while len(raw_places) < max_results:
            resp = req.get(PLACES_SEARCH_URL, params=params, timeout=15)
            data = resp.json()

            if data.get("status") == "REQUEST_DENIED":
                job["status"] = "error"
                job["error"]  = data.get("error_message", "Invalid API Key")
                return

            if data.get("status") not in ("OK", "ZERO_RESULTS"):
                log(f"API status: {data.get('status')}")
                break

            raw_places.extend(data.get("results", []))
            log(f"Found {len(raw_places)} businesses so far...")
            job["progress"] = min(10, int(len(raw_places) / max_results * 10))

            next_token = data.get("next_page_token")
            if not next_token or len(raw_places) >= max_results:
                break
            time.sleep(2)
            params = {"pagetoken": next_token, "key": API_KEY}

        raw_places = raw_places[:max_results]
        total      = len(raw_places)
        log(f"Found {total} businesses. Enriching + scoring...")

        # ── Phase 2: Detail + Score ──────────────────────────────────────────
        leads = []
        for i, place in enumerate(raw_places):
            place_id = place.get("place_id")
            log(f"[{i+1}/{total}] {place.get('name', '?')}")
            job["progress"] = 10 + int((i / total) * 80)

            detail_resp = req.get(PLACES_DETAILS_URL, params={
                "place_id": place_id,
                "fields":   "name,formatted_address,formatted_phone_number,website,"
                            "rating,user_ratings_total,price_level,url,types",
                "key":      API_KEY,
                "language": "fr",
            }, timeout=15)
            details = detail_resp.json().get("result", {})
            time.sleep(0.1)

            biz            = {**place, **details}
            score, temp    = compute_score(biz)

            leads.append({
                "name":             biz.get("name", ""),
                "address":          biz.get("formatted_address", place.get("formatted_address", "")),
                "phone":            biz.get("formatted_phone_number", ""),
                "website":          biz.get("website", ""),
                "rating":           biz.get("rating", ""),
                "reviews":          biz.get("user_ratings_total", ""),
                "price_level":      biz.get("price_level", ""),
                "google_maps_url":  biz.get("url", f"https://www.google.com/maps/place/?q=place_id:{place_id}"),
                "types":            ", ".join(biz.get("types", [])),
                "score":            score,
                "temperature":      temp,
                "city":             city,
                "category":         category,
            })

        # ── Phase 3: Sort + Export ───────────────────────────────────────────
        leads.sort(key=lambda x: x["score"], reverse=True)
        for i, lead in enumerate(leads, 1):
            lead["rank"] = i

        job["leads"]    = leads
        job["progress"] = 100
        job["status"]   = "done"

        ts    = datetime.now().strftime("%Y%m%d_%H%M%S")
        fname = f"leads_{city.replace(' ','_')}_{category.replace(' ','_')}_{ts}.csv"
        fpath = os.path.join(os.getcwd(), fname)

        fields = ["rank","name","score","temperature","address","phone","website",
                  "rating","reviews","price_level","google_maps_url","types","city","category"]

        with open(fpath, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=fields)
            writer.writeheader()
            writer.writerows(leads)

        job["csv_path"] = fpath
        job["csv_name"] = fname
        log(f"Done! {len(leads)} leads exported.")

    except Exception as e:
        job["status"] = "error"
        job["error"]  = str(e)
        log(f"Error: {e}")


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/check_key")
def check_key():
    return jsonify({"has_key": bool(API_KEY)})


@app.route("/api/start", methods=["POST"])
def start():
    data = request.json
    if not API_KEY:
        return jsonify({"error": "No Google API key. Add GOOGLE_API_KEY to your .env file."}), 400

    job_id = str(uuid.uuid4())
    jobs[job_id] = {"status": "pending", "progress": 0, "log": [], "leads": []}

    t = threading.Thread(
        target=run_job,
        args=(job_id, data.get("city",""), data.get("category",""), int(data.get("max_results", 20)))
    )
    t.daemon = True
    t.start()

    return jsonify({"job_id": job_id})


@app.route("/api/status/<job_id>")
def status(job_id):
    job = jobs.get(job_id, {})
    return jsonify({
        "status":   job.get("status"),
        "progress": job.get("progress", 0),
        "log":      job.get("log", []),
        "leads":    job.get("leads", []),
        "error":    job.get("error", ""),
        "csv_name": job.get("csv_name", ""),
    })


@app.route("/api/download/<job_id>")
def download(job_id):
    job  = jobs.get(job_id, {})
    path = job.get("csv_path")
    if not path or not os.path.exists(path):
        return "File not found", 404
    return send_file(path, as_attachment=True, download_name=job.get("csv_name"))


# ─── ENTRY POINT ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import webbrowser

    print("\n  PROSPECTION AGENT")
    print("  Dashboard → http://localhost:5000")
    if not API_KEY:
        print("  ⚠  No GOOGLE_API_KEY found — create a .env file first.\n")
    else:
        print("  ✓  Google API Key detected.\n")

    threading.Timer(1.2, lambda: webbrowser.open("http://localhost:5000")).start()
    app.run(host="0.0.0.0", debug=False, port=5000)
